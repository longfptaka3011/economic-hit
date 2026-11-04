import React, { useEffect, useRef, useState } from 'react';
import { parseAvatarProfile, type AvatarProfile, type OnlineRoom, type OnlineSnapshot, type QuizView, type OnlineReply } from '@market-mayhem/shared';
import { AvatarSetup, AvatarPreview, rememberAvatar } from '../components/AvatarSetup';
import { socket } from '../networking/socket';
import { GameView as PhaserGame } from '../game/GameView';
import { LearningOverlay } from '../game/ui/LearningOverlay';
import { HowToPlay } from '../components/HowToPlay';
import { RaceHUD } from '../game/ui/RaceHUD';
import {MatchResults} from '../game/ui/MatchResults';
import {LobbyCity} from '../components/LobbyCity';

function OnlineMiniMap({snapshot}:{snapshot:OnlineSnapshot}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const cells=useRef<NonNullable<OnlineSnapshot['territory']>>([]);
  useEffect(()=>{
    if(snapshot.territory)cells.current=snapshot.territory;
    const ctx=ref.current?.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#38434e';ctx.fillRect(0,0,128,128);ctx.fillStyle='#8ca170';ctx.fillRect(64,64,64,64);
    ctx.fillStyle='#d5be8b';ctx.beginPath();ctx.arc(64,64,15,0,Math.PI*2);ctx.fill();
    for(const cell of cells.current){
      const player=snapshot.players.find(player=>player.id===cell.owner);if(!player)continue;
      ctx.fillStyle='#'+player.color.toString(16).padStart(6,'0');ctx.fillRect(cell.col/2,cell.row/2,1,1);
    }
    for(const player of snapshot.players){ctx.fillStyle='#'+player.color.toString(16).padStart(6,'0');ctx.fillRect(player.x/32-2,player.y/32-2,4,4);ctx.strokeStyle='white';ctx.strokeRect(player.x/32-2,player.y/32-2,4,4);}
  },[snapshot]);
  return <canvas width={128} height={128} ref={ref} className="online-minimap" aria-label="Bản đồ vị trí và lãnh thổ các người chơi" role="img"/>;
}

