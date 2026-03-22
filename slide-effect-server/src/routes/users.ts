import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, adminOnly } from '../auth';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/users - list all users (admin) or own profile (operator)
router.get('/', (req, res) => {
  const user = (req as any).user;
  const db = getDb();

  if (user.role === 'admin') {
    const users = db.prepare(`
      SELECT id, email, name, role, status, workspace, last_login, created_at
      FROM users ORDER BY created_at DESC
    `).all();
    res.json(users);
  } else {
    const u = db.prepare('SELECT id, email, name, role, status, workspace FROM users WHERE id = ?').get(user.id);
    res.json([u]);
  }
});

// GET /api/users/me - current user profile
router.get('/me', (req, res) => {
  const user = (req as any).user;
  const db = getDb();
  const u = db.prepare('SELECT id, email, name, role, status, workspace, permissions FROM users WHERE id = ?').get(user.id);
  res.json(u);
});

// POST /api/users - create user (admin only)
router.post('/', adminOnly, (req, res) => {
  const { email, password, name, role, workspace } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email déjà utilisé' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, workspace, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(id, email, hash, name || '', role || 'operator', workspace || 'default');

  const newUser = db.prepare('SELECT id, email, name, role, status, workspace, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json(newUser);
});

// PUT /api/users/:id - update user
router.put('/:id', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  // Operator can only update own profile (name, password)
  if (user.role !== 'admin' && user.id !== id) {
    res.status(403).json({ error: 'Accès refusé' });
    return;
  }

  const db = getDb();
  const { name, email, password, role, status, workspace, permissions } = req.body;
  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined && user.role === 'admin') { updates.push('email = ?'); values.push(email); }
  if (password) {
    updates.push('password_hash = ?');
    values.push(bcrypt.hashSync(password, 10));
  }
  // Admin only fields
  if (user.role === 'admin') {
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (workspace !== undefined) { updates.push('workspace = ?'); values.push(workspace); }
    if (permissions !== undefined) { updates.push('permissions = ?'); values.push(JSON.stringify(permissions)); }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    return;
  }

  values.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT id, email, name, role, status, workspace, created_at FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/users/:id - delete user (admin only)
router.delete('/:id', adminOnly, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  if (id === user.id) {
    res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    return;
  }

  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

// POST /api/users/:id/ban - ban/unban user (admin only)
router.post('/:id/ban', adminOnly, (req, res) => {
  const { id } = req.params;
  const { banned } = req.body;
  const db = getDb();
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(banned ? 'banned' : 'active', id);
  res.json({ ok: true, status: banned ? 'banned' : 'active' });
});

// POST /api/users/:id/suspend - suspend user (admin only)
router.post('/:id/suspend', adminOnly, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const u = db.prepare('SELECT status FROM users WHERE id = ?').get(id) as any;
  const newStatus = u?.status === 'suspended' ? 'active' : 'suspended';
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(newStatus, id);
  res.json({ ok: true, status: newStatus });
});

// POST /api/users/:id/role - change role (admin only)
router.post('/:id/role', adminOnly, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'operator'].includes(role)) {
    res.status(400).json({ error: 'Rôle invalide' });
    return;
  }
  const db = getDb();
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  res.json({ ok: true, role });
});

export default router;
