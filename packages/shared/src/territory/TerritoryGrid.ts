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
  private ownerCells=new Map<string,Set<number>>();
  private latestChanges=new Map<number,{owner:string|null;revision:number}>();
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
    this.latestChanges.set(row*this.cols+col,{owner:newOwnerId,revision:this.ownershipRevision});

    // Decrement previous owner count
    if (prevOwner !== null) {
      this.ownerCells.get(prevOwner)?.delete(row*this.cols+col);
      const prevCount = this.ownerCounts.get(prevOwner) || 0;
      if (prevCount > 1) {
        this.ownerCounts.set(prevOwner, prevCount - 1);
      } else {
        this.ownerCounts.delete(prevOwner);
        this.ownerCells.delete(prevOwner);
      }
    }

    // Set new owner
    this.owners[row][col] = newOwnerId;

    // Increment new owner count
    if (newOwnerId !== null) {
      let cells=this.ownerCells.get(newOwnerId);if(!cells){cells=new Set();this.ownerCells.set(newOwnerId,cells);}cells.add(row*this.cols+col);
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
    const cells=this.ownerCells.get(ownerId),changed=!!cells?.size;
    for(const key of cells??[]){this.owners[Math.floor(key/this.cols)][key%this.cols]=null;this.latestChanges.set(key,{owner:null,revision:this.ownershipRevision+1});}
    this.ownerCells.delete(ownerId);
    this.ownerCounts.delete(ownerId);
    if(changed)this.ownershipRevision++;
  }

  public getAllOwnedCells(ownerId: string): Array<{ col: number; row: number }> {
    return [...(this.ownerCells.get(ownerId)??[])].map(key=>({col:key%this.cols,row:Math.floor(key/this.cols)}));
  }

  /** Bounded journal: one latest entry per cell, including ownership removals. */
  public changesSince(revision:number):Array<{col:number;row:number;owner:string|null}> {
    const changes=[];
    for(const [key,change] of this.latestChanges)if(change.revision>revision)changes.push({col:key%this.cols,row:Math.floor(key/this.cols),owner:change.owner});
    return changes;
  }
}

