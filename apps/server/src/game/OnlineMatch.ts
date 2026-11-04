import { randomUUID,randomInt } from 'node:crypto';
import { RaceQuizDirector, SprintAbility, TerritoryGrid, TrailManager, TerritoryCaptureSystem, GAME_CONSTANTS, EconomySystem,learningOutcome,MatchRecorder,
  stepOnlineMotion, type OnlineMember, type OnlineInput, type OnlineSnapshot, type OnlinePlayer } from '@market-mayhem/shared';

const SPAWNS = [{col:64,row:64},{col:190,row:64},{col:64,row:190},{col:190,row:190}];
function chooseSpawns(count:number):Array<{col:number;row:number}> {
  if(count>GAME_CONSTANTS.MAX_PLAYERS)throw new Error('Too many players for an online match');
  if(count<=4)return SPAWNS.slice(0,count);
  // Equal distance from the central market, away from district boundaries.
  // Shuffle sixteen separated slots so join order grants no fixed position.
  const pool=Array.from({length:16},(_,i)=>{const angle=Math.PI/16+i*Math.PI/8;return {col:Math.round(127.5+90*Math.cos(angle)),row:Math.round(127.5+90*Math.sin(angle))};});
  for(let i=pool.length-1;i>0;i--){const j=randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,count);
}
const STOP: OnlineInput = { sequence: -1, dx: 0, dy: 0, sprint: false };
interface Actor {
  member: OnlineMember; x: number; y: number; vx: number; vy: number;
  spawn: {col:number;row:number}; sprint: SprintAbility; shield: number; score: number;
  input: OnlineInput; inputAge: number; sequence: number; motionRevision:number;
}

/** Authoritative fixed-step world: clients send only intent, never position or score. */
export class OnlineMatch {
  readonly id = randomUUID();
  readonly grid = new TerritoryGrid(256, 256);
  readonly trails = new TrailManager();
  readonly economy=new EconomySystem(this.grid);
  readonly recorder=new MatchRecorder();
  readonly quiz: RaceQuizDirector;
  readonly actors = new Map<string, Actor>();
  remainingSeconds: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS;
  tick = 0;
  revision = 0;
  finished = false;
  quizVersion = 0;

  constructor(members: OnlineMember[], private duration: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS) {
    const spawns=chooseSpawns(members.length);
    this.remainingSeconds = duration;
    this.quiz = new RaceQuizDirector(members.map(member => member.id));
    members.forEach((member, i) => {
      const spawn = spawns[i];
      this.economy.registerPlayer(member.id);const economy=this.economy;
      this.actors.set(member.id, { member, spawn, x: spawn.col*16+8, y: spawn.row*16+8, vx:0, vy:0,
        sprint: new SprintAbility(), shield:3.5, get score(){return economy.getProfile(member.id).totalProfit;}, input:STOP, inputAge:0, sequence:-1,motionRevision:0 });
      this.grid.spawnTerritory(member.id, spawn.col, spawn.row, 2);
      this.recorder.register(member.id,this.grid.getOwnerCellsCount(member.id));
    });
  }

  input(playerId: string, input: OnlineInput): boolean {
    const actor = this.actors.get(playerId);
    if (!actor || this.finished || this.quiz.isLearning(playerId) || !input || !Number.isSafeInteger(input.sequence) || input.sequence <= actor.sequence) return false;
    if (!Number.isFinite(input.dx) || !Number.isFinite(input.dy) || typeof input.sprint !== 'boolean') return false;
    const length = Math.hypot(input.dx, input.dy);
    const divisor = Math.max(1, length);
    actor.input = { sequence: input.sequence, dx: input.dx/divisor, dy:input.dy/divisor, sprint:input.sprint };
    actor.sequence = input.sequence;
    actor.inputAge = 0;
    return true;
  }

  private clearInputs(): void {
    for (const actor of this.actors.values()) { actor.input = STOP; actor.vx = 0; actor.vy = 0; }
  }

  answer(playerId: string, roundId: string, option: number): boolean {
    if(this.finished)return false;
    if (!this.quiz.submit(roundId, playerId, option)) return false;
    this.recorder.answer(playerId,this.quiz.viewFor(playerId)!.answer!.correct);
    this.quizVersion++;
    return true;
  }

  continue(playerId: string, roundId: string): boolean {
    const actor=this.actors.get(playerId);if(!actor || this.finished)return false;
    const answer=this.quiz.finish(roundId,playerId);if(!answer)return false;
    const outcome=learningOutcome(answer.correct,actor.sprint.rage);
    actor.shield=outcome.shieldSeconds;actor.sprint.rage=outcome.rage;
    actor.input=STOP;actor.vx=0;actor.vy=0;actor.inputAge=0;
    actor.motionRevision++;
    this.quizVersion++;
    return true;
  }

  remove(playerId: string): void {
    this.actors.delete(playerId);
    this.trails.clearTrail(playerId);
    this.grid.clearOwner(playerId);
    this.revision++;
    this.quiz.removeParticipant(playerId);
    this.economy.removePlayer(playerId);
    this.quizVersion++;
    if (this.actors.size < 2) { this.economy.settleInterest();this.finished = true; this.clearInputs(); }
  }

