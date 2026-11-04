import React,{useEffect,useRef} from 'react';
import {racePoints,raceStandings,type MatchResult,type EconomicScoreBreakdown} from '@market-mayhem/shared';
const sources:Array<{key:keyof EconomicScoreBreakdown;label:string}>=[{key:'industrialProfit',label:'Công nghiệp'},{key:'commercialProfit',label:'Thương nghiệp'},{key:'financialInterest',label:'Lợi tức'},{key:'groundRent',label:'Đất đai và phí nhận'},{key:'centralProfit',label:'Chợ trung tâm'},{key:'neutralProfit',label:'Đất chung'}];
export function MatchResults({results,playerId,reason='time',practice=false,actions,onExit}:{results:MatchResult[];playerId:string;reason?:'time'|'opponents-left';practice?:boolean;actions:React.ReactNode;onExit:()=>void}){
  const panel=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[]);
  const own=results.find(result=>result.id===playerId),stats=own?.stats;
  const ranked=raceStandings(results),ownRank=ranked.find(entry=>entry.player.id===playerId)?.rank;
  const mainSource=own?sources.filter(source=>own.income[source.key]>0).sort((a,b)=>own.income[b.key]-own.income[a.key])[0]:undefined;
  const number=(value:number)=>racePoints(value).toLocaleString('vi-VN');
  return <div className="learning-backdrop" onKeyDown={event=>{
    event.stopPropagation();if(event.key!=='Tab')return;
    const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled), summary')??[]);
    if(!buttons.length)return;event.preventDefault();const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next=index<0?(event.shiftKey?buttons.length-1:0):(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length;
    buttons[next]?.focus();
  }} onKeyUp={event=>event.stopPropagation()}><section ref={panel} className={'learning-panel match-results '+(practice?'practice-results':'')} role="dialog" aria-modal="true" aria-labelledby="match-result-title">
    <div className="eyebrow">{practice?'TỔNG KẾT LUYỆN TẬP':'TỔNG KẾT CUỘC ĐUA'}</div><h2 id="match-result-title" ref={heading} tabIndex={-1}>{practice?'Hoàn thành lượt luyện tập':reason==='time'?'Hết giờ · Tổng kết thị trường':'Trận kết thúc sớm · Đối thủ đã rời'}</h2>
    <p className="result-rule">{practice?'Luyện tập một mình · Theo dõi điểm, diện tích và kiến thức của bạn.':<>Nhiều điểm kinh tế nhất thắng; cùng điểm được đồng hạng.{reason==='opponents-left'?' Bảng dưới chỉ gồm người còn trong trận.':''}</>}</p>
    {own && stats && <><div className="result-headline"><strong>{practice?'KẾT QUẢ LUYỆN TẬP':`HẠNG ${ownRank}`} · {number(own.score)} ĐIỂM</strong><span>Nguồn thu chủ yếu: {mainSource?.label??'Chưa có thu nhập'}</span></div>
      <dl className="result-stats"><div><dt>Diện tích lớn nhất</dt><dd>{number(stats.peakCells)} ô</dd></div><div><dt>Vòng chiếm đất</dt><dd>{stats.captures}</dd></div>{!practice && <><div><dt>Đã cắt đuôi</dt><dd>{stats.cuts} lần</dd></div><div><dt>Bị cắt đuôi</dt><dd>{stats.deaths} lần</dd></div></>}<div><dt>Trả lời đúng</dt><dd>{stats.questionsCorrect}/{stats.questionsAnswered} câu</dd></div><div><dt>Ô chiếm tích lũy</dt><dd>{number(stats.capturedCells)} ô</dd></div></dl>
      <details className="result-income"><summary>Xem nguồn thu và phí đã trả</summary><ul>{sources.map(source=><li key={source.key}><span>{source.label}</span><strong>{number(own.income[source.key])} điểm</strong></li>)}</ul><p>Phí đất đã trả: {number(own.income.tollsPaid)} điểm. Nguồn thu là số gộp trước phí; đã quyết toán lợi tức còn chờ.</p></details>
    </>}
    {!practice && <ol className="online-results result-ranking">{ranked.map(({player,rank})=><li key={player.id}><strong style={{color:'#'+player.color.toString(16).padStart(6,'0')}}>#{rank} {player.nickname}{player.id===playerId?' (Bạn)':''} · {number(player.score)} điểm</strong><span>{number(player.stats.peakCells)} ô lớn nhất · {player.stats.cuts} lần cắt đuôi · {player.stats.questionsCorrect}/{player.stats.questionsAnswered} câu đúng</span></li>)}</ol>}
    <div className="result-actions">{actions}</div><button className="learning-exit" onClick={onExit}>Rời trận và về trang chủ</button>
  </section></div>;
}
