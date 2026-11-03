import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@market-mayhem/shared';

// Production serves HTTP and Socket.IO on the same Render origin.
const SERVER_URL = import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_SERVER_URL || window.location.origin);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export function measurePing(): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    socket.emit('game:ping', start);
    socket.once('game:pong', () => {
      const latency = Math.round(performance.now() - start);
      resolve(latency);
    });
  });
}

