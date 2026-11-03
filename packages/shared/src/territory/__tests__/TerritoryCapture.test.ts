import { describe, it, expect, beforeEach } from 'vitest';
import { TerritoryGrid } from '../TerritoryGrid.js';
import { TerritoryCaptureSystem } from '../TerritoryCaptureSystem.js';
import { TrailManager } from '../TrailManager.js';

describe('Territory Capture System', () => {
  let grid: TerritoryGrid;
  const PLAYER_ID = 'player_1';
  const OPPONENT_ID = 'player_2';

  beforeEach(() => {
    // 30x30 grid for fast deterministic unit tests
    grid = new TerritoryGrid(30, 30);
  });

  it('1. Simple rectangular capture', () => {
    // Spawn player at (10, 10) with radius 1 (3x3 base: cols 9-11, rows 9-11)
    grid.spawnTerritory(PLAYER_ID, 10, 10, 1);
    const initialCount = grid.getOwnerCellsCount(PLAYER_ID);
    expect(initialCount).toBe(9);

    // Trail starts from (12, 10), moves right to (15, 10), down to (15, 13),
    // left to (10, 13), up to (10, 12) (which reconnects to base at row 11)
    const trail = [
      { col: 12, row: 10 },
      { col: 13, row: 10 },
      { col: 14, row: 10 },
      { col: 15, row: 10 },
      { col: 15, row: 11 },
      { col: 15, row: 12 },
      { col: 15, row: 13 },
      { col: 14, row: 13 },
      { col: 13, row: 13 },
      { col: 12, row: 13 },
      { col: 11, row: 13 },
      { col: 10, row: 13 },
      { col: 10, row: 12 }, // connects back to territory at (10, 11)
    ];

    const result = TerritoryCaptureSystem.capture(grid, PLAYER_ID, trail);

    expect(result.success).toBe(true);
    expect(result.trailCells.length).toBe(trail.length);
    expect(result.enclosedCells.length).toBeGreaterThan(0);

    // Check that enclosed interior cells like (12, 11), (13, 11), (14, 11), (12, 12), (13, 12), (14, 12) are owned
    expect(grid.getOwner(12, 11)).toBe(PLAYER_ID);
    expect(grid.getOwner(13, 12)).toBe(PLAYER_ID);
    expect(grid.getOwner(14, 11)).toBe(PLAYER_ID);

    // Unenclosed cells outside must remain null
    expect(grid.getOwner(20, 20)).toBeNull();
    expect(grid.getOwner(0, 0)).toBeNull();
  });

  it('2. Irregular closed capture', () => {
    grid.spawnTerritory(PLAYER_ID, 5, 5, 1); // 3x3 base: cols 4-6, rows 4-6

    // Zig-zag stepped closed loop
    const trail = [
      { col: 7, row: 5 },
      { col: 8, row: 5 },
      { col: 8, row: 6 },
      { col: 9, row: 6 },
      { col: 9, row: 7 },
      { col: 9, row: 8 },
      { col: 8, row: 8 },
      { col: 7, row: 8 },
      { col: 6, row: 8 },
      { col: 5, row: 8 },
      { col: 5, row: 7 }, // reconnects to base at row 6
    ];

    const result = TerritoryCaptureSystem.capture(grid, PLAYER_ID, trail);

    expect(result.success).toBe(true);
    expect(grid.getOwner(7, 6)).toBe(PLAYER_ID);
    expect(grid.getOwner(7, 7)).toBe(PLAYER_ID);
    expect(grid.getOwner(8, 7)).toBe(PLAYER_ID);
  });

  it('3. Concave capture', () => {
    // Base at (10, 10)
    grid.spawnTerritory(PLAYER_ID, 10, 10, 1);

    // C-shaped concave loop
    const trail = [
      { col: 12, row: 9 },
      { col: 15, row: 9 },
      { col: 15, row: 13 },
      { col: 13, row: 13 },
      { col: 13, row: 11 },
      { col: 12, row: 11 }, // re-enters base
    ];

    const result = TerritoryCaptureSystem.capture(grid, PLAYER_ID, trail);

    expect(result.success).toBe(true);
    // Interior of concave pocket must be captured
    expect(grid.getOwner(14, 10)).toBe(PLAYER_ID);
    expect(grid.getOwner(14, 11)).toBe(PLAYER_ID);
  });

  it('4. Boundary cases (touching map edge without capturing whole map)', () => {
    // Spawn player in the corner at (1, 1), base covers (0,0) to (2,2)
    grid.spawnTerritory(PLAYER_ID, 1, 1, 1);

    // Trail extends along top border x=0, down to y=5, touches wall at col 0
    const trail = [
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
      { col: 5, row: 1 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 4, row: 3 },
      { col: 3, row: 3 },
      { col: 2, row: 3 }, // connects back to base at (2, 2)
    ];

    const result = TerritoryCaptureSystem.capture(grid, PLAYER_ID, trail);

    expect(result.success).toBe(true);

    // Corner pocket cells like (3, 1), (4, 1), (3, 2), (4, 2) must be captured
    expect(grid.getOwner(3, 1)).toBe(PLAYER_ID);
    expect(grid.getOwner(4, 2)).toBe(PLAYER_ID);

    // CRITICAL: The entire remaining map MUST NOT be captured!
    expect(grid.getOwner(20, 20)).toBeNull();
    expect(grid.getOwner(15, 15)).toBeNull();
    expect(grid.getOwner(29, 29)).toBeNull();
    expect(grid.getTerritoryPercentage(PLAYER_ID)).toBeLessThan(10);
  });

  it('5. Overlapping / opponent territory capture', () => {
    // Player 1 base
    grid.spawnTerritory(PLAYER_ID, 5, 5, 1);

    // Opponent has a base at (8, 5)
    grid.spawnTerritory(OPPONENT_ID, 8, 5, 1);
    expect(grid.getOwner(8, 5)).toBe(OPPONENT_ID);

    // Player 1 draws a loop that surrounds Opponent's territory
    const trail = [
      { col: 6, row: 3 },
      { col: 10, row: 3 },
      { col: 10, row: 7 },
      { col: 6, row: 7 },
    ];

    const result = TerritoryCaptureSystem.capture(grid, PLAYER_ID, trail);

    expect(result.success).toBe(true);
    expect(result.stolenFromOthersCount).toBeGreaterThan(0);
    // Opponent's cell at (8, 5) should now be stolen by Player 1
    expect(grid.getOwner(8, 5)).toBe(PLAYER_ID);
  });

  it('6. Self-intersecting paths (Figure-8)', () => {
    grid.spawnTerritory(PLAYER_ID, 10, 10, 1);

    // Figure-8 loop crossing at (13, 10)
    const trail = [
      // First lobe
      { col: 12, row: 10 },
      { col: 13, row: 10 }, // Intersection point
      { col: 14, row: 9 },
      { col: 15, row: 10 },
      { col: 14, row: 11 },
      { col: 13, row: 10 }, // Crosses itself!
      // Second lobe
      { col: 12, row: 12 },
      { col: 11, row: 12 }, // connects back to base
    ];

    const result = TerritoryCaptureSystem.capture(grid, PLAYER_ID, trail);

    expect(result.success).toBe(true);
    // First lobe center (14, 10) should be captured
    expect(grid.getOwner(14, 10)).toBe(PLAYER_ID);
    // Trail cells must be owned
    expect(grid.getOwner(13, 10)).toBe(PLAYER_ID);
  });

  it('7. Trail collision detection', () => {
    const trailManager = new TrailManager();

    // Player 1 draws a trail
    trailManager.addPoint(PLAYER_ID, 12, 10);
    trailManager.addPoint(PLAYER_ID, 13, 10);
    trailManager.addPoint(PLAYER_ID, 14, 10);

    // Player 2 steps onto (13, 10)
    const collision = trailManager.checkCollision(OPPONENT_ID, 13, 10);

    expect(collision).not.toBeNull();
    expect(collision?.hitPlayerId).toBe(PLAYER_ID);
    expect(collision?.intersectorId).toBe(OPPONENT_ID);
    expect(collision?.cutPosition).toEqual({ col: 13, row: 10 });
    expect(collision?.cutIndex).toBe(1);

    // Moving on an empty cell has no collision
    const noCollision = trailManager.checkCollision(OPPONENT_ID, 20, 20);
    expect(noCollision).toBeNull();
  });

  it('8. Respawn behavior & territory percentage calculation', () => {
    const trailManager = new TrailManager();

    // Spawn Player 1
    grid.spawnTerritory(PLAYER_ID, 5, 5, 2); // 5x5 = 25 cells
    trailManager.addPoint(PLAYER_ID, 8, 5);

    expect(grid.getOwnerCellsCount(PLAYER_ID)).toBe(25);
    const initialPercent = grid.getTerritoryPercentage(PLAYER_ID);
    expect(initialPercent).toBeCloseTo((25 / 900) * 100, 2);

    // Player 1 gets eliminated: clear trail and old territory
    trailManager.clearTrail(PLAYER_ID);
    grid.clearOwner(PLAYER_ID);

    expect(trailManager.hasTrail(PLAYER_ID)).toBe(false);
    expect(grid.getOwnerCellsCount(PLAYER_ID)).toBe(0);

    // Respawn Player 1 at a new safe location (20, 20) with 3x3 territory
    grid.spawnTerritory(PLAYER_ID, 20, 20, 1);

    expect(grid.getOwnerCellsCount(PLAYER_ID)).toBe(9);
    expect(grid.getOwner(20, 20)).toBe(PLAYER_ID);
    expect(grid.getOwner(5, 5)).toBeNull(); // Old territory remains cleared
  });
});

