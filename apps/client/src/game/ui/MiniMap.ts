import Phaser from 'phaser';
import { MAP_CONFIG } from '../config/map.config';
import { TerritoryGrid } from '@market-mayhem/shared';
import { needsTouchLayout } from './touchLayout';

export class MiniMap {
  private scene: Phaser.Scene;
  private grid: TerritoryGrid;
  private container!: Phaser.GameObjects.Container;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerDot!: Phaser.GameObjects.Arc;
  private cameraBox!: Phaser.GameObjects.Graphics;

  private readonly mapSize: number = 110;
  private readonly scale: number;

  constructor(scene: Phaser.Scene, grid: TerritoryGrid,private color=0x06b6d4) {
    this.scene = scene;
    this.grid = grid;
    this.scale = this.mapSize / MAP_CONFIG.worldWidth; // 110 / 1280
    this.create();
  }

  private create(): void {
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;
    const posX = screenW - this.mapSize - 18;
    const posY = screenH - this.mapSize - (needsTouchLayout()?140:18);

    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x020617, 0.9);
    bg.fillRoundedRect(-6, -20, this.mapSize + 12, this.mapSize + 26, 8);
    bg.lineStyle(1.5, 0x334155, 0.9);
    bg.strokeRoundedRect(-6, -20, this.mapSize + 12, this.mapSize + 26, 8);

    const title = this.scene.add.text(this.mapSize / 2, -10, 'BẢN ĐỒ KINH TẾ', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.mapGraphics = this.scene.add.graphics();
    this.cameraBox = this.scene.add.graphics();

    // Solo practice radar marker.
    this.playerDot = this.scene.add.circle(0, 0, 3.5, this.color);
    this.playerDot.setStrokeStyle(1, 0xffffff, 1);


    this.container = this.scene.add.container(posX, posY, [
      bg,
      title,
      this.mapGraphics,
      this.cameraBox,
      this.playerDot,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(500);

    this.drawStaticMap();
  }

  private drawStaticMap(): void {
    const half = this.mapSize / 2;

    this.mapGraphics.clear();

    // 4 Economic Districts (Cartoon City Map Colors)
    // Top-left: Industrial (Slate Gray)
    this.mapGraphics.fillStyle(0x334155, 1);
    this.mapGraphics.fillRect(0, 0, half, half);

    // Top-right: Commercial (Urban Pavement)
    this.mapGraphics.fillStyle(0xe2e8f0, 1);
    this.mapGraphics.fillRect(half, 0, half, half);

    // Bottom-left: Financial (Marble Civic)
    this.mapGraphics.fillStyle(0xf1f5f9, 1);
    this.mapGraphics.fillRect(0, half, half, half);

    // Bottom-right: Land (Meadow Green)
    this.mapGraphics.fillStyle(0x86efac, 1);
    this.mapGraphics.fillRect(half, half, half, half);

    // Main Asphalt Cross Avenues
    this.mapGraphics.fillStyle(0x1e293b, 1);
    this.mapGraphics.fillRect(0, half - 3, this.mapSize, 6);
    this.mapGraphics.fillRect(half - 3, 0, 6, this.mapSize);

    // Central Market Hub Circle
    this.mapGraphics.fillStyle(0xf59e0b, 1);
    this.mapGraphics.fillCircle(half, half, 8);
    this.mapGraphics.fillStyle(0x38bdf8, 1);
    this.mapGraphics.fillCircle(half, half, 4);

    // Border
    this.mapGraphics.lineStyle(1.5, 0x38bdf8, 0.9);
    this.mapGraphics.strokeRect(0, 0, this.mapSize, this.mapSize);
  }

  public onResize(screenWidth: number, screenHeight: number): void {
    const posX = screenWidth - this.mapSize - 18;
    const posY = screenHeight - this.mapSize - (needsTouchLayout()?140:18);
    if (this.container) {
      this.container.setPosition(posX, posY);
    }
  }

  public update(playerX: number, playerY: number): void {
    this.playerDot.setPosition(playerX * this.scale, playerY * this.scale);

    // Update Camera Viewport Box on Mini-map
    const cam = this.scene.cameras.main;
    const viewX = cam.scrollX * this.scale;
    const viewY = cam.scrollY * this.scale;
    const viewW = (cam.width / cam.zoom) * this.scale;
    const viewH = (cam.height / cam.zoom) * this.scale;

    this.cameraBox.clear();
    this.cameraBox.lineStyle(1, 0xffffff, 0.65);
    this.cameraBox.strokeRect(
      Math.max(0, viewX),
      Math.max(0, viewY),
      Math.min(this.mapSize - viewX, viewW),
      Math.min(this.mapSize - viewY, viewH)
    );
  }

  public destroy(): void {
    this.container.destroy(true);
  }
}

