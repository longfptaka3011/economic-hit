import Phaser from 'phaser';
import { PlayerState } from '../entities/PlayerState';
import { SprintAbility, SPRINT_CONFIG } from '@market-mayhem/shared';
import { createAvatarSheet } from './avatarTexture';

export type CharacterDirection = 'down' | 'up' | 'left' | 'right';

export class PlayerRenderer {
  private scene: Phaser.Scene;
  private characterIndex: number;
  private animKeyPrefix: string;
  private textureKey: string;
  private clothingColor?: number;

  // Visual Display Objects
  private container!: Phaser.GameObjects.Container;
  private shadow!: Phaser.GameObjects.Ellipse;
  private sprite!: Phaser.GameObjects.Sprite;
  private shieldAura!: Phaser.GameObjects.Graphics;
  private nicknameText!: Phaser.GameObjects.Text;
  private rageBar!: Phaser.GameObjects.Graphics;

  // Animation and Facing State
  private currentDirection: CharacterDirection = 'down';
  private isCurrentlyWalking: boolean = false;

  constructor(scene: Phaser.Scene, characterIndex: number = 0, clothingColor?: number) {
    this.scene = scene;
    this.characterIndex = characterIndex;
    this.clothingColor=clothingColor;
    this.textureKey=clothingColor===undefined?'urban_tiles':`avatar_${characterIndex}_${clothingColor}`;
    this.animKeyPrefix = clothingColor===undefined?`char_${characterIndex}`:this.textureKey;
  }

