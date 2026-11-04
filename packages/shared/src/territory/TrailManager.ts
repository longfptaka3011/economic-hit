import { GridCoord } from './TerritoryCaptureSystem.js';

export interface TrailCollisionResult {
  hitPlayerId: string;
  intersectorId: string;
  cutPosition: GridCoord;
  cutIndex: number;
}

export class TrailManager {
  private trails: Map<string, GridCoord[]> = new Map();
  private indexes=new Map<string,Map<string,number>>();
  private versions=new Map<string,number>();
  private nextVersion=0;
  private compactCache=new Map<string,GridCoord[]>();

  public versionFor(playerId:string):number {return this.versions.get(playerId)??0;}
  /** Keep endpoints/turns; preserve the exact cell path when expanded. */
  public getCompactTrail(playerId:string):GridCoord[] {
    const cached=this.compactCache.get(playerId);if(cached)return cached;
    const trail=this.getTrail(playerId),result:GridCoord[]=[];
    for(let i=0;i<trail.length;i++){
      const a=trail[i-1],b=trail[i],c=trail[i+1];
      if(!a || !c || b.col-a.col!==c.col-b.col || b.row-a.row!==c.row-b.row)result.push(b);
    }
    this.compactCache.set(playerId,result);return result;
  }

  public getTrail(playerId: string): GridCoord[] {
    return this.trails.get(playerId) || [];
  }

  public addPoint(playerId: string, col: number, row: number): boolean {
    let trail = this.trails.get(playerId);
    if (!trail) {
      trail = [];
      this.trails.set(playerId, trail);
      this.indexes.set(playerId,new Map());
    }

    // Avoid duplicate consecutive points
    if (trail.length > 0) {
      const last = trail[trail.length - 1];
      if (last.col === col && last.row === row) {
        return false;
      }
    }

    const index=this.indexes.get(playerId)!,key=`${col},${row}`;
    if(!index.has(key))index.set(key,trail.length);
    trail.push({ col, row });
    this.versions.set(playerId,++this.nextVersion);this.compactCache.delete(playerId);
    return true;
  }

  public clearTrail(playerId: string): void {
    if(this.trails.has(playerId))this.versions.set(playerId,++this.nextVersion);
    this.trails.delete(playerId);
    this.indexes.delete(playerId);this.compactCache.delete(playerId);
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
      const i=this.indexes.get(victimId)?.get(`${col},${row}`);
      if(i!==undefined){
          return {
            hitPlayerId: victimId,
            intersectorId,
            cutPosition: { col, row },
            cutIndex: i,
          };
      }
    }

    return null;
  }
}

export function expandCompactTrail(points:readonly GridCoord[]):GridCoord[] {
  const result:GridCoord[]=[];
  for(const point of points){
    const previous=result[result.length-1];
    if(previous){
      const dc=point.col-previous.col,dr=point.row-previous.row,steps=Math.max(Math.abs(dc),Math.abs(dr));
      for(let i=1;i<steps;i++)result.push({col:Math.round(previous.col+dc*i/steps),row:Math.round(previous.row+dr*i/steps)});
    }
    result.push(point);
  }
  return result;
}

