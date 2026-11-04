import Phaser from 'phaser';
import { MAP_CONFIG } from '../config/map.config';
import { LogicalGrid } from '../entities/LogicalGrid';
import { CityMapRenderer } from '../rendering/CityMapRenderer';
import { BoundarySystem } from '../systems/BoundarySystem';
import { InputSystem } from '../systems/InputSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { Player } from '../entities/Player';
import { PauseOverlay } from '../ui/PauseOverlay';
import { TerritoryGrid, TrailManager, TerritoryCaptureSystem, GAME_CONSTANTS, RaceQuizDirector, learningOutcome,MatchRecorder, type AvatarProfile } from '@market-mayhem/shared';
import { TerritoryRenderer } from '../rendering/TerritoryRenderer';
import { ParticleEffects } from '../effects/ParticleEffects';
import { NotificationManager } from '../ui/NotificationManager';
import { EconomicSystem } from '../systems/EconomicSystem';
import { MiniMap } from '../ui/MiniMap';

import { PlayerRenderer } from '../rendering/PlayerRenderer';
import { SprintHUD } from '../ui/SprintHUD';
import { RegionManager } from '../entities/RegionManager';
import { DiscoveryPopup } from '../ui/DiscoveryPopup';

export class MainScene extends Phaser.Scene {
  // Logical, Territory & Economic engines
  private logicalGrid!: LogicalGrid;
  private territoryGrid!: TerritoryGrid;
  private trailManager!: TrailManager;
  private economicSystem!: EconomicSystem;

  // Renderers & Effects
  private cityMapRenderer!: CityMapRenderer;
  private territoryRenderer!: TerritoryRenderer;
  private particleEffects!: ParticleEffects;
  private notificationManager!: NotificationManager;
  private miniMap!: MiniMap;

  // Systems
  private boundarySystem!: BoundarySystem;
  private inputSystem!: InputSystem;
  private cameraSystem!: CameraSystem;
  private pauseOverlay!: PauseOverlay;

  private quizDirector!: RaceQuizDirector;
  private sprintHUD!: SprintHUD;
  private regionManager!: RegionManager;
  private discoveryPopup!: DiscoveryPopup;

  // Entities
  private player!: Player;

  // Spawn constants
  private readonly playerSpawn = { col: 64, row: 64 }; // Starts in Industrial Zone

  // Match duration shared with the authoritative server.
  private matchRemainingSec: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS;

  private matchEnded=false;
  private lastClockSecond=-1;
  private lastRaceEmit=-Infinity;
  private recorder=new MatchRecorder();
  private togglePause=()=>{if(!this.quizDirector.isLearning(this.player.id) && !this.matchEnded)this.pauseOverlay.toggle();};

  constructor(private avatar:AvatarProfile={nickname:'Nhà Tư Bản Trẻ',character:0,color:0x38bdf8}) {
    super({ key: 'MainScene' });
  }

  preload(): void {
    this.load.spritesheet('urban_tiles', '/assets/tiles/urban_tiles.png', {frameWidth:16,frameHeight:16});
    this.load.spritesheet('tiny_town_tiles', '/assets/tiles/tiny_town_tiles.png', {frameWidth:16,frameHeight:16});
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,this.shutdown,this);
    this.matchRemainingSec=GAME_CONSTANTS.MATCH_DURATION_SECONDS;
    this.matchEnded=false;
    this.lastClockSecond=-1;
    this.lastRaceEmit=-Infinity;
    this.recorder=new MatchRecorder();this.recorder.register('local_player');
    this.game.events.on('request-pause',this.togglePause);
    this.quizDirector=new RaceQuizDirector(['local_player']);
    this.game.events.on('learning:answer',this.submitLearningAnswer,this);
    this.game.events.on('learning:continue',this.continueAfterLearning,this);
    PlayerRenderer.registerAnimations(this,this.avatar.character);
    // Initialize the 256x256 city grid.
    this.logicalGrid = new LogicalGrid(
      MAP_CONFIG.gridCols,
      MAP_CONFIG.gridRows,
      MAP_CONFIG.tileSize
    );
    this.territoryGrid = new TerritoryGrid(MAP_CONFIG.gridCols, MAP_CONFIG.gridRows);
    this.trailManager = new TrailManager();

    // 2. Initialize Economic System (Marxist Surplus Value & 4 Forms)
    this.economicSystem = new EconomicSystem(this.territoryGrid, this.logicalGrid);
    this.economicSystem.registerPlayer('local_player');

    // 3. Visual Cartoon City Map Rendering (Bakes roads, buildings, trees, central market)
    this.cityMapRenderer = new CityMapRenderer(this, this.logicalGrid);
    this.cityMapRenderer.render();

    // 4. Territory & Trail Renderer (Paper.io 2 vibrant layered paper)
    this.territoryRenderer = new TerritoryRenderer(this, this.territoryGrid, this.trailManager);
    this.territoryRenderer.registerPlayer('local_player', this.avatar.color, this.avatar.color, this.avatar.color);

    // 5. Effects & Notifications
    this.particleEffects = new ParticleEffects(this);
    this.notificationManager = new NotificationManager(this);

