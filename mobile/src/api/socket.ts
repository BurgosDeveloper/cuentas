import { io, Socket } from 'socket.io-client';
import { getServerUrl } from './config';
import { getAuthToken } from './client';

let socket: Socket | null = null;

export async function initSocket(userId: string): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  const serverUrl = await getServerUrl();
  const token = await getAuthToken();

  socket = io(serverUrl, {
    transports: ['websocket'],
    auth: { token, userId },
    query: { token, userId },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket en tiempo real conectado:', socket?.id);
    if (userId) {
      socket?.emit('join_user_room', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('⚡ Socket desconectado:', reason);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
