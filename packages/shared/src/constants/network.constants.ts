export const SOCKET_EVENTS = {
  // Connection / Lifecycle
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PING: 'game:ping',
  PONG: 'game:pong',

  // Room Management
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_SET_READY: 'room:set_ready',
  ROOM_STATE_UPDATED: 'room:state_updated',
  ROOM_START_COUNTDOWN: 'room:start_countdown',
  ROOM_GAME_STARTED: 'room:game_started',
  ROOM_ERROR: 'room:error',

  // In-Game Events
  PLAYER_INPUT: 'player:input',
  WORLD_SNAPSHOT: 'game:world_snapshot',
  TERRITORY_CAPTURED: 'game:territory_captured',
  PLAYER_ELIMINATED: 'game:player_eliminated',
  PLAYER_RESPAWNED: 'game:player_respawned',
  MARKET_EVENT_TRIGGERED: 'game:market_event',
  MATCH_FINISHED: 'game:match_finished',
} as const;