export function OnlineLobby({initialMode,initialProfile,onExit}:{initialMode:'create'|'join';initialProfile:AvatarProfile;onExit:()=>void}) {
  const [room,setRoom]=useState<OnlineRoom|null>(null);
  const [snapshot,setSnapshot]=useState<OnlineSnapshot|null>(null);
  const [quiz,setQuiz]=useState<QuizView|null>(null);
  const [profile,setProfile]=useState(initialProfile);const [code,setCode]=useState('');
  const [editing,setEditing]=useState(false);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [connected,setConnected]=useState(socket.connected);
  const currentMatch=useRef<string|null>(null);
  const mounted=useRef(true);
  useEffect(()=>{
    mounted.current=true;
    const onRoom=(next:OnlineRoom)=>{
      setRoom(next);
      if(next.status==='lobby'){setSnapshot(null);setQuiz(null);currentMatch.current=null;}
    };
    const start=(session:{room:OnlineRoom;snapshot:OnlineSnapshot})=>{currentMatch.current=session.snapshot.matchId;setRoom(session.room);setSnapshot(session.snapshot);setQuiz(null);setError('');};
    const update=(next:OnlineSnapshot)=>{if(currentMatch.current===next.matchId)setSnapshot(next);};
    const learning=(matchId:string,next:QuizView|null)=>{if(matchId===currentMatch.current)setQuiz(next);};
    const disconnect=()=>{setConnected(false);setRoom(null);setSnapshot(null);setQuiz(null);currentMatch.current=null;setBusy(false);setError('Mất kết nối. Bạn đã rời trận; hãy tạo hoặc vào lại phòng.');};
    const connect=()=>setConnected(true);
    socket.on('online:room',onRoom);socket.on('online:started',start);socket.on('online:snapshot',update);
    socket.on('online:quiz',learning);socket.on('online:error',setError);socket.on('disconnect',disconnect);socket.on('connect',connect);
    return ()=>{
      mounted.current=false;socket.emit('online:leave');
      socket.off('online:room',onRoom);socket.off('online:started',start);socket.off('online:snapshot',update);
      socket.off('online:quiz',learning);socket.off('online:error',setError);socket.off('disconnect',disconnect);socket.off('connect',connect);
    };
  },[]);
  const enter=(event:React.FormEvent)=>{
    event.preventDefault();if(!connected || busy)return;
    const valid=parseAvatarProfile(profile);if(!valid){setError('Tên nhân vật cần 2–24 ký tự và không chỉ chứa khoảng trắng.');return;}
    setBusy(true);setError('');
    const callback=(err:Error|null,result:OnlineReply)=>{
      if(!mounted.current)return;setBusy(false);
      if(err){setError('Máy chủ chưa phản hồi. Hãy thử lại.');socket.emit('online:leave');return;}
      if(result.success && result.room){setRoom(result.room);setProfile(valid);rememberAvatar(valid);setEditing(false);}else setError(result.error??'Không thể vào phòng.');
    };
    if(room)socket.timeout(5000).emit('online:customize',valid,callback);
    else if(initialMode==='create')socket.timeout(5000).emit('online:create',valid,callback);
    else socket.timeout(5000).emit('online:join',code,valid,callback);
  };
  const me=room?.members.find(member=>member.id===socket.id);
  const host=room?.hostId===socket.id;
  const exit=()=>{socket.emit('online:leave');onExit();};
  if(snapshot && room && room.status!=='lobby') {
    const player=snapshot.players.find(player=>player.id===socket.id);
    return <div className="game-viewport">
      <PhaserGame online={{snapshot,playerId:socket.id!}} onExitGame={exit}/>
      <RaceHUD players={snapshot.players} playerId={socket.id!} remainingSeconds={snapshot.remainingSeconds} heading={'PHÒNG '+room.code}
        actions={<><button onClick={()=>document.fullscreenElement?document.exitFullscreen().catch(()=>{}):document.documentElement.requestFullscreen().catch(()=>{})}>Toàn màn hình</button><button onClick={exit}>Rời trận</button></>}/>
      {player && <div className="online-sprint"><strong>NỘ {Math.ceil(player.rage)}/100</strong><progress aria-label="Nộ của bạn" max={100} value={player.rage}/><span>{player.sprinting?'ĐANG TĂNG TỐC':'GIỮ SPACE / CHẠY ĐỂ TĂNG TỐC'}</span></div>}
      <OnlineMiniMap snapshot={snapshot}/>
      {error && <div className="online-error-toast" role="alert">{error}</div>}
      {quiz && !snapshot.finished && <LearningOverlay quiz={quiz} online remainingSeconds={snapshot.remainingSeconds}
        onAnswer={(round,index)=>socket.emit('online:answer',snapshot.matchId,round,index)}
        onContinue={round=>socket.emit('online:continue',snapshot.matchId,round)} onExit={exit}/>}
      {snapshot.finished && <MatchResults results={snapshot.results??[]} playerId={socket.id!} reason={snapshot.players.length<2?'opponents-left':'time'} onExit={exit} actions={<>
        <p>{room.members.filter(member=>member.ready).length}/{room.members.length} người sẵn sàng chơi lại · Giữ nguyên nhân vật và mã phòng.</p>
        <button className="pixel-button secondary" onClick={()=>socket.emit('online:ready',!me?.ready)}>{me?.ready?'HỦY SẴN SÀNG':'SẴN SÀNG CHƠI LẠI'}</button>
        {host && <><button className="pixel-button primary" disabled={room.members.length<2 || !room.members.every(member=>member.ready)} onClick={()=>socket.emit('online:start')}>CHƠI LẠI NGAY</button><button className="pixel-button secondary" onClick={()=>socket.emit('online:lobby')}>VỀ PHÒNG CHỜ · MỜI THÊM BẠN</button></>}
      </>}/>}
    </div>;
  }
  return <main className="online-shell lobby-shell"><div className="lobby-layout">
    <header className="lobby-hero"><div className="lobby-hero-copy"><div className="eyebrow">MARKET MAYHEM · ONLINE</div><h2>Thành phố nhỏ.<br/><em>Tham vọng lớn.</em></h2><p>Gặp gỡ đối thủ, xây dựng đế chế và biến kiến thức thành lợi thế.</p><div className="lobby-facts"><span><b>2–4</b> người chơi</span><span><b>8</b> phút tranh tài</span><span><b>10</b> câu / người</span></div><span className={`lobby-connection ${connected?'is-connected':''}`} role="status">● {connected?'Máy chủ đã kết nối':'Đang kết nối máy chủ…'}</span></div><LobbyCity players={room?.members??[profile]}/></header>
    <section className="online-card"><div className="lobby-section-heading"><div><div className="eyebrow">{room?'QUẢNG TRƯỜNG XUẤT PHÁT':'HỒ SƠ NHÀ KINH DOANH'}</div>
    <h1>{room?`Phòng ${room.code}`:initialMode==='create'?'Tạo phòng mới':'Tham gia phòng'}</h1>
    </div>{room && <div className="lobby-room-code"><small>MÃ MỜI BẠN BÈ</small><strong>{room.code}</strong></div>}</div>
    {!room || editing?<form onSubmit={enter}>
      <AvatarSetup value={profile} onChange={setProfile} unavailableColors={room?.members.filter(member=>member.id!==socket.id).map(member=>member.color)}/>
      {!room && initialMode==='join' && <label>Mã phòng (6 chữ số)<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>}
      <button className="pixel-button primary" disabled={busy || !connected}>{busy?'ĐANG KẾT NỐI…':room?'LƯU NHÂN VẬT':initialMode==='create'?'TẠO PHÒNG · 8 PHÚT':'VÀO PHÒNG'}</button>
      {room && <button type="button" className="learning-exit" onClick={()=>{setEditing(false);setError('');}}>Hủy thay đổi</button>}</form>:<>
      <p>Chia sẻ mã <strong>{room.code}</strong> với bạn bè. Từ 2–4 người; mọi người bật sẵn sàng trước khi bắt đầu.</p>
      <ul className="online-members lobby-roster">{Array.from({length:4},(_,index)=>{const member=room.members[index];return <li key={member?.id??index} className={member?.ready?'is-ready':member?'':'empty-seat'}>{member?<><div className="lobby-player-portrait" style={{borderColor:'#'+member.color.toString(16).padStart(6,'0')}}><AvatarPreview character={member.character} color={member.color} size={64}/></div><div className="lobby-player-name"><span>{member.nickname}{member.id===socket.id?' (Bạn)':''}</span><small>{member.id===room.hostId?'★ Chủ phòng':'Nhà kinh doanh'}</small></div><strong>{member.ready?'✓ Sẵn sàng':'Đang chuẩn bị'}</strong></>:<><div className="lobby-empty-icon">+</div><span>Chờ người chơi</span><small>Chia sẻ mã để mời bạn</small></>}</li>;})}</ul>
      <button className="pixel-button secondary" onClick={()=>{setProfile({nickname:me!.nickname,character:me!.character,color:me!.color});setEditing(true);setError('');}}>ĐỔI NHÂN VẬT / MÀU</button>
      <div className="room-actions"><button className="pixel-button secondary" onClick={()=>socket.emit('online:ready',!me?.ready)}>{me?.ready?'HỦY SẴN SÀNG':'SẴN SÀNG'}</button>
        {host && <button className="pixel-button primary" disabled={room.members.length<2 || !room.members.every(m=>m.ready)} onClick={()=>socket.emit('online:start')}>BẮT ĐẦU</button>}</div>
      <p className="online-tip">10 câu/người, từ phút 1:00 đến 7:00. Đúng: khiên 5 giây và hồi tối đa 20 nộ. Sai: chờ 5 giây, không thưởng nộ và xóa khiên cũ. Khi làm bài/chờ phạt, bạn đứng yên và được bảo vệ hai chiều. Trả lời xong được đi tiếp riêng; đồng hồ vẫn chạy.</p>
      <HowToPlay/>
    </>}
    {error && <p role="alert" className="online-error">{error}</p>}
    <button className="learning-exit" onClick={exit}>{room?'Rời phòng':'Về trang chủ'}</button>
  </section><footer className="lobby-footer">CHIẾM ĐẤT · TÍCH LŨY LỢI NHUẬN · CHINH PHỤC KIẾN THỨC</footer></div></main>;
}
