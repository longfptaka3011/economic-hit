import Phaser from 'phaser';
import { PlayerState, PlayerConfig } from './PlayerState';
import { PlayerRenderer } from '../rendering/PlayerRenderer';
import { BoundarySystem } from '../systems/BoundarySystem';
import { MovementInput } from '../systems/InputSystem';
import { SprintAbility } from '@market-mayhem/shared';

export class Player {
  public readonly id: string = 'local_player';
  public readonly state: PlayerState;
  public readonly sprint = new SprintAbility();
  public shieldTimeRemaining: number = 0;
  private renderer: PlayerRenderer;
  private boundarySystem: BoundarySystem;

  constructor(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    boundarySystem: BoundarySystem,
    config?: Partial<PlayerConfig>
  ) {
    this.boundarySystem = boundarySystem;
    this.state = new PlayerState(startX, startY, config);
    this.renderer = new PlayerRenderer(scene, this.state.config.character, this.state.config.color);
    this.renderer.create({
      x: this.state.x,
      y: this.state.y,
      nickname: this.state.config.nickname,
      color: this.state.config.color,
    });
  }

  public respawn(startX: number, startY: number): void {
    this.state.x = startX;
    this.state.y = startY;
    this.state.vx = 0;
    this.state.vy = 0;
    this.sprint.reset();
    this.shieldTimeRemaining = 3.5; // 3.5 seconds invulnerability
  }

  public update(input: MovementInput, deltaSec: number): void {
    // Shield countdown
    if (this.shieldTimeRemaining > 0) {
      this.shieldTimeRemaining = Math.max(0, this.shieldTimeRemaining - deltaSec);
    }

    // 1. Update acceleration, deceleration, velocity and unconstrained position
    const multiplier = this.sprint.update(deltaSec, input.sprint, input.isMoving);
    this.state.updatePhysics(input.dx, input.dy, deltaSec, multiplier);

    // 2. Enforce world map boundaries
    const { x: clampedX, y: clampedY, hitBoundary } = this.boundarySystem.clampPosition(
      this.state.x,
      this.state.y
    );

    this.state.x = clampedX;
    this.state.y = clampedY;

    if (hitBoundary) {
      if (this.state.x === this.boundarySystem.minX && this.state.vx < 0) this.state.vx = 0;
      if (this.state.x === this.boundarySystem.maxX && this.state.vx > 0) this.state.vx = 0;
      if (this.state.y === this.boundarySystem.minY && this.state.vy < 0) this.state.vy = 0;
      if (this.state.y === this.boundarySystem.maxY && this.state.vy > 0) this.state.vy = 0;
    }

    // 3. Update visual animations and render container
    this.renderer.updateFromPlayerState(this.state, this.shieldTimeRemaining > 0);
    this.renderer.updateSprint(this.sprint);
  }

  public holdForLearning():void {
    this.state.vx=0;this.state.vy=0;this.state.isMoving=false;this.sprint.isSprinting=false;
    this.renderer.updateFromPlayerState(this.state,true);this.renderer.updateSprint(this.sprint);
  }

  public get x(): number {
    return this.state.x;
  }

  public get y(): number {
    return this.state.y;
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.renderer.getContainer();
  }

  public destroy(): void {
    this.renderer.destroy();
  }
}

