import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { getDb } from './db';
import { verifyToken } from './auth';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer, corsOrigin: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth.token as string;
    const type = socket.handshake.auth.type as 'player' | 'admin';

    if (type === 'player' && token) {
      // Authenticate player by its player token
      const db = getDb();
      const player = db.prepare('SELECT * FROM players WHERE token = ?').get(token) as any;

      if (!player) {
        socket.disconnect();
        return;
      }

      // Join player's dedicated room
      socket.join(`player:${player.id}`);

      // Mark online
      db.prepare('UPDATE players SET status = \'online\', last_seen = datetime(\'now\') WHERE id = ?').run(player.id);
      console.log(`📺 Player connected: ${player.name} (${player.id})`);

      // Broadcast status to admin dashboard
      io?.to('admins').emit('dashboard:player-status', {
        playerId: player.id,
        status: 'online',
        lastSeen: new Date().toISOString(),
      });

      // Heartbeat handler
      socket.on('player:ping', () => {
        db.prepare('UPDATE players SET last_seen = datetime(\'now\') WHERE id = ?').run(player.id);
      });

      // Player reports current slide index
      socket.on('player:status', (data: { slideIndex: number; playlistId: string }) => {
        db.prepare('UPDATE players SET current_slide_index = ? WHERE id = ?').run(data.slideIndex, player.id);
        io?.to('admins').emit('dashboard:player-slide', {
          playerId: player.id,
          slideIndex: data.slideIndex,
          playlistId: data.playlistId,
        });
      });

      // On disconnect
      socket.on('disconnect', () => {
        db.prepare('UPDATE players SET status = \'offline\' WHERE id = ?').run(player.id);
        io?.to('admins').emit('dashboard:player-status', {
          playerId: player.id,
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });
        console.log(`📴 Player disconnected: ${player.name}`);
      });

    } else if (type === 'admin' && token) {
      // Authenticate admin by JWT
      try {
        const payload = verifyToken(token);
        if (payload.role === 'admin' || payload.role === 'operator') {
          socket.join('admins');
          console.log(`👤 Admin connected: ${payload.email}`);
        } else {
          socket.disconnect();
        }
      } catch {
        socket.disconnect();
      }
    } else {
      socket.disconnect();
    }
  });

  // Periodically mark offline players who haven't pinged in 30s
  setInterval(() => {
    const db = getDb();
    db.prepare(`
      UPDATE players SET status = 'offline'
      WHERE status = 'online' AND last_seen < datetime('now', '-30 seconds')
    `).run();
  }, 15000);

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function pushPlaylistToPlayer(playerId: string, playlist: any) {
  if (io) {
    io.to(`player:${playerId}`).emit('player:update', { playlist });
  }
}

export function pushPlaylistToGroup(groupId: string, playlist: any) {
  if (io) {
    io.to(`group:${groupId}`).emit('player:update', { playlist });
  }
}
