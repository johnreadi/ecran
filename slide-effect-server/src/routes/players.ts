import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, adminOnly } from '../auth';
import { getSocketServer } from '../socket';

const router = Router();

// GET /api/players — list all players with status
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const players = db.prepare(`
    SELECT p.*, g.name as group_name, pl.name as playlist_name
    FROM players p
    LEFT JOIN groups g ON p.group_id = g.id
    LEFT JOIN playlists pl ON p.current_playlist_id = pl.id
    ORDER BY p.created_at DESC
  `).all();

  res.json(players.map((p: any) => ({
    ...p,
    metadata: JSON.parse(p.metadata || '{}'),
  })));
});

// GET /api/players/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const player = db.prepare(`
    SELECT p.*, g.name as group_name, pl.name as playlist_name, pl.slides as playlist_slides
    FROM players p
    LEFT JOIN groups g ON p.group_id = g.id
    LEFT JOIN playlists pl ON p.current_playlist_id = pl.id
    WHERE p.id = ?
  `).get(req.params.id) as any;

  if (!player) { res.status(404).json({ error: 'Player introuvable' }); return; }
  res.json({ ...player, metadata: JSON.parse(player.metadata || '{}') });
});

// POST /api/players — create player
router.post('/', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name, group_id } = req.body;
  if (!name) { res.status(400).json({ error: 'Nom requis' }); return; }

  const db = getDb();
  const id = uuidv4();
  const token = uuidv4().replace(/-/g, '');

  db.prepare(`
    INSERT INTO players (id, name, token, group_id)
    VALUES (?, ?, ?, ?)
  `).run(id, name, token, group_id || null);

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
  res.status(201).json(player);
});

// PATCH /api/players/:id — update player info
router.patch('/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name, group_id } = req.body;
  const db = getDb();
  db.prepare('UPDATE players SET name = COALESCE(?, name), group_id = ? WHERE id = ?')
    .run(name, group_id ?? null, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/players/:id
router.delete('/:id', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/players/generate-pairing — generate pairing code for a new player
router.post('/generate-pairing', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { name, group_id } = req.body;
  if (!name) { res.status(400).json({ error: 'Nom requis' }); return; }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
  const id = uuidv4();
  const token = uuidv4().replace(/-/g, '');

  const db = getDb();
  db.prepare(`
    INSERT INTO players (id, name, token, group_id, pairing_code, pairing_expires)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, token, group_id || null, code, expires);

  res.json({ id, code, token, expires });
});

// POST /api/players/pair — player claims its identity via pairing code
router.post('/pair', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) { res.status(400).json({ error: 'Code requis' }); return; }

  const db = getDb();
  const player = db.prepare(`
    SELECT * FROM players WHERE pairing_code = ? AND pairing_expires > datetime('now')
  `).get(code) as any;

  if (!player) { res.status(404).json({ error: 'Code invalide ou expiré' }); return; }

  // Clear pairing code after use
  db.prepare('UPDATE players SET pairing_code = NULL, pairing_expires = NULL WHERE id = ?').run(player.id);

  res.json({ playerId: player.id, token: player.token, name: player.name });
});

// GET /api/players/me/playlist — called by player on boot
router.get('/me/playlist', (req: Request, res: Response) => {
  const token = req.headers['x-player-token'] as string;
  if (!token) { res.status(401).json({ error: 'Token player requis' }); return; }

  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE token = ?').get(token) as any;
  if (!player) { res.status(404).json({ error: 'Player inconnu' }); return; }

  // Update last seen
  db.prepare('UPDATE players SET last_seen = datetime(\'now\'), status = \'online\' WHERE id = ?').run(player.id);

  if (!player.current_playlist_id) {
    res.json({ playlist: null, player: { id: player.id, name: player.name } });
    return;
  }

  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(player.current_playlist_id) as any;
  if (!playlist) { res.json({ playlist: null }); return; }

  res.json({
    playlist: { ...playlist, slides: JSON.parse(playlist.slides), settings: JSON.parse(playlist.settings || '{}') },
    player: { id: player.id, name: player.name },
  });
});

// POST /api/players/:id/assign — assign playlist to player
router.post('/:id/assign', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { playlist_id, schedule } = req.body;
  if (!playlist_id) { res.status(400).json({ error: 'playlist_id requis' }); return; }

  const db = getDb();
  // Update current playlist on player
  db.prepare('UPDATE players SET current_playlist_id = ? WHERE id = ?').run(playlist_id, req.params.id);

  // Push update via WebSocket
  const io = getSocketServer();
  if (io) {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(playlist_id) as any;
    if (playlist) {
      io.to(`player:${req.params.id}`).emit('player:update', {
        playlist: { ...playlist, slides: JSON.parse(playlist.slides), settings: JSON.parse(playlist.settings || '{}') },
      });
    }
  }

  res.json({ ok: true });
});

// POST /api/players/:id/command — send command to player
router.post('/:id/command', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { command } = req.body; // 'refresh' | 'restart' | 'next' | 'prev'
  const io = getSocketServer();
  if (io) {
    io.to(`player:${req.params.id}`).emit('player:command', { command });
  }
  res.json({ ok: true, command });
});

export default router;
