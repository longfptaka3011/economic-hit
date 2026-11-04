import { LEARNING_QUESTIONS, LearningQuestion, LearningTopic } from './questions.js';

export const LEARNING_STAGES = [
  { id: 'foundation', atSeconds: 60, topic: 'profit', title: 'Khởi nghiệp: hiểu lợi nhuận' },
  { id: 'foundation-practice', atSeconds: 100, topic: 'profit', title: 'Khởi nghiệp: vận dụng lợi nhuận' },
  { id: 'trade', atSeconds: 140, topic: 'commercial', title: 'Mở rộng: lưu thông hàng hóa' },
  { id: 'trade-practice', atSeconds: 180, topic: 'commercial', title: 'Mở rộng: lợi nhuận thương nghiệp' },
  { id: 'credit', atSeconds: 220, topic: 'interest', title: 'Tăng trưởng: vốn và lợi tức' },
  { id: 'credit-practice', atSeconds: 260, topic: 'interest', title: 'Tăng trưởng: phân chia lợi nhuận' },
  { id: 'land', atSeconds: 300, topic: 'rent', title: 'Cạnh tranh: đất đai và địa tô' },
  { id: 'land-practice', atSeconds: 340, topic: 'rent', title: 'Cạnh tranh: vận dụng địa tô' },
  { id: 'review-practice', atSeconds: 380, topic: 'synthesis', title: 'Bứt phá: tổng hợp kiến thức' },
  { id: 'review', atSeconds: 420, topic: 'synthesis', title: 'Về đích: kết nối các hình thức' },
] as const;

export interface QuizRound {
  id: string;
  stageId: string;
  title: string;
  reason: 'milestone' | 'crisis';
  question: LearningQuestion;
}
export interface QuizAnswer {
  optionIndex: number;
  correct: boolean;
}
export interface QuizView {
  roundId: string;
  title: string;
  reason: QuizRound['reason'];
  question: Omit<LearningQuestion, 'correctIndex' | 'explanation'>;
  answeredCount: number;
  participantCount: number;
  canContinue: boolean;
  penaltyRemainingSeconds: number;
  completedStages: number;
  totalStages: number;
  answer: (QuizAnswer & { correctIndex: number; explanation: string }) | null;
}

/** Pauses its clock during an open round. A round cannot finish before every
 * registered human has submitted. Bot simulation is paused by the game host.
 * Transport-independent; this is not an implementation of network room sync.
 */
export class QuizDirector {
  public active: QuizRound | null = null;
  public elapsedSeconds = 0;
  private readonly participants: Set<string>;
  private readonly answers = new Map<string, QuizAnswer>();
  private readonly completed = new Set<string>();
  private readonly usedQuestions = new Set<string>();
  private pendingCrisis: LearningTopic | null = null;
  private crisisUsed = false;
  private lastRoundAt = -Infinity;
  private nextId = 0;

  constructor(participantIds: readonly string[], private random: () => number = Math.random) {
    this.participants = new Set(participantIds.filter(Boolean));
    if (!this.participants.size) throw new Error('A learning session needs a human participant');
  }

  public requestCrisis(topic: LearningTopic): void {
    if (this.elapsedSeconds >= 30 && !this.crisisUsed) this.pendingCrisis = topic;
  }

  public removeParticipant(playerId: string): void {
    this.participants.delete(playerId);
    this.answers.delete(playerId);
  }

  public update(deltaSec: number): QuizRound | null {
    if (this.active || !Number.isFinite(deltaSec) || deltaSec < 0) return null;
    this.elapsedSeconds += deltaSec;
    const stage = LEARNING_STAGES.find(item => !this.completed.has(item.id) && this.elapsedSeconds >= item.atSeconds);
    if (stage) return this.start(stage.id, stage.title, stage.topic, 'milestone');
    if (this.pendingCrisis && this.elapsedSeconds - this.lastRoundAt >= 90) {
      const topic = this.pendingCrisis;
      this.pendingCrisis = null;
      this.crisisUsed = true;
      return this.start('crisis', 'Cứu nguy: dừng lại để nhìn rõ thị trường', topic, 'crisis');
    }
    return null;
  }

  private start(stageId: string, title: string, topic: LearningTopic, reason: QuizRound['reason']): QuizRound {
    const candidates = LEARNING_QUESTIONS.filter(q => q.topic === topic && !this.usedQuestions.has(q.id));
    const choice = Math.min(candidates.length - 1, Math.max(0, Math.floor(this.random() * candidates.length)));
    const question = candidates[choice];
    this.usedQuestions.add(question.id);
    this.answers.clear();
    this.lastRoundAt = this.elapsedSeconds;
    this.active = { id: `learning-${++this.nextId}`, stageId, title, reason, question };
    return this.active;
  }

  public submit(roundId: string, playerId: string, optionIndex: number): boolean {
    if (!this.active || this.active.id !== roundId || !this.participants.has(playerId) || this.answers.has(playerId)) return false;
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= this.active.question.options.length) return false;
    this.answers.set(playerId, { optionIndex, correct: optionIndex === this.active.question.correctIndex });
    return true;
  }

  public get canContinue(): boolean {
    return !!this.active && this.answers.size === this.participants.size;
  }

  public viewFor(playerId: string): QuizView | null {
    if (!this.active || !this.participants.has(playerId)) return null;
    const { correctIndex, explanation, ...question } = this.active.question;
    const answer = this.answers.get(playerId);
    return {
      roundId: this.active.id, title: this.active.title, reason: this.active.reason, question,
      answeredCount: this.answers.size, participantCount: this.participants.size,
      canContinue: this.canContinue, penaltyRemainingSeconds:0, completedStages: this.completed.size, totalStages: LEARNING_STAGES.length,
      answer: answer ? { ...answer, correctIndex, explanation } : null,
    };
  }

  public finish(roundId: string): ReadonlyMap<string, QuizAnswer> | null {
    if (!this.active || this.active.id !== roundId || !this.canContinue) return null;
    const result = new Map(this.answers);
    if (this.active.reason === 'milestone') this.completed.add(this.active.stageId);
    this.active = null;
    this.answers.clear();
    return result;
  }
}
