import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { Server } from 'socket.io';
import { describe, expect, it } from 'vitest';
import { setupOnline } from '../online.js';
import { OnlineMatch } from '../../game/OnlineMatch.js';

// Reuse the app's installed client for an actual transport test, no second copy.
const clientRequire=createRequire(new URL('../../../../../client/package.json',import.meta.url));
const {io:connect}=clientRequire('socket.io-client');
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(predicate:()=>boolean){for(let i=0;i<100;i++){if(predicate())return;await delay(10);}throw new Error('Socket event timeout');}

describe('Online room Socket.IO transport',()=>{
  it('shares checkpoints while allowing each player to resume independently over real sockets',async()=>{
    const http=createServer();const io=new Server(http);let match:OnlineMatch|undefined;
    const cleanup=setupOnline(io,members=>{match=new OnlineMatch(members);return match;});
    await new Promise<void>(resolve=>http.listen(0,'127.0.0.1',resolve));
    const port=(http.address() as {port:number}).port;
    const clients:any[]=[];
    const states=new Map<any,any>();
    const makeClient=async()=>{
      const client=connect(`http://127.0.0.1:${port}`,{transports:['websocket'],reconnection:false,forceNew:true});
      clients.push(client);const state:any={};states.set(client,state);
      client.on('online:room',(room:unknown)=>state.room=room);
      client.on('online:started',(session:unknown)=>state.session=session);
      client.on('online:snapshot',(snapshot:unknown)=>state.snapshot=snapshot);
      client.on('online:quiz',(_id:string,quiz:unknown)=>state.quiz=quiz);
      await new Promise<void>(resolve=>client.on('connect',resolve));return client;
    };
    const request=(client:any,event:string,...args:unknown[])=>new Promise<any>((resolve,reject)=>client.timeout(1000).emit(event,...args,(err:Error,result:unknown)=>err?reject(err):resolve(result)));
    try{
      const [a,b,c]=await Promise.all([makeClient(),makeClient(),makeClient()]);
      const avatar=(nickname:string,character:number,color:number)=>({nickname,character,color});
      expect((await request(a,'online:create',avatar(' ',0,0x38bdf8))).success).toBe(false);
      const room=(await request(a,'online:create',avatar('Alpha',5,0x38bdf8))).room;
      expect(room.members[0].character).toBe(5);
      expect((await request(b,'online:join','000000',avatar('Beta',1,0xfb923c))).success).toBe(false);
      expect((await request(b,'online:join',room.code,avatar('Beta',1,0x38bdf8))).success).toBe(false);
      await request(b,'online:join',room.code,avatar('Beta',1,0xfb923c));await request(c,'online:join',room.code,avatar('Gamma',2,0xa3e635));
      const customized=await request(a,'online:customize',avatar('Alpha 2',4,0xe879f9));
      expect(customized.room.members[0].nickname).toBe('Alpha 2');
      expect(customized.room.members[0].color).toBe(0xe879f9);
      expect(customized.room.members[0].ready).toBe(false);
      b.emit('online:start');await delay(30);expect(match).toBeUndefined();
      for(const client of clients)client.emit('online:ready',true);
      await until(()=>states.get(a).room.members.every((member:any)=>member.ready));
      a.emit('online:start');await until(()=>clients.every(client=>states.get(client).session));
      expect(states.get(a).session.snapshot.matchId).toBe(states.get(b).session.snapshot.matchId);
      expect(states.get(a).session.snapshot.players[0].character).toBe(4);
      expect(states.get(a).session.snapshot.remainingSeconds).toBe(480);
      expect((await request(a,'online:customize',avatar('Changed',0,0x38bdf8))).success).toBe(false);
      const running=match!;
      running.quiz.elapsedSeconds=59.999;
      await until(()=>!!states.get(a).quiz);
      const round=states.get(a).quiz.roundId;
      expect(states.get(b).quiz.roundId).toBe(round);
      const time=running.remainingSeconds;await delay(50);
      expect(running.remainingSeconds).toBeLessThan(time);
      a.emit('online:answer',running.id,round,0);await until(()=>!!states.get(a).quiz.answer);
      expect(states.get(b).quiz.answer).toBeNull();
      expect(states.get(a).quiz.canContinue).toBe(true);
      a.emit('online:continue',running.id,round);await until(()=>states.get(a).quiz===null);
      expect(states.get(b).quiz.answer).toBeNull();expect(running.quiz.isLearning(b.id)).toBe(true);
      expect(running.input(a.id,{sequence:100,dx:1,dy:0,sprint:true})).toBe(true);
      expect(running.input(b.id,{sequence:100,dx:1,dy:0,sprint:true})).toBe(false);
      c.disconnect();await until(()=>states.get(b).quiz.participantCount===2);
      b.emit('online:answer',running.id,round,1);await until(()=>!!states.get(b).quiz.answer);
      b.emit('online:continue',running.id,round);await until(()=>states.get(b).quiz===null);
      expect(running.quiz.isLearning(a.id)).toBe(false);expect(running.quiz.isLearning(b.id)).toBe(false);
      a.emit('online:leave');await until(()=>states.get(b).room.status==='finished');
      expect(states.get(b).room.hostId).toBe(b.id);
      b.emit('online:lobby');await until(()=>states.get(b).room.status==='lobby');
      expect(states.get(b).room.members[0].ready).toBe(false);
    }finally{clients.forEach(client=>client.disconnect());cleanup();await new Promise<void>(resolve=>io.close(()=>resolve()));}
  });
});
