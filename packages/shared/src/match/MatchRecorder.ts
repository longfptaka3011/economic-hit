import type { EconomicScoreBreakdown } from '../economy/EconomySystem.js';

export interface MatchStats { peakCells:number;captures:number;capturedCells:number;cuts:number;deaths:number;questionsAnswered:number;questionsCorrect:number }
export interface MatchFeedbackEvent { id:number;type:'capture'|'cut';actorId:string;victimId?:string;cells?:number;x:number;y:number }
export interface MatchResult {
  id:string;nickname:string;color:number;score:number;ownedCells:number;
  stats:MatchStats;income:EconomicScoreBreakdown;
}
/** Shared measurement only: never changes capture, rewards, or score. */
export class MatchRecorder {
  private stats=new Map<string,MatchStats>();
  private events:MatchFeedbackEvent[]=[];
  private sequence=0;
  public register(id:string,initialCells=25):void {this.stats.set(id,{peakCells:initialCells,captures:0,capturedCells:0,cuts:0,deaths:0,questionsAnswered:0,questionsCorrect:0});}
  public observe(id:string,cells:number):void {const stats=this.stats.get(id);if(stats)stats.peakCells=Math.max(stats.peakCells,cells);}
  public answer(id:string,correct:boolean):void {const stats=this.stats.get(id);if(stats){stats.questionsAnswered++;if(correct)stats.questionsCorrect++;}}
  public capture(actorId:string,cells:number,x:number,y:number):void {
    const stats=this.stats.get(actorId);if(!stats || cells<=0)return;
    stats.captures++;stats.capturedCells+=cells;this.emit({type:'capture',actorId,cells,x,y});
  }
  public cut(actorId:string,victimId:string,x:number,y:number):void {
    if(actorId===victimId || !this.stats.has(actorId) || !this.stats.has(victimId))return;
    this.stats.get(actorId)!.cuts++;this.stats.get(victimId)!.deaths++;this.emit({type:'cut',actorId,victimId,x,y});
  }
  private emit(event:Omit<MatchFeedbackEvent,'id'>):void {this.events.push({...event,id:++this.sequence});if(this.events.length>12)this.events.shift();}
  public recentEvents():MatchFeedbackEvent[] {return this.events.map(event=>({...event}));}
  public forPlayer(id:string):MatchStats {return {...(this.stats.get(id)??{peakCells:0,captures:0,capturedCells:0,cuts:0,deaths:0,questionsAnswered:0,questionsCorrect:0})};}
}
