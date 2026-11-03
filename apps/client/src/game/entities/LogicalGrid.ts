import { MAP_CONFIG } from '../config/map.config';
import { ZoneType } from '@market-mayhem/shared';

export interface LogicalCell {
  col: number;
  row: number;
  zone: ZoneType;
  walkable: boolean;
}

export class LogicalGrid {
  public readonly cols: number;
  public readonly rows: number;
  public readonly tileSize: number;
  private cells: LogicalCell[][];

  constructor(cols = MAP_CONFIG.gridCols, rows = MAP_CONFIG.gridRows, tileSize = MAP_CONFIG.tileSize) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.cells = [];
    this.initialize();
  }

  private initialize(): void {
    const halfCols = Math.floor(this.cols / 2);
    const halfRows = Math.floor(this.rows / 2);

    // Central Market bounds: circle or diamond around center
    const centerCol = halfCols;
    const centerRow = halfRows;
    const centralRadius = Math.floor(this.cols * 0.12); // ~30 cells radius (~480px)

    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        // Distance to center
        const dc = c - centerCol;
        const dr = r - centerRow;
        const distToCenter = Math.sqrt(dc * dc + dr * dr);

        let zone: ZoneType = 'NEUTRAL';

        if (distToCenter <= centralRadius) {
          // Central Market Plaza
          zone = 'CENTRAL';
        } else if (c < halfCols && r < halfRows) {
          zone = 'INDUSTRIAL'; // Top-left: Industrial District
        } else if (c >= halfCols && r < halfRows) {
          zone = 'COMMERCIAL'; // Top-right: Commercial District
        } else if (c < halfCols && r >= halfRows) {
          zone = 'FINANCIAL'; // Bottom-left: Financial District
        } else {
          zone = 'LAND'; // Bottom-right: Land District
        }

        this.cells[r][c] = {
          col: c,
          row: r,
          zone,
          walkable: true,
        };
      }
    }
  }

  public getCell(col: number, row: number): LogicalCell | null {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }
    return this.cells[row][col];
  }

  public isWithinBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  public worldToGrid(worldX: number, worldY: number): { col: number; row: number } {
    return {
      col: Math.floor(worldX / this.tileSize),
      row: Math.floor(worldY / this.tileSize),
    };
  }

  public gridToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }
}
