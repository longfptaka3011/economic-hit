import Phaser from 'phaser';
import { MAP_CONFIG } from '../config/map.config';
import { LogicalGrid } from '../entities/LogicalGrid';
import { CityMapRenderer } from '../rendering/CityMapRenderer';
import { BoundarySystem } from '../systems/BoundarySystem';
import { InputSystem } from '../systems/InputSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { Player } from '../entities/Player';
import { BotPlayer } from '../entities/BotPlayer';
import { PauseOverlay } from '../ui/PauseOverlay';
import { TerritoryGrid, TrailManager, TerritoryCaptureSystem, GAME_CONSTANTS, RaceQuizDirector, learningOutcome, racePoints,raceStandings, type AvatarProfile } from '@market-mayhem/shared';
import { TerritoryRenderer } from '../rendering/TerritoryRenderer';
import { ParticleEffects } from '../effects/ParticleEffects';
import { NotificationManager } from '../ui/NotificationManager';
import { EconomicSystem } from '../systems/EconomicSystem';
import { MiniMap } from '../ui/MiniMap';
import { ArcadeHUD, LeaderboardEntry } from '../ui/ArcadeHUD';

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
  private arcadeHUD!: ArcadeHUD;

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
  private bot!: BotPlayer;

  // Spawn constants
  private readonly playerSpawn = { col: 64, row: 64 }; // Starts in Industrial Zone
  private readonly botSpawn = { col: 190, row: 190 }; // Starts in Land Zone

  // Match duration shared with the authoritative server.
  private matchRemainingSec: number = GAME_CONSTANTS.MATCH_DURATION_SECONDS;

  private matchEnded=false;
  private lastClockSecond=-1;
  private lastRaceEmit=-Infinity;
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
    this.game.events.on('request-pause',this.togglePause);
    this.quizDirector=new RaceQuizDirector(['local_player']);
    this.game.events.on('learning:answer',this.submitLearningAnswer,this);
    this.game.events.on('learning:continue',this.continueAfterLearning,this);
    PlayerRenderer.registerAnimations(this,0);PlayerRenderer.registerAnimations(this,1);
    // 1. Initialize Map & Grid System (80x80)
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
    this.economicSystem.registerPlayer('bot_player');

    // 3. Visual Cartoon City Map Rendering (Bakes roads, buildings, trees, central market)
    this.cityMapRenderer = new CityMapRenderer(this, this.logicalGrid);
    this.cityMapRenderer.render();

    // 4. Territory & Trail Renderer (Paper.io 2 vibrant layered paper)
    this.territoryRenderer = new TerritoryRenderer(this, this.territoryGrid, this.trailManager);
    this.territoryRenderer.registerPlayer('local_player', this.avatar.color, this.avatar.color, this.avatar.color);
    this.territoryRenderer.registerPlayer('bot_player', 0xf97316, 0xc2410c, 0xfb923c); // Vibrant Paper Orange

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

    // 8. Spawn Bot Player with 5x5 starting territory in Land Zone
    this.bot = new BotPlayer(
      this,
      this.territoryGrid,
      this.trailManager,
      this.boundarySystem,
      this.botSpawn.col,
      this.botSpawn.row
    );

    // Draw initial territories
    this.territoryRenderer.renderTerritories();

    // 9. Camera System
    // 9. Camera System (Smooth Following & Boundary Clamping)
    this.cameraSystem = new CameraSystem(this);
    this.cameraSystem.followTarget(this.player.getContainer());

    // 10. Mini-Map Overview (Bottom Right)
    // 10. Mini-Map Overview (Anchored in Bottom-Right Corner)
    this.miniMap = new MiniMap(this, this.territoryGrid);

    // 11. Pause Overlay
    // 11. Professional Arcade HUD (Top-Left Capital, Top-Center Timer, Top-Right Leaderboard & Buttons)
    this.arcadeHUD = new ArcadeHUD(
      this,
      () => this.toggleFullscreen(),
      () => { if(!this.quizDirector.isLearning(this.player.id)) this.pauseOverlay.toggle(); }
    );

    // 12. Pause Overlay
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
    this.arcadeHUD.onResize(size.width,size.height);
    this.miniMap.onResize(size.width,size.height);
    this.pauseOverlay.onResize(size.width,size.height);
    this.sprintHUD.onResize(size.width,size.height);
    this.discoveryPopup.onResize(size.width,size.height);
    this.notificationManager.onResize(size.width,size.height);
  }
  public toggleFullscreen():void {this.game.events.emit('request-fullscreen');}
  public setFullscreenState(isFullscreen: boolean): void {
    if (this.arcadeHUD) {
      this.arcadeHUD.setFullscreenButtonText(isFullscreen);
    }
  }

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
      const competitors=[{id:this.player.id,nickname:this.avatar.nickname},{id:this.bot.id,nickname:'Tư Bản Robot'}].map(player=>({
        id:player.id,
        nickname:player.nickname,score:this.economicSystem.getProfile(player.id).totalProfit,ownedCells:this.territoryGrid.getOwnerCellsCount(player.id)
      }));
      const rankings=raceStandings(competitors).map(({player,rank})=>({...player,rank,score:racePoints(player.score)}));
      this.game.events.emit('local:finished',rankings);return;
    }

    // 2. Measure FPS
    const fps = Math.round(this.game.loop.actualFps);
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
        const result = TerritoryCaptureSystem.capture(this.territoryGrid, this.player.id, trail);
        this.trailManager.clearTrail(this.player.id);

        if (result.success && result.totalCapturedCount > 0) {
          // Visual feedback
          // Visual feedback: flash captured area, paper confetti burst, toast
          this.territoryRenderer.triggerCaptureFlash(
            [...result.trailCells, ...result.enclosedCells],
            0x0ea5e9
          );
          this.particleEffects.emitCaptureBurst(this.player.x, this.player.y, 0x0ea5e9);
          this.territoryRenderer.renderTerritories();

          const newPercent = this.territoryGrid.getTerritoryPercentage(this.player.id);
          this.notificationManager.showCaptureToast(
            this.player.x,
            this.player.y,
            result.totalCapturedCount,
            newPercent
          );
        }
      }
    }

    // 4. Update Bot Player
    // 5. Update Bot Player AI
    this.bot.update(deltaSec, learning?[]:this.trailManager.getTrail(this.player.id), (botResult) => {
      if (botResult && botResult.totalCapturedCount > 0) {
        this.territoryRenderer.triggerCaptureFlash(
          [...botResult.trailCells, ...botResult.enclosedCells],
          0xf97316
        );
        this.particleEffects.emitCaptureBurst(this.bot.x, this.bot.y, 0xf97316);
        this.territoryRenderer.renderTerritories();
      }
    });

    // 5. Trail Collision Checks
    // 6. Trail Collision Checks
    this.checkTrailCollisions(pCol, pRow);

    // 6. Ground Rent Toll Collection in Land Zone
    // 7. Ground Rent Toll Collection in Land Zone
    this.checkGroundRentTolls(deltaSec, pCol, pRow);

    // 7. Update Economic Profits & Surplus Value Accumulation
    // 8. Update Economic Profits & Surplus Value Accumulation
    this.economicSystem.update(deltaSec);

    // 8. Update Territory Renderers (trails & flash animations)
    // 9. Update Territory Renderers (trails & flash animations)
    this.territoryRenderer.update(deltaSec);

    // 9. Update MiniMap
    // 10. Update MiniMap
    this.miniMap.update(this.player.x, this.player.y, this.bot.x, this.bot.y);

    // 10. Update Comprehensive HUD Info
    // 11. Update Arcade HUD
    this.updateHUD(pCol, pRow, fps);
  }

  private checkGroundRentTolls(deltaSec: number, pCol: number, pRow: number): void {

    // Check if Bot stepped on Player's Land territory
    const botCellOwner = this.territoryGrid.getOwner(this.bot.col, this.bot.row);
    if (botCellOwner === this.player.id) {
      const toll = this.economicSystem.collectGroundRentToll('bot_player', 'local_player', this.bot.col, this.bot.row);
      if (toll > 0) {
        this.notificationManager.showFloatingProfit(this.player.x, this.player.y, `+${toll} ĐỊA TÔ TỪ BOT!`, '#c084fc');
      }
    }

    // Check if Player stepped on Bot's Land territory
    const playerCellOwner = this.territoryGrid.getOwner(pCol, pRow);
    if (playerCellOwner === this.bot.id && !this.quizDirector.isLearning(this.player.id)) {
      const toll = this.economicSystem.collectGroundRentToll('local_player', 'bot_player', pCol, pRow);
      if (toll > 0) {
        this.notificationManager.showFloatingProfit(this.player.x, this.player.y, `-${toll} NỘP ĐỊA TÔ CHO BOT!`, '#ef4444');
      }
    }
  }

  private checkTrailCollisions(pCol: number, pRow: number): void {
    if(this.quizDirector.isLearning(this.player.id))return;
    // Check if Bot crossed Player's exposed trail
    if (this.player.shieldTimeRemaining <= 0) {
      const botHitPlayer = this.trailManager.checkCollision(this.bot.id, this.bot.col, this.bot.row);
      if (botHitPlayer && botHitPlayer.hitPlayerId === this.player.id) {
        this.particleEffects.emitEliminationParticles(this.player.x, this.player.y, 0x06b6d4);
        this.particleEffects.emitEliminationParticles(this.player.x, this.player.y, 0x0ea5e9);
        this.notificationManager.showAlert('⚠️ BOT ĐÃ CẮT VỆT ĐUÔI! BẠN BỊ HẠ GỤC VÀ ĐANG HỒI SINH...', true);
        this.respawnPlayer();
        this.quizDirector.requestCrisis(this.player.id,'profit');
        return;
      }
    }

    // Check if Player crossed Bot's exposed trail
    if (this.bot.shieldTimeRemaining <= 0) {
      const playerHitBot = this.trailManager.checkCollision(this.player.id, pCol, pRow);
      if (playerHitBot && playerHitBot.hitPlayerId === this.bot.id) {
        this.particleEffects.emitEliminationParticles(this.bot.x, this.bot.y, 0xf97316);
        this.notificationManager.showAlert('💥 BẠN ĐÃ CẮT ĐUÔI ROBOT! BOT ĐÃ BỊ HẠ GỤC!', false);
        this.respawnBot();
      }
    }
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

  private respawnBot(): void {
    this.trailManager.clearTrail(this.bot.id);
    this.bot.respawn(this.botSpawn.col, this.botSpawn.row);
    this.territoryRenderer.renderTerritories();
  }

  private updateHUD(pCol: number, pRow: number, fps: number): void {
    const playerTiles = this.territoryGrid.getOwnerCellsCount(this.player.id);
    const playerPct = this.territoryGrid.getTerritoryPercentage(this.player.id);
    const botTiles = this.territoryGrid.getOwnerCellsCount(this.bot.id);
    const botPct = this.territoryGrid.getTerritoryPercentage(this.bot.id);

    // Economic profile
    const profile = this.economicSystem.getProfile(this.player.id);
    const botProfile = this.economicSystem.getProfile(this.bot.id);

    const leaderboard: LeaderboardEntry[] = [
      {
        name: 'Bạn',
        isPlayer: true,
        tiles: playerTiles,
        percentage: playerPct,
        profit: profile.totalProfit,
        hasShield: this.player.shieldTimeRemaining > 0 || this.quizDirector.isLearning(this.player.id),
      },
      {
        name: 'Bot',
        isPlayer: false,
        tiles: botTiles,
        percentage: botPct,
        profit: botProfile.totalProfit,
        hasShield: this.bot.shieldTimeRemaining > 0,
      },
    ].sort((a, b) => racePoints(b.profit) - racePoints(a.profit));

    if(this.time.now-this.lastRaceEmit>=250){
      this.lastRaceEmit=this.time.now;
      this.game.events.emit('race:state',{remainingSeconds:this.matchRemainingSec,players:[
        {id:this.player.id,nickname:this.avatar.nickname,color:this.avatar.color,score:profile.totalProfit,ownedCells:playerTiles,economy:this.economicSystem.getStatus(this.player.id),learning:this.quizDirector.isLearning(this.player.id),shield:this.player.shieldTimeRemaining,x:this.player.x,y:this.player.y},
        {id:this.bot.id,nickname:'Tư Bản Robot',color:0xf97316,score:botProfile.totalProfit,ownedCells:botTiles,economy:this.economicSystem.getStatus(this.bot.id),shield:this.bot.shieldTimeRemaining,x:this.bot.x,y:this.bot.y}
      ]});
    }

    const region=this.regionManager.getCurrentRegion();
    const zoneTitle=region.vietnameseName,zoneColor=region.textColor;
    this.arcadeHUD.update(
      profile,
      this.matchRemainingSec,
      leaderboard,
      zoneTitle,
      zoneColor,
      this.player.shieldTimeRemaining,
      fps,
      this.player.x,
      this.player.y,
      pCol,
      pRow
    );
  }

  private publishLearningState():void {this.game.events.emit('learning:state',this.quizDirector.viewFor(this.player.id));}
  private submitLearningAnswer(round:string,index:number):void {if(this.quizDirector.submit(round,this.player.id,index))this.publishLearningState();}
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
    if (this.bot) this.bot.destroy();
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.territoryRenderer) this.territoryRenderer.destroy();
    if (this.notificationManager) this.notificationManager.destroy();
    if (this.miniMap) this.miniMap.destroy();
    if (this.arcadeHUD) this.arcadeHUD.destroy();
    this.cityMapRenderer?.destroy();
  }
}
