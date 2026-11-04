import Phaser from 'phaser';
import { TerritoryGrid, TrailManager, SprintAbility,expandCompactTrail, type OnlineSnapshot } from '@market-mayhem/shared';
import { LogicalGrid } from '../entities/LogicalGrid';
import { CityMapRenderer } from '../rendering/CityMapRenderer';
import { PlayerRenderer } from '../rendering/PlayerRenderer';
import { TerritoryRenderer } from '../rendering/TerritoryRenderer';
import { CameraSystem } from '../systems/CameraSystem';
import { InputSystem } from '../systems/InputSystem';
import { socket } from '../../networking/socket';
import { RegionManager } from '../entities/RegionManager';
import { DiscoveryPopup } from '../ui/DiscoveryPopup';
import {ParticleEffects} from '../effects/ParticleEffects';
import {LocalMotionPrediction,RemoteMotionBuffer} from '../networking/MotionSmoothing';
import {mergeLoadingOwnership} from '../networking/ownership';

/** Predict local appearance, interpolate opponents; authority owns land and scores. */
export class OnlineScene extends Phaser.Scene {
  private grid = new TerritoryGrid(256,256);
  private trails = new TrailManager();
  private renderers = new Map<string,PlayerRenderer>();
  private territory!: TerritoryRenderer;
  private city!: CityMapRenderer;
  private cameraSystem!: CameraSystem;
  private controls!: InputSystem;
  private sequence=0;
  private sendTimer=0;
  private revision=-1;
  private ready=false;
  private regions=new RegionManager();
  private discovery!:DiscoveryPopup;
  private effects!:ParticleEffects;
  private lastEffectId=0;
  private prediction=new LocalMotionPrediction();
  private remoteMotion=new RemoteMotionBuffer();
  private lastIntent={dx:0,dy:0,sprint:false};
  private lastSnapshotTick=-1;
  private trailVersions=new Map<string,number>();
  constructor(private snapshot:OnlineSnapshot,private playerId:string){super({key:'OnlineScene'});}

