import Phaser from 'phaser';
import { LogicalGrid } from '../entities/LogicalGrid';
import { MAP_CONFIG } from '../config/map.config';

const TILE = 32;
const CHUNK = 512;
const BLOCK = 256;

/** Bake licensed 16px artwork at integer 2x scale; never change gameplay cells. */
export class CityMapRenderer {
  private chunks: Phaser.GameObjects.RenderTexture[] = [];
  public chimneyPositions: Array<{ x: number; y: number }> = [];

  constructor(private scene: Phaser.Scene, private logicalGrid: LogicalGrid) {}

  public render(): void {
    this.destroy();
    const stamp = this.scene.make.image({ key: 'urban_tiles', add: false }).setOrigin(0).setScale(2);
    for (let oy = 0; oy < MAP_CONFIG.worldHeight; oy += CHUNK) {
      for (let ox = 0; ox < MAP_CONFIG.worldWidth; ox += CHUNK) {
        const rt = this.scene.add.renderTexture(ox, oy,
          Math.min(CHUNK, MAP_CONFIG.worldWidth - ox), Math.min(CHUNK, MAP_CONFIG.worldHeight - oy));
        rt.setOrigin(0).setDepth(0);
        rt.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.chunks.push(rt);
        rt.beginDraw();
        const tile = (x: number, y: number, col: number, row: number, rural = false) => {
          if (x + TILE <= ox || y + TILE <= oy || x >= ox + CHUNK || y >= oy + CHUNK) return;
          stamp.setTexture(rural ? 'tiny_town_tiles' : 'urban_tiles', row * (rural ? 12 : 27) + col);
          rt.batchDraw(stamp, x - ox, y - oy);
        };
        for (let y = oy; y < oy + rt.height; y += TILE) {
          for (let x = ox; x < ox + rt.width; x += TILE) {
            const zone = this.logicalGrid.getCell(Math.floor(x / MAP_CONFIG.tileSize), Math.floor(y / MAP_CONFIG.tileSize))?.zone;
            const road = x % BLOCK < 48 || y % BLOCK < 48;
            if (zone === 'CENTRAL') tile(x, y, 1, 4);
            else if (road) tile(x, y, 9, 16);
            else if (zone === 'LAND') tile(x, y, 0, 0, true);
            else tile(x, y, zone === 'INDUSTRIAL' ? 9 : 1, 4);
          }
        }
        // Include neighboring blocks so multi-tile objects survive chunk seams.
        for (let by = Math.max(0, oy - BLOCK); by < oy + CHUNK; by += BLOCK) {
          for (let bx = Math.max(0, ox - BLOCK); bx < ox + CHUNK; bx += BLOCK) {
            const zone = this.logicalGrid.getCell((bx + 128) / MAP_CONFIG.tileSize, (by + 128) / MAP_CONFIG.tileSize)?.zone;
            if (Math.hypot(bx + 128 - MAP_CONFIG.worldWidth / 2, by + 128 - MAP_CONFIG.worldHeight / 2) < 640) continue;
            const x = bx + 80;
            const y = by + 80;
            const variant = (bx / BLOCK * 7 + by / BLOCK * 11) % 5;
            if (variant === 3) {
              for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) tile(x + c * TILE, y + r * TILE, 1, 1);
              for (let c = 0; c < 3; c++) {
                tile(x + c * 48, y, 16, 8); tile(x + c * 48, y + 32, 16, 9);
              }
              tile(x + 64, y + 96, 3, 10);
              continue;
            }
            if (zone === 'LAND') {
              for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) tile(x + c * TILE, y + r * TILE, 1, 2, true);
              for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) tile(x + c * TILE, y + 64 + r * TILE, c + 4, r + 4, true);
              for (let c = 0; c < 3; c++) tile(x + c * TILE, y + 128, c === 0 ? 0 : c === 1 ? 2 : 3, 7, true);
            } else {
              const orangeRoof = zone === 'COMMERCIAL';
              for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
                const edge = c === 0 ? 0 : c === 4 ? 3 : 2;
                const roofRow = (orangeRoof ? 4 : 0) + (r === 0 ? 0 : r === 2 ? 3 : 2);
                if (zone === 'FINANCIAL') tile(x + c * TILE, y + r * TILE, c === 0 ? 8 : c === 4 ? 10 : 9, 3 + r);
                else tile(x + c * TILE, y + r * TILE, 16 + edge, roofRow);
              }
              for (let c = 0; c < 5; c++) tile(x + c * TILE, y + 96, c === 2 ? 12 : zone === 'FINANCIAL' ? 15 : 11, c === 2 ? 12 : zone === 'FINANCIAL' ? 9 : 11);
              tile(bx + 80, by + 224, zone === 'COMMERCIAL' ? 17 : 16, 15);
              tile(bx + 16, by + 96, 17, 16);
              tile(bx + 16, by + 128, 17, 17);
              if (zone === 'INDUSTRIAL') {
                if (bx >= ox && bx < ox + CHUNK && by >= oy && by < oy + CHUNK) {
                  this.chimneyPositions.push({ x: x + 144, y: y - 28 });
                }
              }
            }
            for (let r = 0; r < 2; r++) tile(bx + 48, by + 144 + r * TILE, 16, 8 + r);
          }
        }
        rt.endDraw();
        this.drawStreetDetails(rt, ox, oy);
      }
    }
    stamp.destroy();
  }

  private drawStreetDetails(rt: Phaser.GameObjects.RenderTexture, ox: number, oy: number): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    const centerX = MAP_CONFIG.worldWidth / 2;
    const centerY = MAP_CONFIG.worldHeight / 2;
    g.fillStyle(0xf4e4b4, 0.8);
    for (let y = oy; y < oy + CHUNK; y += 16) for (let x = ox; x < ox + CHUNK; x += 16) {
      if (Math.hypot(x - centerX, y - centerY) < 500) continue;
      if (x % BLOCK === 16 && y % 48 === 0) g.fillRect(x - ox + 6, y - oy, 2, 12);
      if (y % BLOCK === 16 && x % 48 === 0) g.fillRect(x - ox, y - oy + 6, 12, 2);
    }
    // Stepped fountain and coin monument, clipped consistently by each texture.
    const x = centerX - ox;
    const y = centerY - oy;
    // Market stalls form a readable landmark ring, with integer pixel stripes.
    const stallColors = [0xb96555, 0x5d8f9b, 0x85955e, 0xd0a25c];
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      const sx = Math.round((centerX + Math.cos(angle) * 320) / 16) * 16 - ox;
      const sy = Math.round((centerY + Math.sin(angle) * 320) / 16) * 16 - oy;
      g.fillStyle(0x394739, 0.3).fillRect(sx + 4, sy + 8, 64, 48);
      g.fillStyle(0x806748).fillRect(sx + 4, sy + 24, 56, 24);
      g.fillStyle(stallColors[i % 4]).fillRect(sx, sy, 64, 32);
      for (let stripe = 0; stripe < 4; stripe++) g.fillStyle(0xf2dfb2).fillRect(sx + stripe * 16, sy, 8, 32);
      g.fillStyle(0x534b38).fillRect(sx + 8, sy + 38, 48, 4);
    }
    // Small original details distinguish factories, banks and working farms.
    for (let by = Math.max(0, oy - BLOCK); by < oy + CHUNK; by += BLOCK) {
      for (let bx = Math.max(0, ox - BLOCK); bx < ox + CHUNK; bx += BLOCK) {
        if ((bx / BLOCK * 7 + by / BLOCK * 11) % 5 === 3) continue;
        if (Math.hypot(bx + 128 - centerX, by + 128 - centerY) < 640) continue;
        const zone = this.logicalGrid.getCell((bx + 128) / MAP_CONFIG.tileSize, (by + 128) / MAP_CONFIG.tileSize)?.zone;
        const px = bx + 80 - ox;
        const py = by + 80 - oy;
        if (zone === 'INDUSTRIAL') {
          g.fillStyle(0x343e4b).fillRect(px + 132, py - 28, 24, 52);
          g.fillStyle(0xb96f5a).fillRect(px + 136, py - 24, 16, 44);
          for (let band = 0; band < 3; band++) g.fillStyle(0xd5c1a1).fillRect(px + 136, py - 20 + band * 16, 16, 4);
          g.fillStyle(0x27333c).fillRect(px + 132, py - 28, 24, 6);
        } else if (zone === 'LAND') {
          for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
            g.fillStyle(0xb3a15d).fillRect(px + c * 14 + 3, py + r * 18 + 8, 2, 12);
            g.fillStyle(0xf0cf77).fillRect(px + c * 14, py + r * 18 + 6, 8, 4);
          }
        } else if (zone === 'FINANCIAL') {
          g.fillStyle(0x354d62).fillRect(px + 32, py + 40, 96, 28);
          g.fillStyle(0xdac583).fillRect(px + 40, py + 44, 80, 3);
          // Stylized bank columns and a gold plaque on the roof.
          for (let column = 0; column < 4; column++) g.fillStyle(0xdac583).fillRect(px + 44 + column * 20, py + 50, 4, 12);
        }
      }
    }
    g.fillStyle(0x363f53).fillRect(x - 100, y - 84, 208, 184);
    g.fillStyle(0xdac8a1).fillRect(x - 96, y - 88, 192, 176);
    g.fillStyle(0x538eac).fillRect(x - 80, y - 72, 160, 144);
    g.fillStyle(0x8bd7d7).fillRect(x - 64, y - 56, 128, 112);
    g.fillStyle(0xf0d48a).fillRect(x - 24, y - 40, 48, 72);
    g.fillStyle(0xffe9a4).fillRect(x - 16, y - 56, 32, 32);
    g.fillStyle(0xd1a257).fillRect(x - 8, y - 48, 8, 16);
    for (let i = -1; i <= 1; i++) g.fillStyle(0xf5f2cf).fillRect(x + i * 40 - 4, y + 48, 8, 4);
    rt.draw(g);
    g.destroy();
  }

  public destroy(): void {
    this.chunks.forEach(chunk => chunk.destroy());
    this.chunks = [];
    this.chimneyPositions = [];
  }
}
