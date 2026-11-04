import {SprintAbility} from '../abilities/SprintAbility.js';

export interface MovementIntent {dx:number;dy:number;sprint:boolean}
export interface OnlineMotion {x:number;y:number;vx:number;vy:number;sprint:SprintAbility}
export const ONLINE_STEP_SECONDS=1/60;

/** Shared visual prediction / authoritative physics. No land, cuts or scores. */
export function stepOnlineMotion(state:OnlineMotion,input:MovementIntent,dt:number):void {
  const divisor=Math.max(1,Math.hypot(input.dx,input.dy));
  const dx=input.dx/divisor,dy=input.dy/divisor;
  const speed=175*state.sprint.update(dt,input.sprint,dx!==0 || dy!==0);
  const response=Math.min(1,850*dt/175);
  state.vx+=(dx*speed-state.vx)*response;state.vy+=(dy*speed-state.vy)*response;
  const magnitude=Math.hypot(state.vx,state.vy);
  if(magnitude>speed){state.vx*=speed/magnitude;state.vy*=speed/magnitude;}
  state.x=Math.max(14,Math.min(4082,state.x+state.vx*dt));
  state.y=Math.max(14,Math.min(4082,state.y+state.vy*dt));
}
