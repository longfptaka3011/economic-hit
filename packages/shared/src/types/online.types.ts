import type { QuizView } from '../learning/QuizDirector.js';
import type { AvatarProfile } from './avatar.types.js';
import type { EconomyStatus } from '../economy/EconomySystem.js';
import type { MatchFeedbackEvent,MatchResult } from '../match/MatchRecorder.js';

export {AVATAR_COLORS as ONLINE_COLORS} from './avatar.types.js';
export interface OnlineMember extends AvatarProfile { id: string; ready: boolean }
export interface OnlineRoom {
  code: string; hostId: string; status: 'lobby' | 'playing' | 'finished'; members: OnlineMember[];
}
export interface OnlineInput { sequence: number; dx: number; dy: number; sprint: boolean }
export interface OnlinePlayer extends OnlineMember {
  x: number; y: number; vx: number; vy: number; rage: number; sprinting: boolean; exhausted: boolean;
  shield: number; score: number; ownedCells: number;
  learning: boolean;
  lastInputSequence:number; inputAgeSeconds:number;
  motionRevision:number; sprintRecoveryDelaySeconds:number;
  economy: EconomyStatus;
}
export interface OnlineSnapshot {
  matchId: string; tick: number; remainingSeconds: number; paused: boolean; finished: boolean;
  players: OnlinePlayer[]; trails: Record<string, Array<{col: number; row: number}>>;
  trailsCompressed?:true;trailVersions?:Record<string,number>;
  territoryRevision: number;
  territory?: Array<{ col: number; row: number; owner: string }>;
  territoryDelta?:Array<{col:number;row:number;owner:string|null}>;
  events:MatchFeedbackEvent[];
  results?:MatchResult[];
}
export interface OnlineSession { room: OnlineRoom; snapshot: OnlineSnapshot }
export type OnlineReply = { success: boolean; error?: string; room?: OnlineRoom };
export interface OnlineClientEvents {
  'online:create': (profile: AvatarProfile, reply: (result: OnlineReply) => void) => void;
  'online:join': (code: string, profile: AvatarProfile, reply: (result: OnlineReply) => void) => void;
  'online:customize': (profile: AvatarProfile, reply: (result: OnlineReply) => void) => void;
  'online:leave': () => void;
  'online:ready': (ready: boolean) => void;
  'online:start': () => void;
  'online:input': (matchId: string, input: OnlineInput) => void;
  'online:answer': (matchId: string, roundId: string, index: number) => void;
  'online:continue': (matchId: string, roundId: string) => void;
  'online:lobby': () => void;
}
export interface OnlineServerEvents {
  'online:room': (room: OnlineRoom) => void;
  'online:started': (session: OnlineSession) => void;
  'online:snapshot': (snapshot: OnlineSnapshot) => void;
  'online:quiz': (matchId: string, quiz: QuizView | null, readyIds: string[]) => void;
  'online:error': (message: string) => void;
}
