import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/players/:id/location - Mettre à jour la position (appelé par le player)
router.post('/players/:id/location', (req: Request, res: Response) => {
  const { latitude, longitude, accuracy, address } = req.body;
  const playerId = req.params.id;

  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'Latitude et longitude requises' });
    return;
  }

  const db = getDb();
  
  // Vérifier que le player existe
  const player = db.prepare('SELECT id FROM players WHERE id = ?').get(playerId);
  if (!player) {
    res.status(404).json({ error: 'Player non trouvé' });
    return;
  }

  // Upsert de la position
  const existing = db.prepare('SELECT id FROM player_locations WHERE player_id = ?').get(playerId);
  
  if (existing) {
    db.prepare(`
      UPDATE player_locations 
      SET latitude = ?, longitude = ?, accuracy = ?, address = ?, updated_at = datetime('now')
      WHERE player_id = ?
    `).run(latitude, longitude, accuracy || null, address || null, playerId);
  } else {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO player_locations (id, player_id, latitude, longitude, accuracy, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, playerId, latitude, longitude, accuracy || null, address || null);
  }

  res.json({ success: true });
});

// GET /api/players/locations - Toutes les positions (admin)
router.get('/players/locations', (req: Request, res: Response) => {
  const db = getDb();
  const locations = db.prepare(`
    SELECT pl.*, p.name as player_name, p.status as player_status,
           w.name as workspace_name, u.name as user_name, u.email as user_email
    FROM player_locations pl
    JOIN players p ON pl.player_id = p.id
    LEFT JOIN workspaces w ON p.workspace_id = w.id
    LEFT JOIN users u ON w.user_id = u.id
    ORDER BY pl.updated_at DESC
  `).all();

  res.json(locations);
});

// GET /api/workspace/players/locations - Positions du workspace (user)
router.get('/workspace/players/locations', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  const workspace = db.prepare('SELECT id FROM workspaces WHERE user_id = ?').get(userId) as any;
  
  if (!workspace) {
    res.json([]);
    return;
  }

  const locations = db.prepare(`
    SELECT pl.*, p.name as player_name, p.status as player_status
    FROM player_locations pl
    JOIN players p ON pl.player_id = p.id
    WHERE p.workspace_id = ?
    ORDER BY pl.updated_at DESC
  `).all(workspace.id);

  res.json(locations);
});

// GET /api/players/nearby - Players proches d'un point
router.get('/players/nearby', (req: Request, res: Response) => {
  const { lat, lng, radius = 10 } = req.query; // radius en km
  
  if (!lat || !lng) {
    res.status(400).json({ error: 'lat et lng requis' });
    return;
  }

  const db = getDb();
  
  // Formule de Haversine simplifiée
  const locations = db.prepare(`
    SELECT pl.*, p.name as player_name, p.status as player_status,
           w.name as workspace_name, u.name as user_name,
           (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(?)) + 
           sin(radians(?)) * sin(radians(latitude)))) as distance
    FROM player_locations pl
    JOIN players p ON pl.player_id = p.id
    LEFT JOIN workspaces w ON p.workspace_id = w.id
    LEFT JOIN users u ON w.user_id = u.id
    HAVING distance < ?
    ORDER BY distance
  `).all(Number(lat), Number(lng), Number(lat), Number(radius));

  res.json(locations);
});

// GET /api/players/:id/location - Position d'un player spécifique
router.get('/players/:id/location', (req: Request, res: Response) => {
  const db = getDb();
  const location = db.prepare(`
    SELECT pl.*, p.name as player_name, p.status as player_status
    FROM player_locations pl
    JOIN players p ON pl.player_id = p.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!location) {
    res.status(404).json({ error: 'Position non trouvée' });
    return;
  }

  res.json(location);
});

// DELETE /api/players/:id/location - Supprimer la position (RGPD)
router.delete('/players/:id/location', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM player_locations WHERE player_id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
