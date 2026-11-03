import Phaser from 'phaser';
import { RegionTransitionEvent } from '../entities/RegionManager';

export class DiscoveryPopup {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  // Background and border
  private cardBg!: Phaser.GameObjects.Graphics;
  private glowBorder!: Phaser.GameObjects.Graphics;

  // Content text objects
  private headerBadgeText!: Phaser.GameObjects.Text;
  private iconSprite!: Phaser.GameObjects.Image;
  private englishTitleText!: Phaser.GameObjects.Text;
  private vietnameseTitleText!: Phaser.GameObjects.Text;
  private quoteText!: Phaser.GameObjects.Text;
  private bonusBadgeBg!: Phaser.GameObjects.Graphics;
  private bonusBadgeText!: Phaser.GameObjects.Text;

  // Active tween handle
  private activeTween: Phaser.Tweens.Tween | null = null;
  private autoHideTimer: Phaser.Time.TimerEvent | null = null;

  private isVisible: boolean = false;
  private readonly cardW: number = 440;
  private readonly cardH: number = 96;

  constructor(scene: Phaser.Scene,private minimumY=0) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const screenW = this.scene.scale.width;
    const startX = screenW / 2;
    const startY = -120; // Hidden above viewport

    this.cardBg = this.scene.add.graphics();
    this.glowBorder = this.scene.add.graphics();

    // 1. Discovery Header Tag
    this.headerBadgeText = this.scene.add.text(0, -32, '✨ KHÁM PHÁ VÙNG ĐẤT MỚI', {
      fontFamily: '"Press Start 2P", Silkscreen, monospace',
      fontSize: '8px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // 2. Big District Icon
    this.iconSprite = this.scene.add.image(-168, 4, 'urban_tiles', 16).setScale(3);

    // 3. English Title
    this.englishTitleText = this.scene.add.text(-120, -18, 'INDUSTRIAL DISTRICT', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2,
    });

    // 4. Vietnamese Subtitle
    this.vietnameseTitleText = this.scene.add.text(-120, 2, 'KHU CÔNG NGHIỆP', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '11px',
      color: '#f87171',
      fontStyle: 'bold',
    });

    // 5. Short Quote / Description
    this.quoteText = this.scene.add.text(-120, 20, '"Nơi trực tiếp sản xuất ra Giá trị Thặng dư (m)."', {
      fontFamily: 'monospace, sans-serif',
      fontSize: '9px',
      color: '#cbd5e1',
      maxLines: 2,
      wordWrap: { width: 300 },
    });

