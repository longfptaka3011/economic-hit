import {SprintAbility,stepOnlineMotion,ONLINE_STEP_SECONDS,type MovementIntent,type OnlineMotion,type OnlinePlayer,type OnlineSnapshot} from '@market-mayhem/shared';

const STOP:MovementIntent={dx:0,dy:0,sprint:false};
const fromPlayer=(player:OnlinePlayer):OnlineMotion=>{
  const sprint=new SprintAbility();sprint.restore({rage:player.rage,sprinting:player.sprinting,exhausted:player.exhausted,recoveryDelaySeconds:player.sprintRecoveryDelaySeconds});
  return {x:player.x,y:player.y,vx:player.vx,vy:player.vy,sprint};
};
function integrate(state:OnlineMotion,input:MovementIntent,seconds:number):void {
  for(let remaining=seconds;remaining>1e-8;){const dt=Math.min(remaining,ONLINE_STEP_SECONDS);stepOnlineMotion(state,input,dt);remaining-=dt;}
}

/** Predict appearance only. Rebase to authority and replay recent local intent.
 * Receipt timing is estimated from acknowledged input + server-held duration;
 * replay is capped at 300ms, rather than guessing through a long outage. */
export class LocalMotionPrediction {
  private state:OnlineMotion|null=null;
  private history:Array<{start:number;end:number;input:MovementIntent}>=[];
  private sent=new Map<number,number>();
  private lastTime=0;
  private receivedAt=0;
  private tick=-1;
  private revision=-1;
  private frozen=true;
  private offset={x:0,y:0};

  public recordSent(sequence:number,now:number):void {
    this.sent.set(sequence,now);
    for(const [id,time] of this.sent)if(time<now-2000)this.sent.delete(id);
  }
  public reconcile(player:OnlinePlayer,tick:number,now:number,frozen=false):void {
    if(tick<this.tick)return;
    const reset=!this.state || this.revision!==player.motionRevision || frozen || this.frozen!==frozen;
    const previous=this.state?{x:this.state.x+this.offset.x,y:this.state.y+this.offset.y}:player;
    this.state=fromPlayer(player);this.tick=tick;this.receivedAt=now;
    this.revision=player.motionRevision;this.frozen=frozen;
    if(reset){this.history=[];this.sent.clear();this.offset={x:0,y:0};}
    else {
      const sentAt=this.sent.get(player.lastInputSequence);
      if(sentAt!==undefined && player.inputAgeSeconds<=.5){
        const anchor=Math.max(now-300,Math.min(now,sentAt+player.inputAgeSeconds*1000));
        for(const frame of this.history){
          const duration=Math.min(now,frame.end)-Math.max(anchor,frame.start);
          if(duration>0)integrate(this.state,frame.input,duration/1000);
        }
      }
      for(const sequence of this.sent.keys())if(sequence<player.lastInputSequence)this.sent.delete(sequence);
      this.offset={x:previous.x-this.state.x,y:previous.y-this.state.y};
      if(Math.hypot(this.offset.x,this.offset.y)>128)this.offset={x:0,y:0};
    }
    this.lastTime=now;
  }
  public advance(now:number,input:MovementIntent):OnlineMotion|null {
    if(!this.state)return null;
    const start=Math.max(this.lastTime,now-100),dt=Math.max(0,now-start)/1000;
    if(!this.frozen && now-this.receivedAt<=500){
      integrate(this.state,input,dt);
      if(dt>0)this.history.push({start,end:now,input:{...input}});
    }else {this.state.vx=0;this.state.vy=0;this.state.sprint.isSprinting=false;}
    this.history=this.history.filter(frame=>frame.end>=now-1000);
    const decay=Math.exp(-dt/.08);this.offset.x*=decay;this.offset.y*=decay;
    this.lastTime=now;
    return {...this.state,x:Math.max(14,Math.min(4082,this.state.x+this.offset.x)),y:Math.max(14,Math.min(4082,this.state.y+this.offset.y))};
  }
}

/** Render opponents 120ms behind a monotonic server tick clock. Missing updates
 * hold the newest position; we never extrapolate a cut or respawn. */
export class RemoteMotionBuffer {
  private frames:OnlineSnapshot[]=[];
  private clockOffset=Infinity;
  public push(snapshot:OnlineSnapshot,now:number):void {
    if(this.frames.length && snapshot.tick<this.frames[this.frames.length-1].tick)return;
    if(this.frames.length && snapshot.tick===this.frames[this.frames.length-1].tick){this.frames[this.frames.length-1]=snapshot;return;}
    this.clockOffset=Math.min(this.clockOffset,now-snapshot.tick*1000/60);
    this.frames.push(snapshot);if(this.frames.length>30)this.frames.shift();
  }
  public sample(id:string,now:number):OnlinePlayer|null {
    const newest=this.frames[this.frames.length-1];
    const latest=newest?.players.find(player=>player.id===id);if(!latest)return null;
    if(latest.learning || newest.paused || newest.finished)return latest;
    const time=now-this.clockOffset-120;
    let before:OnlinePlayer|null=null,beforeTime=0;
    for(const frame of this.frames){
      const player=frame.players.find(player=>player.id===id);
      if(!player || player.motionRevision!==latest.motionRevision || player.learning)continue;
      const at=frame.tick*1000/60;
      if(at>=time){
        if(!before)return player;
        const alpha=Math.max(0,Math.min(1,(time-beforeTime)/(at-beforeTime)));
        return {...player,x:before.x+(player.x-before.x)*alpha,y:before.y+(player.y-before.y)*alpha,
          vx:before.vx+(player.vx-before.vx)*alpha,vy:before.vy+(player.vy-before.vy)*alpha};
      }
      before=player;beforeTime=at;
    }
    const held=before??latest;
    return time>newest.tick*1000/60+100?{...held,vx:0,vy:0}:held;
  }
}
