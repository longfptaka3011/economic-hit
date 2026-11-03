import { TerritoryGrid } from './TerritoryGrid.js';

export interface GridCoord {
  col: number;
  row: number;
}

export interface CaptureResult {
  success: boolean;
  enclosedCells: GridCoord[];
  trailCells: GridCoord[];
  totalCapturedCount: number;
  stolenFromOthersCount: number;
}

export class TerritoryCaptureSystem {
  /**
   * Interpolate contiguous line of cells between two grid coordinates (Bresenham)
   */
  public static interpolateLine(p0: GridCoord, p1: GridCoord): GridCoord[] {
    const points: GridCoord[] = [];
    let x0 = p0.col;
    let y0 = p0.row;
    const x1 = p1.col;
    const y1 = p1.row;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push({ col: x0, row: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    return points;
  }

  /**
   * Fully connects trail points so there are no open holes or gaps between consecutive waypoints
   */
  public static rasterizeTrail(trail: GridCoord[]): GridCoord[] {
    if (trail.length === 0) return [];
    const result: GridCoord[] = [];

    for (let i = 0; i < trail.length; i++) {
      if (i === 0) {
        result.push(trail[0]);
      } else {
        const line = this.interpolateLine(trail[i - 1], trail[i]);
        // Skip first point of line since it duplicates the previous point
        for (let j = 1; j < line.length; j++) {
          result.push(line[j]);
        }
      }
    }
    return result;
  }

  public static capture(
    grid: TerritoryGrid,
    playerId: string,
    rawTrail: GridCoord[]
  ): CaptureResult {
    if (!rawTrail || rawTrail.length < 2) {
      return {
        success: false,
        enclosedCells: [],
        trailCells: [],
        totalCapturedCount: 0,
        stolenFromOthersCount: 0,
      };
    }

    const trail = this.rasterizeTrail(rawTrail);
    const cols = grid.cols;
    const rows = grid.rows;
    const totalCells = cols * rows;

    // 1. Build Boundary Mask (Flat Uint8Array for high performance on 256x256 grids)
    // 1 = boundary, 0 = non-boundary
    const isBoundary = new Uint8Array(totalCells);

    for (let r = 0; r < rows; r++) {
      const rowOffset = r * cols;
      for (let c = 0; c < cols; c++) {
        if (grid.getOwner(c, r) === playerId) {
          isBoundary[rowOffset + c] = 1;
        }
      }
    }

    // Set trail cells as boundary
    const trailSet = new Set<number>();
    const uniqueTrailCells: GridCoord[] = [];
    for (const pt of trail) {
      if (grid.isWithinBounds(pt.col, pt.row)) {
        const idx = pt.row * cols + pt.col;
        if (!trailSet.has(idx)) {
          trailSet.add(idx);
          uniqueTrailCells.push({ col: pt.col, row: pt.row });
          isBoundary[idx] = 1;
        }
      }
    }

    // 2. Flood Fill to find all 4-connected components of non-boundary cells
    const visited = new Uint8Array(totalCells);
    const components: GridCoord[][] = [];

    const dirs = [
      { dc: 1, dr: 0 },
      { dc: -1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: 0, dr: -1 },
    ];

    for (let r = 0; r < rows; r++) {
      const rowOffset = r * cols;
      for (let c = 0; c < cols; c++) {
        const rootIdx = rowOffset + c;
        if (isBoundary[rootIdx] === 0 && visited[rootIdx] === 0) {
          // Start BFS for this connected component
          const currentComponent: GridCoord[] = [];
          const queue: number[] = [rootIdx];
          visited[rootIdx] = 1;

          let head = 0;
          while (head < queue.length) {
            const currIdx = queue[head++];
            const currCol = currIdx % cols;
            const currRow = Math.floor(currIdx / cols);
            currentComponent.push({ col: currCol, row: currRow });

            for (let d = 0; d < 4; d++) {
              const nc = currCol + dirs[d].dc;
              const nr = currRow + dirs[d].dr;

              if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
                const nIdx = nr * cols + nc;
                if (isBoundary[nIdx] === 0 && visited[nIdx] === 0) {
                  visited[nIdx] = 1;
                  queue.push(nIdx);
                }
              }
            }
          }

          components.push(currentComponent);
        }
      }
    }

    // 3. Identify enclosed components vs exterior component
    let enclosedCells: GridCoord[] = [];

    if (components.length >= 2) {
      // The largest component is the outside world!
      let largestIndex = 0;
      let maxCount = components[0].length;

      for (let i = 1; i < components.length; i++) {
        if (components[i].length > maxCount) {
          maxCount = components[i].length;
          largestIndex = i;
        }
      }

      // All components other than the largest one are enclosed pockets
      for (let i = 0; i < components.length; i++) {
        if (i !== largestIndex) {
          enclosedCells.push(...components[i]);
        }
      }
    }

    // 4. Update ownership in grid
    let stolenFromOthersCount = 0;
    const cellsToCapture = [...uniqueTrailCells, ...enclosedCells];

    for (const cell of cellsToCapture) {
      const currentOwner = grid.getOwner(cell.col, cell.row);
      if (currentOwner !== null && currentOwner !== playerId) {
        stolenFromOthersCount++;
      }
      grid.setOwner(cell.col, cell.row, playerId);
    }

    return {
      success: true,
      enclosedCells,
      trailCells: uniqueTrailCells,
      totalCapturedCount: cellsToCapture.length,
      stolenFromOthersCount,
    };
  }
}
