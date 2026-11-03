import Phaser from 'phaser';
import { EconomicScoreBreakdown } from '../systems/EconomicSystem';

export interface LeaderboardEntry {
  name: string;
  isPlayer: boolean;
  tiles: number;
  percentage: number;
  profit: number;
  hasShield: boolean;
}

export class ArcadeHUD {
  private scene: Phaser.Scene;

  // Root container (Depth 500, scrollFactor 0)
  private container!: Phaser.GameObjects.Container;

  // Top-Left: Player Capital & Profits
  private capitalCardBg!: Phaser.GameObjects.Graphics;
  private capitalTitleText!: Phaser.GameObjects.Text;
  private capitalRateText!: Phaser.GameObjects.Text;
  private breakdownText!: Phaser.GameObjects.Text;

  // Top-Center: Match Timer & Zone Banner
  private timerBg!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private zoneBannerBg!: Phaser.GameObjects.Graphics;
  private zoneBannerText!: Phaser.GameObjects.Text;

  // Top-Right: Compact Leaderboard & Action Buttons
  private leaderboardBg!: Phaser.GameObjects.Graphics;
  private leaderboardTitle!: Phaser.GameObjects.Text;
  private leaderboardPlayerText!: Phaser.GameObjects.Text;
  private leaderboardBotText!: Phaser.GameObjects.Text;

  // Action Buttons (Fullscreen, Pause, Dev stats)
  private fullscreenBtnBg!: Phaser.GameObjects.Graphics;
  private fullscreenBtnText!: Phaser.GameObjects.Text;
  private fullscreenHitArea!: Phaser.GameObjects.Rectangle;

  private pauseBtnBg!: Phaser.GameObjects.Graphics;
  private pauseBtnText!: Phaser.GameObjects.Text;
  private pauseHitArea!: Phaser.GameObjects.Rectangle;

  // Bottom-Left: Active Power-up & Territory bar
  private powerupBg!: Phaser.GameObjects.Graphics;
  private powerupIconText!: Phaser.GameObjects.Text;
  private powerupStatusText!: Phaser.GameObjects.Text;

  // Developer Overlay (Toggled via F3 key or button)
  private devContainer!: Phaser.GameObjects.Container;
  private devText!: Phaser.GameObjects.Text;
  private isDevOverlayVisible: boolean = false;
  private compact: boolean = false;

  // Callbacks
  private onFullscreenToggle?: () => void;
  private onPauseToggle?: () => void;

  constructor(
    scene: Phaser.Scene,
    onFullscreenToggle?: () => void,
    onPauseToggle?: () => void
  ) {
    this.scene = scene;
    this.onFullscreenToggle = onFullscreenToggle;
    this.onPauseToggle = onPauseToggle;
    this.create();
  }

