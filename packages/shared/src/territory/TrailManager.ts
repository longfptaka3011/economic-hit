import { GridCoord } from './TerritoryCaptureSystem.js';

export interface TrailCollisionResult {
  hitPlayerId: string;
  intersectorId: string;
  cutPosition: GridCoord;
  cutIndex: number;
}

export class TrailManager {
  private trails: Map<string, GridCoord[]> = new Map();

  public getTrail(playerId: string): GridCoord[] {
    return this.trails.get(playerId) || [];
  }

  public addPoint(playerId: string, col: number, row: number): boolean {
    let trail = this.trails.get(playerId);
    if (!trail) {
      trail = [];
      this.trails.set(playerId, trail);
    }

    // Avoid duplicate consecutive points
    if (trail.length > 0) {
      const last = trail[trail.length - 1];
      if (last.col === col && last.row === row) {
        return false;
      }
    }

    trail.push({ col, row });
    return true;
  }

  public clearTrail(playerId: string): void {
    this.trails.delete(playerId);
  }

  public hasTrail(playerId: string): boolean {
    const trail = this.trails.get(playerId);
    return !!trail && trail.length > 0;
  }

  public checkCollision(
    intersectorId: string,
    col: number,
    row: number
  ): TrailCollisionResult | null {
    for (const [victimId, trail] of this.trails.entries()) {
      if (victimId === intersectorId) {
        // Can't cut your own trail to eliminate yourself in standard rules
        continue;
      }

      // Check if (col, row) matches any cell in victim's trail
      for (let i = 0; i < trail.length; i++) {
        const pt = trail[i];
        if (pt.col === col && pt.row === row) {
          return {
            hitPlayerId: victimId,
            intersectorId,
            cutPosition: { col, row },
            cutIndex: i,
          };
        }
      }
    }

    return null;
  }
}

