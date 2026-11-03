import { ZoneType } from '@market-mayhem/shared';
import { TerritoryGrid } from '@market-mayhem/shared';
import { LogicalGrid } from '../entities/LogicalGrid';

export interface EconomicScoreBreakdown {
  industrialProfit: number; // P_i: Sinh ra từ Khu Công Nghiệp
  commercialProfit: number; // P_c: Gia tốc lưu thông từ Khu Thương Nghiệp
  financialInterest: number; // z: Lợi tức từ Khu Tài Chính
  groundRent: number; // R: Địa tô từ Khu Đất Đai
  totalProfit: number; // Tổng tư bản tích lũy (Tổng điểm)
  ratePerSecond: number; // Tốc độ sinh lời hiện tại / giây
}

export class EconomicSystem {
  private grid: TerritoryGrid;
  private logicalGrid: LogicalGrid;

  // Breakdown for each player: id -> breakdown
  private profiles: Map<string, EconomicScoreBreakdown> = new Map();
  private interestTimers: Map<string, number> = new Map();

  constructor(grid: TerritoryGrid, logicalGrid: LogicalGrid) {
    this.grid = grid;
    this.logicalGrid = logicalGrid;
  }

  public registerPlayer(id: string): void {
    this.profiles.set(id, {
      industrialProfit: 0,
      commercialProfit: 0,
      financialInterest: 0,
      groundRent: 0,
      totalProfit: 0,
      ratePerSecond: 0,
    });
    this.interestTimers.set(id, 0);
  }

  public getProfile(id: string): EconomicScoreBreakdown {
    return (
      this.profiles.get(id) || {
        industrialProfit: 0,
        commercialProfit: 0,
        financialInterest: 0,
        groundRent: 0,
        totalProfit: 0,
        ratePerSecond: 0,
      }
    );
  }

  /**
   * Award balanced one-time discovery bonus
   */
  public awardDiscoveryBonus(playerId: string, amount: number): void {
    const profile = this.profiles.get(playerId);
    if (profile) {
      profile.totalProfit += amount;
      profile.commercialProfit += amount; // Attributed as commercial exploration gains
    }
  }

  /**
   * Called every frame to simulate continuous accumulation of surplus value and its distribution
   */
  public update(deltaSec: number, _onTollCollected?: (victimId: string, ownerId: string, amount: number) => void): void {
    // 1. Count owned cells by zone for each player
    const zoneCounts: Map<string, Record<ZoneType, number>> = new Map();

    for (const id of this.profiles.keys()) {
      zoneCounts.set(id, {
        NEUTRAL: 0,
        INDUSTRIAL: 0,
        COMMERCIAL: 0,
        FINANCIAL: 0,
        LAND: 0,
        CENTRAL: 0,
      });
    }

    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const ownerId = this.grid.getOwner(c, r);
        if (ownerId && zoneCounts.has(ownerId)) {
          const cell = this.logicalGrid.getCell(c, r);
          const zone = cell ? cell.zone : 'NEUTRAL';
          zoneCounts.get(ownerId)![zone]++;
        }
      }
    }

    // 2. Accumulate profit forms for each player
    for (const [id, profile] of this.profiles.entries()) {
      const counts = zoneCounts.get(id)!;

      // A. Industrial Zone: Primary source of surplus value (m -> Industrial Profit P_i)
      // Base: 2.5 points per cell per second
      const rawSurplus = counts.INDUSTRIAL * 2.5 * deltaSec;

      // B. Commercial Zone: Circulation accelerator (Velocity Multiplier)
      // Having commercial tiles multiplies the conversion rate of surplus into realized profit
      const commercialBonusFactor = 1.0 + (counts.COMMERCIAL / 40.0) * 0.5; // up to 2.5x multiplier
      const industrialGain = rawSurplus * commercialBonusFactor;
      profile.industrialProfit += industrialGain;

      // Commercial Profit: Share of surplus value appropriated by commercial capital
      const commercialGain = counts.COMMERCIAL * 1.8 * deltaSec;
      profile.commercialProfit += commercialGain;

      // C. Land Zone: Capitalist Ground Rent (R)
      // Generates baseline monopoly ground rent per cell per second
      const rentGain = counts.LAND * 1.5 * deltaSec;
      profile.groundRent += rentGain;

      // D. Central Market Plaza: Direct trading turnover (1.5 pts/cell/sec)
      const centralGain = counts.CENTRAL * 1.5 * deltaSec;
      profile.commercialProfit += centralGain;

      // E. Financial Zone: Loan Capital Interest (z)
      // Generates compound interest every 3 seconds based on total accumulated capital
      let interestGain = 0;
      let timer = (this.interestTimers.get(id) || 0) + deltaSec;
      if (timer >= 2.5) {
        timer = 0;
        if (counts.FINANCIAL > 0 && profile.totalProfit > 50) {
          // Interest rate: 1.5% base + 0.1% per financial cell
          const interestRate = 0.015 + counts.FINANCIAL * 0.001;
          interestGain = profile.totalProfit * interestRate;
          profile.financialInterest += interestGain;
        }
      }
      this.interestTimers.set(id, timer);

      // Baseline neutral territory gain
      const neutralGain = counts.NEUTRAL * 0.5 * deltaSec;

      // Total Profit summation
      const totalGain = industrialGain + commercialGain + rentGain + centralGain + interestGain + neutralGain;
      profile.totalProfit += totalGain;
      profile.ratePerSecond = totalGain / Math.max(0.001, deltaSec);
    }
  }

  /**
   * Called when an opponent steps onto another player's territory in the Land Zone:
   * Deducts a ground rent toll from the trespasser and pays it to the landowner!
   */
  public collectGroundRentToll(
    trespasserId: string,
    ownerId: string,
    col: number,
    row: number
  ): number {
    const cell = this.logicalGrid.getCell(col, row);
    if (!cell || cell.zone !== 'LAND') return 0;

    const trespasserProfile = this.profiles.get(trespasserId);
    const ownerProfile = this.profiles.get(ownerId);
    if (!trespasserProfile || !ownerProfile) return 0;

    // Toll amount: 5 points
    const toll = Math.min(5, trespasserProfile.totalProfit);
    if (toll > 0) {
      trespasserProfile.totalProfit -= toll;
      ownerProfile.groundRent += toll;
      ownerProfile.totalProfit += toll;
    }
    return toll;
  }

  public resetPlayer(id: string): void {
    const profile = this.profiles.get(id);
    if (profile) {
      profile.industrialProfit = 0;
      profile.commercialProfit = 0;
      profile.financialInterest = 0;
      profile.groundRent = 0;
      profile.totalProfit = 0;
      profile.ratePerSecond = 0;
    }
    this.interestTimers.set(id, 0);
  }
}
