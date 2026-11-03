import Phaser from 'phaser';
import { TerritoryGrid, TrailManager } from '@market-mayhem/shared';
import { MAP_CONFIG } from '../config/map.config';

export interface PlayerVisualConfig {
  id: string;
  color: number;
  darkColor: number;
  trailColor: number;
  borderColor: number;
}

export class TerritoryRenderer {
  private scene: Phaser.Scene;
  private grid: TerritoryGrid;
  private trailManager: TrailManager;

  // Graphics layers for pixel-perfect depth
  private territoryShadowGraphics!: Phaser.GameObjects.Graphics;
  private territoryGraphics!: Phaser.GameObjects.Graphics;
  private trailShadowGraphics!: Phaser.GameObjects.Graphics;
  private trailGraphics!: Phaser.GameObjects.Graphics;
  private flashGraphics!: Phaser.GameObjects.Graphics;

  private playerVisuals: Map<string, PlayerVisualConfig> = new Map();
  private flashCells: Array<{ col: number; row: number; color: number; alpha: number }> = [];

  constructor(scene: Phaser.Scene, grid: TerritoryGrid, trailManager: TrailManager) {
    this.scene = scene;
    this.grid = grid;
    this.trailManager = trailManager;

    // Layer 1: Pixel Drop Shadow (Depth 2)
    this.territoryShadowGraphics = scene.add.graphics();
    this.territoryShadowGraphics.setDepth(2);

    // Layer 2: Main Pixel Territory Fill & Crisp Borders (Depth 3)
    this.territoryGraphics = scene.add.graphics();
    this.territoryGraphics.setDepth(3);

    // Layer 3: Trail Pixel Drop Shadow (Depth 4)
    this.trailShadowGraphics = scene.add.graphics();
    this.trailShadowGraphics.setDepth(4);

    // Layer 4: Main Pixel Trail Ribbon (Depth 5)
    this.trailGraphics = scene.add.graphics();
    this.trailGraphics.setDepth(5);

    // Layer 5: Pixel Capture Flash (Depth 6)
    this.flashGraphics = scene.add.graphics();
    this.flashGraphics.setDepth(6);
  }

  public registerPlayer(id: string, color: number, darkColor: number, trailColor?: number): void {
    this.playerVisuals.set(id, {
      id,
      color,
      darkColor,
      trailColor: trailColor || color,
      borderColor: 0xffffff,
    });
  }

  public triggerCaptureFlash(cells: Array<{ col: number; row: number }>, color: number): void {
    for (const cell of cells) {
      this.flashCells.push({
        col: cell.col,
        row: cell.row,
        color,
        alpha: 0.95,
      });
    }
  }

