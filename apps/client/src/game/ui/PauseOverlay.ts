import Phaser from 'phaser';

export class PauseOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isVisible: boolean = false;
  private onResumeCallback?: () => void;
  private onResetCallback?: () => void;

  constructor(scene: Phaser.Scene, onResume?: () => void, onReset?: () => void) {
    this.scene = scene;
    this.onResumeCallback = onResume;
    this.onResetCallback = onReset;
    this.create();
  }

  private create(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // 1. Semi-transparent backdrop
    const backdrop = this.scene.add.rectangle(0, 0, width, height, 0x020617, 0.75).setOrigin(0);
    backdrop.setInteractive(); // Blocks input to game beneath

    // 2. 16-bit Retro Pixel Modal Card
    const cardW = 340;
    const cardH = 272;
    const cardX = width / 2;
    const cardY = height / 2;

    const cardBg = this.scene.add.graphics();
    // Drop shadow
    cardBg.fillStyle(0x020617, 0.6);
    cardBg.fillRect(cardX - cardW / 2 + 4, cardY - cardH / 2 + 4, cardW, cardH);
    // Dark slate body
    cardBg.fillStyle(0x0b0f19, 0.98);
    cardBg.fillRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH);
    // 2px metallic border
    cardBg.lineStyle(2, 0x38bdf8, 0.9);
    cardBg.strokeRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH);
    // Inner border
    cardBg.lineStyle(1, 0xffffff, 0.3);
    cardBg.strokeRect(cardX - cardW / 2 + 3, cardY - cardH / 2 + 3, cardW - 6, cardH - 6);

    // Corner rivets (4 dots)
    cardBg.fillStyle(0xfacc15, 1);
    cardBg.fillRect(cardX - cardW / 2 + 5, cardY - cardH / 2 + 5, 3, 3);
    cardBg.fillRect(cardX + cardW / 2 - 8, cardY - cardH / 2 + 5, 3, 3);
    cardBg.fillRect(cardX - cardW / 2 + 5, cardY + cardH / 2 - 8, 3, 3);
    cardBg.fillRect(cardX + cardW / 2 - 8, cardY + cardH / 2 - 8, 3, 3);

    // 3. Title & Text
    const titleText = this.scene.add.text(cardX, cardY - 65, '⏸️ TẠM DỪNG', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '16px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const descText = this.scene.add.text(
      cardX,
      cardY - 32,
      'MARKET MAYHEM – CHIẾN TRƯỜNG THỊ TRƯỜNG\nNhấn ESC hoặc bấm nút bên dưới để tiếp tục',
      {
        fontFamily: 'monospace, sans-serif',
        fontSize: '9.5px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 4,
      }
    ).setOrigin(0.5);

    // 4. Resume Button
    const resumeBtn = this.createButton(cardX, cardY + 20, 240, 34, 'TIẾP TỤC CHƠI (RESUME)', 0x0284c7, () => {
      this.hide();
      if (this.onResumeCallback) this.onResumeCallback();
    });

    // 5. Reset Position Button
    const resetBtn = this.createButton(cardX, cardY + 66, 240, 34, 'HỒI SINH TẠI CĂN CỨ', 0x334155, () => {
      this.hide();
      if (this.onResetCallback) this.onResetCallback();
    });
    const exitBtn = this.createButton(cardX, cardY + 110, 240, 28, 'VỀ TRANG CHỦ', 0x334155, () => {
      this.scene.game.events.emit('request-exit-menu');
    });

    // Root Container
    this.container = this.scene.add.container(0, 0, [
      backdrop,
      cardBg,
      titleText,
      descText,
      ...resumeBtn,
      ...resetBtn,
      ...exitBtn,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setVisible(false);
  }

  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    bgColor: number,
    onClick: () => void
  ): Phaser.GameObjects.GameObject[] {
    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRect(x - w / 2, y - h / 2, w, h);
    bg.lineStyle(1.5, 0xffffff, 0.8);
    bg.strokeRect(x - w / 2, y - h / 2, w, h);

    const label = this.scene.add.text(x, y, text, {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '9.5px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.scene.add.rectangle(x, y, w, h).setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', () => {
      onClick();
    });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x0ea5e9, 1);
      bg.fillRect(x - w / 2, y - h / 2, w, h);
      bg.lineStyle(1.5, 0xfacc15, 1);
      bg.strokeRect(x - w / 2, y - h / 2, w, h);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 1);
      bg.fillRect(x - w / 2, y - h / 2, w, h);
      bg.lineStyle(1.5, 0xffffff, 0.8);
      bg.strokeRect(x - w / 2, y - h / 2, w, h);
    });

    return [bg, label, hitArea];
  }

  public show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
  }

  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public get isOpen(): boolean {
    return this.isVisible;
  }

  public onResize(width: number, height: number): void {
    if (this.container) {
      this.container.destroy(true);
      this.create();
      this.container.setVisible(this.isVisible);
    }
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy(true);
    }
  }
}
