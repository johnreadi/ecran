import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, adminOnly } from '../auth';

const router = Router();
router.use(authMiddleware);

// GET /api/assignments
router.get('/', (req, res) => {
  const db = getDb();
  const assignments = db.prepare(`
    SELECT a.*,
      pl.name as playlist_name,
      p.name as player_name,
      g.name as group_name
    FROM assignments a
    LEFT JOIN playlists pl ON a.playlist_id = pl.id
    LEFT JOIN players p ON a.player_id = p.id
    LEFT JOIN groups g ON a.group_id = g.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(assignments.map((a: any) => ({
    ...a,
    schedule: JSON.parse(a.schedule || '{}'),
  })));
});

// GET /api/assignments/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const a = db.prepare(`
    SELECT a.*, pl.name as playlist_name, p.name as player_name
    FROM assignments a
    LEFT JOIN playlists pl ON a.playlist_id = pl.id
    LEFT JOIN players p ON a.player_id = p.id
    WHERE a.id = ?
  `).get(req.params.id) as any;
  if (!a) { res.status(404).json({ error: 'Introuvable' }); return; }
  res.json({ ...a, schedule: JSON.parse(a.schedule || '{}') });
});

// POST /api/assignments
router.post('/', adminOnly, (req, res) => {
  const { playlist_id, player_id, group_id, schedule, priority, active } = req.body;
  if (!playlist_id) { res.status(400).json({ error: 'playlist_id requis' }); return; }
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO assignments (id, playlist_id, player_id, group_id, schedule, priority, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, playlist_id, player_id || null, group_id || null, JSON.stringify(schedule || {}), priority || 0, active !== undefined ? active : 1);
  const created = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as any;
  res.status(201).json({ ...created, schedule: JSON.parse(created.schedule || '{}') });
});

// PUT /api/assignments/:id
router.put('/:id', adminOnly, (req, res) => {
  const { playlist_id, player_id, group_id, schedule, priority, active } = req.body;
  const db = getDb();
  const a = db.prepare('SELECT id FROM assignments WHERE id = ?').get(req.params.id);
  if (!a) { res.status(404).json({ error: 'Introuvable' }); return; }
  db.prepare(`
    UPDATE assignments SET
      playlist_id = COALESCE(?, playlist_id),
      player_id = ?,
      group_id = ?,
      schedule = COALESCE(?, schedule),
      priority = COALESCE(?, priority),
      active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    playlist_id || null,
    player_id !== undefined ? player_id : null,
    group_id !== undefined ? group_id : null,
    schedule !== undefined ? JSON.stringify(schedule) : null,
    priority !== undefined ? priority : null,
    active !== undefined ? active : null,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as any;
  res.json({ ...updated, schedule: JSON.parse(updated.schedule || '{}') });
});

// DELETE /api/assignments/:id
router.delete('/:id', adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