  public renderTerritories(): void {
    this.territoryShadowGraphics.clear();
    this.territoryGraphics.clear();

    const tileSize = MAP_CONFIG.tileSize;

    // 1. Pass 1: Pixel Drop Shadow slightly offset (y + 2)
    this.territoryShadowGraphics.fillStyle(0x020617, 0.2);
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const ownerId = this.grid.getOwner(c, r);
        if (ownerId && this.playerVisuals.has(ownerId)) {
          const x = c * tileSize;
          const y = r * tileSize;
          this.territoryShadowGraphics.fillRect(x, y + 2, tileSize, tileSize);
        }
      }
    }

    // 2. Pass 2: Pixel Tint Fill and Crisp 1px Outline
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const ownerId = this.grid.getOwner(c, r);
        if (ownerId && this.playerVisuals.has(ownerId)) {
          const visual = this.playerVisuals.get(ownerId)!;
          const x = c * tileSize;
          const y = r * tileSize;

          // Main semi-transparent pixel overlay (alpha 0.42 preserves environmental visibility)
          this.territoryGraphics.fillStyle(visual.color, 0.28);
          this.territoryGraphics.fillRect(x, y, tileSize, tileSize);

          // Subtle retro pixel inner border
          this.territoryGraphics.fillStyle(0xffffff, 0.12);
          this.territoryGraphics.fillRect(x, y, tileSize, 1);
          this.territoryGraphics.fillRect(x, y, 1, tileSize);

          // Crisp solid pixel boundary on outer perimeter
          this.territoryGraphics.lineStyle(2, visual.trailColor, 0.95);

          if (r === 0 || this.grid.getOwner(c, r - 1) !== ownerId) {
            this.territoryGraphics.lineBetween(x, y, x + tileSize, y);
          }
          if (r === this.grid.rows - 1 || this.grid.getOwner(c, r + 1) !== ownerId) {
            this.territoryGraphics.lineBetween(x, y + tileSize, x + tileSize, y + tileSize);
          }
          if (c === 0 || this.grid.getOwner(c - 1, r) !== ownerId) {
            this.territoryGraphics.lineBetween(x, y, x, y + tileSize);
          }
          if (c === this.grid.cols - 1 || this.grid.getOwner(c + 1, r) !== ownerId) {
            this.territoryGraphics.lineBetween(x + tileSize, y, x + tileSize, y + tileSize);
          }
        }
      }
    }
  }

  public renderTrails(): void {
    this.trailShadowGraphics.clear();
    this.trailGraphics.clear();

    const tileSize = MAP_CONFIG.tileSize;
    const pixelBlockSize = 12;
    const offset = (tileSize - pixelBlockSize) / 2;

    for (const [playerId, visual] of this.playerVisuals.entries()) {
      const trail = this.trailManager.getTrail(playerId);
      if (trail.length === 0) continue;

      // 1. Trail Drop Shadow
      this.trailShadowGraphics.fillStyle(0x020617, 0.3);
      for (const pt of trail) {
        const px = pt.col * tileSize + offset;
        const py = pt.row * tileSize + offset + 2;
        this.trailShadowGraphics.fillRect(px, py, pixelBlockSize, pixelBlockSize);
      }

      // 2. Main Pixel Ribbon Trail
      for (let i = 0; i < trail.length; i++) {
        const pt = trail[i];
        const px = pt.col * tileSize + offset;
        const py = pt.row * tileSize + offset;

        // Core fill
        this.trailGraphics.fillStyle(visual.trailColor, 0.95);
        this.trailGraphics.fillRect(px, py, pixelBlockSize, pixelBlockSize);

        // Bright pixel center highlight
        this.trailGraphics.fillStyle(0xffffff, 0.6);
        this.trailGraphics.fillRect(px + 3, py + 3, pixelBlockSize - 6, pixelBlockSize - 6);

        // Dark pixel boundary
        this.trailGraphics.lineStyle(1, 0x020617, 0.8);
        this.trailGraphics.strokeRect(px, py, pixelBlockSize, pixelBlockSize);
      }
    }
  }

  public update(deltaSec: number): void {
    this.renderTrails();
    this.flashGraphics.clear();

    // Render & fade capture flash cells
    if (this.flashCells.length > 0) {
      const tileSize = MAP_CONFIG.tileSize;

      for (let i = this.flashCells.length - 1; i >= 0; i--) {
        const fc = this.flashCells[i];
        fc.alpha -= deltaSec * 2.8;

        if (fc.alpha <= 0) {
          this.flashCells.splice(i, 1);
        } else {
          const px = fc.col * tileSize;
          const py = fc.row * tileSize;

          // Crisp retro pixel flash
          this.flashGraphics.fillStyle(0xffffff, fc.alpha * 0.9);
          this.flashGraphics.fillRect(px, py, tileSize, tileSize);
          this.flashGraphics.lineStyle(1.5, fc.color, fc.alpha);
          this.flashGraphics.strokeRect(px, py, tileSize, tileSize);
        }
      }
    }
  }

  public destroy(): void {
    this.territoryShadowGraphics.destroy();
    this.territoryGraphics.destroy();
    this.trailShadowGraphics.destroy();
    this.trailGraphics.destroy();
    this.flashGraphics.destroy();
    this.playerVisuals.clear();
    this.flashCells = [];
  }
}
