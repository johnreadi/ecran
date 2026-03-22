import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, adminOnly } from '../auth';

const router = Router();

// GET /api/groups
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const groups = db.prepare(`
    SELECT g.*, COUNT(p.id) as player_count
    FROM groups g
    LEFT JOIN players p ON p.group_id = g.id
    GROUP BY g.id
    ORDER BY g.name
  `).all();
  res.json(groups);
});

// POST /api/groups
router.post('/', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: 'Nom requis' }); return; }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO groups (id, name, description) VALUES (?, ?, ?)').run(id, name, description || '');

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  res.status(201).json(group);
});

// PATCH /api/groups/:id
router.patch('/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name, description } = req.body;
  const db = getDb();
  db.prepare('UPDATE groups SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
    .run(name, description, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/groups/:id
router.delete('/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
