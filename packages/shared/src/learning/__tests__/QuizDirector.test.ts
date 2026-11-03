import { describe, expect, it } from 'vitest';
import { QuizDirector, LEARNING_STAGES } from '../QuizDirector.js';
import { LEARNING_QUESTIONS } from '../questions.js';

describe('Learning checkpoints', () => {
  it('opens at the milestone and freezes its clock until the answer is reviewed', () => {
    const quiz = new QuizDirector(['p1'], () => 0);
    expect(quiz.update(59)).toBeNull();
    const round = quiz.update(1)!;
    expect(round.stageId).toBe('foundation');
    quiz.update(600);
    expect(quiz.elapsedSeconds).toBe(60);
    expect(quiz.finish(round.id)).toBeNull();
    expect(quiz.viewFor('p1')?.answer).toBeNull();
    // Answer/explanation are absent from the unsubmitted question view.
    expect(quiz.viewFor('p1')?.question).not.toHaveProperty('correctIndex');
    expect(quiz.viewFor('p1')?.question).not.toHaveProperty('explanation');
  });

  it('waits for every human; a wrong answer is reviewed without blocking the match forever', () => {
    const quiz = new QuizDirector(['p1', 'p2'], () => 0);
    const round = quiz.update(60)!;
    quiz.submit(round.id, 'p1', round.question.correctIndex);
    expect(quiz.canContinue).toBe(false);
    expect(quiz.finish(round.id)).toBeNull();
    quiz.submit(round.id, 'p2', (round.question.correctIndex + 1) % 4);
    expect(quiz.viewFor('p2')?.answer?.correct).toBe(false);
    expect(quiz.viewFor('p2')?.answer?.explanation).toBeTruthy();
    expect(quiz.canContinue).toBe(true);
    expect(quiz.finish(round.id)?.size).toBe(2);
    expect(quiz.finish(round.id)).toBeNull();
    expect(quiz.update(120)?.stageId).toBe('trade');
  });

  it('rejects stale, duplicate, unknown-player and malformed answers', () => {
    const quiz = new QuizDirector(['p1'], () => 0);
    const round = quiz.update(60)!;
    expect(quiz.submit('old-round', 'p1', 0)).toBe(false);
    expect(quiz.submit(round.id, 'stranger', 0)).toBe(false);
    for (const choice of [-1, 4, 0.5, NaN]) expect(quiz.submit(round.id, 'p1', choice)).toBe(false);
    expect(quiz.submit(round.id, 'p1', 0)).toBe(true);
    expect(quiz.submit(round.id, 'p1', 1)).toBe(false);
    expect(quiz.finish('old-round')).toBeNull();
  });

  it('delivers each of the five scheduled topics once, with no repeated question', () => {
    const quiz = new QuizDirector(['p1'], () => 0);
    const seen = new Set<string>();
    for (const stage of LEARNING_STAGES) {
      const round = quiz.update(stage.atSeconds - quiz.elapsedSeconds)!;
      expect(round.question.topic).toBe(stage.topic);
      expect(seen.has(round.question.id)).toBe(false);
      seen.add(round.question.id);
      quiz.submit(round.id, 'p1', round.question.correctIndex);
      quiz.finish(round.id);
    }
    expect(quiz.update(60)).toBeNull();
  });

  it('limits crisis questions and keeps them separate from scheduled stage completion', () => {
    const quiz = new QuizDirector(['p1'], () => 0);
    quiz.requestCrisis('profit'); // Too early at spawn.
    expect(quiz.update(30)).toBeNull();
    quiz.requestCrisis('profit');
    const crisis = quiz.update(0)!;
    expect(crisis.reason).toBe('crisis');
    quiz.submit(crisis.id, 'p1', 0);
    expect(quiz.viewFor('p1')?.completedStages).toBe(0);
    quiz.finish(crisis.id);
    const milestone = quiz.update(30)!;
    expect(milestone.stageId).toBe('foundation');
    expect(milestone.question.id).not.toBe(crisis.question.id);
    quiz.submit(milestone.id, 'p1', 0);
    quiz.finish(milestone.id);
    quiz.requestCrisis('interest');
    expect(quiz.update(80)).toBeNull();
  });

  it('ignores invalid time, de-duplicates participants, and rejects empty sessions', () => {
    expect(() => new QuizDirector([])).toThrow();
    const quiz = new QuizDirector(['p1', 'p1']);
    quiz.update(NaN);
    quiz.update(-100);
    expect(quiz.elapsedSeconds).toBe(0);
    quiz.update(60);
    expect(quiz.viewFor('p1')?.participantCount).toBe(1);
    expect(quiz.viewFor('outsider')).toBeNull();
  });
});

describe('Textbook question bank', () => {
  it('has 25 distinct questions, five per topic, with four unique choices and traceable references', () => {
    expect(LEARNING_QUESTIONS).toHaveLength(25);
    expect(new Set(LEARNING_QUESTIONS.map(q => q.id)).size).toBe(25);
    for (const stage of LEARNING_STAGES) expect(LEARNING_QUESTIONS.filter(q => q.topic === stage.topic)).toHaveLength(5);
    for (const q of LEARNING_QUESTIONS) {
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.correctIndex]).toBeTruthy();
      expect(q.explanation.length).toBeGreaterThan(40);
      expect(q.sourcePages.length).toBeGreaterThan(0);
      expect(q.sourcePages.every(page => page >= 100 && page <= 111)).toBe(true);
    }
  });

  it('checks the independently calculated numerical answers', () => {
    const expected = { 'profit-cost': '100', 'profit-rate': '20%', 'commercial-example': '15',
      'interest-rate': '5%', 'interest-split': '45', 'rent-land-price': '200 triệu',
      'synthesis-weighted': '30%', 'synthesis-production-price': '110' };
    for (const [id, answer] of Object.entries(expected)) {
      const question = LEARNING_QUESTIONS.find(q => q.id === id)!;
      expect(question.options[question.correctIndex]).toBe(answer);
    }
  });
});
