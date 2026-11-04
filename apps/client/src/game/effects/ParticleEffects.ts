import Phaser from 'phaser';

export class ParticleEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Retro Pixel Art Confetti Burst on territory capture
   */
  public emitCaptureBurst(x: number, y: number, primaryColor: number,capturedCells=0): void {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const confettiColors = [
      primaryColor,
      0xffffff,
      0xfbbf24, // Gold pixel
      0x38bdf8, // Cyan pixel
      0xf43f5e, // Coral pixel
      0x4ade80, // Lime pixel
    ];
    const particleCount = capturedCells>=50?36:24;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const color = confettiColors[i % confettiColors.length];
      const size = Phaser.Math.Between(4, 7);

      // Pixel square confetti
      const p = this.scene.add.rectangle(x, y, size, size, color);
      p.setStrokeStyle(1, 0x020617, 0.6);
      p.setDepth(25);

      this.scene.tweens.add({
        targets: p,
        x: x + vx * 0.45,
        y: y + vy * 0.45 + 16, // Gravity pull
        alpha: 0,
        duration: 500 + Math.random() * 250,
        ease: 'Stepped', // Retro pixel step animation
        easeParams: [5],
        onComplete: () => {
          p.destroy();
        },
      });
    }
  }

  public emitEliminationParticles(x: number, y: number, color: number): void {
    this.emitEliminationBurst(x, y, color);
  }

  /**
   * Retro Pixel Art Elimination explosion (pixel shockwave box and pixel fragments)
   */
  public emitEliminationBurst(x: number, y: number, color: number): void {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    // 1. Expanding pixel shockwave box
    const box = this.scene.add.rectangle(x, y, 16, 16);
    box.setStrokeStyle(3, color, 0.95);
    box.setDepth(28);

    this.scene.tweens.add({
      targets: box,
      width: 72,
      height: 72,
      alpha: 0,
      duration: 350,
      ease: 'Stepped',
      easeParams: [6],
      onComplete: () => box.destroy(),
    });

    // 2. Pixel fragments scattering
    const fragmentColors = [color, 0xffffff, 0xf59e0b, 0xef4444];
    const fragmentCount = 28;

    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 90 + Math.random() * 140;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const pColor = fragmentColors[i % fragmentColors.length];
      const size = Phaser.Math.Between(4, 8);
      const p = this.scene.add.rectangle(x, y, size, size, pColor);
      p.setStrokeStyle(1, 0x020617, 0.8);
      p.setDepth(28);

      this.scene.tweens.add({
        targets: p,
        x: x + vx * 0.5,
        y: y + vy * 0.5,
        alpha: 0,
        duration: 550 + Math.random() * 200,
        ease: 'Stepped',
        easeParams: [6],
        onComplete: () => p.destroy(),
      });
    }
  }

  /**
   * Industrial Factory Chimney Pixel Smoke Puff
   */
  public emitSmokePuff(x: number, y: number): void {
    const smokeColors = [0x94a3b8, 0xcbd5e1, 0x64748b, 0xe2e8f0];
    const color = Phaser.Utils.Array.GetRandom(smokeColors);
    const size = Phaser.Math.Between(5, 8);

    const smoke = this.scene.add.rectangle(x + Phaser.Math.Between(-3, 3), y, size, size, color);
    smoke.setAlpha(0.75);
    smoke.setDepth(8);

    this.scene.tweens.add({
      targets: smoke,
      x: smoke.x + Phaser.Math.Between(-8, 8),
      y: smoke.y - Phaser.Math.Between(24, 38),
      scale: 1.8,
      alpha: 0,
      duration: 1200 + Math.random() * 400,
      ease: 'Sine.easeOut',
      onComplete: () => smoke.destroy(),
    });
  }
}
