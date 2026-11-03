import { ZoneType } from './territory.types.js';

export interface EconomicProfile {
  rawSurplusValue: number; // m chưa chuyển đổi
  industrialProfit: number; // P_i
  commercialProfit: number; // P_c
  financialInterest: number; // z
  groundRent: number; // R
  totalAccumulatedProfit: number; // Tổng tích lũy để xếp hạng
}

export type MarketEventType =
  | 'OVERPRODUCTION_CRISIS' // Khủng hoảng sản xuất thừa
  | 'FINANCIAL_BOOM' // Sốt tài chính - lãi suất tăng
  | 'LAND_SPECULATION' // Đầu cơ địa ốc - địa tô tăng gấp đôi
  | 'STAGNATION_RECESSION' // Đình đốn kinh tế
  | 'COMMERCIAL_EXPANSION'; // Kích cầu thương nghiệp

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  title: string;
  description: string;
  affectedZone: ZoneType;
  multiplierEffect: number;
  durationSeconds: number;
  remainingSeconds: number;
}
