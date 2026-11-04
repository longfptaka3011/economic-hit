import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { GAME_CONSTANTS } from '@market-mayhem/shared';

export function createApp(clientDirectory?: string) {
  const app=express();
  app.use(cors({origin:process.env.CORS_ORIGIN || true}));
  app.use(express.json({limit:'16kb'}));
  app.get('/health',(_req,res)=>res.json({status:'ok',game:'MARKET MAYHEM',version:'0.6.1',
    matchDurationSeconds:GAME_CONSTANTS.MATCH_DURATION_SECONDS,uptimeSeconds:Math.floor(process.uptime())}));
  if(clientDirectory && existsSync(path.join(clientDirectory,'index.html'))) {
    app.use(express.static(clientDirectory,{index:false,maxAge:'1h'}));
    // Missing assets must not return an HTML document to image / JS loaders.
    app.get('*',(req,res)=>{
      if(req.path.startsWith('/assets/') || req.path.startsWith('/socket.io/') || path.extname(req.path))return res.sendStatus(404);
      res.setHeader('Cache-Control','no-cache');res.sendFile(path.join(clientDirectory,'index.html'));
    });
  }
  return app;
}
