import {describe,it,expect} from 'vitest';
import type {OnlineSnapshot} from '@market-mayhem/shared';
import {mergeLoadingOwnership,SnapshotOwnership} from '../ownership';
const snapshot=(overrides:Partial<OnlineSnapshot>={}):OnlineSnapshot=>({matchId:'one',tick:0,remainingSeconds:480,paused:false,finished:false,players:[],trails:{},events:[],territoryRevision:0,...overrides});
describe('Ownership delta delivery',()=>{
  it('applies steals, clears and multiple updates before the first rendered frame',()=>{
    const initial=snapshot({territory:[{col:1,row:1,owner:'a'},{col:2,row:1,owner:'b'}]});
    const first=mergeLoadingOwnership(initial,snapshot({tick:1,territoryRevision:1,territoryDelta:[{col:1,row:1,owner:'b'},{col:3,row:1,owner:'a'}]}));
    const second=mergeLoadingOwnership(first,snapshot({tick:2,territoryRevision:2,territoryDelta:[{col:2,row:1,owner:null}]}));
    expect(second.territory).toEqual([{col:1,row:1,owner:'b'},{col:3,row:1,owner:'a'}]);expect(second.territoryDelta).toBeUndefined();
  });
  it('retains all socket deltas when React renders only the last packet, and resets on rematch',()=>{
    const ownership=new SnapshotOwnership();ownership.accept(snapshot({territory:[{col:1,row:1,owner:'a'}]}));
    ownership.accept(snapshot({tick:1,territoryRevision:1,territoryDelta:[{col:2,row:1,owner:'b'}]}));
    ownership.accept(snapshot({tick:1,territoryRevision:2,territoryDelta:[{col:1,row:1,owner:null}]}));
    const rendered=ownership.accept(snapshot({tick:2,territoryRevision:2}));expect(rendered.territory).toEqual([{col:2,row:1,owner:'b'}]);
    expect(ownership.accept(snapshot({tick:1,territory:[{col:9,row:9,owner:'old'}]}))).toBe(rendered);
    const next=ownership.accept(snapshot({tick:3,territoryRevision:2}));expect(next.territory).toBe(rendered.territory);
    expect(ownership.accept(snapshot({matchId:'two',territory:[]})).territory).toEqual([]);
  });
});
