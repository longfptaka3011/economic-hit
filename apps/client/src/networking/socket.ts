import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@market-mayhem/shared';

// Production serves HTTP and Socket.IO on the same Render origin.
const SERVER_URL = import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_SERVER_URL || window.location.origin);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

export function measurePing(): Promise<number|null> {
  return new Promise((resolve) => {
    const start = performance.now();
    const finish=(value:number|null)=>{clearTimeout(timer);socket.off('game:pong',pong);resolve(value);};
    const pong=(timestamp:number)=>{if(timestamp===start)finish(Math.round(performance.now()-start));};
    const timer=setTimeout(()=>finish(null),3000);
    socket.on('game:pong',pong);
    socket.emit('game:ping',start);
  });
}

