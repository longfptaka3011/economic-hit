import { describe, expect, it } from 'vitest';
import { OnlineMatch } from '../OnlineMatch.js';

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
  it('freezes all simulation until every participant answers AND reviews',()=>{
    const match=new OnlineMatch(members);
    match.quiz.elapsedSeconds=59.999;
    match.step();const round=match.quiz.active!;
    expect(round).toBeTruthy();
    const frozen=JSON.stringify(match.snapshot(true));
    simulate(match,5);
    expect(JSON.stringify(match.snapshot(true))).toBe(frozen);
    expect(match.input('one',{sequence:10,dx:1,dy:0,sprint:true})).toBe(false);
    expect(match.quiz.viewFor('one')?.question).not.toHaveProperty('correctIndex');
    match.answer('one',round.id,round.question.correctIndex);
    expect(match.continue('one',round.id)).toBe(false);
    match.answer('two',round.id,0);match.answer('three',round.id,0);
    match.actors.get('one')!.sprint.rage=30;
    expect(match.continue('one',round.id)).toBe(true);
    expect(match.quiz.active).not.toBeNull();
    match.continue('two',round.id);
    match.continue('three',round.id);
    expect(match.quiz.active).toBeNull();
    expect(match.actors.get('one')!.sprint.rage).toBe(50);
    expect(match.continue('one',round.id)).toBe(false);
    expect(match.actors.get('one')!.sprint.rage).toBe(50);
    const time=match.remainingSeconds;match.step();expect(match.remainingSeconds).toBeLessThan(time);
  });
  it('removes a disconnected participant from the answer gate and cleans its land',()=>{
    const match=new OnlineMatch(members);
    match.quiz.elapsedSeconds=60;match.step();const round=match.quiz.active!;
    match.answer('one',round.id,0);match.answer('two',round.id,1);
    match.remove('three');
    expect(match.grid.getOwnerCellsCount('three')).toBe(0);
    expect(match.quiz.viewFor('one')?.participantCount).toBe(2);
    match.continue('one',round.id);match.continue('two',round.id);
    expect(match.quiz.active).toBeNull();
    match.remove('two');expect(match.finished).toBe(true);
  });
  it('ends on time and rejects future movement',()=>{
    const match=new OnlineMatch(members,.1);simulate(match,1);
    expect(match.finished).toBe(true);expect(match.remainingSeconds).toBe(0);
    expect(match.input('one',{sequence:1,dx:1,dy:0,sprint:true})).toBe(false);
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
