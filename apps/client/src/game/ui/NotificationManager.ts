import Phaser from 'phaser';

export class NotificationManager {
  private scene: Phaser.Scene;
  private alertContainer!: Phaser.GameObjects.Container;
  private alertBg!: Phaser.GameObjects.Graphics;
  private alertText!: Phaser.GameObjects.Text;
  private alertTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createAlertBanner();
  }

  private createAlertBanner(): void {
    const width = this.scene.scale.width;
    this.alertBg = this.scene.add.graphics();

    this.alertText = this.scene.add.text(width / 2, 70, '', {
      fontFamily: 'Silkscreen, monospace, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    this.alertContainer = this.scene.add.container(0, 0, [this.alertBg, this.alertText]);
    this.alertContainer.setScrollFactor(0);
    this.alertContainer.setDepth(600);
    this.alertContainer.setVisible(false);
  }

  public onResize(width: number, _height: number): void {
    if (this.alertText) {
      this.alertText.setX(width / 2);
    }
  }

  public showCaptureToast(x: number, y: number, count: number, percent: number): void {
    const toast = this.scene.add.text(x, y - 20, `+${count} Ô! (${percent.toFixed(1)}%)`, {
      fontFamily: '"Press Start 2P", Silkscreen, monospace',
      fontSize: '9px',
      color: '#38bdf8',
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5,
    }).setOrigin(0.5);
    toast.setDepth(30);

    this.scene.tweens.add({
      targets: toast,
      y: y - 55,
      alpha: 0,
      duration: 850,
      ease: 'Stepped',
      easeParams: [6],
      onComplete: () => toast.destroy(),
    });
  }

  public showFloatingProfit(x: number, y: number, text: string, color: string = '#4ade80'): void {
    const floating = this.scene.add.text(x, y - 16, text, {
      fontFamily: '"Press Start 2P", Silkscreen, monospace',
      fontSize: '8px',
      color: color,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5,
    }).setOrigin(0.5);
    floating.setDepth(30);

    this.scene.tweens.add({
      targets: floating,
      y: y - 48,
      alpha: 0,
      duration: 1100,
      ease: 'Stepped',
      easeParams: [6],
      onComplete: () => floating.destroy(),
    });
  }

  public showAlert(message: string, isDanger: boolean = false): void {
    this.alertText.setText(message);
    const textW = this.alertText.width + 48;
    const textH = 34;
    const screenW = this.scene.scale.width;

    this.alertBg.clear();
    // Drop shadow
    this.alertBg.fillStyle(0x020617, 0.5);
    this.alertBg.fillRect(screenW / 2 - textW / 2 + 2, 70 - textH / 2 + 2, textW, textH);
    // Dark body
    this.alertBg.fillStyle(0x0b0f19, 0.95);
    this.alertBg.fillRect(screenW / 2 - textW / 2, 70 - textH / 2, textW, textH);
    // 2px pixel frame
    const borderColor = isDanger ? 0xef4444 : 0x22c55e;
    this.alertBg.lineStyle(2, borderColor, 0.95);
    this.alertBg.strokeRect(screenW / 2 - textW / 2, 70 - textH / 2, textW, textH);

    this.alertContainer.setVisible(true);
    this.alertContainer.setAlpha(1);

    this.scene.tweens.add({
      targets: this.alertContainer,
      alpha: 0,
      duration: 600,
      delay: 2200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.alertContainer.setVisible(false);
      },
    });
  }

  public destroy(): void {
    if (this.alertContainer) {
      this.alertContainer.destroy(true);
    }
  }
}
