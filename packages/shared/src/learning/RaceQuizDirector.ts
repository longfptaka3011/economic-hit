import { LEARNING_STAGES, type QuizAnswer, type QuizRound, type QuizView } from './QuizDirector.js';
import { LEARNING_QUESTIONS, type LearningTopic } from './questions.js';
import { LEARNING_RULES } from './learningRules.js';

interface Challenge { round:QuizRound; answers:Map<string,QuizAnswer>; answeredAt:Map<string,number> }
interface Learner {
  queue:Challenge[]; completed:Set<string>;
}

/** One real-time schedule, shared questions, and independent answer/review gates.
 * Later stages queue for a slow reader; nobody can hold the match clock hostage. */
export class RaceQuizDirector {
  public elapsedSeconds=0;
  private learners=new Map<string,Learner>();
  private issued=new Set<string>();
  private usedQuestions=new Set<string>();
  private nextId=0;

  constructor(ids:readonly string[],private random:()=>number=Math.random){
    ids.filter(Boolean).forEach(id=>this.learners.set(id,{queue:[],completed:new Set()}));
    if(!this.learners.size)throw new Error('A learning session needs a human participant');
  }
  public isLearning(id:string):boolean {return !!this.learners.get(id)?.queue.length;}
  public removeParticipant(id:string):void {
    this.learners.delete(id);
    for(const learner of this.learners.values())for(const challenge of learner.queue){challenge.answers.delete(id);challenge.answeredAt.delete(id);}
  }
  private challenge(stageId:string,title:string,topic:LearningTopic,reason:QuizRound['reason']):Challenge|null {
    const candidates=LEARNING_QUESTIONS.filter(question=>question.topic===topic && !this.usedQuestions.has(question.id));
    if(!candidates.length)return null;
    const index=Math.max(0,Math.min(candidates.length-1,Math.floor(this.random()*candidates.length)));
    const question=candidates[index];this.usedQuestions.add(question.id);
    return {round:{id:`learning-${++this.nextId}`,stageId,title,reason,question},answers:new Map(),answeredAt:new Map()};
  }
  private penaltyRemaining(id:string,challenge:Challenge|undefined,time=this.elapsedSeconds):number {
    if(!challenge || challenge.answers.get(id)?.correct!==false)return 0;
    return Math.max(0,LEARNING_RULES.wrongDelaySeconds-(time-challenge.answeredAt.get(id)!));
  }
  public update(dt:number):boolean {
    if(!Number.isFinite(dt) || dt<0)return false;
    const previousTime=this.elapsedSeconds;
    this.elapsedSeconds+=dt;
    let changed=false;
    for(const [id,learner] of this.learners){
      if(Math.ceil(this.penaltyRemaining(id,learner.queue[0],previousTime)-1e-8)!==Math.ceil(this.penaltyRemaining(id,learner.queue[0])-1e-8))changed=true;
    }
    for(const stage of LEARNING_STAGES){
      if(this.issued.has(stage.id) || this.elapsedSeconds<stage.atSeconds)continue;
      this.issued.add(stage.id);
      const challenge=this.challenge(stage.id,stage.title,stage.topic,'milestone');if(!challenge)continue;
      for(const learner of this.learners.values())learner.queue.push(challenge);
      changed=true;
    }
    return changed;
  }
  public submit(roundId:string,id:string,optionIndex:number):boolean {
    const challenge=this.learners.get(id)?.queue[0];
    if(!challenge || challenge.round.id!==roundId || challenge.answers.has(id))return false;
    if(!Number.isInteger(optionIndex) || optionIndex<0 || optionIndex>=challenge.round.question.options.length)return false;
    challenge.answers.set(id,{optionIndex,correct:optionIndex===challenge.round.question.correctIndex});
    challenge.answeredAt.set(id,this.elapsedSeconds);return true;
  }
  public finish(roundId:string,id:string):QuizAnswer|null {
    const learner=this.learners.get(id),challenge=learner?.queue[0];
    if(!learner || !challenge || challenge.round.id!==roundId)return null;
    const answer=challenge.answers.get(id);if(!answer)return null;
    if(this.penaltyRemaining(id,challenge)>1e-8)return null;
    learner.queue.shift();if(challenge.round.reason==='milestone')learner.completed.add(challenge.round.stageId);
    return answer;
  }
  public viewFor(id:string):QuizView|null {
    const learner=this.learners.get(id),challenge=learner?.queue[0];if(!learner || !challenge)return null;
    const {correctIndex,explanation,...question}=challenge.round.question;
    const answer=challenge.answers.get(id);
    const penaltyRemainingSeconds=this.penaltyRemaining(id,challenge);
    return {roundId:challenge.round.id,title:challenge.round.title,reason:challenge.round.reason,question,
      answeredCount:challenge.answers.size,participantCount:this.learners.size,canContinue:!!answer && penaltyRemainingSeconds<=1e-8,penaltyRemainingSeconds,
      completedStages:learner.completed.size,totalStages:LEARNING_STAGES.length,
      answer:answer?{...answer,correctIndex,explanation}:null};
  }
}
