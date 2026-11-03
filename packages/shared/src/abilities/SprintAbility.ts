export const SPRINT_CONFIG = {
  maxRage: 100,
  speedMultiplier: 1.6,
  drainPerSecond: 25,
  recoveryPerSecond: 20,
  recoveryDelaySeconds: 1,
  exhaustionRecovery: 20,
} as const;

/** Per-character resource. Independent of rendering, input devices and the clock. */
export class SprintAbility {
  public rage: number = SPRINT_CONFIG.maxRage;
  public isSprinting = false;
  public exhausted = false;
  private recoveryDelay = 0;

  /** Returns the movement multiplier for this tick, including partial depletion. */
  public update(deltaSec: number, requested: boolean, moving: boolean): number {
    if (!Number.isFinite(deltaSec) || deltaSec <= 0) return 1;
    this.isSprinting = false;

    if (requested && moving && !this.exhausted && this.rage > 0) {
      const duration = Math.min(deltaSec, this.rage / SPRINT_CONFIG.drainPerSecond);
      this.rage = Math.max(0, this.rage - SPRINT_CONFIG.drainPerSecond * duration);
      this.recoveryDelay = SPRINT_CONFIG.recoveryDelaySeconds;
      this.exhausted = this.rage <= 0;
      this.isSprinting = !this.exhausted;
      return 1 + (SPRINT_CONFIG.speedMultiplier - 1) * duration / deltaSec;
    }

    const recoveryTime = Math.max(0, deltaSec - this.recoveryDelay);
    this.recoveryDelay = Math.max(0, this.recoveryDelay - deltaSec);
    // Holding Space after exhaustion cannot automatically retrigger the skill.
    if (!requested || !moving) {
      this.rage = Math.min(SPRINT_CONFIG.maxRage, this.rage + recoveryTime * SPRINT_CONFIG.recoveryPerSecond);
    }
    if (!requested && this.rage >= SPRINT_CONFIG.exhaustionRecovery) this.exhausted = false;
    return 1;
  }

  public reset(): void {
    this.rage = SPRINT_CONFIG.maxRage;
    this.isSprinting = false;
    this.exhausted = false;
    this.recoveryDelay = 0;
  }
}
