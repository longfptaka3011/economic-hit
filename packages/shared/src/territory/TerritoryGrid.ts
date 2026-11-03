export interface TerritoryCell {
  col: number;
  row: number;
  ownerId: string | null;
}

export class TerritoryGrid {
  public readonly cols: number;
  public readonly rows: number;
  public readonly totalCells: number;
  private owners: (string | null)[][];
  private ownerCounts: Map<string, number> = new Map();
  private ownershipRevision=0;
  public get revision():number {return this.ownershipRevision;}

  constructor(cols: number = 80, rows: number = 80) {
    this.cols = cols;
    this.rows = rows;
    this.totalCells = cols * rows;
    this.owners = [];

    for (let r = 0; r < rows; r++) {
      this.owners[r] = new Array(cols).fill(null);
    }
  }

  public isWithinBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  public getOwner(col: number, row: number): string | null {
    if (!this.isWithinBounds(col, row)) return null;
    return this.owners[row][col];
  }

  public setOwner(col: number, row: number, newOwnerId: string | null): void {
    if (!this.isWithinBounds(col, row)) return;

    const prevOwner = this.owners[row][col];
    if (prevOwner === newOwnerId) return;
    this.ownershipRevision++;

    // Decrement previous owner count
    if (prevOwner !== null) {
      const prevCount = this.ownerCounts.get(prevOwner) || 0;
      if (prevCount > 1) {
        this.ownerCounts.set(prevOwner, prevCount - 1);
      } else {
        this.ownerCounts.delete(prevOwner);
      }
    }

    // Set new owner
    this.owners[row][col] = newOwnerId;

    // Increment new owner count
    if (newOwnerId !== null) {
      const nextCount = this.ownerCounts.get(newOwnerId) || 0;
      this.ownerCounts.set(newOwnerId, nextCount + 1);
    }
  }

  public getOwnerCellsCount(ownerId: string): number {
    return this.ownerCounts.get(ownerId) || 0;
  }

  public getTerritoryPercentage(ownerId: string): number {
    const count = this.getOwnerCellsCount(ownerId);
    return (count / this.totalCells) * 100;
  }

  public spawnTerritory(
    ownerId: string,
    centerCol: number,
    centerRow: number,
    radius: number = 2
  ): Array<{ col: number; row: number }> {
    const spawnedCells: Array<{ col: number; row: number }> = [];

    for (let r = centerRow - radius; r <= centerRow + radius; r++) {
      for (let c = centerCol - radius; c <= centerCol + radius; c++) {
        if (this.isWithinBounds(c, r)) {
          this.setOwner(c, r, ownerId);
          spawnedCells.push({ col: c, row: r });
        }
      }
    }

    return spawnedCells;
  }

  public clearOwner(ownerId: string): void {
    let changed=false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.owners[r][c] === ownerId) {
          this.owners[r][c] = null;
          changed=true;
        }
      }
    }
    this.ownerCounts.delete(ownerId);
    if(changed)this.ownershipRevision++;
  }

  public getAllOwnedCells(ownerId: string): Array<{ col: number; row: number }> {
    const cells: Array<{ col: number; row: number }> = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.owners[r][c] === ownerId) {
          cells.push({ col: c, row: r });
        }
      }
    }
    return cells;
  }
}

