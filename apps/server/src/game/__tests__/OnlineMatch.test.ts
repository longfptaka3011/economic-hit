import { describe, expect, it } from 'vitest';
import { OnlineMatch } from '../OnlineMatch.js';
import { LEARNING_QUESTIONS } from '@market-mayhem/shared';

const members = ['one','two','three'].map((id,i)=>({id,nickname:id,character:i,color:i,ready:true}));
const simulate=(match:OnlineMatch,seconds:number)=>{for(let i=0;i<Math.round(seconds*60);i++)match.step();};
describe('Authoritative online match',()=>{
  it('accepts only fresh valid intent and caps sprint movement, including diagonals',()=>{
    const match=new OnlineMatch(members);
    expect(match.input('outsider',{sequence:1,dx:1,dy:0,sprint:false})).toBe(false);
    expect(match.input('one',{sequence:1,dx:NaN,dy:0,sprint:false})).toBe(false);
    expect(match.input('one',{sequence:1,dx:100,dy:100,sprint:true})).toBe(true);
    expect(match.input('one',{sequence:1,dx:0,dy:0,sprint:false})).toBe(false);
    simulate(match,.4);
    const a=match.actors.get('one')!;
    expect(Math.hypot(a.vx,a.vy)).toBeLessThanOrEqual(280.0001);
    expect(a.sprint.rage).toBeLessThan(100);
    expect(match.actors.get('two')!.sprint.rage).toBe(100);
    simulate(match,2);
    expect(Math.hypot(a.vx,a.vy)).toBeLessThan(1);
  });
  it('lets a reviewed player race while others learn; clock and economy continue with protected stationary learners',()=>{
    const match=new OnlineMatch(members);
    match.quiz.elapsedSeconds=59.999;
    match.step();const view=match.quiz.viewFor('one')!;
    expect(view).toBeTruthy();
    const actor=match.actors.get('one')!,x=actor.x,y=actor.y,time=match.remainingSeconds;
    simulate(match,5);
    expect(actor.x).toBe(x);expect(actor.y).toBe(y);expect(match.remainingSeconds).toBeLessThan(time-4.9);
    expect(actor.score).toBeGreaterThan(0);expect(match.snapshot().paused).toBe(false);
    expect(match.input('one',{sequence:10,dx:1,dy:0,sprint:true})).toBe(false);
    expect(match.quiz.viewFor('one')?.question).not.toHaveProperty('correctIndex');
    match.answer('one',view.roundId,LEARNING_QUESTIONS.find(question=>question.id===view.question.id)!.correctIndex);
    match.actors.get('one')!.sprint.rage=30;
    expect(match.continue('one',view.roundId)).toBe(true);
    expect(match.quiz.viewFor('one')).toBeNull();expect(match.quiz.viewFor('two')).not.toBeNull();
    expect(match.actors.get('one')!.sprint.rage).toBe(50);
    expect(match.continue('one',view.roundId)).toBe(false);
    expect(match.actors.get('one')!.sprint.rage).toBe(50);
    expect(match.input('one',{sequence:11,dx:1,dy:0,sprint:false})).toBe(true);
    simulate(match,.3);expect(actor.x).toBeGreaterThan(x);
    expect(match.snapshot().players.find(player=>player.id==='two')?.learning).toBe(true);
  });
  it('removes a disconnected participant from the answer gate and cleans its land',()=>{
    const match=new OnlineMatch(members);
    match.quiz.elapsedSeconds=60;match.step();const round=match.quiz.viewFor('one')!;
    match.answer('one',round.roundId,0);match.answer('two',round.roundId,1);
    match.remove('three');
    expect(match.grid.getOwnerCellsCount('three')).toBe(0);
    expect(match.quiz.viewFor('one')?.participantCount).toBe(2);
    match.continue('one',round.roundId);match.continue('two',round.roundId);
    expect(match.quiz.viewFor('one')).toBeNull();expect(match.quiz.viewFor('two')).toBeNull();
    match.remove('two');expect(match.finished).toBe(true);
  });
  it('ends on time and rejects future movement',()=>{
    const match=new OnlineMatch(members,.1);simulate(match,1);
    expect(match.finished).toBe(true);expect(match.remainingSeconds).toBe(0);
    expect(match.input('one',{sequence:1,dx:1,dy:0,sprint:true})).toBe(false);
  });
  it('gives all four stationary spawn players equal final points, including unsettled finance income',()=>{
    const match=new OnlineMatch([...members,{id:'four',nickname:'four',character:3,color:3,ready:true}]);
    simulate(match,481);
    const players=match.snapshot().players;
    for(const player of players){expect(player.score).toBeCloseTo(24000,4);expect(player.economy.ratePerSecond).toBe(50);expect(player.economy.pendingInterest).toBe(0);}
  });
  it('protects an exposed learner trail, prevents learner attacks and restores ordinary vulnerability on review',()=>{
    const match=new OnlineMatch(members);match.quiz.elapsedSeconds=60;match.step();
    const view=match.quiz.viewFor('one')!,a=match.actors.get('one')!,b=match.actors.get('two')!;
    a.shield=0;b.shield=0;match.trails.addPoint('one',100,100);b.x=1608;b.y=1608;
    match.answer('two',view.roundId,0);match.continue('two',view.roundId);match.step();
    expect(match.trails.hasTrail('one')).toBe(true);expect(a.shield).toBe(0);
    match.trails.addPoint('two',Math.floor(a.x/16),Math.floor(a.y/16));match.step();
    expect(b.shield).toBe(0); // A learner standing on a rival trail does not cut it.
    match.answer('one',view.roundId,0);match.continue('one',view.roundId);match.step();
    expect(a.shield).toBe(3.5);expect(match.trails.hasTrail('one')).toBe(false);
  });
  it('finishes on real time even when nobody answers a question',()=>{
    const match=new OnlineMatch(members,60.1);simulate(match,61);
    expect(match.finished).toBe(true);expect(match.remainingSeconds).toBe(0);
    expect(match.snapshot().players.every(player=>!player.learning)).toBe(true);
  });
  it('captures a closed trail using the existing capture engine',()=>{
    const match=new OnlineMatch(members);const actor=match.actors.get('one')!;
    actor.x=64*16+8;actor.y=64*16+8;
    for(let col=64;col<=70;col++)match.trails.addPoint('one',col,64);
    for(let row=65;row<=70;row++)match.trails.addPoint('one',70,row);
    for(let col=69;col>=64;col--)match.trails.addPoint('one',col,70);
    for(let row=69;row>=64;row--)match.trails.addPoint('one',64,row);
    match.step();expect(match.grid.getOwnerCellsCount('one')).toBeGreaterThan(25);
    expect(match.trails.hasTrail('one')).toBe(false);
    expect(match.revision).toBeGreaterThan(0);
  });
  it('respawns a player whose exposed trail is cut, with protection and fresh rage',()=>{
    const match=new OnlineMatch(members);
    const victim=match.actors.get('one')!, attacker=match.actors.get('two')!;
    victim.shield=0;victim.sprint.rage=2;
    match.trails.addPoint('one',100,100);
    attacker.x=1608;attacker.y=1608;
    match.step();
    expect(victim.shield).toBe(3.5);expect(victim.sprint.rage).toBe(100);
    expect(match.trails.hasTrail('one')).toBe(false);
    expect(match.grid.getOwnerCellsCount('one')).toBe(25);
  });
});
