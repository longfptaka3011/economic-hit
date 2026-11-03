import Phaser from 'phaser';
import { LogicalGrid } from '../entities/LogicalGrid';

export class GridRenderer {
  private scene: Phaser.Scene;
  private logicalGrid: LogicalGrid;
  private graphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, logicalGrid: LogicalGrid) {
    this.scene = scene;
    this.logicalGrid = logicalGrid;
  }

  public render(): void {
    const worldW = this.logicalGrid.cols * this.logicalGrid.tileSize; // 1280
    const worldH = this.logicalGrid.rows * this.logicalGrid.tileSize; // 1280
    const halfW = worldW / 2; // 640
    const halfH = worldH / 2; // 640
    const tileSize = this.logicalGrid.tileSize;

    this.graphics = this.scene.add.graphics();

    // 1. Paper.io 2 Style: 4 Distinct Soft Pastel Paper Quadrants
    // Top-Left: Industrial (Soft Rose / Coral Paper)
    this.graphics.fillStyle(0xfff1f2, 1);
    this.graphics.fillRect(0, 0, halfW, halfH);

    // Top-Right: Commercial (Soft Sky-Cyan Paper)
    this.graphics.fillStyle(0xf0f9ff, 1);
    this.graphics.fillRect(halfW, 0, halfW, halfH);

    // Bottom-Left: Financial (Soft Mint / Sage Green Paper)
    this.graphics.fillStyle(0xf0fdf4, 1);
    this.graphics.fillRect(0, halfH, halfW, halfH);

    // Bottom-Right: Land Zone (Soft Lilac / Lavender Paper)
    this.graphics.fillStyle(0xfaf5ff, 1);
    this.graphics.fillRect(halfW, halfH, halfW, halfH);

    // 2. Paper.io 2 Subtle Faint Grid Lines (Clean graph paper feel)
    this.graphics.lineStyle(1, 0x94a3b8, 0.2);

    for (let x = 0; x <= worldW; x += tileSize) {
      this.graphics.moveTo(x, 0);
      this.graphics.lineTo(x, worldH);
    }
    for (let y = 0; y <= worldH; y += tileSize) {
      this.graphics.moveTo(0, y);
      this.graphics.lineTo(worldW, y);
    }
    this.graphics.strokePath();

    // 3. Central Axis Dividers (Soft minimalist boundary)
    this.graphics.lineStyle(2, 0x64748b, 0.35);
    this.graphics.moveTo(halfW, 0);
    this.graphics.lineTo(halfW, worldH);
    this.graphics.moveTo(0, halfH);
    this.graphics.lineTo(worldW, halfH);
    this.graphics.strokePath();

    // 4. Central Hub Circle Stamp (Minimalist Paper.io 2 seal)
    this.graphics.fillStyle(0xffffff, 0.95);
    this.graphics.fillCircle(halfW, halfH, 60);
    this.graphics.lineStyle(2, 0xf59e0b, 0.8);
    this.graphics.strokeCircle(halfW, halfH, 60);

    this.scene.add.text(halfW, halfH - 10, 'TRUNG TÂM', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#d97706',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.scene.add.text(halfW, halfH + 8, 'THỊ TRƯỜNG', {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#64748b',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 5. Zone Modern Flat Badges
    this.renderZoneBadges(halfW, halfH);

    // 6. Outer Paper Frame Shadow & Thick Border
    // Outer drop shadow effect
    this.graphics.lineStyle(6, 0x0f172a, 0.15);
    this.graphics.strokeRect(3, 3, worldW - 6, worldH - 6);

    // Crisp inner frame
    this.graphics.lineStyle(4, 0x334155, 0.9);
    this.graphics.strokeRect(2, 2, worldW - 4, worldH - 4);
  }

  private renderZoneBadges(halfW: number, halfH: number): void {
    const badgeConfigs = [
      {
        x: 32,
        y: 32,
        title: '🏭 KHU CÔNG NGHIỆP',
        desc: 'Sản xuất Giá trị thặng dư (m) • +2.5 đ/s/ô',
        bgColor: 0xffe4e6,
        borderColor: 0xf43f5e,
        textColor: '#e11d48',
      },
      {
        x: halfW + 32,
        y: 32,
        title: '🏬 KHU THƯƠNG NGHIỆP',
        desc: 'Gia tốc chu chuyển tư bản • Nhân hệ số x1.5 - x2.5',
        bgColor: 0xe0f2fe,
        borderColor: 0x0284c7,
        textColor: '#0369a1',
      },
      {
        x: 32,
        y: halfH + 32,
        title: '🏦 KHU TÀI CHÍNH',
        desc: 'Tư bản tiền tệ cho vay • Sinh lãi tức (z) định kỳ',
        bgColor: 0xdcfce7,
        borderColor: 0x16a34a,
        textColor: '#15803d',
      },
      {
        x: halfW + 32,
        y: halfH + 32,
        title: '🌾 KHU ĐẤT ĐAI',
        desc: 'Độc quyền tư hữu đất • Thu tiền Địa tô (R) khi đối thủ dẫm đất',
        bgColor: 0xf3e8ff,
        borderColor: 0x9333ea,
        textColor: '#7e22ce',
      },
    ];

    for (const b of badgeConfigs) {
      const g = this.scene.add.graphics();
      g.fillStyle(b.bgColor, 0.9);
      g.fillRoundedRect(b.x, b.y, 340, 48, 10);
      g.lineStyle(1.5, b.borderColor, 0.6);
      g.strokeRoundedRect(b.x, b.y, 340, 48, 10);

      this.scene.add.text(b.x + 14, b.y + 8, b.title, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: b.textColor,
        fontStyle: 'bold',
      });

      this.scene.add.text(b.x + 14, b.y + 28, b.desc, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#475569',
      });
    }
  }
}
