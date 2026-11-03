import { describe, expect, it } from 'vitest';
import { PlayerState } from '../PlayerState';

describe('Sprint movement', () => {
  it('runs 60% faster with the same cap for diagonal movement', () => {
    const normal = new PlayerState(0, 0);
    const boosted = new PlayerState(0, 0);
    const diagonal = new PlayerState(0, 0);
    for (let i = 0; i < 120; i++) {
      normal.updatePhysics(1, 0, 1 / 60);
      boosted.updatePhysics(1, 0, 1 / 60, 1.6);
      diagonal.updatePhysics(Math.SQRT1_2, Math.SQRT1_2, 1 / 60, 1.6);
    }
    expect(boosted.x / normal.x).toBeCloseTo(1.6);
    expect(diagonal.speed).toBeCloseTo(boosted.speed);
    boosted.updatePhysics(1, 0, 1 / 60);
    expect(boosted.speed).toBeCloseTo(normal.config.maxSpeed);
  });

  it('slows down when movement is released, even while previously sprinting', () => {
    const state = new PlayerState(0, 0);
    state.vx = 280;
    for (let i = 0; i < 120; i++) state.updatePhysics(0, 0, 1 / 60);
    expect(state.speed).toBe(0);
  });
});
