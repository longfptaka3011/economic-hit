import {describe,it,expect} from 'vitest';
import {TerritoryGrid} from '../TerritoryGrid.js';
import {TrailManager,expandCompactTrail} from '../TrailManager.js';

describe('Indexed territory ownership',()=>{
  it('journals only cells changed since a baseline, including transfers and clears',()=>{
    const grid=new TerritoryGrid(20,20);grid.spawnTerritory('a',5,5,1);const baseline=grid.revision;
    grid.setOwner(5,5,'b');grid.setOwner(8,8,'b');grid.setOwner(8,8,'a');grid.clearOwner('b');
    expect(grid.changesSince(baseline)).toEqual([{col:5,row:5,owner:null},{col:8,row:8,owner:'a'}]);
    expect(grid.changesSince(grid.revision)).toEqual([]);
  });
  it('stays consistent through steals, repeated ownership, clearing and respawn',()=>{
    const grid=new TerritoryGrid(20,20);
    grid.spawnTerritory('a',5,5,2);grid.spawnTerritory('b',7,5,2);
    grid.setOwner(5,5,'b');grid.setOwner(5,5,'b');grid.setOwner(7,5,null);
    grid.clearOwner('a');grid.spawnTerritory('a',14,14,2);
    let seed=3;
    for(let i=0;i<300;i++){seed=(seed*1664525+1013904223)>>>0;grid.setOwner(seed%20,(seed>>>8)%20,[null,'a','b'][seed%3]);}
    for(const id of ['a','b']){
      const scan=[];for(let row=0;row<20;row++)for(let col=0;col<20;col++)if(grid.getOwner(col,row)===id)scan.push(row*20+col);
      expect(grid.getAllOwnedCells(id).map(p=>p.row*20+p.col).sort((a,b)=>a-b)).toEqual(scan);
      expect(grid.getOwnerCellsCount(id)).toBe(scan.length);
    }
    const before=grid.revision;grid.clearOwner('unknown');expect(grid.revision).toBe(before);
    grid.clearOwner('b');expect(grid.getAllOwnedCells('b')).toEqual([]);expect(grid.getOwnerCellsCount('b')).toBe(0);
    expect(grid.getAllOwnedCells('a').every(p=>grid.getOwner(p.col,p.row)==='a')).toBe(true);
  });
});

describe('Trail lookup and compact transport',()=>{
  it('keeps first collision index and victim ordering through revisits and clears',()=>{
    const trails=new TrailManager();trails.addPoint('a',1,1);trails.addPoint('a',2,1);trails.addPoint('a',1,1);trails.addPoint('b',1,1);
    expect(trails.checkCollision('c',1,1)).toMatchObject({hitPlayerId:'a',cutIndex:0});
    expect(trails.checkCollision('a',1,1)?.hitPlayerId).toBe('b');
    trails.clearTrail('a');expect(trails.checkCollision('c',1,1)?.hitPlayerId).toBe('b');
    trails.clearTrail('b');expect(trails.checkCollision('c',1,1)).toBeNull();
    trails.addPoint('a',3,4);expect(trails.checkCollision('c',1,1)).toBeNull();expect(trails.checkCollision('c',3,4)?.cutIndex).toBe(0);
  });
  it('round-trips straight, diagonal, reversed and zigzag cell paths without changing cuts',()=>{
    const trails=new TrailManager();let col=0,row=0;
    for(const [dx,dy,steps] of [[1,0,100],[0,1,60],[-1,-1,40],[1,-1,30],[-1,0,20],[1,0,20]])for(let i=0;i<steps;i++){col+=dx;row+=dy;trails.addPoint('a',col,row);}
    const compact=trails.getCompactTrail('a');expect(compact.length).toBeLessThan(15);
    expect(expandCompactTrail(compact)).toEqual(trails.getTrail('a'));
    expect(trails.getCompactTrail('a')).toBe(compact);
    const version=trails.versionFor('a');expect(trails.addPoint('a',col,row)).toBe(false);expect(trails.versionFor('a')).toBe(version);
    trails.addPoint('a',col,row+1);expect(trails.versionFor('a')).toBeGreaterThan(version);
    expect(expandCompactTrail(trails.getCompactTrail('a'))).toEqual(trails.getTrail('a'));
    trails.clearTrail('a');expect(trails.versionFor('a')).toBeGreaterThan(version);expect(trails.getCompactTrail('a')).toEqual([]);
  });
});
