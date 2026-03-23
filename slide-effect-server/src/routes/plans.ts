import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/plans - Liste tous les forfaits actifs (public)
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const plans = db.prepare(`
    SELECT * FROM plans 
    WHERE is_active = 1 
    ORDER BY price_monthly ASC
  `).all();
  res.json(plans);
});

// GET /api/plans/all - Tous les forfaits (admin only)
router.get('/all', (req: Request, res: Response) => {
  const db = getDb();
  const plans = db.prepare(`
    SELECT * FROM plans 
    ORDER BY created_at DESC
  `).all();
  res.json(plans);
});

// GET /api/plans/:id - Détail d'un forfait
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    res.status(404).json({ error: 'Forfait non trouvé' });
    return;
  }
  res.json(plan);
});

// POST /api/plans - Créer un forfait (admin only)
router.post('/', (req: Request, res: Response) => {
  const {
    name,
    description,
    price_monthly,
    price_yearly,
    max_players,
    max_screens,
    max_storage_mb,
    features,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
  } = req.body;

  if (!name || !price_monthly || !price_yearly) {
    res.status(400).json({ error: 'Nom et prix requis' });
    return;
  }

  const db = getDb();
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO plans (
      id, name, description, price_monthly, price_yearly,
      max_players, max_screens, max_storage_mb, features,
      stripe_price_id_monthly, stripe_price_id_yearly
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    description || '',
    price_monthly,
    price_yearly,
    max_players || 1,
    max_screens || 1,
    max_storage_mb || 100,
    JSON.stringify(features || []),
    stripe_price_id_monthly || null,
    stripe_price_id_yearly || null
  );

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
  res.status(201).json(plan);
});

// PUT /api/plans/:id - Modifier un forfait (admin only)
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Forfait non trouvé' });
    return;
  }

  const {
    name,
    description,
    price_monthly,
    price_yearly,
    max_players,
    max_screens,
    max_storage_mb,
    features,
    is_active,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
  } = req.body;

  db.prepare(`
    UPDATE plans SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price_monthly = COALESCE(?, price_monthly),
      price_yearly = COALESCE(?, price_yearly),
      max_players = COALESCE(?, max_players),
      max_screens = COALESCE(?, max_screens),
      max_storage_mb = COALESCE(?, max_storage_mb),
      features = COALESCE(?, features),
      is_active = COALESCE(?, is_active),
      stripe_price_id_monthly = COALESCE(?, stripe_price_id_monthly),
      stripe_price_id_yearly = COALESCE(?, stripe_price_id_yearly),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name,
    description,
    price_monthly,
    price_yearly,
    max_players,
    max_screens,
    max_storage_mb,
    features ? JSON.stringify(features) : null,
    is_active,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    req.params.id
  );

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  res.json(plan);
});

// DELETE /api/plans/:id - Supprimer un forfait (admin only)
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Forfait non trouvé' });
    return;
  }

  // Soft delete - désactiver plutôt que supprimer
  db.prepare(`
    UPDATE plans SET is_active = 0, updated_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true });
});

export default router;
