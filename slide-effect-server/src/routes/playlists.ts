import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, adminOnly } from '../auth';

const router = Router();

// GET /api/playlists
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const playlists = db.prepare(`
    SELECT p.*, u.email as created_by_email
    FROM playlists p
    LEFT JOIN users u ON p.created_by = u.id
    ORDER BY p.updated_at DESC
  `).all();

  res.json(playlists.map((p: any) => ({
    ...p,
    slides: JSON.parse(p.slides || '[]'),
    settings: JSON.parse(p.settings || '{}'),
  })));
});

// GET /api/playlists/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id) as any;
  if (!playlist) { res.status(404).json({ error: 'Playlist introuvable' }); return; }

  res.json({ ...playlist, slides: JSON.parse(playlist.slides || '[]'), settings: JSON.parse(playlist.settings || '{}') });
});

// POST /api/playlists — create or publish from editor
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, description, slides, settings } = req.body;
  if (!name) { res.status(400).json({ error: 'Nom requis' }); return; }

  const user = (req as any).user;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO playlists (id, name, description, slides, settings, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    description || '',
    JSON.stringify(slides || []),
    JSON.stringify(settings || {}),
    user.id,
  );

  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as any;
  res.status(201).json({ ...playlist, slides: JSON.parse(playlist.slides), settings: JSON.parse(playlist.settings) });
});

// PUT /api/playlists/:id — update
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const { name, description, slides, settings } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE playlists
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        slides = COALESCE(?, slides),
        settings = COALESCE(?, settings),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || null,
    description || null,
    slides ? JSON.stringify(slides) : null,
    settings ? JSON.stringify(settings) : null,
    req.params.id,
  );

  res.json({ ok: true });
});

// DELETE /api/playlists/:id
router.delete('/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
