export type ZoneType =
  | 'NEUTRAL'
  | 'INDUSTRIAL'
  | 'COMMERCIAL'
  | 'FINANCIAL'
  | 'LAND'
  | 'CENTRAL';

export type CellState =
  | 'EMPTY'
  | 'OWNED'
  | 'TRAIL';

export interface GridCell {
  col: number;
  row: number;
  zone: ZoneType;
  state: CellState;
  ownerId: string | null; // socket id of owner
}

export interface TerritoryCaptureEvent {
  playerId: string;
  capturedCellsCount: number;
  totalOwnedCellsCount: number;
  capturedZoneSummary: Record<ZoneType, number>;
}

export interface TrailCutEvent {
  attackerId: string;
  victimId: string;
  cutPosition: { col: number; row: number };
}