    // 6. Boundary System
    this.boundarySystem = new BoundarySystem(
      MAP_CONFIG.worldWidth,
      MAP_CONFIG.worldHeight,
      14
    );

    // 7. Spawn Player with 5x5 starting territory in Industrial Zone
    const spawnX = this.playerSpawn.col * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    const spawnY = this.playerSpawn.row * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;

    this.player = new Player(this, spawnX, spawnY, this.boundarySystem, {
      nickname: this.avatar.nickname,
      color: this.avatar.color,
      character: this.avatar.character,
      maxSpeed: 175,
      acceleration: 850,
      deceleration: 950,
      radius: 12,
    });
    this.territoryGrid.spawnTerritory('local_player', this.playerSpawn.col, this.playerSpawn.row, 2);

    // Draw initial territories
    this.territoryRenderer.renderTerritories();

    // 9. Camera System
    // 9. Camera System (Smooth Following & Boundary Clamping)
    this.cameraSystem = new CameraSystem(this);
    this.cameraSystem.followTarget(this.player.getContainer());

    // 10. Mini-Map Overview (Bottom Right)
    // 10. Mini-Map Overview (Anchored in Bottom-Right Corner)
    this.miniMap = new MiniMap(this, this.territoryGrid,this.avatar.color);

    // Pause overlay
    this.pauseOverlay = new PauseOverlay(
      this,
      () => {},
      () => this.respawnPlayer()
    );

    // 12. Input System
    // 13. Input System
    this.inputSystem = new InputSystem(this, () => {
      if(!this.quizDirector.isLearning(this.player.id)) this.pauseOverlay.toggle();
    });

