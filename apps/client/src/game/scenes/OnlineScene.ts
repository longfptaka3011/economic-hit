import Phaser from 'phaser';
import { TerritoryGrid, TrailManager, SprintAbility, type OnlineSnapshot } from '@market-mayhem/shared';
import { LogicalGrid } from '../entities/LogicalGrid';
import { CityMapRenderer } from '../rendering/CityMapRenderer';
import { PlayerRenderer } from '../rendering/PlayerRenderer';
import { TerritoryRenderer } from '../rendering/TerritoryRenderer';
import { CameraSystem } from '../systems/CameraSystem';
import { InputSystem } from '../systems/InputSystem';
import { socket } from '../../networking/socket';

/** Online scene displays server snapshots only; it never awards land or scores. */
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
    this.ready=true;this.applySnapshot(this.snapshot);
    const local=this.renderers.get(this.playerId);
    if(local)this.cameraSystem.followTarget(local.getContainer());
    this.scale.on('resize',this.resize,this);
    this.game.events.on(Phaser.Core.Events.BLUR,this.stopInput,this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.scale.off('resize',this.resize,this);
      this.game.events.off(Phaser.Core.Events.BLUR,this.stopInput,this);
      this.controls.destroy();this.cameraSystem.destroy();this.city.destroy();this.territory.destroy();
      this.renderers.forEach(renderer=>renderer.destroy());this.renderers.clear();
    });
  }
  private resize(size:Phaser.Structs.Size):void {this.cameraSystem.onResize(size.width,size.height);}
  private stopInput():void {
    this.input.keyboard?.resetKeys();
    socket.volatile.emit('online:input',this.snapshot.matchId,{sequence:++this.sequence,dx:0,dy:0,sprint:false});
  }
  public applySnapshot(snapshot:OnlineSnapshot):void {
    const wasPaused=this.snapshot.paused;
    if(!this.ready && !snapshot.territory && this.snapshot.territory) snapshot={...snapshot,territory:this.snapshot.territory};
    this.snapshot=snapshot;if(!this.ready)return;
    if(snapshot.paused!==wasPaused || snapshot.finished)this.stopInput();
    const ids=new Set(snapshot.players.map(player=>player.id));
    for(const [id,renderer]of this.renderers)if(!ids.has(id)){renderer.destroy();this.renderers.delete(id);this.trails.clearTrail(id);}
    snapshot.players.forEach((player)=>{
      if(!this.renderers.has(player.id)){
        const renderer=new PlayerRenderer(this,player.character,player.color);
        renderer.create({x:player.x,y:player.y,nickname:player.nickname,color:player.color});
        this.renderers.set(player.id,renderer);
        this.territory.registerPlayer(player.id,player.color,player.color,player.color);
      }
      this.trails.clearTrail(player.id);
      for(const point of snapshot.trails[player.id]??[])this.trails.addPoint(player.id,point.col,point.row);
    });
    if(snapshot.territory && snapshot.territoryRevision!==this.revision){
      // Complete ownership refresh is sent only on changes, including disconnects.
      const owners=new Set<string>();
      for(let row=0;row<256;row++)for(let col=0;col<256;col++){const owner=this.grid.getOwner(col,row);if(owner)owners.add(owner);}
      owners.forEach(owner=>this.grid.clearOwner(owner));
      snapshot.territory.forEach(cell=>this.grid.setOwner(cell.col,cell.row,cell.owner));
      this.revision=snapshot.territoryRevision;this.territory.renderTerritories();
    }
  }
  update(_time:number,delta:number):void {
    if(!this.ready)return;
    this.sendTimer+=delta;
    if(this.sendTimer>=50){
      this.sendTimer=0;const input=this.controls.getMovementInput();
      if(!this.snapshot.paused && !this.snapshot.finished)socket.volatile.emit('online:input',this.snapshot.matchId,
        {sequence:++this.sequence,dx:input.dx,dy:input.dy,sprint:input.sprint});
    }
    for(const player of this.snapshot.players){
      const renderer=this.renderers.get(player.id)!;
      const position=renderer.getContainer();
      const alpha=this.snapshot.paused || this.snapshot.finished?1:1-Math.exp(-delta/45);
      const snap=Math.hypot(player.x-position.x,player.y-position.y)>128;
      const x=snap?player.x:Phaser.Math.Linear(position.x,player.x,alpha);
      const y=snap?player.y:Phaser.Math.Linear(position.y,player.y,alpha);
      const frozen=this.snapshot.paused || this.snapshot.finished;
      renderer.update(x,y,frozen?0:player.vx,frozen?0:player.vy,player.shield>0);
      const sprint=new SprintAbility();sprint.rage=player.rage;sprint.isSprinting=player.sprinting && !frozen;sprint.exhausted=player.exhausted;
      renderer.updateSprint(sprint);
    }
    this.territory.update(delta/1000);
  }
}
