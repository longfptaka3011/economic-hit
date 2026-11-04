import Phaser from 'phaser';
import { TerritoryGrid, TrailManager, GridCoord, TerritoryCaptureSystem, SprintAbility } from '@market-mayhem/shared';
import { BoundarySystem } from '../systems/BoundarySystem';
import { MAP_CONFIG } from '../config/map.config';
import { PlayerRenderer } from '../rendering/PlayerRenderer';

export class BotPlayer {
  public readonly id: string = 'bot_player';
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public speed: number = 145; // slightly slower than player for fun gameplay
  public isAlive: boolean = true;
  public shieldTimeRemaining: number = 0;
  public readonly sprint = new SprintAbility();
  private wantsSprint = false;

  private scene: Phaser.Scene;
  private grid: TerritoryGrid;
  private trailManager: TrailManager;
  private boundarySystem: BoundarySystem;
  private renderer: PlayerRenderer;

  // AI loop state
  private stateTimer: number = 0;
  private currentDirection: { dx: number; dy: number } = { dx: 1, dy: 0 };
  private loopStep: number = 0;
  private baseSpawnCol: number;
  private baseSpawnRow: number;

  constructor(
    scene: Phaser.Scene,
    grid: TerritoryGrid,
    trailManager: TrailManager,
    boundarySystem: BoundarySystem,
    startCol: number = 190,
    startRow: number = 190
  ) {
    this.scene = scene;
    this.grid = grid;
    this.trailManager = trailManager;
    this.boundarySystem = boundarySystem;
    this.baseSpawnCol = startCol;
    this.baseSpawnRow = startRow;

    this.x = startCol * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    this.y = startRow * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;

    this.renderer = new PlayerRenderer(scene, 1); // Character 1 = Bot Player (Orange/Mechanic)
    this.renderer.create({
      x: this.x,
      y: this.y,
      nickname: 'Tư Bản Robot 🤖',
      color: 0xf97316,
    });

    this.respawn(startCol, startRow);
  }

  public respawn(col = this.baseSpawnCol, row = this.baseSpawnRow): void {
    this.isAlive = true;
    this.sprint.reset();
    this.wantsSprint = false;
    this.shieldTimeRemaining = 3.5; // 3.5 seconds invulnerability
    this.trailManager.clearTrail(this.id);

    // Reset base territory (5x5)
    this.grid.clearOwner(this.id);
    this.grid.spawnTerritory(this.id, col, row, 2);

    this.x = col * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    this.y = row * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    this.vx = 0;
    this.vy = 0;
    this.loopStep = 0;
    this.stateTimer = 0;
    this.currentDirection = { dx: 0, dy: 1 };
  }

  public update(
    deltaSec: number,
    playerTrail: GridCoord[],
    onCaptureCallback: (result: any,newCells:number) => void
  ): void {
    if (!this.isAlive) return;

    // Shield countdown
    if (this.shieldTimeRemaining > 0) {
      this.shieldTimeRemaining = Math.max(0, this.shieldTimeRemaining - deltaSec);
    }

    // AI Decision Making:
    this.updateAIBehavior(deltaSec, playerTrail);

    // Physics movement
    const multiplier = this.sprint.update(deltaSec, this.wantsSprint, this.currentDirection.dx !== 0 || this.currentDirection.dy !== 0);
    this.vx = this.currentDirection.dx * this.speed * multiplier;
    this.vy = this.currentDirection.dy * this.speed * multiplier;

    this.x += this.vx * deltaSec;
    this.y += this.vy * deltaSec;

    // Boundary constraint
    const clamped = this.boundarySystem.clampPosition(this.x, this.y);
    this.x = clamped.x;
    this.y = clamped.y;
    if (clamped.hitBoundary) {
      // Pick perpendicular direction when hitting wall
      this.currentDirection = { dx: -this.currentDirection.dy, dy: this.currentDirection.dx };
    }

    // Sync visuals & directional walk animation
    this.renderer.update(this.x, this.y, this.vx, this.vy, this.shieldTimeRemaining > 0, deltaSec);
    this.renderer.updateSprint(this.sprint);

    // Grid coordinates
    const curCol = Math.floor(this.x / MAP_CONFIG.tileSize);
    const curRow = Math.floor(this.y / MAP_CONFIG.tileSize);
    const isOwner = this.grid.getOwner(curCol, curRow) === this.id;

    if (!isOwner) {
      // Outside owned territory: record trail
      this.trailManager.addPoint(this.id, curCol, curRow);
    } else {
      // Inside owned territory: check if returning from trail
      if (this.trailManager.hasTrail(this.id)) {
        const trail = this.trailManager.getTrail(this.id);
        const before=this.grid.getOwnerCellsCount(this.id);
        const result = TerritoryCaptureSystem.capture(this.grid, this.id, trail);
        this.trailManager.clearTrail(this.id);
        onCaptureCallback(result,this.grid.getOwnerCellsCount(this.id)-before);
      }
    }
  }

  private updateAIBehavior(deltaSec: number, playerTrail: GridCoord[]): void {
    this.wantsSprint = false;
    this.stateTimer += deltaSec;

    const curCol = Math.floor(this.x / MAP_CONFIG.tileSize);
    const curRow = Math.floor(this.y / MAP_CONFIG.tileSize);

    // Priority 1: Check if player's exposed trail is nearby (< 16 tiles) to cut it!
    if (playerTrail.length > 2) {
      let closestPoint: GridCoord | null = null;
      let minDistSq = 16 * 16;

      for (const pt of playerTrail) {
        const dc = pt.col - curCol;
        const dr = pt.row - curRow;
        const distSq = dc * dc + dr * dr;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestPoint = pt;
        }
      }

      if (closestPoint) {
        this.wantsSprint = true;
        // Steer toward player trail!
        const dc = closestPoint.col - curCol;
        const dr = closestPoint.row - curRow;
        if (Math.abs(dc) > Math.abs(dr)) {
          this.currentDirection = { dx: Math.sign(dc), dy: 0 };
        } else if (dr !== 0) {
          this.currentDirection = { dx: 0, dy: Math.sign(dr) };
        }
        return;
      }
    }

    // Priority 2: Deterministic expansion patrol loop (turns every ~1.2s to close loop)
    if (this.stateTimer > 1.25) {
      this.stateTimer = 0;
      this.loopStep = (this.loopStep + 1) % 4;

      switch (this.loopStep) {
        case 0:
          this.currentDirection = { dx: 1, dy: 0 }; // Right
          break;
        case 1:
          this.currentDirection = { dx: 0, dy: 1 }; // Down
          break;
        case 2:
          this.currentDirection = { dx: -1, dy: 0 }; // Left
          break;
        case 3:
          this.currentDirection = { dx: 0, dy: -1 }; // Up (back to base)
          break;
      }
    }
  }

  public get col(): number {
    return Math.floor(this.x / MAP_CONFIG.tileSize);
  }

  public get row(): number {
    return Math.floor(this.y / MAP_CONFIG.tileSize);
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}

