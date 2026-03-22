import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { signToken } from '../auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(401).json({ error: 'Identifiants invalides' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Identifiants invalides' });
    return;
  }

  // Check account status
  if (user.status === 'banned') {
    res.status(403).json({ error: 'Compte banni. Contactez l\'administrateur.' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Compte suspendu. Contactez l\'administrateur.' });
    return;
  }

  // Update last_login
  db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name || '', role: user.role, workspace: user.workspace || 'default' },
  });
});

// POST /api/auth/register (admin only in prod — open for first setup)
router.post('/register', (req: Request, res: Response) => {
  const { email, password, role = 'operator' } = req.body;
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

  const { v4: uuidv4 } = require('uuid');
  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(id, email, hash, role);

  const token = signToken({ id, email, role });
  res.status(201).json({ token, user: { id, email, role } });
});

export default router;
