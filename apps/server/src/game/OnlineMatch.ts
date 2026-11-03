import { randomUUID } from 'node:crypto';
import { QuizDirector, SprintAbility, TerritoryGrid, TrailManager, TerritoryCaptureSystem, GAME_CONSTANTS,
  type OnlineMember, type OnlineInput, type OnlineSnapshot, type OnlinePlayer } from '@market-mayhem/shared';

const SPAWNS = [{col:64,row:64},{col:190,row:64},{col:64,row:190},{col:190,row:190}];
const STOP: OnlineInput = { sequence: -1, dx: 0, dy: 0, sprint: false };
interface Actor {
  member: OnlineMember; x: number; y: number; vx: number; vy: number;
  spawn: {col:number;row:number}; sprint: SprintAbility; shield: number; score: number;
  input: OnlineInput; inputAge: number; sequence: number; interest: number; toll: number;
}

/** Authoritative fixed-step world: clients send only intent, never position or score. */
export class OnlineMatch {
  readonly id = randomUUID();
  readonly grid = new TerritoryGrid(256, 256);
  readonly trails = new TrailManager();
  readonly quiz: QuizDirector;
  readonly actors = new Map<string, Actor>();
  readonly readyIds = new Set<string>();
  remainingSeconds: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS;
  tick = 0;
  revision = 0;
  finished = false;
  quizVersion = 0;

  constructor(members: OnlineMember[], private duration: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS) {
    this.remainingSeconds = duration;
    this.quiz = new QuizDirector(members.map(member => member.id));
    members.forEach((member, i) => {
      const spawn = SPAWNS[i];
      this.actors.set(member.id, { member, spawn, x: spawn.col*16+8, y: spawn.row*16+8, vx:0, vy:0,
        sprint: new SprintAbility(), shield:3.5, score:0, input:STOP, inputAge:0, sequence:-1, interest:0, toll:0 });
      this.grid.spawnTerritory(member.id, spawn.col, spawn.row, 2);
    });
  }

  input(playerId: string, input: OnlineInput): boolean {
    const actor = this.actors.get(playerId);
    if (!actor || this.finished || this.quiz.active || !input || !Number.isSafeInteger(input.sequence) || input.sequence <= actor.sequence) return false;
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
    if (!this.quiz.submit(roundId, playerId, option)) return false;
    this.quizVersion++;
    return true;
  }

  continue(playerId: string, roundId: string): boolean {
    if (!this.actors.has(playerId) || this.quiz.active?.id !== roundId || !this.quiz.canContinue) return false;
    if (this.readyIds.has(playerId)) return false;
    this.readyIds.add(playerId);
    this.quizVersion++;
    this.tryResume();
    return true;
  }

  private tryResume(): void {
    const round = this.quiz.active;
    if (!round || !this.quiz.canContinue || this.readyIds.size !== this.actors.size) return;
    const answers = this.quiz.finish(round.id);
    if (!answers) return;
    for (const [id, answer] of answers) {
      const actor = this.actors.get(id);
      if (actor && answer.correct) actor.sprint.rage = Math.min(100, actor.sprint.rage + 20);
    }
    this.readyIds.clear();
    this.clearInputs();
    this.quizVersion++;
  }

  remove(playerId: string): void {
    this.actors.delete(playerId);
    this.trails.clearTrail(playerId);
    this.grid.clearOwner(playerId);
    this.revision++;
    this.quiz.removeParticipant(playerId);
    this.readyIds.delete(playerId);
    this.quizVersion++;
    if (this.actors.size < 2) { this.finished = true; this.clearInputs(); }
    else this.tryResume();
  }

  private respawn(id: string, actor: Actor): void {
    this.trails.clearTrail(id);
    this.grid.clearOwner(id);
    this.grid.spawnTerritory(id, actor.spawn.col, actor.spawn.row, 2);
    actor.x = actor.spawn.col*16+8; actor.y = actor.spawn.row*16+8;
    actor.vx = 0; actor.vy = 0; actor.input = STOP; actor.sprint.reset(); actor.shield = 3.5;
    this.revision++;
    this.quiz.requestCrisis('profit');
  }

