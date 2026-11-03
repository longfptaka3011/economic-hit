import { randomInt } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import { parseAvatarProfile, type ClientToServerEvents, type ServerToClientEvents, type OnlineRoom, type OnlineMember } from '@market-mayhem/shared';
import { OnlineMatch } from '../game/OnlineMatch.js';

type GameServer = Server<ClientToServerEvents,ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents,ServerToClientEvents>;
interface Room { info: OnlineRoom; match?: OnlineMatch; lastRevision: number; lastQuizVersion: number }

export function setupOnline(io: GameServer, createMatch: (members:OnlineMember[])=>OnlineMatch = members=>new OnlineMatch(members)): () => void {
  const rooms = new Map<string, Room>();
  const membership = new Map<string,string>();
  const roomFor = (id:string) => rooms.get(membership.get(id) ?? '');
  const channel = (code:string) => `online:${code}`;
  const publishRoom = (room:Room) => io.to(channel(room.info.code)).emit('online:room',room.info);
  const publishQuiz = (room:Room) => {
    const match=room.match;if(!match)return;
    for (const member of room.info.members) io.to(member.id).emit('online:quiz',match.id,
      match.finished ? null : match.quiz.viewFor(member.id),[]);
    room.lastQuizVersion=match.quizVersion;
  };
  const publishSnapshot = (room:Room,full=false) => {
    const match=room.match;if(!match)return;
    io.to(channel(room.info.code)).emit('online:snapshot',match.snapshot(full || room.lastRevision!==match.revision));
    room.lastRevision=match.revision;
    if(match.quizVersion!==room.lastQuizVersion || match.finished)publishQuiz(room);
    if(match.finished && room.info.status==='playing'){room.info.status='finished';publishRoom(room);}
  };
  function leave(socket:GameSocket) {
    const room=roomFor(socket.id);membership.delete(socket.id);if(!room)return;
    void socket.leave(channel(room.info.code));
    room.info.members=room.info.members.filter(m=>m.id!==socket.id);
    room.match?.remove(socket.id);
    if(!room.info.members.length){rooms.delete(room.info.code);return;}
    if(room.info.hostId===socket.id)room.info.hostId=room.info.members[0].id;
    if(room.match)publishSnapshot(room,true);
    publishRoom(room);
  }
  io.on('connection',(socket:GameSocket)=>{
    socket.on('online:create', (value, reply) => {
      if(typeof reply!=='function')return;
      if(membership.has(socket.id))return reply({success:false,error:'Hãy rời phòng hiện tại trước.'});
      const profile=parseAvatarProfile(value);if(!profile)return reply({success:false,error:'Tên cần 2–24 ký tự, nhân vật và màu phải hợp lệ.'});
      let code:string;do{code=randomInt(100000,1000000).toString();}while(rooms.has(code));
      const room:Room={info:{code,hostId:socket.id,status:'lobby',members:[{id:socket.id,...profile,ready:false}]},lastRevision:-1,lastQuizVersion:-1};
      rooms.set(code,room);membership.set(socket.id,code);void socket.join(channel(code));
      reply({success:true,room:room.info});publishRoom(room);
    });
    socket.on('online:join',(code,value,reply)=>{
      if(typeof reply!=='function')return;
      const fail=(error:string)=>reply({success:false,error});
      if(membership.has(socket.id))return fail('Hãy rời phòng hiện tại trước.');
      const room=typeof code==='string'?rooms.get(code.trim()):undefined;
      if(!room)return fail('Không tìm thấy phòng.');
      if(room.info.status!=='lobby')return fail('Phòng đang chơi. Hãy chờ chủ phòng mở lượt mới.');
      if(room.info.members.length>=4)return fail('Phòng đã đủ 4 người.');
      const profile=parseAvatarProfile(value);if(!profile)return fail('Tên cần 2–24 ký tự, nhân vật và màu phải hợp lệ.');
      if(room.info.members.some(member=>member.color===profile.color))return fail('Màu này đã có người chọn trong phòng. Hãy chọn màu khác.');
      room.info.members.push({id:socket.id,...profile,ready:false});
      membership.set(socket.id,room.info.code);void socket.join(channel(room.info.code));
      reply({success:true,room:room.info});publishRoom(room);
    });
    socket.on('online:leave',()=>leave(socket));
    socket.on('online:customize',(value,reply)=>{
      if(typeof reply!=='function')return;
      const room=roomFor(socket.id),profile=parseAvatarProfile(value);
      if(!room || room.info.status!=='lobby')return reply({success:false,error:'Chỉ đổi nhân vật trong phòng chờ.'});
      if(!profile)return reply({success:false,error:'Tên hoặc nhân vật không hợp lệ.'});
      if(room.info.members.some(member=>member.id!==socket.id && member.color===profile.color))return reply({success:false,error:'Màu này đã có người chọn.'});
      Object.assign(room.info.members.find(member=>member.id===socket.id)!,profile,{ready:false});
      reply({success:true,room:room.info});publishRoom(room);
    });
    socket.on('disconnect',()=>leave(socket));
    socket.on('online:ready',ready=>{
      const room=roomFor(socket.id);if(!room || room.info.status!=='lobby' || typeof ready!=='boolean')return;
      room.info.members.find(m=>m.id===socket.id)!.ready=ready;publishRoom(room);
    });
    socket.on('online:start',()=>{
      const room=roomFor(socket.id);if(!room)return;
      if(room.info.hostId!==socket.id)return socket.emit('online:error','Chỉ chủ phòng được bắt đầu.');
      if(room.info.status!=='lobby' || room.info.members.length<2 || !room.info.members.every(m=>m.ready))return socket.emit('online:error','Cần ít nhất 2 người và tất cả đã sẵn sàng.');
      room.match=createMatch(room.info.members.map(member=>({...member})));
      room.info.status='playing';room.lastQuizVersion=-1;room.lastRevision=0;
      publishRoom(room);
      io.to(channel(room.info.code)).emit('online:started',{room:room.info,snapshot:room.match.snapshot(true)});
      publishQuiz(room);
    });
    socket.on('online:input',(matchId,input)=>{
      const match=roomFor(socket.id)?.match;if(match?.id===matchId)match.input(socket.id,input);
    });
    socket.on('online:answer',(matchId,roundId,index)=>{
      const room=roomFor(socket.id);if(!room?.match || room.match.id!==matchId || room.match.finished)return;
      if(room.match.answer(socket.id,roundId,index))publishQuiz(room);
    });
    socket.on('online:continue',(matchId,roundId)=>{
      const room=roomFor(socket.id);if(!room?.match || room.match.id!==matchId || room.match.finished)return;
      if(room.match.continue(socket.id,roundId)){publishQuiz(room);publishSnapshot(room);}
    });
    socket.on('online:lobby',()=>{
      const room=roomFor(socket.id);if(!room || room.info.hostId!==socket.id || room.info.status!=='finished')return;
      room.match=undefined;room.info.status='lobby';room.info.members.forEach(m=>m.ready=false);publishRoom(room);
    });
  });
  let previous=performance.now(),accumulator=0,broadcastTicks=0;
  const timer=setInterval(()=>{
    const now=performance.now();accumulator+=Math.min(.25,(now-previous)/1000);previous=now;
    while(accumulator>=1/60){
      for(const room of rooms.values())if(room.info.status==='playing')room.match?.step();
      accumulator-=1/60;broadcastTicks++;
      if(broadcastTicks%6===0)for(const room of rooms.values())if(room.info.status==='playing')publishSnapshot(room);
    }
  },1000/60);
  timer.unref();
  return ()=>{clearInterval(timer);rooms.clear();membership.clear();};
}
