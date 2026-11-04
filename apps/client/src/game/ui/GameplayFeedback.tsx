import React,{useCallback,useEffect,useRef,useState} from 'react';
import {racePoints,raceProgress,type MatchFeedbackEvent} from '@market-mayhem/shared';
import {gameAudio,type GameCue} from './gameAudio';
interface Competitor {id:string;nickname:string;score:number}
export function GameplayFeedback({events,players,playerId,finished}:{events:MatchFeedbackEvent[];players:Competitor[];playerId:string;finished:boolean}){
  const [notice,setNotice]=useState<{text:string;cue:GameCue}|null>(null);
  const lastEvent=useRef<number|null>(null),timer=useRef<ReturnType<typeof setTimeout>>();
  const active=useRef<{cue:GameCue;until:number}|null>(null),finishedBefore=useRef(false);
  const baseline=useRef<{rank:number;ids:string;ahead:string[]}|null>(null),pendingRank=useRef<{rank:number;since:number}|null>(null),lastRankNotice=useRef(0);
  const show=useCallback((text:string,cue:GameCue)=>{
    if(cue!=='loss' && active.current?.cue==='loss' && active.current.until>Date.now())return false;
    clearTimeout(timer.current);active.current={cue,until:Date.now()+2600};setNotice({text,cue});gameAudio.play(cue);
    timer.current=setTimeout(()=>{setNotice(null);active.current=null;},2600);return true;
  },[]);
  useEffect(()=>()=>{clearTimeout(timer.current);},[]);
  useEffect(()=>{
    const newest=events.reduce((max,event)=>Math.max(max,event.id),0);
    if(lastEvent.current===null){lastEvent.current=newest;return;}
    const fresh=events.filter(event=>event.id>lastEvent.current!);lastEvent.current=Math.max(lastEvent.current,newest);
    if(finished)return;
    const loss=fresh.find(event=>event.type==='cut' && event.victimId===playerId);
    const cut=fresh.find(event=>event.type==='cut' && event.actorId===playerId);
    const cells=fresh.filter(event=>event.type==='capture' && event.actorId===playerId).reduce((sum,event)=>sum+(event.cells??0),0);
    if(loss)show(`Bị ${players.find(player=>player.id===loss.actorId)?.nickname??'đối thủ'} cắt đuôi · Hồi sinh tại căn cứ`,'loss');
    else if(cut)show(`Đã cắt đuôi ${players.find(player=>player.id===cut.victimId)?.nickname??'đối thủ'}!`,'cut');
    else if(cells>0)show(`Chiếm thêm ${cells.toLocaleString('vi-VN')} ô · ${cells>=50?'VÙNG LỚN!':'Lãnh thổ đã mở rộng!'}`,'capture');
  },[events,playerId,players,finished,show]);
  useEffect(()=>{
    if(finished || !players.length)return;
    const own=players.find(player=>player.id===playerId);if(!own)return;
    const rank=raceProgress(players,playerId).rank,ids=players.map(player=>player.id).sort().join('|');
    const ahead=players.filter(player=>racePoints(player.score)>racePoints(own.score)).map(player=>player.id);
    if(!baseline.current || baseline.current.ids!==ids || rank>=baseline.current.rank){baseline.current={rank,ids,ahead};pendingRank.current=null;return;}
    const passed=baseline.current.ahead.some(id=>{const player=players.find(player=>player.id===id);return player && racePoints(own.score)>racePoints(player.score);});
    if(!passed){pendingRank.current=null;return;}
    if(pendingRank.current?.rank!==rank)pendingRank.current={rank,since:Date.now()};
    if(Date.now()-pendingRank.current.since>=1200 && Date.now()-lastRankNotice.current>=6000 && show(`Vượt lên hạng ${rank}! Tiếp tục giữ lợi thế.`,'rank')){
      lastRankNotice.current=Date.now();baseline.current={rank,ids,ahead};pendingRank.current=null;
    }
  },[players,playerId,finished,show]);
  useEffect(()=>{if(finished && !finishedBefore.current){gameAudio.play('finish');clearTimeout(timer.current);setNotice(null);}finishedBefore.current=finished;},[finished]);
  return notice?<div className={'gameplay-feedback feedback-'+notice.cue} role="status" aria-live="polite">{notice.text}</div>:null;
}
