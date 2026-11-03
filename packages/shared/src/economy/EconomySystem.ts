import { TerritoryGrid } from '../territory/TerritoryGrid.js';
import type { ZoneType } from '../types/territory.types.js';

export const CORE_DISTRICTS=['INDUSTRIAL','COMMERCIAL','FINANCIAL','LAND'] as const;
export const ECONOMY_RULES={coreYield:2,centralYield:3,neutralYield:.5,diversityCells:25,diversityStep:.05,
  interestPeriod:2.5,toll:5,tollCooldown:.8} as const;
export const DISTRICT_NAMES:Record<ZoneType,string>={INDUSTRIAL:'Công nghiệp',COMMERCIAL:'Thương nghiệp',FINANCIAL:'Tài chính',LAND:'Đất đai',CENTRAL:'Chợ trung tâm',NEUTRAL:'Đất chung'};
export type ZoneCounts=Record<ZoneType,number>;
export const emptyZoneCounts=():ZoneCounts=>({INDUSTRIAL:0,COMMERCIAL:0,FINANCIAL:0,LAND:0,CENTRAL:0,NEUTRAL:0});
export function economicZoneAt(col:number,row:number,cols=256,rows=256):ZoneType {
  if(col<0 || row<0 || col>=cols || row>=rows)return 'NEUTRAL';
  const halfCols=Math.floor(cols/2),halfRows=Math.floor(rows/2);
  if(Math.hypot(col-halfCols,row-halfRows)<=Math.floor(cols*.12))return 'CENTRAL';
  return col<halfCols?(row<halfRows?'INDUSTRIAL':'FINANCIAL'):(row<halfRows?'COMMERCIAL':'LAND');
}
export function districtIncome(counts:ZoneCounts):{rates:ZoneCounts;diversityPercent:number;ratePerSecond:number} {
  const districts=CORE_DISTRICTS.filter(zone=>counts[zone]>=ECONOMY_RULES.diversityCells).length;
  const diversityPercent=Math.max(0,districts-1)*ECONOMY_RULES.diversityStep*100;
  const rates=emptyZoneCounts();
  CORE_DISTRICTS.forEach(zone=>rates[zone]=counts[zone]*ECONOMY_RULES.coreYield*(1+diversityPercent/100));
  rates.CENTRAL=counts.CENTRAL*ECONOMY_RULES.centralYield;rates.NEUTRAL=counts.NEUTRAL*ECONOMY_RULES.neutralYield;
  return {rates,diversityPercent,ratePerSecond:Object.values(rates).reduce((sum,rate)=>sum+rate,0)};
}
export interface EconomicScoreBreakdown {
  industrialProfit:number;commercialProfit:number;financialInterest:number;groundRent:number;centralProfit:number;neutralProfit:number;
  tollsPaid:number;totalProfit:number;ratePerSecond:number;
}
export interface EconomyStatus {
  counts:ZoneCounts;rates:ZoneCounts;ratePerSecond:number;diversityPercent:number;
  pendingInterest:number;nextInterestSeconds:number;
}
interface Account { profile:EconomicScoreBreakdown;pendingInterest:number;interestTimer:number;tollTimer:number }
const emptyProfile=():EconomicScoreBreakdown=>({industrialProfit:0,commercialProfit:0,financialInterest:0,groundRent:0,centralProfit:0,neutralProfit:0,tollsPaid:0,totalProfit:0,ratePerSecond:0});

/** Identical scoring for local and online. Finance accrues from owned cells,
 * settles in fixed intervals, and never compounds the accumulated score. */
