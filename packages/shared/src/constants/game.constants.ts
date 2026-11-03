export const GAME_CONSTANTS = {
  // Tick rate for the deterministic server loop (20 ticks per second)
  TICK_RATE: 20,
  TICK_INTERVAL_MS: 50, // 1000 / 20 = 50ms

  // World dimensions in world units (pixels)
  MAP_WIDTH: 4096,
  MAP_HEIGHT: 4096,

  // Grid discretization
  // 4096x4096 map with 16px cell size yields 256x256 grid cells
  GRID_CELL_SIZE: 16,
  GRID_COLS: 256,
  GRID_ROWS: 256,

  // Player movement
  DEFAULT_PLAYER_SPEED: 180, // pixels per second
  BOOST_PLAYER_SPEED: 260,
  PLAYER_RADIUS: 12, // visual & collision circle radius

  // Starting territory
  INITIAL_TERRITORY_RADIUS: 2, // 5x5 grid cells around initial spawn

  // Match configuration
  MATCH_DURATION_SECONDS: 480, // 8 minutes (reading time at checkpoints is excluded)
  RESPAWN_COOLDOWN_SECONDS: 3,

  // Room limits
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  RECOMMENDED_MIN_PLAYERS: 4,
  RECOMMENDED_MAX_PLAYERS: 8,
} as const;

