import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { getDb } from './db';
import { verifyToken } from './auth';

let io: SocketIOServer | null = null;

// Map pour stocker les utilisateurs connectés (userId -> socketId)
const connectedUsers = new Map<string, string>();

export function initSocketServer(httpServer: HttpServer, corsOrigin: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth.token as string;
    const type = socket.handshake.auth.type as 'player' | 'admin' | 'user';
    const userId = socket.handshake.auth.userId as string;

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

    } else if ((type === 'admin' || type === 'user') && token) {
      // Authenticate user by JWT
      try {
        const payload = verifyToken(token);
        const db = getDb();
        const user = db.prepare('SELECT id, role, status FROM users WHERE id = ?').get(payload.id) as any;
        
        if (!user || user.status !== 'active') {
          socket.disconnect();
          return;
        }

        // Store connection
        connectedUsers.set(user.id, socket.id);
        socket.join(`user:${user.id}`);

        if (user.role === 'admin') {
          socket.join('admins');
          console.log(`👤 Admin connected: ${payload.email}`);
        } else {
          console.log(`👤 User connected: ${payload.email}`);
        }

        // Join user's room for messages
        socket.join(`user:${user.id}`);

        // Handle typing indicator
        socket.on('message:typing', (data: { toUserId: string; isTyping: boolean }) => {
          io?.to(`user:${data.toUserId}`).emit('message:typing', {
            fromUserId: user.id,
            isTyping: data.isTyping,
          });
        });

        // Handle new message
        socket.on('message:send', (data: { toUserId: string; content: string; attachments?: any[] }) => {
          const messageData = {
            id: Date.now().toString(),
            fromUserId: user.id,
            toUserId: data.toUserId,
            content: data.content,
            attachments: data.attachments || [],
            createdAt: new Date().toISOString(),
          };

          // Emit to recipient
          io?.to(`user:${data.toUserId}`).emit('message:new', messageData);
          
          // Emit back to sender for confirmation
          socket.emit('message:sent', messageData);
        });

        // Handle read receipt
        socket.on('message:read', (data: { messageId: string; fromUserId: string }) => {
          io?.to(`user:${data.fromUserId}`).emit('message:read', {
            messageId: data.messageId,
            readAt: new Date().toISOString(),
          });
        });

        // On disconnect
        socket.on('disconnect', () => {
          connectedUsers.delete(user.id);
          console.log(`📴 User disconnected: ${payload.email}`);
        });

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

// Helper functions for messaging
export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}

export function getOnlineUsers(): string[] {
  return Array.from(connectedUsers.keys());
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function broadcastToAdmins(event: string, data: any) {
  if (io) {
    io.to('admins').emit(event, data);
  }
}
