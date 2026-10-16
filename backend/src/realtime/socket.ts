import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { RealtimeEvents, RealtimeEvent } from '@cuentas/shared';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    // Permitir conexión y verificar userId si se provee
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (userId) {
      socket.data.userId = userId;
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`🔌 Dispositivo conectado en tiempo real para usuario: ${userId} (Socket ID: ${socket.id})`);
    } else {
      console.log(`🔌 Dispositivo conectado como anónimo (Socket ID: ${socket.id})`);
    }

    socket.on('join_user_room', (targetUserId: string) => {
      socket.join(`user_${targetUserId}`);
      socket.data.userId = targetUserId;
      console.log(`🔗 Socket ${socket.id} se unió a la sala user_${targetUserId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Dispositivo desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado.');
  }
  return io;
}

export function emitToUser(userId: string, event: RealtimeEvent, payload: unknown) {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, payload);
  console.log(`📡 Evento realtime emitido [${event}] a usuario: ${userId}`);
}

export function broadcastAll(event: RealtimeEvent, payload: unknown) {
  if (!io) return;
  io.emit(event, payload);
}
