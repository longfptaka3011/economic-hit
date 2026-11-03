import { randomUUID } from 'node:crypto';
import { RaceQuizDirector, SprintAbility, TerritoryGrid, TrailManager, TerritoryCaptureSystem, GAME_CONSTANTS, EconomySystem,
  type OnlineMember, type OnlineInput, type OnlineSnapshot, type OnlinePlayer } from '@market-mayhem/shared';

const SPAWNS = [{col:64,row:64},{col:190,row:64},{col:64,row:190},{col:190,row:190}];
const STOP: OnlineInput = { sequence: -1, dx: 0, dy: 0, sprint: false };
interface Actor {
  member: OnlineMember; x: number; y: number; vx: number; vy: number;
  spawn: {col:number;row:number}; sprint: SprintAbility; shield: number; score: number;
  input: OnlineInput; inputAge: number; sequence: number;
}

/** Authoritative fixed-step world: clients send only intent, never position or score. */
export class OnlineMatch {
  readonly id = randomUUID();
  readonly grid = new TerritoryGrid(256, 256);
  readonly trails = new TrailManager();
  readonly economy=new EconomySystem(this.grid);
  readonly quiz: RaceQuizDirector;
  readonly actors = new Map<string, Actor>();
  remainingSeconds: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS;
  tick = 0;
  revision = 0;
  finished = false;
  quizVersion = 0;

  constructor(members: OnlineMember[], private duration: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS) {
    this.remainingSeconds = duration;
    this.quiz = new RaceQuizDirector(members.map(member => member.id));
    members.forEach((member, i) => {
      const spawn = SPAWNS[i];
      this.economy.registerPlayer(member.id);const economy=this.economy;
      this.actors.set(member.id, { member, spawn, x: spawn.col*16+8, y: spawn.row*16+8, vx:0, vy:0,
        sprint: new SprintAbility(), shield:3.5, get score(){return economy.getProfile(member.id).totalProfit;}, input:STOP, inputAge:0, sequence:-1 });
      this.grid.spawnTerritory(member.id, spawn.col, spawn.row, 2);
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
    this.quizVersion++;
    return true;
  }

  continue(playerId: string, roundId: string): boolean {
    const actor=this.actors.get(playerId);if(!actor || this.finished)return false;
    const answer=this.quiz.finish(roundId,playerId);if(!answer)return false;
    if(answer.correct)actor.sprint.rage=Math.min(100,actor.sprint.rage+20);
    actor.input=STOP;actor.vx=0;actor.vy=0;actor.inputAge=0;
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
    this.revision++;
    this.quiz.requestCrisis(id,'profit');
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
      const {dx,dy,sprint} = actor.input;
      const speed = 175 * actor.sprint.update(dt, sprint, dx !== 0 || dy !== 0);
      const response = Math.min(1,850*dt/175);
      actor.vx += (dx*speed-actor.vx)*response; actor.vy += (dy*speed-actor.vy)*response;
      const magnitude = Math.hypot(actor.vx, actor.vy);
      if (magnitude > speed) { actor.vx *= speed/magnitude; actor.vy *= speed/magnitude; }
      actor.x = Math.max(14, Math.min(4082, actor.x + actor.vx*dt));
      actor.y = Math.max(14, Math.min(4082, actor.y + actor.vy*dt));
    }
    // Determine simultaneous cuts before captures can remove a vulnerable trail.
    const victims = new Set<string>();
    for (const [id,actor] of this.actors) {
      if(this.quiz.isLearning(id))continue;
      const hit = this.trails.checkCollision(id,Math.floor(actor.x/16),Math.floor(actor.y/16));
      if (hit && !this.quiz.isLearning(hit.hitPlayerId) && this.actors.get(hit.hitPlayerId)!.shield <= 0) victims.add(hit.hitPlayerId);
    }
    for (const id of victims) this.respawn(id,this.actors.get(id)!);
    for (const [id,actor] of this.actors) {
      if (victims.has(id) || this.quiz.isLearning(id)) continue;
      const col=Math.floor(actor.x/16), row=Math.floor(actor.y/16);
      if (this.grid.getOwner(col,row) !== id) this.trails.addPoint(id,col,row);
      else if (this.trails.hasTrail(id)) {
        TerritoryCaptureSystem.capture(this.grid,id,this.trails.getTrail(id));
        this.trails.clearTrail(id); this.revision++;
      }
      const owner=this.grid.getOwner(col,row);
      if(owner && owner!==id)this.economy.collectGroundRentToll(id,owner,col,row);
    }
    // Cache zone totals until ownership changes; no full-grid scan each server tick.
    this.economy.update(dt);
    if(!this.remainingSeconds){this.economy.settleInterest();this.finished=true;this.clearInputs();}
  }

  snapshot(includeTerritory = false): OnlineSnapshot {
    const players: OnlinePlayer[] = [...this.actors.values()].map(a=>({...a.member,x:a.x,y:a.y,vx:a.vx,vy:a.vy,
      rage:a.sprint.rage,sprinting:a.sprint.isSprinting,exhausted:a.sprint.exhausted,shield:a.shield,score:a.score,learning:!this.finished && this.quiz.isLearning(a.member.id),
      ownedCells:this.grid.getOwnerCellsCount(a.member.id),economy:this.economy.getStatus(a.member.id)}));
    const territory: NonNullable<OnlineSnapshot['territory']>=[];
    if(includeTerritory)for(const id of this.actors.keys())for(const cell of this.grid.getAllOwnedCells(id))territory.push({...cell,owner:id});
    return {matchId:this.id,tick:this.tick,remainingSeconds:this.remainingSeconds,paused:false,
      finished:this.finished,players,trails:Object.fromEntries([...this.actors.keys()].map(id=>[id,this.trails.getTrail(id)])),
      territoryRevision:this.revision,...(includeTerritory?{territory}:{})};
  }
}