export class EconomySystem {
  private accounts=new Map<string,Account>();
  private counts=new Map<string,ZoneCounts>();
  private countsRevision=-1;
  constructor(private grid:TerritoryGrid){}
  public registerPlayer(id:string):void {
    this.accounts.set(id,{profile:emptyProfile(),pendingInterest:0,interestTimer:0,tollTimer:0});this.countsRevision=-1;
  }
  public removePlayer(id:string):void {this.accounts.delete(id);this.counts.delete(id);this.countsRevision=-1;}
  private refreshCounts():void {
    if(this.countsRevision===this.grid.revision)return;
    this.counts.clear();for(const id of this.accounts.keys())this.counts.set(id,emptyZoneCounts());
    for(let row=0;row<this.grid.rows;row++)for(let col=0;col<this.grid.cols;col++){
      const owner=this.grid.getOwner(col,row),counts=owner?this.counts.get(owner):undefined;
      if(counts)counts[economicZoneAt(col,row,this.grid.cols,this.grid.rows)]++;
    }
    this.countsRevision=this.grid.revision;
  }
  public getProfile(id:string):EconomicScoreBreakdown {return this.accounts.get(id)?.profile??emptyProfile();}
  public getStatus(id:string):EconomyStatus {
    this.refreshCounts();const account=this.accounts.get(id),counts={...(this.counts.get(id)??emptyZoneCounts())};
    const income=districtIncome(counts);
    return {counts,...income,pendingInterest:account?.pendingInterest??0,nextInterestSeconds:ECONOMY_RULES.interestPeriod-(account?.interestTimer??0)};
  }
  public update(dt:number):void {
    if(!Number.isFinite(dt) || dt<=0)return;
    this.refreshCounts();
    for(const [id,account] of this.accounts){
      const {rates,ratePerSecond}=districtIncome(this.counts.get(id)!);const profile=account.profile;
      profile.industrialProfit+=rates.INDUSTRIAL*dt;profile.commercialProfit+=rates.COMMERCIAL*dt;
      profile.groundRent+=rates.LAND*dt;profile.centralProfit+=rates.CENTRAL*dt;profile.neutralProfit+=rates.NEUTRAL*dt;
      profile.totalProfit+=(ratePerSecond-rates.FINANCIAL)*dt;profile.ratePerSecond=ratePerSecond;
      const elapsed=account.interestTimer+dt;
      if(elapsed+1e-8>=ECONOMY_RULES.interestPeriod){
        const periods=Math.floor((elapsed+1e-8)/ECONOMY_RULES.interestPeriod);
        const tail=Math.max(0,elapsed-periods*ECONOMY_RULES.interestPeriod);
        const payout=account.pendingInterest+rates.FINANCIAL*(dt-tail);
        profile.financialInterest+=payout;profile.totalProfit+=payout;
        account.pendingInterest=rates.FINANCIAL*tail;account.interestTimer=tail;
      }else{account.pendingInterest+=rates.FINANCIAL*dt;account.interestTimer=elapsed;}
      account.tollTimer=Math.max(0,account.tollTimer-dt);
    }
  }
  /** Unpaid cell interest belongs to its earner even if land is lost or time expires. */
  public settleInterest():void {
    for(const account of this.accounts.values()){
      account.profile.financialInterest+=account.pendingInterest;account.profile.totalProfit+=account.pendingInterest;account.pendingInterest=0;
    }
  }
  public collectGroundRentToll(trespasserId:string,ownerId:string,col:number,row:number):number {
    if(trespasserId===ownerId || economicZoneAt(col,row,this.grid.cols,this.grid.rows)!=='LAND' || this.grid.getOwner(col,row)!==ownerId)return 0;
    const payer=this.accounts.get(trespasserId),owner=this.accounts.get(ownerId);
    if(!payer || !owner || payer.tollTimer>1e-8)return 0;
    const toll=Math.min(ECONOMY_RULES.toll,payer.profile.totalProfit);if(toll<=0)return 0;
    payer.profile.totalProfit-=toll;payer.profile.tollsPaid+=toll;owner.profile.totalProfit+=toll;owner.profile.groundRent+=toll;
    payer.tollTimer=ECONOMY_RULES.tollCooldown;return toll;
  }
}
