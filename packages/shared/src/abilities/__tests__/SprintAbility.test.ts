import { describe, expect, it } from 'vitest';
import { SprintAbility } from '../SprintAbility.js';

describe('Sprint ability', () => {
  it('each character has its own resource and stationary input costs nothing', () => {
    const player = new SprintAbility();
    const bot = new SprintAbility();
    player.update(1, true, false);
    expect(player.rage).toBe(100);
    expect(player.update(1, true, true)).toBe(1.6);
    expect(player.rage).toBe(75);
    expect(bot.rage).toBe(100);
  });

  it('depletes after four seconds, never negative, and requires release to rearm', () => {
    const sprint = new SprintAbility();
    sprint.update(4, true, true);
    expect(sprint.rage).toBe(0);
    expect(sprint.exhausted).toBe(true);
    expect(sprint.update(3, true, true)).toBe(1);
    expect(sprint.rage).toBe(0);
    sprint.update(0.5, false, true);
    expect(sprint.rage).toBe(10);
    expect(sprint.exhausted).toBe(true);
    sprint.update(0.5, false, true);
    expect(sprint.exhausted).toBe(false);
    expect(sprint.update(0.1, true, true)).toBe(1.6);
  });

  it('recovers only after the delay, caps at 100, and resets on respawn', () => {
    const sprint = new SprintAbility();
    sprint.update(1, true, true);
    sprint.update(0.5, false, true);
    expect(sprint.rage).toBe(75);
    sprint.update(1, false, true);
    expect(sprint.rage).toBe(85);
    sprint.update(10, false, false);
    expect(sprint.rage).toBe(100);
    sprint.update(4, true, true);
    sprint.reset();
    expect(sprint.rage).toBe(100);
    expect(sprint.isSprinting).toBe(false);
    expect(sprint.exhausted).toBe(false);
  });

  it('accounts for partially available rage instead of boosting an entire long tick', () => {
    const sprint = new SprintAbility();
    sprint.update(3.9, true, true);
    expect(sprint.update(0.2, true, true)).toBeCloseTo(1.3);
    expect(sprint.rage).toBe(0);
  });

  it('ignores invalid time and gives equivalent resource consumption across tick rates', () => {
    const slow = new SprintAbility();
    const fast = new SprintAbility();
    for (let i = 0; i < 30; i++) slow.update(1 / 30, true, true);
    for (let i = 0; i < 120; i++) fast.update(1 / 120, true, true);
    expect(slow.rage).toBeCloseTo(fast.rage);
    slow.update(Number.NaN, true, true);
    slow.update(-1, true, true);
    expect(slow.rage).toBeCloseTo(75);
  });

});
