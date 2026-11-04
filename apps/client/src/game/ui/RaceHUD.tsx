import React from 'react';
import { CORE_DISTRICTS,DISTRICT_NAMES,economicZoneAt,racePoints,raceProgress,raceStandings,expansionAdvice,type EconomyStatus } from '@market-mayhem/shared';
import {AudioToggle} from './AudioToggle';

export interface RaceCompetitor { id:string;nickname:string;color:number;score:number;ownedCells:number;economy:EconomyStatus;learning?:boolean;shield?:number;x:number;y:number }
export interface RaceView { players:RaceCompetitor[];remainingSeconds:number }
export function RaceHUD({players,playerId,remainingSeconds,heading,actions}:{players:RaceCompetitor[];playerId:string;remainingSeconds:number;heading:string;actions:React.ReactNode}){
  const own=players.find(player=>player.id===playerId);if(!own)return null;
  const progress=raceProgress(players,playerId),standings=raceStandings(players),advice=expansionAdvice(own.economy.counts);
  const number=(value:number)=>racePoints(value).toLocaleString('vi-VN');
  return <section className="race-hud" aria-label="Cuộc đua điểm kinh tế">
    <div className="race-topline"><span>{heading}</span><strong className={remainingSeconds<=60?'race-urgent':''}>{Math.floor(remainingSeconds/60)}:{Math.floor(remainingSeconds%60).toString().padStart(2,'0')}</strong></div>
    <div className="race-scoreline"><strong className="race-rank">HẠNG {progress.rank}/{players.length}</strong><strong className="race-score">{number(own.score)} <small>điểm</small></strong></div>
    <p className="race-gap">{progress.text}</p>
    <p className="race-rule">Hết 8 phút: nhiều điểm nhất thắng · Hòa điểm = đồng hạng</p>
    <p className="race-rule">Đang ở: {DISTRICT_NAMES[economicZoneAt(Math.floor(own.x/16),Math.floor(own.y/16))]}</p>
    {own.learning && <p className="race-learning">Đang trả lời · Được bảo vệ khỏi cắt đuôi</p>}
    {!own.learning && (own.shield??0)>0 && <p className="race-shield">KHIÊN {Math.ceil(own.shield!)}s · Bảo vệ khỏi cắt đuôi</p>}
    <p className="race-target">Mở rộng 25 ô {advice.name}: <strong>+{advice.gain.toFixed(1)} điểm/s</strong> <span>(ước tính)</span></p>
    <details className="race-income"><summary>THU NHẬP +{own.economy.ratePerSecond.toFixed(1)} điểm/s · Chi tiết</summary>
      <p>4 khu: 2 điểm/ô/s · Chợ: 3 điểm/ô/s. Mỗi khu thêm đủ 25 ô tăng 5% thu nhập bốn khu, tối đa 15%.</p>
      <ul>{[...CORE_DISTRICTS,'CENTRAL' as const].map(zone=><li key={zone}><span>{DISTRICT_NAMES[zone]} · {own.economy.counts[zone]} ô</span><strong>+{own.economy.rates[zone].toFixed(1)}/s</strong></li>)}</ul>
      <p>Đa dạng hóa: +{own.economy.diversityPercent.toFixed(0)}%{own.economy.counts.FINANCIAL>0 || own.economy.pendingInterest>0?` · Lợi tức chờ nhận: ${own.economy.pendingInterest.toFixed(1)} điểm, còn ${own.economy.nextInterestSeconds.toFixed(1)}s`:''}</p>
      <p>Lợi tức trả mỗi 2,5 giây, không lãi kép theo tổng điểm; tốc độ trên là trung bình. Thu phí đất chưa tính vào tốc độ. Ước tính mở rộng chưa tính khoảng cách và đối thủ.</p>
    </details>
    <details className="race-leaderboard"><summary>BẢNG ĐIỂM · {players.length} người</summary><ol>{standings.map(({player,rank})=><li key={player.id} style={{color:'#'+player.color.toString(16).padStart(6,'0')}}><span>#{rank} {player.nickname}{player.id===playerId?' (Bạn)':''}{player.learning?' 🛡':''}</span><strong>{number(player.score)} điểm</strong></li>)}</ol></details>
    <div className="race-actions">{actions}<AudioToggle/></div>
  </section>;
}
