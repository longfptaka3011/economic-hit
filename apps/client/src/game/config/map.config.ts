export interface MapConfig {
  gridCols: number;
  gridRows: number;
  tileSize: number;
  worldWidth: number;
  worldHeight: number;
  backgroundColor: number;
  gridLineColor: number;
  gridLineAlpha: number;
  borderColor: number;
}

export const MAP_CONFIG: MapConfig = {
  gridCols: 256,
  gridRows: 256,
  tileSize: 16,
  worldWidth: 256 * 16, // 4096 px
  worldHeight: 256 * 16, // 4096 px
  backgroundColor: 0xf1f5f9, // Soft off-white paper canvas (#f1f5f9)
  gridLineColor: 0xcfd8dc,   // Very subtle faint pencil grid lines
  gridLineAlpha: 0.35,
  borderColor: 0x334155,     // Outer paper frame border
};