    // 6. Bonus Badge (+50 ĐIỂM)
    this.bonusBadgeBg = this.scene.add.graphics();
    this.bonusBadgeText = this.scene.add.text(145, -18, '+50 ĐIỂM', {
      fontFamily: '"Press Start 2P", Silkscreen, monospace',
      fontSize: '8px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.container = this.scene.add.container(startX, startY, [
      this.cardBg,
      this.glowBorder,
      this.headerBadgeText,
      this.iconSprite,
      this.englishTitleText,
      this.vietnameseTitleText,
      this.quoteText,
      this.bonusBadgeBg,
      this.bonusBadgeText,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(600);
    this.container.setVisible(false);
  }

  public show(event: RegionTransitionEvent): void {
    const region = event.currentRegion;
    const isFirst = event.isFirstDiscovery;

    const w = this.cardW;
    const h = this.cardH;

    // Draw 16-bit retro pixel card
    this.cardBg.clear();
    // Drop shadow
    this.cardBg.fillStyle(0x020617, 0.6);
    this.cardBg.fillRect(-w / 2 + 4, -h / 2 + 4, w, h);
    // Dark slate body
    this.cardBg.fillStyle(0x0b0f19, 0.95);
    this.cardBg.fillRect(-w / 2, -h / 2, w, h);

    // Retro pixel border & corner bolts
    this.glowBorder.clear();
    this.glowBorder.lineStyle(2, region.themeColor, 0.95);
    this.glowBorder.strokeRect(-w / 2, -h / 2, w, h);
    this.glowBorder.lineStyle(1, 0xffffff, 0.4);
    this.glowBorder.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);

    // Corner rivets (4 dots)
    this.glowBorder.fillStyle(0xfacc15, 1);
    this.glowBorder.fillRect(-w / 2 + 4, -h / 2 + 4, 3, 3);
    this.glowBorder.fillRect(w / 2 - 7, -h / 2 + 4, 3, 3);
    this.glowBorder.fillRect(-w / 2 + 4, h / 2 - 7, 3, 3);
    this.glowBorder.fillRect(w / 2 - 7, h / 2 - 7, 3, 3);

    // Update Text Content
    this.headerBadgeText.setText(isFirst ? '✨ KHÁM PHÁ VÙNG ĐẤT MỚI' : '📍 ĐANG DI CHUYỂN VÀO');
    this.headerBadgeText.setColor(isFirst ? '#facc15' : '#94a3b8');

    const icons = {
      industrial: ['urban_tiles', 16],
      commercial: ['urban_tiles', 4 * 27 + 16],
      financial: ['urban_tiles', 9 * 27 + 13],
      land: ['tiny_town_tiles', 5],
      central: ['tiny_town_tiles', 7 * 12 + 10],
    } as const;
    const [texture, frame] = icons[region.id];
    this.iconSprite.setTexture(texture, frame);
    this.englishTitleText.setText(region.name);
    this.vietnameseTitleText.setText(region.vietnameseName);
    this.vietnameseTitleText.setColor(region.textColor);
    this.quoteText.setText(`"${region.economicQuote}"`);

    // Bonus badge
    this.bonusBadgeBg.clear();
    if (isFirst && event.bonusAwarded > 0) {
      this.bonusBadgeBg.fillStyle(0x16a34a, 0.95);
      this.bonusBadgeBg.fillRect(96, -28, 98, 20);
      this.bonusBadgeBg.lineStyle(1.5, 0x4ade80, 0.9);
      this.bonusBadgeBg.strokeRect(96, -28, 98, 20);
      this.bonusBadgeText.setText(`+${event.bonusAwarded} ĐIỂM`);
      this.bonusBadgeText.setPosition(145, -18);
      this.bonusBadgeText.setVisible(true);
      this.bonusBadgeBg.setVisible(true);
    } else {
      this.bonusBadgeText.setVisible(false);
      this.bonusBadgeBg.setVisible(false);
    }

    // Kill any existing tween
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    if (this.autoHideTimer) {
      this.autoHideTimer.remove();
      this.autoHideTimer = null;
    }

    const screenW = this.scene.scale.width;
    this.container.setX(screenW / 2);
    this.container.setY(-120);
    this.container.setAlpha(0.2);
    const cardScale = Math.min(1, (screenW - 24) / this.cardW);
    this.container.setScale(cardScale);
    this.container.setVisible(true);
    this.isVisible = true;

    // Slide-down animation with retro stepped bounce
    this.activeTween = this.scene.tweens.add({
      targets: this.container,
      y: Math.max(this.minimumY,screenW < 960 ? 200 : 150),
      alpha: 1,
      scale: cardScale,
      duration: 480,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Auto hide after 3.5 seconds
        this.autoHideTimer = this.scene.time.delayedCall(3500, () => {
          this.hide();
        });
      },
    });
  }

  private hide(): void {
    if (!this.isVisible) return;

    if (this.activeTween) {
      this.activeTween.stop();
    }

    this.activeTween = this.scene.tweens.add({
      targets: this.container,
      y: -120,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        this.isVisible = false;
        this.activeTween = null;
      },
    });
  }

  public onResize(width: number, _height: number): void {
    if (this.container) {
      this.container.setX(width / 2);
      this.container.setScale(Math.min(1, (width - 24) / this.cardW));
      if (this.isVisible) {
        this.activeTween?.stop();
        this.container.setY(Math.max(this.minimumY,width < 960 ? 200 : 150));
        this.container.setAlpha(1);
        this.autoHideTimer?.remove();
        this.autoHideTimer = this.scene.time.delayedCall(3500, () => this.hide());
      }
    }
  }

  public destroy(): void {
    if (this.activeTween) this.activeTween.stop();
    if (this.autoHideTimer) this.autoHideTimer.remove();
    if (this.container) this.container.destroy(true);
  }
}
