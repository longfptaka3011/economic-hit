import { MAP_CONFIG } from '../config/map.config';

export type RegionId = 'central' | 'industrial' | 'commercial' | 'financial' | 'land';

export interface RegionDefinition {
  id: RegionId;
  name: string;
  vietnameseName: string;
  description: string;
  icon: string;
  themeColor: number;
  textColor: string;
  accentHex: string;
  economicQuote: string;
  discoveryBonus: number;
}

export const REGIONS: Record<RegionId, RegionDefinition> = {
  central: {
    id: 'central',
    name: 'CENTRAL MARKET PLAZA',
    vietnameseName: 'ĐẠI CHỢ TRUNG TÂM',
    description: 'Nơi tập trung giao lưu thương mại và điều tiết thị trường toàn thành phố.',
    icon: '🏛️',
    themeColor: 0xf59e0b,
    textColor: '#fbbf24',
    accentHex: '#f59e0b',
    economicQuote: 'Trung tâm giao lưu, hội tụ tư bản và lưu thông hàng hóa.',
    discoveryBonus: 50,
  },
  industrial: {
    id: 'industrial',
    name: 'INDUSTRIAL DISTRICT',
    vietnameseName: 'KHU CÔNG NGHIỆP',
    description: 'Nơi trực tiếp sản xuất Giá trị Thặng dư (m) từ lao động thặng dư.',
    icon: '🏭',
    themeColor: 0xef4444,
    textColor: '#f87171',
    accentHex: '#ef4444',
    economicQuote: 'Nơi duy nhất trực tiếp sản xuất ra giá trị thặng dư trong nền kinh tế.',
    discoveryBonus: 50,
  },
  commercial: {
    id: 'commercial',
    name: 'COMMERCIAL DISTRICT',
    vietnameseName: 'KHU THƯƠNG NGHIỆP',
    description: 'Lưu thông hàng hóa; trong game, mỗi ô tạo 2 điểm/giây trước thưởng đa dạng hóa.',
    icon: '🏬',
    themeColor: 0x0284c7,
    textColor: '#38bdf8',
    accentHex: '#0284c7',
    economicQuote: 'Đảm nhận khâu lưu thông, biến hàng hóa thành tiền mặt.',
    discoveryBonus: 50,
  },
  financial: {
    id: 'financial',
    name: 'FINANCIAL DISTRICT',
    vietnameseName: 'KHU TÀI CHÍNH',
    description: 'Trong game, lợi tức tích lũy 2 điểm/ô/giây và trả mỗi 2,5 giây, không lãi kép theo điểm.',
    icon: '🏦',
    themeColor: 0x10b981,
    textColor: '#34d399',
    accentHex: '#10b981',
    economicQuote: 'Tư bản cho vay tham gia phân phối lại giá trị thặng dư dưới dạng lợi tức.',
    discoveryBonus: 50,
  },
  land: {
    id: 'land',
    name: 'LAND DISTRICT',
    vietnameseName: 'KHU ĐẤT ĐAI (ĐIỀN TRANG)',
    description: 'Quyền sở hữu độc quyền đất đai thu Địa tô TBCN (Ground Rent).',
    icon: '🌾',
    themeColor: 0xa855f7,
    textColor: '#c084fc',
    accentHex: '#a855f7',
    economicQuote: 'Địa tô là phần giá trị thặng dư siêu ngạch nộp cho chủ đất.',
    discoveryBonus: 50,
  },
};

export interface RegionTransitionEvent {
  previousRegion: RegionDefinition | null;
  currentRegion: RegionDefinition;
  isFirstDiscovery: boolean;
  bonusAwarded: number;
}

export class RegionManager {
  private currentRegionId: RegionId | null = null;
  private discoveredRegions: Set<RegionId> = new Set();

  // Deadzone margin to prevent jitter/flicker when hovering on region boundary line (24px)
  private readonly hysteresisMargin: number = 24;

  public getRegionAtPosition(worldX: number, worldY: number): RegionDefinition {
    const halfW = MAP_CONFIG.worldWidth / 2;
    const halfH = MAP_CONFIG.worldHeight / 2;

    // Center plaza boundary (circular with 480px radius)
    const centralRadius = MAP_CONFIG.worldWidth * 0.12; // ~490px
    const dx = worldX - halfW;
    const dy = worldY - halfH;
    const distToCenter = Math.sqrt(dx * dx + dy * dy);

    if (distToCenter <= centralRadius) {
      return REGIONS.central;
    }

    // 4 Quadrants
    if (worldX < halfW && worldY < halfH) {
      return REGIONS.industrial;
    } else if (worldX >= halfW && worldY < halfH) {
      return REGIONS.commercial;
    } else if (worldX < halfW && worldY >= halfH) {
      return REGIONS.financial;
    } else {
      return REGIONS.land;
    }
  }

  /**
   * Update player position and return transition event if region changed with hysteresis
   */
  public updatePlayerPosition(worldX: number, worldY: number): RegionTransitionEvent | null {
    const targetRegion = this.getRegionAtPosition(worldX, worldY);

    if (this.currentRegionId === null) {
      // First spawn initialization
      this.currentRegionId = targetRegion.id;
      const isFirst = !this.discoveredRegions.has(targetRegion.id);
      if (isFirst) {
        this.discoveredRegions.add(targetRegion.id);
      }
      return {
        previousRegion: null,
        currentRegion: targetRegion,
        isFirstDiscovery: isFirst,
        bonusAwarded: isFirst ? targetRegion.discoveryBonus : 0,
      };
    }

    if (this.currentRegionId === targetRegion.id) {
      // Still in same region
      return null;
    }

    // Apply hysteresis margin: player must penetrate at least hysteresisMargin into the new region
    // to avoid flickering when oscillating back and forth across the border
    const halfW = MAP_CONFIG.worldWidth / 2;
    const halfH = MAP_CONFIG.worldHeight / 2;
    const centralRadius = MAP_CONFIG.worldWidth * 0.12;
    const distToCenter = Math.sqrt((worldX - halfW) ** 2 + (worldY - halfH) ** 2);

    // If transitioning to or from central plaza, check distance margin
    if (this.currentRegionId === 'central') {
      if (distToCenter < centralRadius + this.hysteresisMargin) {
        return null; // Not far enough out yet
      }
    } else if (targetRegion.id === 'central') {
      if (distToCenter > centralRadius - this.hysteresisMargin) {
        return null; // Not deep enough in yet
      }
    } else {
      // Quadrant to quadrant border check
      if (Math.abs(worldX - halfW) < this.hysteresisMargin || Math.abs(worldY - halfH) < this.hysteresisMargin) {
        return null; // Within the deadzone boundary line
      }
    }

    // Valid deterministic transition
    const previous = REGIONS[this.currentRegionId];
    this.currentRegionId = targetRegion.id;

    const isFirstDiscovery = !this.discoveredRegions.has(targetRegion.id);
    let bonus = 0;
    if (isFirstDiscovery) {
      this.discoveredRegions.add(targetRegion.id);
      bonus = targetRegion.discoveryBonus;
    }

    return {
      previousRegion: previous,
      currentRegion: targetRegion,
      isFirstDiscovery,
      bonusAwarded: bonus,
    };
  }

  public getCurrentRegion(): RegionDefinition {
    return REGIONS[this.currentRegionId || 'industrial'];
  }

  public isDiscovered(id: RegionId): boolean {
    return this.discoveredRegions.has(id);
  }

  public getDiscoveredCount(): number {
    return this.discoveredRegions.size;
  }

  public reset(): void {
    this.currentRegionId = null;
    this.discoveredRegions.clear();
  }
}

