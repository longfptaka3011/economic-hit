import { describe, expect, it } from 'vitest';
import { OnlineMatch } from '../OnlineMatch.js';
import { LEARNING_QUESTIONS, LEARNING_STAGES } from '@market-mayhem/shared';

const members = ['one','two','three'].map((id,i)=>({id,nickname:id,character:i,color:i,ready:true}));
const simulate=(match:OnlineMatch,seconds:number)=>{for(let i=0;i<Math.round(seconds*60);i++)match.step();};
const correctFor=(id:string)=>LEARNING_QUESTIONS.find(question=>question.id===id)!.correctIndex;
describe('Authoritative online match',()=>{
  it('acknowledges normalized input and publishes sprint state without trusting client positions',()=>{
    const match=new OnlineMatch(members);
    match.input('one',{sequence:42,dx:1,dy:1,sprint:true});match.step();
    const p=match.snapshot().players.find(player=>player.id==='one')!;
    expect(p.lastInputSequence).toBe(42);expect(p.inputAgeSeconds).toBeCloseTo(1/60);
    expect(p.sprintRecoveryDelaySeconds).toBe(1);expect(p.motionRevision).toBe(0);
    const actor=match.actors.get('one')!;actor.shield=0;actor.x=1224;actor.y=1208;actor.vx=actor.vy=0;
    match.trails.addPoint('one',75,75);const other=match.actors.get('two')!;other.x=1208;other.y=1208;match.step();
    expect(match.snapshot().players.find(player=>player.id==='one')!.motionRevision).toBe(1);
    match.quiz.elapsedSeconds=60;match.step();const quiz=match.quiz.viewFor('one')!;
    match.answer('one',quiz.roundId,correctFor(quiz.question.id));match.continue('one',quiz.roundId);
    expect(match.snapshot().players.find(player=>player.id==='one')!.motionRevision).toBe(2);
  });
  it('records ten answers per player through a full eight-minute match without extra questions',()=>{
    const match=new OnlineMatch(members);let elapsed=0;
    const seen=new Set<string>();
    for(const stage of LEARNING_STAGES){
      simulate(match,stage.atSeconds-elapsed+.02);elapsed=stage.atSeconds+.02;
      const view=match.quiz.viewFor('one')!;expect(view.totalStages).toBe(10);seen.add(view.question.id);
      for(const member of members){
        expect(match.quiz.viewFor(member.id)?.question.id).toBe(view.question.id);
        expect(match.answer(member.id,view.roundId,correctFor(view.question.id))).toBe(true);
        expect(match.continue(member.id,view.roundId)).toBe(true);
      }
    }
    expect(seen.size).toBe(10);simulate(match,61);
    expect(match.finished).toBe(true);
    for(const member of members){
      expect(match.quiz.viewFor(member.id)).toBeNull();
      expect(match.recorder.forPlayer(member.id)).toMatchObject({questionsAnswered:10,questionsCorrect:10});
    }
  });
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
    expect(actor.shield).toBe(5);
    expect(match.continue('one',view.roundId)).toBe(false);
    expect(match.actors.get('one')!.sprint.rage).toBe(50);
    expect(match.input('one',{sequence:11,dx:1,dy:0,sprint:false})).toBe(true);
    simulate(match,.3);expect(actor.x).toBeGreaterThan(x);
    expect(match.snapshot().players.find(player=>player.id==='two')?.learning).toBe(true);
  });
  it('removes a disconnected participant from the answer gate and cleans its land',()=>{
    const match=new OnlineMatch(members);
    match.quiz.elapsedSeconds=60;match.step();const round=match.quiz.viewFor('one')!;
    const correct=correctFor(round.question.id);match.answer('one',round.roundId,correct);match.answer('two',round.roundId,correct);
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
    const wrong=(correctFor(view.question.id)+1)%4;
    match.answer('two',view.roundId,wrong);simulate(match,5);match.continue('two',view.roundId);match.step();
    expect(match.trails.hasTrail('one')).toBe(true);expect(a.shield).toBe(0);
    match.trails.addPoint('two',Math.floor(a.x/16),Math.floor(a.y/16));match.step();
    expect(b.shield).toBe(0); // A learner standing on a rival trail does not cut it.
    match.answer('one',view.roundId,wrong);simulate(match,5);match.continue('one',view.roundId);match.step();
    expect(a.shield).toBe(3.5);expect(match.trails.hasTrail('one')).toBe(false);
  });
  it('rejects early wrong-answer movement and review, then clears any old shield without rewarding rage',()=>{
    const match=new OnlineMatch(members);match.quiz.elapsedSeconds=60;match.step();const view=match.quiz.viewFor('one')!;
    const actor=match.actors.get('one')!;actor.shield=3;actor.sprint.rage=30;
    match.answer('one',view.roundId,(correctFor(view.question.id)+1)%4);
    expect(match.continue('one',view.roundId)).toBe(false);expect(match.input('one',{sequence:100,dx:1,dy:0,sprint:true})).toBe(false);
    const {x,y}=actor;simulate(match,4.9);expect(actor.x).toBe(x);expect(actor.y).toBe(y);expect(match.continue('one',view.roundId)).toBe(false);
    simulate(match,.1);expect(match.continue('one',view.roundId)).toBe(true);expect(actor.shield).toBe(0);expect(actor.sprint.rage).toBe(30);
    expect(match.continue('one',view.roundId)).toBe(false);expect(actor.shield).toBe(0);
  });
  it('grants five seconds of actual trail protection after correct review and cannot refresh it by replaying continue',()=>{
    const match=new OnlineMatch(members);match.quiz.elapsedSeconds=60;match.step();const view=match.quiz.viewFor('one')!;
    const correct=correctFor(view.question.id);for(const id of ['one','two']){match.answer(id,view.roundId,correct);match.continue(id,view.roundId);}
    const a=match.actors.get('one')!,b=match.actors.get('two')!;a.x=1608;a.y=1624;b.x=1608;b.y=1608;match.trails.addPoint('one',100,100);
    simulate(match,4.9);expect(a.shield).toBeGreaterThan(0);expect(a.shield).toBeLessThan(.11);expect(match.trails.hasTrail('one')).toBe(true);
    expect(match.continue('one',view.roundId)).toBe(false);expect(a.shield).toBeLessThan(.11);
    simulate(match,.2);expect(a.x).toBe(64*16+8);expect(a.shield).toBeGreaterThan(3);expect(a.shield).toBeLessThanOrEqual(3.5);
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
    const cells=match.grid.getOwnerCellsCount('one');expect(match.recorder.forPlayer('one')).toMatchObject({captures:1,capturedCells:cells-25,peakCells:cells});
    expect(match.snapshot().events[0]).toMatchObject({type:'capture',actorId:'one',cells:cells-25});
    const before=match.recorder.forPlayer('one');match.snapshot();match.snapshot();expect(match.recorder.forPlayer('one')).toEqual(before);
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
    expect(match.recorder.forPlayer('one').deaths).toBe(1);expect(match.recorder.forPlayer('two').cuts).toBe(1);
  });
  it('credits a simultaneous cut once and returns consistent finished statistics without exposing live answer totals',()=>{
    const match=new OnlineMatch(members),victim=match.actors.get('one')!;victim.shield=0;match.trails.addPoint('one',100,100);
    for(const id of ['two','three']){match.actors.get(id)!.x=1608;match.actors.get(id)!.y=1608;}
    match.step();expect(match.recorder.forPlayer('one').deaths).toBe(1);
    expect(match.recorder.forPlayer('two').cuts+match.recorder.forPlayer('three').cuts).toBe(1);expect(match.snapshot().results).toBeUndefined();
    match.quiz.elapsedSeconds=60;match.step();const view=match.quiz.viewFor('one')!,correct=correctFor(view.question.id);
    expect(match.answer('one',view.roundId,correct)).toBe(true);expect(match.answer('one',view.roundId,correct)).toBe(false);
    match.remainingSeconds=.001;match.step();const results=match.snapshot().results!;
    const own=results.find(result=>result.id==='one')!;expect(own.stats).toMatchObject({questionsAnswered:1,questionsCorrect:1,deaths:1});
    expect(own.income.totalProfit).toBe(own.score);expect(own.stats.peakCells).toBeGreaterThanOrEqual(own.ownedCells);
    own.stats.questionsCorrect=999;expect(match.snapshot().results!.find(result=>result.id==='one')!.stats.questionsCorrect).toBe(1);
  });
});
