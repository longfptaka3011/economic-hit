import { PlayerColor, PlayerState, PlayerInput } from './player.types.js';
import { RoomInfo } from './room.types.js';
import { MarketEvent } from './economic.types.js';
import type { OnlineClientEvents, OnlineServerEvents } from './online.types.js';

export interface CreateRoomRequest {
  nickname: string;
  color: PlayerColor;
}

export interface JoinRoomRequest {
  roomCode: string;
  nickname: string;
  color: PlayerColor;
}

export interface WorldSnapshot {
  tick: number;
  serverTimestamp: number;
  remainingMatchSeconds: number;
  players: Record<string, PlayerState>;
  activeMarketEvent: MarketEvent | null;
  // Compact grid updates: only cells that changed in the last tick
  dirtyCells?: Array<{
    col: number;
    row: number;
    state: number; // enum code
    ownerId: string | null;
  }>;
}

export interface ClientToServerEvents extends OnlineClientEvents {
  'game:ping': (clientTimestamp: number) => void;
  'room:create': (data: CreateRoomRequest, callback: (response: { success: boolean; room?: RoomInfo; error?: string }) => void) => void;
  'room:join': (data: JoinRoomRequest, callback: (response: { success: boolean; room?: RoomInfo; error?: string }) => void) => void;
  'room:leave': () => void;
  'room:set_ready': (isReady: boolean) => void;
  'player:input': (input: PlayerInput) => void;
}

export interface ServerToClientEvents extends OnlineServerEvents {
  'game:pong': (clientTimestamp: number, serverTimestamp: number) => void;
  'room:state_updated': (room: RoomInfo) => void;
  'room:start_countdown': (countdownSec: number) => void;
  'room:game_started': (initialSnapshot: WorldSnapshot) => void;
  'room:error': (errorMessage: string) => void;
  'game:world_snapshot': (snapshot: WorldSnapshot) => void;
  'game:match_finished': (summary: { rankings: PlayerState[]; durationSec: number }) => void;
}
