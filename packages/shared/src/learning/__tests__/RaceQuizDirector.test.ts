import { describe,it,expect } from 'vitest';
import { RaceQuizDirector } from '../RaceQuizDirector.js';

describe('Independent learning race',()=>{
  it('shares questions but unlocks only the learner who has answered and reviewed',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(60);
    const first=quiz.viewFor('a')!;expect(quiz.viewFor('b')?.question.id).toBe(first.question.id);
    expect(first.question).not.toHaveProperty('correctIndex');expect(first.question).not.toHaveProperty('explanation');
    expect(quiz.finish(first.roundId,'a')).toBeNull();
    expect(quiz.submit(first.roundId,'a',0)).toBe(true);
    expect(quiz.viewFor('a')?.canContinue).toBe(true);expect(quiz.viewFor('b')?.canContinue).toBe(false);
    expect(quiz.viewFor('b')?.answer).toBeNull();
    expect(quiz.finish(first.roundId,'a')).toBeTruthy();expect(quiz.viewFor('a')).toBeNull();
    expect(quiz.isLearning('b')).toBe(true);expect(quiz.finish(first.roundId,'a')).toBeNull();
  });
  it('keeps real time and queues later stages independently without replacing unanswered questions',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(60);const first=quiz.viewFor('a')!;
    quiz.submit(first.roundId,'a',0);quiz.finish(first.roundId,'a');quiz.update(90);
    expect(quiz.elapsedSeconds).toBe(150);expect(quiz.viewFor('a')?.question.topic).toBe('commercial');
    expect(quiz.viewFor('b')?.roundId).toBe(first.roundId);
    quiz.submit(first.roundId,'b',1);quiz.finish(first.roundId,'b');
    expect(quiz.viewFor('b')?.question.id).toBe(quiz.viewFor('a')?.question.id);
    expect(quiz.viewFor('b')?.completedStages).toBe(1);
  });
  it('rejects duplicate, stale, nonparticipant and malformed answers',()=>{
    const quiz=new RaceQuizDirector(['a'],()=>0);quiz.update(60);const round=quiz.viewFor('a')!.roundId;
    for(const option of [-1,4,1.5,NaN])expect(quiz.submit(round,'a',option)).toBe(false);
    expect(quiz.submit('old','a',0)).toBe(false);expect(quiz.submit(round,'outsider',0)).toBe(false);
    expect(quiz.submit(round,'a',0)).toBe(true);expect(quiz.submit(round,'a',1)).toBe(false);
    expect(quiz.finish('old','a')).toBeNull();
    quiz.removeParticipant('a');expect(quiz.viewFor('a')).toBeNull();expect(quiz.finish(round,'a')).toBeNull();
  });
  it('targets crisis questions to the eliminated player and caps their repetition',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(30);quiz.requestCrisis('a','profit');quiz.update(0);
    const round=quiz.viewFor('a')!;expect(round.reason).toBe('crisis');expect(quiz.viewFor('b')).toBeNull();
    quiz.submit(round.roundId,'a',0);quiz.finish(round.roundId,'a');
    quiz.requestCrisis('a','profit');quiz.update(0);expect(quiz.viewFor('a')).toBeNull();
  });
});
