import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/users - Liste tous les utilisateurs (admin)
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.company, u.role, u.status, 
           u.workspace, u.last_login, u.created_at,
           s.status as subscription_status, p.name as plan_name
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN plans p ON s.plan_id = p.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

// GET /api/users/pending - Utilisateurs en attente d'approbation
router.get('/pending', (req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.company, u.role, u.status,
           u.created_at, s.plan_id, p.name as plan_name
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE u.status = 'pending'
    ORDER BY u.created_at ASC
  `).all();
  res.json(users);
});

// GET /api/users/:id - Détail d'un utilisateur
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.email, u.name, u.company, u.role, u.status,
           u.workspace, u.permissions, u.last_login, u.created_at,
           s.id as subscription_id, s.status as subscription_status,
           s.current_period_end, s.cancel_at_period_end,
           p.id as plan_id, p.name as plan_name, p.max_players, p.max_screens
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE u.id = ?
  `).get(req.params.id);

  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  // Compter les ressources
  const workspace = db.prepare('SELECT id FROM workspaces WHERE user_id = ?').get(req.params.id) as any;
  const playerCount = workspace 
    ? (db.prepare('SELECT COUNT(*) as count FROM players WHERE workspace_id = ?').get(workspace.id) as any)?.count || 0
    : 0;

  res.json({ ...user, player_count: playerCount });
});

// GET /api/users/:id/players - Players d'un utilisateur avec géolocalisation
router.get('/:id/players', (req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT id FROM workspaces WHERE user_id = ?').get(req.params.id) as any;
  
  if (!workspace) {
    res.json([]);
    return;
  }

  const players = db.prepare(`
    SELECT p.*, pl.latitude, pl.longitude, pl.address, pl.updated_at as location_updated
    FROM players p
    LEFT JOIN player_locations pl ON p.id = pl.player_id
    WHERE p.workspace_id = ?
    ORDER BY p.created_at DESC
  `).all(workspace.id);

  res.json(players);
});

// POST /api/users/:id/approve - Approuver un utilisateur
router.post('/:id/approve', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, status FROM users WHERE id = ?').get(req.params.id) as any;
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  if (user.status === 'active') {
    res.status(400).json({ error: 'Utilisateur déjà approuvé' });
    return;
  }

  db.prepare(`
    UPDATE users SET status = 'active', updated_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  // Créer le workspace s'il n'existe pas
  const workspaceExists = db.prepare('SELECT id FROM workspaces WHERE user_id = ?').get(req.params.id);
  if (!workspaceExists) {
    const workspaceId = uuidv4();
    const userData = db.prepare('SELECT name, company FROM users WHERE id = ?').get(req.params.id) as any;
    db.prepare(`
      INSERT INTO workspaces (id, user_id, name) 
      VALUES (?, ?, ?)
    `).run(workspaceId, req.params.id, userData?.company || userData?.name || 'Mon Espace');
  }

  res.json({ success: true, message: 'Utilisateur approuvé' });
});

// POST /api/users/:id/suspend - Suspendre un utilisateur
router.post('/:id/suspend', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(req.params.id) as any;
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  db.prepare(`
    UPDATE users SET status = 'suspended', updated_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: 'Utilisateur suspendu' });
});

// POST /api/users/:id/ban - Bannir un utilisateur
router.post('/:id/ban', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(req.params.id) as any;
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  db.prepare(`
    UPDATE users SET status = 'banned', updated_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: 'Utilisateur banni' });
});

// POST /api/users/:id/reactivate - Réactiver un utilisateur
router.post('/:id/reactivate', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(req.params.id) as any;
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  db.prepare(`
    UPDATE users SET status = 'active', updated_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: 'Utilisateur réactivé' });
});

// PUT /api/users/:id/permissions - Modifier les permissions
router.put('/:id/permissions', (req: Request, res: Response) => {
  const { permissions } = req.body;
  
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  db.prepare(`
    UPDATE users SET permissions = ?, updated_at = datetime('now') WHERE id = ?
  `).run(JSON.stringify(permissions), req.params.id);

  res.json({ success: true, message: 'Permissions mises à jour' });
});

// PUT /api/users/:id - Modifier un utilisateur
router.put('/:id', (req: Request, res: Response) => {
  const { name, company, role } = req.body;
  
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      company = COALESCE(?, company),
      role = COALESCE(?, role),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, company, role, req.params.id);

  const updated = db.prepare('SELECT id, email, name, company, role, status FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  // La suppression en cascade gérera les workspaces, subscriptions, etc.
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ success: true, message: 'Utilisateur supprimé' });
});

export default router;
