import {describe,it,expect} from 'vitest';
import {TerritoryGrid} from '../../territory/TerritoryGrid.js';
import {EconomySystem,districtIncome,emptyZoneCounts} from '../EconomySystem.js';
import {raceStandings,raceProgress,expansionAdvice} from '../raceStanding.js';

const spawns=[{col:64,row:64},{col:190,row:64},{col:64,row:190},{col:190,row:190}];
const setup=()=>{const grid=new TerritoryGrid(256,256),economy=new EconomySystem(grid);spawns.forEach((spawn,index)=>{economy.registerPlayer(String(index));grid.spawnTerritory(String(index),spawn.col,spawn.row,2);});return {grid,economy};};
describe('Balanced shared economy',()=>{
  it('gives all four spawn districts equal starting income and equal points over a full match',()=>{
    const {economy}=setup();for(let tick=0;tick<480*60;tick++)economy.update(1/60);economy.settleInterest();
    for(let i=0;i<4;i++){
      expect(economy.getStatus(String(i)).ratePerSecond).toBe(50);
      expect(economy.getProfile(String(i)).totalProfit).toBeCloseTo(24000,5);
    }
  });
  it('starts finance from zero capital, settles exact intervals, and keeps its rate independent of accumulated score',()=>{
    const {economy}=setup();economy.update(1);
    expect(economy.getProfile('2').totalProfit).toBe(0);expect(economy.getStatus('2').pendingInterest).toBe(50);
    economy.update(2);expect(economy.getProfile('2').totalProfit).toBe(125);expect(economy.getStatus('2').pendingInterest).toBe(25);
    economy.getProfile('2').totalProfit=1_000_000;economy.update(2);
    expect(economy.getProfile('2').totalProfit).toBe(1_000_125);expect(economy.getStatus('2').ratePerSecond).toBe(50);
  });
  it('keeps earnings invariant across frame sizes and pays earned interest after territory loss',()=>{
    const a=setup(),b=setup();for(let i=0;i<600;i++)a.economy.update(1/60);b.economy.update(10);
    for(let i=0;i<4;i++)expect(a.economy.getProfile(String(i)).totalProfit).toBeCloseTo(b.economy.getProfile(String(i)).totalProfit,6);
    const c=setup();c.economy.update(1);c.grid.clearOwner('2');c.economy.update(1.5);
    expect(c.economy.getProfile('2').totalProfit).toBe(50);expect(c.economy.getStatus('2').ratePerSecond).toBe(0);
    c.economy.update(100);expect(c.economy.getProfile('2').totalProfit).toBe(50);
  });
  it('requires 25 cells per district, caps diversity at 15%, and prices central land higher',()=>{
    const counts={...emptyZoneCounts(),INDUSTRIAL:25,COMMERCIAL:24};expect(districtIncome(counts).diversityPercent).toBe(0);
    counts.COMMERCIAL=25;expect(districtIncome(counts).diversityPercent).toBe(5);
    counts.FINANCIAL=25;counts.LAND=25;const rates=districtIncome(counts);
    expect(rates.diversityPercent).toBeCloseTo(15);expect(rates.ratePerSecond).toBeCloseTo(230);
    expect(districtIncome({...emptyZoneCounts(),CENTRAL:25}).ratePerSecond).toBe(75);
  });
  it('updates cached income after spawn, transfer and clear operations',()=>{
    const {grid,economy}=setup();expect(economy.getStatus('0').ratePerSecond).toBe(50);
    grid.setOwner(64,64,'1');expect(economy.getStatus('0').ratePerSecond).toBe(48);expect(economy.getStatus('1').counts.INDUSTRIAL).toBe(1);
    grid.clearOwner('0');expect(economy.getStatus('0').ratePerSecond).toBe(0);
    grid.spawnTerritory('0',64,64,2);expect(economy.getStatus('0').ratePerSecond).toBe(50);
  });
  it('conserves points in toll transfers, checks actual ownership, and applies a separate cooldown to each payer',()=>{
    const {economy}=setup();economy.update(10);const before=economy.getProfile('0').totalProfit+economy.getProfile('3').totalProfit;
    expect(economy.collectGroundRentToll('0','3',190,190)).toBe(5);expect(economy.collectGroundRentToll('0','3',190,190)).toBe(0);
    expect(economy.collectGroundRentToll('1','3',190,190)).toBe(5);
    expect(economy.collectGroundRentToll('0','3',200,200)).toBe(0);
    expect(economy.getProfile('0').totalProfit+economy.getProfile('3').totalProfit).toBe(before+5);
    economy.update(.8);expect(economy.collectGroundRentToll('0','3',190,190)).toBe(5);
  });
});
describe('Race standings and actionable expansion value',()=>{
  it('ranks by displayed points rather than territory and shares tied ranks',()=>{
    const players=[{id:'small',score:500,ownedCells:10},{id:'large',score:400,ownedCells:1000},{id:'tie',score:500.99,ownedCells:1}];
    const standings=raceStandings(players);expect(standings.map(entry=>entry.rank)).toEqual([1,1,3]);
    expect(standings[2].player.id).toBe('large');expect(raceProgress(players,'large')).toMatchObject({rank:3,gap:100});
    expect(raceProgress(players,'small').text).toContain('Đồng dẫn đầu');
  });
  it('recommends central value initially and a missing district when diversity adds more income',()=>{
    expect(expansionAdvice({...emptyZoneCounts(),INDUSTRIAL:25})).toMatchObject({zone:'CENTRAL',gain:75});
    const advice=expansionAdvice({...emptyZoneCounts(),INDUSTRIAL:1000});expect(advice.zone).toBe('COMMERCIAL');expect(advice.gain).toBeCloseTo(152.5);
  });
});
