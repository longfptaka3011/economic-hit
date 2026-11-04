import {describe,it,expect} from 'vitest';
import {MatchRecorder} from '../MatchRecorder.js';
describe('Match measurements',()=>{
  it('retains the largest territory after loss and measures cumulative successful captures',()=>{
    const recorder=new MatchRecorder();recorder.register('a');recorder.capture('a',30,1,2);recorder.observe('a',55);recorder.observe('a',25);recorder.capture('a',0,1,2);
    expect(recorder.forPlayer('a')).toMatchObject({peakCells:55,captures:1,capturedCells:30});
    recorder.answer('a',true);recorder.answer('a',false);expect(recorder.forPlayer('a')).toMatchObject({questionsAnswered:2,questionsCorrect:1});
    const copy=recorder.forPlayer('a');copy.cuts=99;expect(recorder.forPlayer('a').cuts).toBe(0);
  });
  it('attributes cuts, ignores self cuts, and bounds replayable event history',()=>{
    const recorder=new MatchRecorder();recorder.register('a');recorder.register('b');recorder.cut('a','a',0,0);
    for(let i=0;i<20;i++)recorder.cut('a','b',0,0);
    expect(recorder.forPlayer('a').cuts).toBe(20);expect(recorder.forPlayer('b').deaths).toBe(20);
    expect(recorder.recentEvents()).toHaveLength(12);expect(recorder.recentEvents()[0].id).toBe(9);
    recorder.recentEvents()[0].actorId='changed';expect(recorder.recentEvents()[0].actorId).toBe('a');
  });
});
