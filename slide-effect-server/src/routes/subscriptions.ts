import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Stripe instance - lazy initialization
let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    });
  }
  return stripe;
}

// POST /api/subscriptions/create-checkout - Créer session de paiement
router.post('/create-checkout', async (req: Request, res: Response) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    res.status(503).json({ error: 'Stripe non configuré' });
    return;
  }

  const { planId, interval = 'month', userId, email, successUrl, cancelUrl } = req.body;

  if (!planId || !userId || !email) {
    res.status(400).json({ error: 'Plan, userId et email requis' });
    return;
  }

  const db = getDb();
  const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND is_active = 1').get(planId) as any;
  if (!plan) {
    res.status(404).json({ error: 'Forfait non trouvé' });
    return;
  }

  const priceId = interval === 'year' 
    ? plan.stripe_price_id_yearly 
    : plan.stripe_price_id_monthly;

  if (!priceId) {
    res.status(400).json({ error: 'Prix Stripe non configuré pour ce forfait' });
    return;
  }

  try {
    // Créer ou récupérer le client Stripe
    let customerId: string;
    const existingSub = db.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?').get(userId) as any;
    
    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripeInstance.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Créer la session de checkout
    const session = await stripeInstance.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: { userId, planId },
      },
      success_url: successUrl || `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/subscription/cancel`,
    });

    // Créer l'abonnement en pending
    const subId = uuidv4();
    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, status, stripe_customer_id, 
        stripe_payment_intent_id, payment_status
      ) VALUES (?, ?, ?, 'pending', ?, ?, 'pending')
      ON CONFLICT (user_id) DO UPDATE SET
        plan_id = excluded.plan_id,
        status = 'pending',
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_payment_intent_id = excluded.stripe_payment_intent_id,
        payment_status = 'pending',
        updated_at = datetime('now')
    `).run(subId, userId, planId, customerId, session.id);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
  }
});

// GET /api/subscriptions/me - Récupérer mon abonnement
router.get('/me', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  const subscription = db.prepare(`
    SELECT s.*, p.name as plan_name, p.max_players, p.max_screens, p.max_storage_mb, p.features
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = ?
  `).get(userId);

  if (!subscription) {
    res.json({ status: 'none' });
    return;
  }

  res.json(subscription);
});

// POST /api/subscriptions/cancel - Annuler l'abonnement
router.post('/cancel', async (req: Request, res: Response) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    res.status(503).json({ error: 'Stripe non configuré' });
    return;
  }

  const { userId } = req.body;
  
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId) as any;
  
  if (!sub?.stripe_subscription_id) {
    res.status(404).json({ error: 'Aucun abonnement actif' });
    return;
  }

  try {
    await stripeInstance.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    db.prepare(`
      UPDATE subscriptions 
      SET cancel_at_period_end = 1, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

// POST /api/subscriptions/reactivate - Réactiver l'abonnement
router.post('/reactivate', async (req: Request, res: Response) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    res.status(503).json({ error: 'Stripe non configuré' });
    return;
  }

  const { userId } = req.body;
  
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId) as any;
  
  if (!sub?.stripe_subscription_id) {
    res.status(404).json({ error: 'Aucun abonnement' });
    return;
  }

  try {
    await stripeInstance.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    db.prepare(`
      UPDATE subscriptions 
      SET cancel_at_period_end = 0, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Erreur lors de la réactivation' });
  }
});

// POST /api/subscriptions/webhook - Webhook Stripe
router.post('/webhook', async (req: Request, res: Response) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    res.status(503).json({ error: 'Stripe non configuré' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, planId } = session.metadata || {};
      
      if (userId && planId) {
        db.prepare(`
          UPDATE subscriptions 
          SET status = 'active', 
              payment_status = 'paid',
              stripe_subscription_id = ?,
              current_period_start = datetime('now'),
              current_period_end = datetime('now', '+1 month'),
              updated_at = datetime('now')
          WHERE user_id = ?
        `).run(session.subscription, userId);

        // Créer le workspace si non existant
        const workspaceExists = db.prepare('SELECT id FROM workspaces WHERE user_id = ?').get(userId);
        if (!workspaceExists) {
          const workspaceId = uuidv4();
          db.prepare(`
            INSERT INTO workspaces (id, user_id, name) 
            VALUES (?, ?, ?)
          `).run(workspaceId, userId, 'Mon Espace');
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string;
      
      db.prepare(`
        UPDATE subscriptions 
        SET payment_status = 'paid',
            current_period_end = datetime('now', '+1 month'),
            updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `).run(subscriptionId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string;
      
      db.prepare(`
        UPDATE subscriptions 
        SET payment_status = 'failed', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `).run(subscriptionId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      db.prepare(`
        UPDATE subscriptions 
        SET status = 'cancelled', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `).run(subscription.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