    this.sprintHUD=new SprintHUD(this);
    this.regionManager=new RegionManager();
    this.discoveryPopup=new DiscoveryPopup(this,340);
    this.scale.on('resize',this.onResize,this);
  }
  private onResize(size:Phaser.Structs.Size):void {
    this.cameraSystem.onResize(size.width,size.height);
    this.miniMap.onResize(size.width,size.height);
    this.pauseOverlay.onResize(size.width,size.height);
    this.sprintHUD.onResize(size.width,size.height);
    this.discoveryPopup.onResize(size.width,size.height);
    this.notificationManager.onResize(size.width,size.height);
  }
  public toggleFullscreen():void {this.game.events.emit('request-fullscreen');}

  update(_time: number, delta: number): void {
    const elapsed=Math.min(Math.max(0,delta),250);
    const steps=Math.max(1,Math.ceil(elapsed/(1000/60)));
    for(let i=0;i<steps;i++)this.updateStep(elapsed/steps);
  }
  private updateStep(delta:number):void {
    const deltaSec = delta / 1000;
    if(this.pauseOverlay.isOpen || this.matchEnded)return;
    if(this.quizDirector.update(deltaSec)){
      this.game.events.emit('controls:reset');this.publishLearningState();
    }

    // 1. Update FPS Counter
      // Questions cost real match time; only manual local pause stops the clock.
    this.matchRemainingSec = Math.max(0, this.matchRemainingSec - deltaSec);
    const clockSecond=Math.floor(this.matchRemainingSec);
    if(clockSecond!==this.lastClockSecond){this.lastClockSecond=clockSecond;this.game.events.emit('match:time',clockSecond);}
    if(this.matchRemainingSec===0){
      this.economicSystem.update(deltaSec);this.economicSystem.settleInterest();
      this.matchEnded=true;this.input.keyboard?.resetKeys();this.tweens.pauseAll();this.anims.pauseAll();this.time.paused=true;
      this.game.events.emit('learning:state',null);
      const competitors=[{id:this.player.id,nickname:this.avatar.nickname}].map(player=>({
        id:player.id,
        nickname:player.nickname,color:this.avatar.color,
        score:this.economicSystem.getProfile(player.id).totalProfit,ownedCells:this.territoryGrid.getOwnerCellsCount(player.id),
        stats:this.recorder.forPlayer(player.id),income:{...this.economicSystem.getProfile(player.id)}
      }));
      this.game.events.emit('local:finished',competitors);return;
    }

    // 2. Measure FPS
    // 2. Read Player Input & Update Physics
    // 3. Read Player Input & Update Physics
    const learning=this.quizDirector.isLearning(this.player.id);
    if(learning)this.player.holdForLearning();
    else this.player.update(this.inputSystem.getMovementInput(), deltaSec);
    const transition=this.regionManager.updatePlayerPosition(this.player.x,this.player.y);
    if(transition)this.discoveryPopup.show({...transition,bonusAwarded:0});
    this.sprintHUD.update(this.player.sprint);

    // 3. Player Grid Position & Trail Logic
    // 4. Player Grid Position & Trail Logic
    const pCol = Math.floor(this.player.x / MAP_CONFIG.tileSize);
    const pRow = Math.floor(this.player.y / MAP_CONFIG.tileSize);
    const isPlayerOnOwnTerritory = this.territoryGrid.getOwner(pCol, pRow) === this.player.id;

    if (!learning && !isPlayerOnOwnTerritory) {
      // Outside owned territory: add point to exposed trail
      this.trailManager.addPoint(this.player.id, pCol, pRow);
    } else if(!learning) {
      // Back inside owned territory: complete trail if one exists!
      if (this.trailManager.hasTrail(this.player.id)) {
        const trail = this.trailManager.getTrail(this.player.id);
        const before=this.territoryGrid.getOwnerCellsCount(this.player.id);
        const result = TerritoryCaptureSystem.capture(this.territoryGrid, this.player.id, trail);
        this.trailManager.clearTrail(this.player.id);

        if (result.success && result.totalCapturedCount > 0) {
          this.recorder.capture(this.player.id,this.territoryGrid.getOwnerCellsCount(this.player.id)-before,this.player.x,this.player.y);
          this.recorder.observe(this.player.id,this.territoryGrid.getOwnerCellsCount(this.player.id));this.publishFeedback();
          // Visual feedback
          // Visual feedback: flash captured area, paper confetti burst, toast
          this.territoryRenderer.triggerCaptureFlash(
            [...result.trailCells, ...result.enclosedCells],
            this.avatar.color
          );
          this.particleEffects.emitCaptureBurst(this.player.x, this.player.y, this.avatar.color,this.territoryGrid.getOwnerCellsCount(this.player.id)-before);
          this.territoryRenderer.renderTerritories();

          const newPercent = this.territoryGrid.getTerritoryPercentage(this.player.id);
          this.notificationManager.showCaptureToast(
            this.player.x,
            this.player.y,
            this.territoryGrid.getOwnerCellsCount(this.player.id)-before,
            newPercent
          );
        }
      }
    }

    // Update Economic Profits & Surplus Value Accumulation
    // 8. Update Economic Profits & Surplus Value Accumulation
    this.economicSystem.update(deltaSec);

    // 8. Update Territory Renderers (trails & flash animations)
    // 9. Update Territory Renderers (trails & flash animations)
    this.territoryRenderer.update(deltaSec);

    // 9. Update MiniMap
    // 10. Update MiniMap
    this.miniMap.update(this.player.x, this.player.y);

    // 10. Update Comprehensive HUD Info
    // Publish the compact React HUD state.
    this.publishRaceState();
  }

  private respawnPlayer(): void {
    this.trailManager.clearTrail(this.player.id);
    this.territoryGrid.clearOwner(this.player.id);
    this.territoryGrid.spawnTerritory(this.player.id, this.playerSpawn.col, this.playerSpawn.row, 2);

    const spawnX = this.playerSpawn.col * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    const spawnY = this.playerSpawn.row * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    this.player.respawn(spawnX, spawnY);

    this.territoryRenderer.renderTerritories();
  }

  private publishRaceState():void {
    if(this.time.now-this.lastRaceEmit<250)return;
    this.lastRaceEmit=this.time.now;
    const profile=this.economicSystem.getProfile(this.player.id);
    this.game.events.emit('race:state',{remainingSeconds:this.matchRemainingSec,players:[
      {id:this.player.id,nickname:this.avatar.nickname,color:this.avatar.color,score:profile.totalProfit,ownedCells:this.territoryGrid.getOwnerCellsCount(this.player.id),economy:this.economicSystem.getStatus(this.player.id),learning:this.quizDirector.isLearning(this.player.id),shield:this.player.shieldTimeRemaining,x:this.player.x,y:this.player.y}
    ]});
  }

  private publishLearningState():void {this.game.events.emit('learning:state',this.quizDirector.viewFor(this.player.id));}
  private publishFeedback():void {this.game.events.emit('match:feedback',this.recorder.recentEvents());}
  private submitLearningAnswer(round:string,index:number):void {
    if(this.matchEnded)return;
    if(this.quizDirector.submit(round,this.player.id,index)){this.recorder.answer(this.player.id,this.quizDirector.viewFor(this.player.id)!.answer!.correct);this.publishLearningState();}
  }
  private continueAfterLearning(round:string):void {
    if(this.matchEnded)return;
    const answer=this.quizDirector.finish(round,this.player.id);if(!answer)return;
    const outcome=learningOutcome(answer.correct,this.player.sprint.rage);
    this.player.shieldTimeRemaining=outcome.shieldSeconds;this.player.sprint.rage=outcome.rage;
    this.game.events.emit('controls:reset');
    this.sprintHUD.update(this.player.sprint);this.publishLearningState();
  }
  shutdown(): void {
    this.game.events.off('request-pause',this.togglePause);
    this.game.events.off('learning:answer',this.submitLearningAnswer,this);
    this.game.events.off('learning:continue',this.continueAfterLearning,this);
    this.time.paused=false;this.anims.resumeAll();
    this.cameraSystem?.destroy();this.sprintHUD?.destroy();this.discoveryPopup?.destroy();
    this.scale.off('resize',this.onResize,this);
    if (this.inputSystem) this.inputSystem.destroy();
    if (this.player) this.player.destroy();
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.territoryRenderer) this.territoryRenderer.destroy();
    if (this.notificationManager) this.notificationManager.destroy();
    if (this.miniMap) this.miniMap.destroy();
    this.cityMapRenderer?.destroy();
  }
}
