import { PlayerState } from './player.types.js';

export type RoomStatus =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'IN_PROGRESS'
  | 'GAME_OVER';

export interface RoomInfo {
  code: string;
  hostId: string;
  status: RoomStatus;
  players: Record<string, PlayerState>;
  playerCount: number;
  maxPlayers: number;
  matchDurationSeconds: number;
  remainingMatchSeconds: number;
}
