import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';

import { getDb } from './db';
import { initSocketServer } from './socket';

import authRoutes from './routes/auth';
import playersRoutes from './routes/players';
import playlistsRoutes from './routes/playlists';
import groupsRoutes from './routes/groups';
import usersRoutes from './routes/users';
import assignmentsRoutes from './routes/assignments';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3003;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (CORS_ORIGIN === '*') return callback(null, true);
    // Allow exact match or subdomains
    if (origin === CORS_ORIGIN || origin.endsWith('.ireadi.net') || origin.endsWith('.readi.fr')) {
      return callback(null, true);
    }
    return callback(null, true); // permissive en prod derrière nginx
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize DB
getDb();

// Initialize Socket.io
initSocketServer(httpServer, CORS_ORIGIN);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/assignments', assignmentsRoutes);

// Health check (pour Docker et monitoring)
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Health check (API path)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Root page - API documentation
app.get('/', (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Effect - Digital Signage Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      width: 100%;
      background: rgba(255,255,255,0.05);
      border-radius: 24px;
      padding: 48px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 { font-size: 2.5rem; margin-bottom: 8px; }
    .subtitle { opacity: 0.7; margin-bottom: 32px; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(34,197,94,0.2);
      border-radius: 20px;
      color: #22c55e;
      font-size: 0.9rem;
      margin-bottom: 32px;
    }
    .status::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    h2 { font-size: 1.2rem; margin: 24px 0 12px; opacity: 0.9; }
    .endpoint {
      background: rgba(0,0,0,0.3);
      padding: 12px 16px;
      border-radius: 8px;
      margin: 8px 0;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .endpoint span { color: #6366f1; }
    .info {
      margin-top: 32px;
      padding: 16px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      font-size: 0.9rem;
      opacity: 0.8;
    }
    .info strong { color: #6366f1; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📺 Slide Effect</h1>
    <p class="subtitle">Digital Signage Server</p>
    <div class="status">Serveur opérationnel</div>
    
    <h2>🔌 Endpoints API</h2>
    <div class="endpoint"><span>GET</span> /api/health - Vérification santé</div>
    <div class="endpoint"><span>POST</span> /api/auth/login - Connexion</div>
    <div class="endpoint"><span>GET</span> /api/players - Liste des players</div>
    <div class="endpoint"><span>GET</span> /api/playlists - Liste des playlists</div>
    <div class="endpoint"><span>GET</span> /api/groups - Liste des groupes</div>
    
    <h2>🔑 Identifiants par défaut</h2>
    <div class="endpoint">Email: admin@signage.local</div>
    <div class="endpoint">Password: admin123</div>
    
    <div class="info">
      <strong>💡 Astuce :</strong> Utilisez le dashboard admin dans l'éditeur pour gérer vos players et playlists.
    </div>
  </div>
</body>
</html>
  `);
});

// Static files for uploads (if needed)
app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        Slide Effect - Digital Signage Server              ║
╠═══════════════════════════════════════════════════════════╣
║  API:      http://localhost:${PORT}/api                    ║
║  Socket:   ws://localhost:${PORT}                          ║
║  Health:   http://localhost:${PORT}/api/health             ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
