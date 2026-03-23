import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuration multer pour les pièces jointes
const uploadsDir = path.join(process.cwd(), 'uploads', 'attachments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// GET /api/messages/conversations - Liste des conversations
router.get('/conversations', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  const conversations = db.prepare(`
    SELECT 
      u.id as user_id,
      u.email,
      u.name,
      u.role,
      COUNT(CASE WHEN m.is_read = 0 AND m.to_user_id = ? THEN 1 END) as unread_count,
      MAX(m.created_at) as last_message_at,
      (SELECT content FROM messages 
       WHERE (from_user_id = ? AND to_user_id = u.id) OR (from_user_id = u.id AND to_user_id = ?)
       ORDER BY created_at DESC LIMIT 1) as last_message
    FROM users u
    JOIN messages m ON (m.from_user_id = u.id AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = u.id)
    WHERE u.id != ?
    GROUP BY u.id
    ORDER BY last_message_at DESC
  `).all(userId, userId, userId, userId, userId, userId);

  res.json(conversations);
});

// GET /api/messages/:userId - Historique avec un utilisateur
router.get('/:userId', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;
  const otherUserId = req.params.userId;
  
  if (!currentUserId) {
    res.status(400).json({ error: 'currentUserId requis' });
    return;
  }

  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, 
           u_from.name as from_name, 
           u_to.name as to_name
    FROM messages m
    JOIN users u_from ON m.from_user_id = u_from.id
    JOIN users u_to ON m.to_user_id = u_to.id
    WHERE (m.from_user_id = ? AND m.to_user_id = ?) 
       OR (m.from_user_id = ? AND m.to_user_id = ?)
    ORDER BY m.created_at ASC
  `).all(currentUserId, otherUserId, otherUserId, currentUserId);

  res.json(messages.map((m: any) => ({
    ...m,
    attachments: JSON.parse(m.attachments || '[]'),
  })));
});

// POST /api/messages - Envoyer un message (nouveau ou réponse)
router.post('/', upload.array('attachments', 5), (req: Request, res: Response) => {
  const { fromUserId, toUserId, content, parentId, calendarEvent } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!fromUserId || !toUserId || !content) {
    res.status(400).json({ error: 'fromUserId, toUserId et content requis' });
    return;
  }

  const db = getDb();
  const id = uuidv4();
  
  const attachments = files?.map(f => ({
    name: f.originalname,
    path: `/uploads/attachments/${f.filename}`,
    size: f.size,
    mimetype: f.mimetype,
  })) || [];

  db.prepare(`
    INSERT INTO messages (id, from_user_id, to_user_id, parent_id, content, attachments, calendar_event, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, fromUserId, toUserId, parentId || null, content, JSON.stringify(attachments), calendarEvent || null);

  const message = db.prepare(`
    SELECT m.*, u_from.name as from_name, u_to.name as to_name
    FROM messages m
    JOIN users u_from ON m.from_user_id = u_from.id
    JOIN users u_to ON m.to_user_id = u_to.id
    WHERE m.id = ?
  `).get(id) as any;

  res.status(201).json({
    ...message,
    attachments: JSON.parse(message.attachments || '[]'),
    calendar_event: message.calendar_event ? JSON.parse(message.calendar_event) : null,
  });
});

// PUT /api/messages/:id/read - Marquer comme lu
router.put('/:id/read', (req: Request, res: Response) => {
  const userId = req.body.userId;
  
  const db = getDb();
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id) as any;
  
  if (!message) {
    res.status(404).json({ error: 'Message non trouvé' });
    return;
  }

  // Seul le destinataire peut marquer comme lu
  if (message.to_user_id !== userId) {
    res.status(403).json({ error: 'Non autorisé' });
    return;
  }

  db.prepare(`
    UPDATE messages SET is_read = 1, read_at = datetime('now') WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true });
});

// DELETE /api/messages/:id - Supprimer un message
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.body.userId;
  
  const db = getDb();
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id) as any;
  
  if (!message) {
    res.status(404).json({ error: 'Message non trouvé' });
    return;
  }

  // Seul l'expéditeur peut supprimer
  if (message.from_user_id !== userId) {
    res.status(403).json({ error: 'Non autorisé' });
    return;
  }

  // Supprimer les fichiers joints
  const attachments = JSON.parse(message.attachments || '[]');
  attachments.forEach((att: any) => {
    const filePath = path.join(process.cwd(), att.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/messages/unread/count - Compteur de messages non lus
router.get('/unread/count', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE to_user_id = ? AND is_read = 0 AND is_archived = 0
  `).get(userId);

  res.json(count);
});

// PUT /api/messages/:id/archive - Archiver/désarchiver un message
router.put('/:id/archive', (req: Request, res: Response) => {
  const { userId, archive } = req.body;
  
  const db = getDb();
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id) as any;
  
  if (!message) {
    res.status(404).json({ error: 'Message non trouvé' });
    return;
  }

  // Seul le destinataire peut archiver
  if (message.to_user_id !== userId) {
    res.status(403).json({ error: 'Non autorisé' });
    return;
  }

  db.prepare(`
    UPDATE messages SET is_archived = ?, archived_at = ? WHERE id = ?
  `).run(archive ? 1 : 0, archive ? new Date().toISOString() : null, req.params.id);

  res.json({ success: true, archived: archive });
});

// GET /api/messages/archived/list - Liste des messages archivés
router.get('/archived/list', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, 
           u_from.name as from_name, 
           u_to.name as to_name
    FROM messages m
    JOIN users u_from ON m.from_user_id = u_from.id
    JOIN users u_to ON m.to_user_id = u_to.id
    WHERE m.to_user_id = ? AND m.is_archived = 1
    ORDER BY m.created_at DESC
  `).all(userId);

  res.json(messages.map((m: any) => ({
    ...m,
    attachments: JSON.parse(m.attachments || '[]'),
    calendar_event: m.calendar_event ? JSON.parse(m.calendar_event) : null,
  })));
});

export default router;
