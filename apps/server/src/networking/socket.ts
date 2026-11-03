import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@market-mayhem/shared';
import { setupOnline } from './online.js';

export function setupSocketIO(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  const cleanup = setupOnline(io);
  io.httpServer?.once('close', cleanup);
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);

    // Latency measurement heartbeat
    socket.on('game:ping', (clientTimestamp: number) => {
      socket.emit('game:pong', clientTimestamp, Date.now());
    });

    // Handle client disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });
}