  preload():void {
    this.load.spritesheet('urban_tiles','/assets/tiles/urban_tiles.png',{frameWidth:16,frameHeight:16});
    this.load.spritesheet('tiny_town_tiles','/assets/tiles/tiny_town_tiles.png',{frameWidth:16,frameHeight:16});
  }
  create():void {
    this.city=new CityMapRenderer(this,new LogicalGrid());this.city.render();
    this.territory=new TerritoryRenderer(this,this.grid,this.trails);
    this.cameraSystem=new CameraSystem(this);
    this.controls=new InputSystem(this);
    this.discovery=new DiscoveryPopup(this,340);
    this.effects=new ParticleEffects(this);this.lastEffectId=Math.max(0,...this.snapshot.events.map(event=>event.id));
    this.ready=true;this.applySnapshot(this.snapshot);
    const local=this.renderers.get(this.playerId);
    if(local)this.cameraSystem.followTarget(local.getContainer());
    this.scale.on('resize',this.resize,this);
    this.game.events.on(Phaser.Core.Events.BLUR,this.stopInput,this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.scale.off('resize',this.resize,this);
      this.game.events.off(Phaser.Core.Events.BLUR,this.stopInput,this);
      this.controls.destroy();this.cameraSystem.destroy();this.city.destroy();this.territory.destroy();
      this.discovery.destroy();
      this.renderers.forEach(renderer=>renderer.destroy());this.renderers.clear();
    });
  }
  private resize(size:Phaser.Structs.Size):void {this.cameraSystem.onResize(size.width,size.height);this.discovery.onResize(size.width,size.height);}
  private stopInput():void {
    this.game.events.emit('controls:reset');
    this.input.keyboard?.resetKeys();
    this.sendIntent({dx:0,dy:0,sprint:false},performance.now());
  }
  private sendIntent(input:{dx:number;dy:number;sprint:boolean},now:number):void {
    const sequence=++this.sequence;this.prediction.recordSent(sequence,now);
    socket.volatile.emit('online:input',this.snapshot.matchId,{sequence,...input});
    this.lastIntent={...input};this.sendTimer=0;
  }
  public applySnapshot(snapshot:OnlineSnapshot):void {
    if(this.ready && snapshot.tick<this.lastSnapshotTick)return;
    const wasPaused=this.snapshot.paused;
    const wasLearning=this.snapshot.players.find(player=>player.id===this.playerId)?.learning;
    if(!this.ready)snapshot=mergeLoadingOwnership(this.snapshot,snapshot);
    this.snapshot=snapshot;if(!this.ready)return;
    this.lastSnapshotTick=snapshot.tick;
    const now=performance.now();this.remoteMotion.push(snapshot,now);
    const me=snapshot.players.find(player=>player.id===this.playerId);
    if(me)this.prediction.reconcile(me,snapshot.tick,now,snapshot.paused || snapshot.finished || me.learning);
    if(snapshot.paused!==wasPaused || snapshot.players.find(player=>player.id===this.playerId)?.learning!==wasLearning || snapshot.finished)this.stopInput();
    const ids=new Set(snapshot.players.map(player=>player.id));
    for(const [id,renderer]of this.renderers)if(!ids.has(id)){renderer.destroy();this.renderers.delete(id);this.trails.clearTrail(id);this.trailVersions.delete(id);}
    snapshot.players.forEach((player)=>{
      if(!this.renderers.has(player.id)){
        const renderer=new PlayerRenderer(this,player.character,player.color);
        renderer.create({x:player.x,y:player.y,nickname:player.nickname,color:player.color});
        this.renderers.set(player.id,renderer);
        this.territory.registerPlayer(player.id,player.color,player.color,player.color);
      }
      const version=snapshot.trailVersions?.[player.id];
      if(version===undefined || this.trailVersions.get(player.id)!==version){
        this.trails.clearTrail(player.id);
        const points=snapshot.trails[player.id]??[];
        for(const point of snapshot.trailsCompressed?expandCompactTrail(points):points)this.trails.addPoint(player.id,point.col,point.row);
        if(version!==undefined)this.trailVersions.set(player.id,version);
      }
    });
    if(snapshot.territory && snapshot.territoryRevision!==this.revision){
      // Complete ownership refresh is sent only on changes, including disconnects.
      const owners=new Set<string>();
      for(let row=0;row<256;row++)for(let col=0;col<256;col++){const owner=this.grid.getOwner(col,row);if(owner)owners.add(owner);}
      owners.forEach(owner=>this.grid.clearOwner(owner));
      snapshot.territory.forEach(cell=>this.grid.setOwner(cell.col,cell.row,cell.owner));
      this.revision=snapshot.territoryRevision;this.territory.renderTerritories();
    }else if(snapshot.territoryDelta){
      for(const cell of snapshot.territoryDelta)this.grid.setOwner(cell.col,cell.row,cell.owner);
      this.revision=snapshot.territoryRevision;this.territory.renderTerritories();
    }
    for(const event of snapshot.events){
      if(event.id<=this.lastEffectId)continue;
      if(this.cameras.main.worldView.contains(event.x,event.y)){
        const actor=snapshot.players.find(player=>player.id===(event.type==='cut'?event.victimId:event.actorId));
        if(event.type==='capture')this.effects.emitCaptureBurst(event.x,event.y,actor?.color??0x38bdf8,event.cells);
        else this.effects.emitEliminationBurst(event.x,event.y,actor?.color??0xfb923c);
      }
      this.lastEffectId=Math.max(this.lastEffectId,event.id);
    }
  }
  update(_time:number,delta:number):void {
    if(!this.ready)return;
    const now=performance.now();
    const me=this.snapshot.players.find(player=>player.id===this.playerId);
    const blocked=this.snapshot.paused || this.snapshot.finished || !me || me.learning;
    const input=blocked?{dx:0,dy:0,sprint:false}:this.controls.getMovementInput();
    this.sendTimer+=delta;
    const predicted=this.prediction.advance(now,input);
    if(!blocked && (this.sendTimer>=50 || input.dx!==this.lastIntent.dx || input.dy!==this.lastIntent.dy || input.sprint!==this.lastIntent.sprint))this.sendIntent({dx:input.dx,dy:input.dy,sprint:input.sprint},now);
    for(const player of this.snapshot.players){
      const renderer=this.renderers.get(player.id)!;
      const motion=player.id===this.playerId?(predicted??player):(this.remoteMotion.sample(player.id,now)??player);
      const {x,y}=motion;
      const frozen=this.snapshot.paused || this.snapshot.finished || player.learning;
      renderer.update(x,y,frozen?0:motion.vx,frozen?0:motion.vy,player.shield>0 || player.learning);
      const sprint=new SprintAbility();sprint.rage=player.rage;sprint.isSprinting=player.sprinting && !frozen;sprint.exhausted=player.exhausted;
      if(player.id===this.playerId && predicted && !frozen)sprint.isSprinting=predicted.sprint.isSprinting;
      renderer.updateSprint(sprint);
      if(player.id===this.playerId && !this.snapshot.finished){
        const transition=this.regions.updatePlayerPosition(player.x,player.y);
        // This popup describes a district; discovery does not award server points.
        if(transition)this.discovery.show({...transition,bonusAwarded:0});
      }
    }
    this.territory.update(delta/1000);
  }
}
