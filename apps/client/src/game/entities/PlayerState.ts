export interface PlayerConfig {
  nickname: string;
  color: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  radius: number;
  character: number;
}

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  nickname: 'Nhà Tư Bản Trẻ',
  color: 0x06b6d4, // Neon cyan
  maxSpeed: 175, // Pixels per second
  acceleration: 850, // Acceleration rate
  deceleration: 950, // Deceleration/friction damping rate
  radius: 12, // Visual radius
  character: 0,
};

export class PlayerState {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public facingAngle: number = 0;
  public isMoving: boolean = false;
  public walkTimer: number = 0;
  public idleTimer: number = 0;
  public readonly config: PlayerConfig;

  constructor(startX: number, startY: number, config: Partial<PlayerConfig> = {}) {
    this.x = startX;
    this.y = startY;
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config };
  }

  public get speed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  public updatePhysics(
    targetDx: number,
    targetDy: number,
    deltaSec: number,
    speedMultiplier: number = 1
  ): void {
    const hasInput = targetDx !== 0 || targetDy !== 0;
    const maxSpeed = this.config.maxSpeed * speedMultiplier;

    if (hasInput) {
      // Desired velocity vector
      const targetVx = targetDx * maxSpeed;
      const targetVy = targetDy * maxSpeed;

      // Smooth acceleration towards target velocity
      const accelStep = this.config.acceleration * deltaSec;
      const response = Math.min(1, accelStep / this.config.maxSpeed);
      this.vx += (targetVx - this.vx) * response;
      this.vy += (targetVy - this.vy) * response;

      // Calculate facing direction
      this.facingAngle = Math.atan2(this.vy, this.vx);
      this.isMoving = true;
      this.walkTimer += deltaSec * 8; // Step frequency
    } else {
      // Smooth deceleration / friction towards zero
      const decelFactor = Math.max(0, 1 - (this.config.deceleration * deltaSec) / this.config.maxSpeed);
      this.vx *= decelFactor;
      this.vy *= decelFactor;

      // Snap to zero when very small to prevent jitter
      if (Math.abs(this.vx) < 1) this.vx = 0;
      if (Math.abs(this.vy) < 1) this.vy = 0;

      this.isMoving = this.vx !== 0 || this.vy !== 0;
      this.idleTimer += deltaSec * 3; // Breathing frequency
    }

    // Releasing the skill or exhausting rage immediately restores the speed cap.
    const speed = this.speed;
    if (speed > maxSpeed) {
      this.vx *= maxSpeed / speed;
      this.vy *= maxSpeed / speed;
    }

    // Integrate position
    this.x += this.vx * deltaSec;
    this.y += this.vy * deltaSec;
  }
}

