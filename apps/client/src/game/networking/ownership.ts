import type {OnlineSnapshot} from '@market-mayhem/shared';

/** Apply every socket event before React batching can coalesce renders. Reuse the
 * complete local map until ownership changes; it is never sent back to server. */
export class SnapshotOwnership {
  private cells=new Map<number,NonNullable<OnlineSnapshot['territory']>[number]>();
  private territory:NonNullable<OnlineSnapshot['territory']>=[];
  private latest:OnlineSnapshot|null=null;
  public accept(next:OnlineSnapshot):OnlineSnapshot {
    if(this.latest?.matchId!==next.matchId){this.cells.clear();this.territory=[];this.latest=null;}
    if(this.latest && next.tick<this.latest.tick)return this.latest;
    if(next.territory){this.cells=new Map(next.territory.map(cell=>[cell.row*256+cell.col,cell]));this.territory=next.territory;}
    else if(next.territoryDelta){
      for(const cell of next.territoryDelta){const key=cell.row*256+cell.col;if(cell.owner===null)this.cells.delete(key);else this.cells.set(key,{...cell,owner:cell.owner});}
      this.territory=[...this.cells.values()];
    }
    this.latest={...next,territory:this.territory,territoryDelta:undefined};return this.latest;
  }
}

/** Keep a complete initial map while Phaser loads and live deltas keep arriving. */
export function mergeLoadingOwnership(previous:OnlineSnapshot,next:OnlineSnapshot):OnlineSnapshot {
  const cells=new Map((next.territory??previous.territory??[]).map(cell=>[cell.row*256+cell.col,cell]));
  for(const cell of next.territoryDelta??[]){const key=cell.row*256+cell.col;if(cell.owner===null)cells.delete(key);else cells.set(key,{...cell,owner:cell.owner});}
  return {...next,territory:[...cells.values()],territoryDelta:undefined};
}
