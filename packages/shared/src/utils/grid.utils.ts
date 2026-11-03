import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { Vector2D } from '../types/player.types.js';

export function worldToGrid(x: number, y: number): { col: number; row: number } {
  const col = Math.floor(x / GAME_CONSTANTS.GRID_CELL_SIZE);
  const row = Math.floor(y / GAME_CONSTANTS.GRID_CELL_SIZE);
  return {
    col: Math.max(0, Math.min(GAME_CONSTANTS.GRID_COLS - 1, col)),
    row: Math.max(0, Math.min(GAME_CONSTANTS.GRID_ROWS - 1, row)),
  };
}

export function gridToWorld(col: number, row: number): Vector2D {
  return {
    x: col * GAME_CONSTANTS.GRID_CELL_SIZE + GAME_CONSTANTS.GRID_CELL_SIZE / 2,
    y: row * GAME_CONSTANTS.GRID_CELL_SIZE + GAME_CONSTANTS.GRID_CELL_SIZE / 2,
  };
}

export function getGridIndex(col: number, row: number): number {
  return row * GAME_CONSTANTS.GRID_COLS + col;
}

export function getGridCoords(index: number): { col: number; row: number } {
  const row = Math.floor(index / GAME_CONSTANTS.GRID_COLS);
  const col = index % GAME_CONSTANTS.GRID_COLS;
  return { col, row };
}
