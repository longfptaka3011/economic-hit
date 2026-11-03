import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ClientToServerEvents, ServerToClientEvents } from '@market-mayhem/shared';
import { SERVER_CONFIG } from './config/index.js';
import { setupSocketIO } from './networking/socket.js';
import { createApp } from './app.js';

const clientDirectory=path.resolve(process.env.CLIENT_DIST_DIR || fileURLToPath(new URL('../../client/dist',import.meta.url)));
const app=createApp(clientDirectory);

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: SERVER_CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  pingInterval: SERVER_CONFIG.PING_INTERVAL_MS,
  pingTimeout: SERVER_CONFIG.PING_TIMEOUT_MS,
});

setupSocketIO(io);

// One instance owns the rooms. Give clients a clean disconnect on Render restarts.
const shutdown=()=>{io.close();httpServer.close(()=>process.exit(0));setTimeout(()=>process.exit(0),8000).unref();};
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);

httpServer.listen(SERVER_CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 MARKET MAYHEM SERVER running at http://localhost:${SERVER_CONFIG.PORT}`);
  console.log(`📡 WebSocket Gateway initialized for multiplayer`);
  console.log(`🩺 Health check available at: http://localhost:${SERVER_CONFIG.PORT}/health`);
  console.log(`=======================================================`);
});

export { app, httpServer, io };
