import { districtIncome,DISTRICT_NAMES,emptyZoneCounts,type ZoneCounts } from './EconomySystem.js';
import type { ZoneType } from '../types/territory.types.js';

/** Rank exactly the integer points displayed in the HUD; equal points share rank. */
export const racePoints=(score:number):number=>Math.max(0,Math.floor(score+1e-6));
export function raceStandings<T extends {id:string;score:number}>(players:readonly T[]):Array<{player:T;rank:number}> {
  const ordered=[...players].sort((a,b)=>racePoints(b.score)-racePoints(a.score)||a.id.localeCompare(b.id));
  let rank=1;
  return ordered.map((player,index)=>{if(index>0 && racePoints(player.score)!==racePoints(ordered[index-1].score))rank=index+1;return {player,rank};});
}
export function raceProgress(players:readonly {id:string;score:number}[],id:string):{rank:number;gap:number;text:string} {
  const standings=raceStandings(players),own=standings.find(item=>item.player.id===id);
  if(!own)return {rank:0,gap:0,text:'Đang cập nhật điểm'};
  const gap=racePoints(standings[0].player.score)-racePoints(own.player.score);
  const lead=standings.filter(item=>item.rank===1).length;
  return {rank:own.rank,gap,text:gap>0?`Kém dẫn đầu ${gap.toLocaleString('vi-VN')} điểm`:lead>1?'Đồng dẫn đầu · Mở rộng để bứt lên':`Dẫn trước ${racePoints(own.player.score)-racePoints(standings[1]?.player.score??own.player.score)} điểm`};
}
/** Marginal value of 25 additional cells, not a promise of vacant or safe land. */
export function expansionAdvice(counts:ZoneCounts=emptyZoneCounts()):{zone:ZoneType;name:string;gain:number} {
  const current=districtIncome(counts).ratePerSecond;
  const options=(['CENTRAL','INDUSTRIAL','COMMERCIAL','FINANCIAL','LAND'] as const).map(zone=>({zone,name:DISTRICT_NAMES[zone],gain:districtIncome({...counts,[zone]:counts[zone]+25}).ratePerSecond-current}));
  return options.sort((a,b)=>b.gain-a.gain)[0];
}