  step(dt = 1/60): void {
    if (this.finished || this.quiz.active) return;
    if (this.quiz.update(dt)) { this.clearInputs(); this.readyIds.clear(); this.quizVersion++; return; }
    this.tick++;
    this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);
    if (!this.remainingSeconds) { this.finished = true; this.clearInputs(); return; }
    for (const actor of this.actors.values()) {
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
      const hit = this.trails.checkCollision(id,Math.floor(actor.x/16),Math.floor(actor.y/16));
      if (hit && this.actors.get(hit.hitPlayerId)!.shield <= 0) victims.add(hit.hitPlayerId);
    }
    for (const id of victims) this.respawn(id,this.actors.get(id)!);
    for (const [id,actor] of this.actors) {
      if (victims.has(id)) continue;
      const col=Math.floor(actor.x/16), row=Math.floor(actor.y/16);
      if (this.grid.getOwner(col,row) !== id) this.trails.addPoint(id,col,row);
      else if (this.trails.hasTrail(id)) {
        TerritoryCaptureSystem.capture(this.grid,id,this.trails.getTrail(id));
        this.trails.clearTrail(id); this.revision++;
      }
      actor.toll = Math.max(0, actor.toll-dt);
      const owner=this.grid.getOwner(col,row);
      if (owner && owner !== id && col>=128 && row>=128 && !actor.toll) {
        const recipient=this.actors.get(owner);
        if (recipient) { const toll=Math.min(5,actor.score);actor.score-=toll;recipient.score+=toll;actor.toll=.8; }
      }
    }
    // Cache zone totals until ownership changes; no full-grid scan each server tick.
    this.updateEconomy(dt);
  }

  private countsRevision = -1;
  private counts = new Map<string, number[]>();
  private updateEconomy(dt:number):void {
    if (this.countsRevision !== this.revision) {
      this.counts.clear();
      for (const id of this.actors.keys()) this.counts.set(id,[0,0,0,0,0]);
      for (let row=0;row<256;row++) for (let col=0;col<256;col++) {
        const owner=this.grid.getOwner(col,row);if(!owner)continue;
        const zone=Math.hypot(col-128,row-128)<=30?4:col<128?(row<128?0:2):(row<128?1:3);
        const counts=this.counts.get(owner);if(counts)counts[zone]++;
      }
      this.countsRevision=this.revision;
    }
    for (const [id,actor] of this.actors) {
      const [industrial,commercial,financial,land,central]=this.counts.get(id)!;
      actor.score += (industrial*2.5*(1+commercial/80)+commercial*1.8+land*1.5+central*1.5)*dt;
      actor.interest+=dt;
      if(actor.interest>=2.5){actor.interest-=2.5;if(financial && actor.score>50)actor.score+=actor.score*(.015+financial*.001);}
    }
  }

  snapshot(includeTerritory = false): OnlineSnapshot {
    const players: OnlinePlayer[] = [...this.actors.values()].map(a=>({...a.member,x:a.x,y:a.y,vx:a.vx,vy:a.vy,
      rage:a.sprint.rage,sprinting:a.sprint.isSprinting,exhausted:a.sprint.exhausted,shield:a.shield,score:a.score,
      ownedCells:this.grid.getOwnerCellsCount(a.member.id)}));
    const territory: NonNullable<OnlineSnapshot['territory']>=[];
    if(includeTerritory)for(const id of this.actors.keys())for(const cell of this.grid.getAllOwnedCells(id))territory.push({...cell,owner:id});
    return {matchId:this.id,tick:this.tick,remainingSeconds:this.remainingSeconds,paused:!!this.quiz.active && !this.finished,
      finished:this.finished,players,trails:Object.fromEntries([...this.actors.keys()].map(id=>[id,this.trails.getTrail(id)])),
      territoryRevision:this.revision,...(includeTerritory?{territory}:{})};
  }
}
