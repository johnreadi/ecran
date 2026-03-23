import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

// GET /api/billing/invoices - Historique des factures
router.get('/invoices', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  
  // Récupérer l'abonnement avec les infos du plan
  const subscription = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price_monthly, p.price_yearly
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = ?
  `).get(userId) as any;

  if (!subscription) {
    res.json({ invoices: [], subscription: null });
    return;
  }

  // Simuler des factures basées sur l'historique
  const invoices = [];
  const startDate = new Date(subscription.created_at);
  const now = new Date();
  
  let currentDate = new Date(startDate);
  let invoiceNumber = 1;
  
  while (currentDate <= now) {
    invoices.push({
      id: `INV-${subscription.id.slice(0, 8)}-${invoiceNumber.toString().padStart(3, '0')}`,
      date: currentDate.toISOString(),
      amount: subscription.price_monthly || subscription.price_yearly,
      status: currentDate < now ? 'paid' : 'pending',
      description: `Abonnement ${subscription.plan_name} - ${currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    invoiceNumber++;
  }

  res.json({
    invoices: invoices.reverse(),
    subscription: {
      id: subscription.id,
      plan_name: subscription.plan_name,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  });
});

// GET /api/billing/usage - Utilisation actuelle
router.get('/usage', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  
  // Récupérer les limites du forfait
  const subscription = db.prepare(`
    SELECT p.max_players, p.max_screens, p.max_storage_mb
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = ? AND s.status = 'active'
  `).get(userId) as any;

  if (!subscription) {
    res.status(404).json({ error: 'Aucun abonnement actif' });
    return;
  }

  // Compter les ressources utilisées
  const workspace = db.prepare('SELECT id FROM workspaces WHERE user_id = ?').get(userId) as any;
  const workspaceId = workspace?.id;

  const playerCount = (db.prepare(`
    SELECT COUNT(*) as count FROM players WHERE workspace_id = ?
  `).get(workspaceId) as any)?.count || 0;

  const screenCount = (db.prepare(`
    SELECT COUNT(*) as count FROM playlists WHERE workspace_id = ?
  `).get(workspaceId) as any)?.count || 0;

  res.json({
    limits: {
      max_players: subscription.max_players,
      max_screens: subscription.max_screens,
      max_storage_mb: subscription.max_storage_mb,
    },
    usage: {
      players: playerCount,
      screens: screenCount,
      storage_mb: 0, // À implémenter avec la taille réelle des fichiers
    },
    percentages: {
      players: Math.round((playerCount / subscription.max_players) * 100),
      screens: Math.round((screenCount / subscription.max_screens) * 100),
      storage: 0,
    },
  });
});

// POST /api/billing/upgrade - Changer de forfait
router.post('/upgrade', (req: Request, res: Response) => {
  const { userId, newPlanId } = req.body;
  
  if (!userId || !newPlanId) {
    res.status(400).json({ error: 'userId et newPlanId requis' });
    return;
  }

  const db = getDb();
  
  // Vérifier le nouveau forfait
  const newPlan = db.prepare('SELECT * FROM plans WHERE id = ? AND is_active = 1').get(newPlanId);
  if (!newPlan) {
    res.status(404).json({ error: 'Nouveau forfait non trouvé' });
    return;
  }

  // Mettre à jour l'abonnement (le changement effectif se fera via Stripe)
  db.prepare(`
    UPDATE subscriptions 
    SET plan_id = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(newPlanId, userId);

  res.json({ success: true, message: 'Forfait mis à jour' });
});

export default router;
