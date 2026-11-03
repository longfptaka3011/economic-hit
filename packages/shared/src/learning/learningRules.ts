export const LEARNING_RULES={correctShieldSeconds:5,wrongDelaySeconds:5,correctRage:20} as const;

/** Applied once, when a reviewed answer is accepted for personal resume. */
export function learningOutcome(correct:boolean,rage:number):{shieldSeconds:number;rage:number} {
  return {shieldSeconds:correct?LEARNING_RULES.correctShieldSeconds:0,
    rage:correct?Math.min(100,rage+LEARNING_RULES.correctRage):rage};
}
