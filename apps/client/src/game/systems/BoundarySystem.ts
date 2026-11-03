import { MAP_CONFIG } from '../config/map.config';

export class BoundarySystem {
  public readonly minX: number;
  public readonly maxX: number;
  public readonly minY: number;
  public readonly maxY: number;

  constructor(
    worldWidth = MAP_CONFIG.worldWidth,
    worldHeight = MAP_CONFIG.worldHeight,
    padding = 14
  ) {
    this.minX = padding;
    this.maxX = worldWidth - padding;
    this.minY = padding;
    this.maxY = worldHeight - padding;
  }

  public clampPosition(x: number, y: number): { x: number; y: number; hitBoundary: boolean } {
    const clampedX = Math.max(this.minX, Math.min(this.maxX, x));
    const clampedY = Math.max(this.minY, Math.min(this.maxY, y));
    const hitBoundary = clampedX !== x || clampedY !== y;

    return {
      x: clampedX,
      y: clampedY,
      hitBoundary,
    };
  }
}

