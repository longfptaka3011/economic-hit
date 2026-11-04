import { describe,it,expect } from 'vitest';
import { RaceQuizDirector } from '../RaceQuizDirector.js';
import { LEARNING_QUESTIONS } from '../questions.js';
import { LEARNING_STAGES } from '../QuizDirector.js';
const correctFor=(id:string)=>LEARNING_QUESTIONS.find(question=>question.id===id)!.correctIndex;

describe('Independent learning race',()=>{
  it('shares questions but unlocks only the learner who has answered and reviewed',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(60);
    const first=quiz.viewFor('a')!;expect(quiz.viewFor('b')?.question.id).toBe(first.question.id);
    expect(first.question).not.toHaveProperty('correctIndex');expect(first.question).not.toHaveProperty('explanation');
    expect(quiz.finish(first.roundId,'a')).toBeNull();
    expect(quiz.submit(first.roundId,'a',correctFor(first.question.id))).toBe(true);
    expect(quiz.viewFor('a')?.canContinue).toBe(true);expect(quiz.viewFor('b')?.canContinue).toBe(false);
    expect(quiz.viewFor('b')?.answer).toBeNull();
    expect(quiz.finish(first.roundId,'a')).toBeTruthy();expect(quiz.viewFor('a')).toBeNull();
    expect(quiz.isLearning('b')).toBe(true);expect(quiz.finish(first.roundId,'a')).toBeNull();
  });
  it('keeps real time and queues later stages independently without replacing unanswered questions',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(60);const first=quiz.viewFor('a')!;
    quiz.submit(first.roundId,'a',correctFor(first.question.id));quiz.finish(first.roundId,'a');quiz.update(40);
    expect(quiz.elapsedSeconds).toBe(100);expect(quiz.viewFor('a')?.question.topic).toBe('profit');
    expect(quiz.viewFor('a')?.question.id).not.toBe(first.question.id);
    expect(quiz.viewFor('b')?.roundId).toBe(first.roundId);
    quiz.submit(first.roundId,'b',correctFor(first.question.id));quiz.finish(first.roundId,'b');
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
  it('delivers exactly ten unique questions to every learner, two per topic, including a slow reader',()=>{
    const quiz=new RaceQuizDirector(['a','b','c','d'],()=>0);
    expect(LEARNING_STAGES).toHaveLength(10);
    const seen:string[]=[];
    for(const stage of LEARNING_STAGES){
      quiz.update(stage.atSeconds-quiz.elapsedSeconds);
      const view=quiz.viewFor('a')!;expect(view.totalStages).toBe(10);expect(view.question.topic).toBe(stage.topic);
      seen.push(view.question.id);quiz.submit(view.roundId,'a',correctFor(view.question.id));quiz.finish(view.roundId,'a');
    }
    expect(new Set(seen).size).toBe(10);
    for(const topic of new Set(LEARNING_STAGES.map(stage=>stage.topic)))expect(LEARNING_STAGES.filter(stage=>stage.topic===topic)).toHaveLength(2);
    quiz.update(60);
    expect(quiz.viewFor('a')).toBeNull();
    for(const id of ['b','c','d']){
      const queued:string[]=[];
      for(let i=0;i<10;i++){
        const view=quiz.viewFor(id)!;expect(view.completedStages).toBe(i);queued.push(view.question.id);
        quiz.submit(view.roundId,id,correctFor(view.question.id));quiz.finish(view.roundId,id);
      }
      expect(queued).toEqual(seen);expect(quiz.viewFor(id)).toBeNull();
    }
    quiz.update(1000);for(const id of ['a','b','c','d'])expect(quiz.isLearning(id)).toBe(false);
  });
  it('holds a wrong answer for five real game seconds and duplicate submissions cannot shorten or restart the penalty',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(60);const view=quiz.viewFor('a')!;
    const wrong=(correctFor(view.question.id)+1)%4;quiz.submit(view.roundId,'a',wrong);
    expect(quiz.viewFor('a')).toMatchObject({canContinue:false,penaltyRemainingSeconds:5});
    expect(quiz.finish(view.roundId,'a')).toBeNull();expect(quiz.isLearning('a')).toBe(true);
    expect(quiz.update(1)).toBe(true);expect(quiz.viewFor('a')?.penaltyRemainingSeconds).toBe(4);
    expect(quiz.submit(view.roundId,'a',correctFor(view.question.id))).toBe(false);
    quiz.update(3.99);expect(quiz.finish(view.roundId,'a')).toBeNull();
    quiz.update(.01);expect(quiz.viewFor('a')?.canContinue).toBe(true);
    expect(quiz.finish(view.roundId,'a')?.correct).toBe(false);
    expect(quiz.finish(view.roundId,'a')).toBeNull();expect(quiz.isLearning('b')).toBe(true);
  });
  it('starts each wrong-answer penalty at that learner submission time, not the shared round time',()=>{
    const quiz=new RaceQuizDirector(['a','b'],()=>0);quiz.update(60);const view=quiz.viewFor('a')!,wrong=(correctFor(view.question.id)+1)%4;
    quiz.submit(view.roundId,'a',wrong);quiz.update(2);quiz.submit(view.roundId,'b',wrong);quiz.update(3);
    expect(quiz.viewFor('a')?.canContinue).toBe(true);expect(quiz.viewFor('b')?.penaltyRemainingSeconds).toBe(2);
    expect(quiz.finish(view.roundId,'a')?.correct).toBe(false);expect(quiz.finish(view.roundId,'b')).toBeNull();
    quiz.update(2);expect(quiz.finish(view.roundId,'b')?.correct).toBe(false);
  });
});
