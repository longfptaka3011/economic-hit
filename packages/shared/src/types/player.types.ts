export type PlayerColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'pink';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerInput {
  sequenceNumber: number;
  direction: Direction;
  timestamp: number;
}

export interface PlayerState {
  id: string; // Socket ID
  roomCode: string;
  nickname: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  position: Vector2D;
  velocity: Vector2D;
  currentDirection: Direction;
  targetDirection: Direction;
  cellPosition: { col: number; row: number };
  score: number;
  ownedCellCount: number;
  trailCellCount: number;
  respawnTimeRemainingSec: number;
}