  private respawn(id: string, actor: Actor): void {
    this.trails.clearTrail(id);
    this.grid.clearOwner(id);
    this.grid.spawnTerritory(id, actor.spawn.col, actor.spawn.row, 2);
    actor.x = actor.spawn.col*16+8; actor.y = actor.spawn.row*16+8;
    actor.vx = 0; actor.vy = 0; actor.input = STOP; actor.sprint.reset(); actor.shield = 3.5;
    actor.motionRevision++;
    this.revision++;
  }

  step(dt = 1/60): void {
    if (this.finished) return;
    dt=Math.min(dt,this.remainingSeconds);
    if (this.quiz.update(dt))this.quizVersion++;
    this.tick++;
    this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);
    for (const actor of this.actors.values()) {
      if(this.quiz.isLearning(actor.member.id)){
        actor.input=STOP;actor.vx=0;actor.vy=0;actor.sprint.isSprinting=false;continue;
      }
      actor.shield = Math.max(0, actor.shield - dt);
      actor.inputAge += dt;
      if (actor.inputAge > .5) actor.input = STOP;
      stepOnlineMotion(actor,actor.input,dt);
    }
    // Determine simultaneous cuts before captures can remove a vulnerable trail.
    const victims = new Map<string,string>();
    for (const [id,actor] of this.actors) {
      if(this.quiz.isLearning(id))continue;
      const hit = this.trails.checkCollision(id,Math.floor(actor.x/16),Math.floor(actor.y/16));
      if (hit && !this.quiz.isLearning(hit.hitPlayerId) && this.actors.get(hit.hitPlayerId)!.shield <= 0 && !victims.has(hit.hitPlayerId))victims.set(hit.hitPlayerId,id);
    }
    for (const [id,attacker] of victims){const victim=this.actors.get(id)!;this.recorder.cut(attacker,id,victim.x,victim.y);this.respawn(id,victim);}
    for (const [id,actor] of this.actors) {
      if (victims.has(id) || this.quiz.isLearning(id)) continue;
      const col=Math.floor(actor.x/16), row=Math.floor(actor.y/16);
      if (this.grid.getOwner(col,row) !== id) this.trails.addPoint(id,col,row);
      else if (this.trails.hasTrail(id)) {
        const before=this.grid.getOwnerCellsCount(id);
        TerritoryCaptureSystem.capture(this.grid,id,this.trails.getTrail(id));
        this.recorder.capture(id,this.grid.getOwnerCellsCount(id)-before,actor.x,actor.y);
        this.recorder.observe(id,this.grid.getOwnerCellsCount(id));
        this.trails.clearTrail(id); this.revision++;
      }
      const owner=this.grid.getOwner(col,row);
      if(owner && owner!==id)this.economy.collectGroundRentToll(id,owner,col,row);
    }
    // Cache zone totals until ownership changes; no full-grid scan each server tick.
    this.economy.update(dt);
    if(!this.remainingSeconds){this.economy.settleInterest();this.finished=true;this.clearInputs();}
  }

  snapshot(includeTerritory = false,sinceGridRevision?:number): OnlineSnapshot {
    const players: OnlinePlayer[] = [...this.actors.values()].map(a=>({...a.member,x:a.x,y:a.y,vx:a.vx,vy:a.vy,
      rage:a.sprint.rage,sprinting:a.sprint.isSprinting,exhausted:a.sprint.exhausted,shield:a.shield,score:a.score,learning:!this.finished && this.quiz.isLearning(a.member.id),
      lastInputSequence:a.sequence,inputAgeSeconds:a.inputAge,motionRevision:a.motionRevision,sprintRecoveryDelaySeconds:a.sprint.recoveryDelaySeconds,
      ownedCells:this.grid.getOwnerCellsCount(a.member.id),economy:this.economy.getStatus(a.member.id)}));
    const territory: NonNullable<OnlineSnapshot['territory']>=[];
    if(includeTerritory)for(const id of this.actors.keys())for(const cell of this.grid.getAllOwnedCells(id))territory.push({...cell,owner:id});
    return {matchId:this.id,tick:this.tick,remainingSeconds:this.remainingSeconds,paused:false,
      finished:this.finished,players,trails:Object.fromEntries([...this.actors.keys()].map(id=>[id,this.trails.getCompactTrail(id)])),
      trailsCompressed:true,trailVersions:Object.fromEntries([...this.actors.keys()].map(id=>[id,this.trails.versionFor(id)])),
      territoryRevision:this.revision,events:this.recorder.recentEvents(),
      ...(this.finished?{results:players.map(player=>({id:player.id,nickname:player.nickname,color:player.color,score:player.score,ownedCells:player.ownedCells,stats:this.recorder.forPlayer(player.id),income:{...this.economy.getProfile(player.id)}}))}:{}),
      ...(includeTerritory?{territory}:{}),
      ...(!includeTerritory && sinceGridRevision!==undefined && sinceGridRevision!==this.grid.revision?{territoryDelta:this.grid.changesSince(sinceGridRevision)}:{})};
  }
}