  private create(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(500);

    // 1. Top-Left: Capital & Profit Card
    this.capitalCardBg = this.scene.add.graphics();
    this.capitalTitleText = this.scene.add.text(0, 0, '💰 0 đ', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '15px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2,
    });
    this.capitalRateText = this.scene.add.text(0, 0, '+0.0 đ/s', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#4ade80',
      fontStyle: 'bold',
    });
    this.breakdownText = this.scene.add.text(0, 0, '🏭 CN: 0 | 🏬 TM: 0 | 🏦 Lãi: 0 | 🌾 Tô: 0', {
      fontFamily: 'monospace, sans-serif',
      fontSize: '9.5px',
      color: '#94a3b8',
    });

    // 2. Top-Center: Match Timer & Zone Banner
    this.timerBg = this.scene.add.graphics();
    this.timerText = this.scene.add.text(0, 0, '⏱️ 8:00', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.zoneBannerBg = this.scene.add.graphics();
    this.zoneBannerText = this.scene.add.text(0, 0, '🏭 KHU CÔNG NGHIỆP', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '10px',
      color: '#f87171',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // 3. Top-Right: Compact Leaderboard
    this.leaderboardBg = this.scene.add.graphics();
    this.leaderboardTitle = this.scene.add.text(0, 0, '👑 BẢNG XẾP HẠNG', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '9px',
      color: '#94a3b8',
      fontStyle: 'bold',
    });
    this.leaderboardPlayerText = this.scene.add.text(0, 0, '#1 Bạn: 0.4%', {
      fontFamily: 'monospace, sans-serif',
      fontSize: '10px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });
    this.leaderboardBotText = this.scene.add.text(0, 0, '#2 Bot: 0.4%', {
      fontFamily: 'monospace, sans-serif',
      fontSize: '10px',
      color: '#fb923c',
    });

    // 4. Action Buttons (Fullscreen, Pause)
    this.fullscreenBtnBg = this.scene.add.graphics();
    this.fullscreenBtnText = this.scene.add.text(0, 0, '⛶ TOÀN MÀN HÌNH', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.fullscreenHitArea = this.scene.add.rectangle(0, 0, 115, 24).setInteractive({ useHandCursor: true });
    this.fullscreenHitArea.on('pointerdown', () => {
      if (this.onFullscreenToggle) this.onFullscreenToggle();
    });

    this.pauseBtnBg = this.scene.add.graphics();
    this.pauseBtnText = this.scene.add.text(0, 0, '⏸️ MENU', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.pauseHitArea = this.scene.add.rectangle(0, 0, 75, 24).setInteractive({ useHandCursor: true });
    this.pauseHitArea.on('pointerdown', () => {
      if (this.onPauseToggle) this.onPauseToggle();
    });

    // 5. Bottom-Left: Power-Up Slot
    this.powerupBg = this.scene.add.graphics();
    this.powerupIconText = this.scene.add.text(0, 0, '🛡️ KHIÊN BẢO VỆ', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '9px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });
    this.powerupStatusText = this.scene.add.text(0, 0, 'BẢO VỆ KHI HỒI SINH', {
      fontFamily: 'monospace, sans-serif',
      fontSize: '8.5px',
      color: '#94a3b8',
    });

    // 6. Developer Stats Overlay (Toggle with F3)
    this.createDevOverlay();

    // Assemble container
    this.container.add([
      this.capitalCardBg,
      this.capitalTitleText,
      this.capitalRateText,
      this.breakdownText,
      this.timerBg,
      this.timerText,
      this.zoneBannerBg,
      this.zoneBannerText,
      this.leaderboardBg,
      this.leaderboardTitle,
      this.leaderboardPlayerText,
      this.leaderboardBotText,
      this.fullscreenBtnBg,
      this.fullscreenBtnText,
      this.fullscreenHitArea,
      this.pauseBtnBg,
      this.pauseBtnText,
      this.pauseHitArea,
      this.powerupBg,
      this.powerupIconText,
      this.powerupStatusText,
      this.devContainer,
    ]);

    // Setup F3 key listener for dev stats toggle
    if (this.scene.input.keyboard) {
      const f3Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
      f3Key.on('down', () => this.toggleDevOverlay());
    }

    // Initial positioning based on current viewport size
    this.onResize(this.scene.scale.width, this.scene.scale.height);
  }

  private createDevOverlay(): void {
    const devBg = this.scene.add.graphics();
    devBg.fillStyle(0x020617, 0.9);
    devBg.fillRect(0, 0, 200, 68);
    devBg.lineStyle(1.5, 0x10b981, 0.9);
    devBg.strokeRect(0, 0, 200, 68);

    this.devText = this.scene.add.text(10, 8, 'FPS: 60\nPOS: (0, 0)\nTILE: [0, 0]\nF3: Đóng Dev Info', {
      fontFamily: 'monospace',
      fontSize: '9.5px',
      color: '#10b981',
      lineSpacing: 2,
    });

    this.devContainer = this.scene.add.container(14, 115, [devBg, this.devText]);
    this.devContainer.setVisible(this.isDevOverlayVisible);
  }

  public toggleDevOverlay(): void {
    this.isDevOverlayVisible = !this.isDevOverlayVisible;
    this.devContainer.setVisible(this.isDevOverlayVisible);
  }

  public onResize(width: number, height: number): void {
    const compact = width < 960;
    this.compact = compact;
    // 1. Top-Left: Capital Card (Retro Pixel Frame)
    const cardW = compact ? Math.max(150, width - 168) : 280;
    const cardH = 70;
    this.capitalCardBg.clear();
    // Drop shadow
    this.capitalCardBg.fillStyle(0x020617, 0.5);
    this.capitalCardBg.fillRect(16, 16, cardW, cardH);
    // Dark slate panel
    this.capitalCardBg.fillStyle(0x0b0f19, 0.94);
    this.capitalCardBg.fillRect(14, 14, cardW, cardH);
    // Metallic 2px border
    this.capitalCardBg.lineStyle(2, 0x38bdf8, 0.85);
    this.capitalCardBg.strokeRect(14, 14, cardW, cardH);
    // Corner rivets
    this.capitalCardBg.fillStyle(0xfacc15, 1);
    this.capitalCardBg.fillRect(16, 16, 3, 3);
    this.capitalCardBg.fillRect(14 + cardW - 5, 16, 3, 3);
    this.capitalCardBg.fillRect(16, 14 + cardH - 5, 3, 3);
    this.capitalCardBg.fillRect(14 + cardW - 5, 14 + cardH - 5, 3, 3);

    this.capitalTitleText.setPosition(24, 20);
    this.capitalRateText.setPosition(compact ? 24 : 175, compact ? 52 : 23);
    this.breakdownText.setPosition(24, 52);
    this.breakdownText.setVisible(!compact);

    // 2. Top-Center: Timer & Zone Banner
    const centerX = compact ? width - 70 : width / 2;
    const timerW = 110;
    const timerH = 28;
    this.timerBg.clear();
    this.timerBg.fillStyle(0x020617, 0.5);
    this.timerBg.fillRect(centerX - timerW / 2 + 2, 16, timerW, timerH);
    this.timerBg.fillStyle(0x0b0f19, 0.94);
    this.timerBg.fillRect(centerX - timerW / 2, 14, timerW, timerH);
    this.timerBg.lineStyle(1.5, 0xfacc15, 0.9);
    this.timerBg.strokeRect(centerX - timerW / 2, 14, timerW, timerH);

    this.timerText.setPosition(centerX, 28);

    const bannerW = Math.min(290, width - 28);
    const bannerH = 26;
    const bannerX = width / 2;
    const bannerY = compact ? 112 : 46;
    this.zoneBannerBg.clear();
    this.zoneBannerBg.fillStyle(0x020617, 0.5);
    this.zoneBannerBg.fillRect(bannerX - bannerW / 2 + 2, bannerY + 2, bannerW, bannerH);
    this.zoneBannerBg.fillStyle(0x0b0f19, 0.94);
    this.zoneBannerBg.fillRect(bannerX - bannerW / 2, bannerY, bannerW, bannerH);
    this.zoneBannerBg.lineStyle(1.5, 0x475569, 0.85);
    this.zoneBannerBg.strokeRect(bannerX - bannerW / 2, bannerY, bannerW, bannerH);

    this.zoneBannerText.setPosition(bannerX, bannerY + 13);

    // 3. Top-Right: Compact Leaderboard & Buttons
    const lbW = 190;
    const lbH = 68;
    const lbX = width - lbW - 14;
    this.leaderboardBg.clear();
    this.leaderboardBg.fillStyle(0x020617, 0.5);
    this.leaderboardBg.fillRect(lbX + 2, 16, lbW, lbH);
    this.leaderboardBg.fillStyle(0x0b0f19, 0.94);
    this.leaderboardBg.fillRect(lbX, 14, lbW, lbH);
    this.leaderboardBg.lineStyle(1.5, 0xf59e0b, 0.85);
    this.leaderboardBg.strokeRect(lbX, 14, lbW, lbH);

    this.leaderboardTitle.setPosition(lbX + 12, 20);
    this.leaderboardPlayerText.setPosition(lbX + 12, 38);
    this.leaderboardBotText.setPosition(lbX + 12, 54);
    this.leaderboardTitle.setVisible(!compact);
    if (compact) {
      this.leaderboardBg.clear().fillStyle(0x0b0f19, 0.94).fillRect(width - 140, 46, 126, 30);
      this.leaderboardPlayerText.setPosition(width - 132, 48);
      this.leaderboardBotText.setPosition(width - 132, 62);
    }
    this.devContainer.setY(compact ? 150 : 115);

    // Fullscreen and Pause Buttons
    const fsX = width - 128;
    const fsY = 92;
    this.fullscreenBtnBg.clear();
    this.fullscreenBtnBg.fillStyle(0x1e293b, 0.95);
    this.fullscreenBtnBg.fillRect(fsX - 58, fsY - 12, 116, 24);
    this.fullscreenBtnBg.lineStyle(1.5, 0x64748b, 0.9);
    this.fullscreenBtnBg.strokeRect(fsX - 58, fsY - 12, 116, 24);

    this.fullscreenBtnText.setPosition(fsX, fsY);
    this.fullscreenHitArea.setPosition(fsX, fsY);

    const pauseX = width - 212;
    const pauseY = 92;
    this.pauseBtnBg.clear();
    this.pauseBtnBg.fillStyle(0x1e293b, 0.95);
    this.pauseBtnBg.fillRect(pauseX - 38, pauseY - 12, 76, 24);
    this.pauseBtnBg.lineStyle(1.5, 0x64748b, 0.9);
    this.pauseBtnBg.strokeRect(pauseX - 38, pauseY - 12, 76, 24);

    this.pauseBtnText.setPosition(pauseX, pauseY);
    this.pauseHitArea.setPosition(pauseX, pauseY);

    // 4. Bottom-Left: Power-Up Slot
    const puW = 160;
    const puH = 44;
    const puX = 14;
    const puY = height - puH - 14;
    this.powerupBg.clear();
    this.powerupBg.fillStyle(0x020617, 0.5);
    this.powerupBg.fillRect(puX + 2, puY + 2, puW, puH);
    this.powerupBg.fillStyle(0x0b0f19, 0.94);
    this.powerupBg.fillRect(puX, puY, puW, puH);
    this.powerupBg.lineStyle(1.5, 0x0284c7, 0.85);
    this.powerupBg.strokeRect(puX, puY, puW, puH);

    this.powerupIconText.setPosition(puX + 12, puY + 8);
    this.powerupStatusText.setPosition(puX + 12, puY + 26);
  }

  public setFullscreenButtonText(isFullscreen: boolean): void {
    if (this.fullscreenBtnText) {
      this.fullscreenBtnText.setText(isFullscreen ? '⛶ THU NHỎ' : '⛶ TOÀN MÀN HÌNH');
    }
  }

  public update(
    profile: EconomicScoreBreakdown,
    matchRemainingSec: number,
    leaderboard: LeaderboardEntry[],
    zoneTitle: string,
    zoneColor: string,
    shieldTimeRemaining: number,
    fps: number,
    playerX: number,
    playerY: number,
    playerCol: number,
    playerRow: number
  ): void {
    // 1. Capital & Profits
    const totalProfitDisplay = Math.floor(profile.totalProfit).toLocaleString('vi-VN');
    const rateDisplay = profile.ratePerSecond.toFixed(1);
    this.capitalTitleText.setText(`💰 ${totalProfitDisplay} đ`);
    this.capitalRateText.setText(`+${rateDisplay} đ/s`);

    const pi = Math.floor(profile.industrialProfit);
    const pc = Math.floor(profile.commercialProfit);
    const z = Math.floor(profile.financialInterest);
    const r = Math.floor(profile.groundRent);
    this.breakdownText.setText(`🏭 CN: ${pi} | 🏬 TM: ${pc} | 🏦 Lãi: ${z} | 🌾 Tô: ${r}`);

    // 2. Match Timer
    const mins = Math.floor(matchRemainingSec / 60);
    const secs = Math.floor(matchRemainingSec % 60);
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    this.timerText.setText(`⏱️ ${timeFormatted}`);
    if (matchRemainingSec <= 60) {
      this.timerText.setColor('#ef4444');
    } else {
      this.timerText.setColor('#ffffff');
    }

    // 3. Zone Banner
    this.zoneBannerText.setText(zoneTitle);
    this.zoneBannerText.setColor(zoneColor);

    // 4. Leaderboard
    if (leaderboard.length >= 1) {
      const p = leaderboard[0];
      const pScore = Math.floor(p.profit).toLocaleString('vi-VN');
      this.leaderboardPlayerText.setText(`#1 ${p.name}: ${p.percentage.toFixed(1)}%${this.compact ? '' : ` (${pScore})`}`);
      this.leaderboardPlayerText.setColor(p.isPlayer ? '#38bdf8' : '#fb923c');
    }
    if (leaderboard.length >= 2) {
      const b = leaderboard[1];
      const bScore = Math.floor(b.profit).toLocaleString('vi-VN');
      this.leaderboardBotText.setText(`#2 ${b.name}: ${b.percentage.toFixed(1)}%${this.compact ? '' : ` (${bScore})`}`);
      this.leaderboardBotText.setColor(b.isPlayer ? '#38bdf8' : '#fb923c');
    }

    // 5. Shield Status
    if (shieldTimeRemaining > 0) {
      this.powerupIconText.setText(`🛡️ KHIÊN (${shieldTimeRemaining.toFixed(1)}s)`);
      this.powerupIconText.setColor('#38bdf8');
      this.powerupStatusText.setText('ĐANG BẢO VỆ ĐUÔI');
      this.powerupStatusText.setColor('#4ade80');
    } else {
      this.powerupIconText.setText('🛡️ KHIÊN SẴN SÀNG');
      this.powerupIconText.setColor('#64748b');
      this.powerupStatusText.setText('KÍCH HOẠT KHI HỒI SINH');
      this.powerupStatusText.setColor('#64748b');
    }

    // 6. Dev info overlay
    if (this.isDevOverlayVisible && this.devText) {
      this.devText.setText(
        `FPS: ${fps}\nPOS: (${Math.round(playerX)}, ${Math.round(playerY)})\nTILE: [${playerCol}, ${playerRow}]\nF3: Đóng Dev Info`
      );
    }
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy(true);
    }
  }
}