  /**
   * Register directional walk animations for this character index
   */
  public static registerAnimations(scene: Phaser.Scene, characterIndex: number, clothingColor?:number): void {
    const custom=clothingColor!==undefined;
    const texture=custom?`avatar_${characterIndex}_${clothingColor}`:'urban_tiles';
    const prefix = custom?texture:`char_${characterIndex}`;
    if(custom && !scene.textures.exists(texture)) {
      const source=scene.textures.get('urban_tiles').getSourceImage() as HTMLImageElement;
      const sheet=scene.textures.addCanvas(texture,createAvatarSheet(source,characterIndex,clothingColor))!;
      for(let pose=0;pose<3;pose++)for(let direction=0;direction<4;direction++)sheet.add(pose*4+direction,0,direction*16,pose*16,16,16);
      sheet.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    // Each character occupies 3 rows in urban_tiles (81 tiles per character offset)
    const baseOffset = characterIndex * 81;

    // Direction tile frame offsets:
    // Down: 23, walk: [23, 50, 77]
    // Up: 24, walk: [24, 51, 78]
    // Left: 25, walk: [25, 52, 79]
    // Right: 26, walk: [26, 53, 80]
    const dirs = [
      { dir: 'down', col: 23 },
      { dir: 'up', col: 24 },
      { dir: 'left', col: 25 },
      { dir: 'right', col: 26 },
    ];

    for (const [index, { dir, col }] of dirs.entries()) {
      const animKey = `${prefix}_walk_${dir}`;
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: custom ? [index,index+4,index,index+8].map(frame=>({key:texture,frame})) : [
            { key: 'urban_tiles', frame: baseOffset + col },
            { key: 'urban_tiles', frame: baseOffset + col + 27 },
            { key: 'urban_tiles', frame: baseOffset + col },
            { key: 'urban_tiles', frame: baseOffset + col + 54 },
          ],
          frameRate: 7,
          repeat: -1,
        });
      }
    }
  }

  public create(state: { x: number; y: number; nickname: string; color: number }): void {
    const baseOffset = this.characterIndex * 81;
    PlayerRenderer.registerAnimations(this.scene,this.characterIndex,this.clothingColor);
    const defaultFrame = this.clothingColor===undefined?baseOffset+23:0;

    // 1. Soft Pixel Drop Shadow (Depth under character)
    this.shadow = this.scene.add.ellipse(0, 9, 16, 7, 0x020617, 0.45);

    // 2. Pixel Shield Aura (Draws crisp retro pixel shield barrier when active)
    this.shieldAura = this.scene.add.graphics();
    this.drawShieldAura(state.color);
    this.shieldAura.setVisible(false);
    this.rageBar = this.scene.add.graphics();

    // Match the environment's integer 2x source pixel scale.
    this.sprite = this.scene.add.sprite(0, 0, this.textureKey, defaultFrame);
    this.sprite.setScale(2);
    this.sprite.setOrigin(0.5, 0.5);

    // 4. Retro Pixel Nickname Text Badge
    const textColor = '#' + state.color.toString(16).padStart(6, '0');
    this.nicknameText = this.scene.add.text(0, -18, state.nickname, {
      fontFamily: '"Press Start 2P", Silkscreen, monospace, sans-serif',
      fontSize: '8px',
      color: textColor,
      fontStyle: 'bold',
      stroke: '#020617',
      strokeThickness: 2.5,
    }).setOrigin(0.5);

    // 5. Container Assembly
    this.container = this.scene.add.container(state.x, state.y, [
      this.shadow,
      this.shieldAura,
      this.sprite,
      this.nicknameText,
      this.rageBar,
    ]);
    this.container.setDepth(15);
    this.updateSprint(new SprintAbility());
  }

  public updateSprint(sprint: SprintAbility): void {
    const color = sprint.exhausted ? 0xf97316 : sprint.isSprinting ? 0xfacc15 : 0x67d4db;
    this.rageBar.clear().fillStyle(0x101c29, 0.95).fillRect(-19, 20, 38, 6);
    const width = Math.round(36 * sprint.rage / SPRINT_CONFIG.maxRage);
    this.rageBar.fillStyle(color).fillRect(-18, 21, width, 4);
    this.sprite.anims.timeScale = sprint.isSprinting ? SPRINT_CONFIG.speedMultiplier : 1;
    if (sprint.isSprinting && this.clothingColor===undefined) this.sprite.setTint(0xffebae);
    else this.sprite.clearTint();
  }

  private drawShieldAura(color: number): void {
    this.shieldAura.clear();
    // Glowing pixel hexagon / diamond aura
    this.shieldAura.lineStyle(2, color, 0.85);
    this.shieldAura.strokeCircle(0, 0, 16);
    this.shieldAura.lineStyle(1, 0xffffff, 0.7);
    this.shieldAura.strokeCircle(0, 0, 14);
  }

  public update(
    x: number,
    y: number,
    vx: number,
    vy: number,
    hasShield: boolean = false,
    _deltaSec: number = 0.016
  ): void {
    if (!this.container) return;

    this.container.setPosition(x, y);

    // Shield Aura Pulse
    if (hasShield) {
      this.shieldAura.setVisible(true);
      const pulse = 0.6 + Math.sin(this.scene.time.now * 0.012) * 0.35;
      this.shieldAura.setAlpha(pulse);
      this.shieldAura.setRotation(this.scene.time.now * 0.002);
    } else {
      this.shieldAura.setVisible(false);
    }

    const speedSq = vx * vx + vy * vy;
    const isMoving = speedSq > 150; // Threshold to prevent microscopic drift

    if (isMoving) {
      // Determine dominant direction
      let newDir: CharacterDirection = this.currentDirection;
      if (Math.abs(vx) > Math.abs(vy)) {
        newDir = vx > 0 ? 'right' : 'left';
      } else {
        newDir = vy > 0 ? 'down' : 'up';
      }

      this.currentDirection = newDir;
      const animKey = `${this.animKeyPrefix}_walk_${newDir}`;

      if (!this.isCurrentlyWalking || this.sprite.anims.currentAnim?.key !== animKey) {
        if (this.scene.anims.exists(animKey)) {
          this.sprite.play(animKey, true);
        }
        this.isCurrentlyWalking = true;
      }

      // Subtle pixel bobbing
      const bob = Math.round(Math.sin(this.scene.time.now * 0.015));
      this.sprite.setY(bob);
    } else {
      // Idle: stop animation and display resting directional frame
      if (this.isCurrentlyWalking) {
        this.sprite.stop();
        this.isCurrentlyWalking = false;
        this.sprite.setY(0);

        const baseOffset = this.characterIndex * 81;
        const idleColMap: Record<CharacterDirection, number> = {
          down: 23,
          up: 24,
          left: 25,
          right: 26,
        };
        this.sprite.setFrame(this.clothingColor===undefined?baseOffset+idleColMap[this.currentDirection]:idleColMap[this.currentDirection]-23);
      }
    }
  }

  public updateFromPlayerState(state: PlayerState, hasShield: boolean = false): void {
    this.update(state.x, state.y, state.vx, state.vy, hasShield);
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy(true);
    }
  }
}
