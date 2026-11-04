import React, { useEffect, useRef } from 'react';
import { LEARNING_RULES,type QuizView } from '@market-mayhem/shared';

interface Props {
  quiz: QuizView;
  onAnswer: (roundId: string, index: number) => void;
  onContinue: (roundId: string) => void;
  onExit: () => void;
  online?: boolean;
  remainingSeconds?: number;
}

export function LearningOverlay({ quiz, onAnswer, onContinue, onExit, online=false, remainingSeconds }: Props) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    // Never focus an answer: releasing a held sprint key can click focused buttons.
    panel.current?.focus();
  }, [quiz.roundId]);
  useEffect(() => {
    const block=(event:KeyboardEvent)=>{
      if([' ','spacebar','enter','w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','escape'].includes(event.key.toLowerCase()) || event.code==='Space'){
        event.preventDefault();event.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown',block,true);window.addEventListener('keyup',block,true);
    return()=>{window.removeEventListener('keydown',block,true);window.removeEventListener('keyup',block,true);};
  },[]);

  // Native keyboard / scripted button activation has detail=0. Require a real
  // pointer click (mouse, pen, or the compatibility click following a tap).
  const pointerAction=(event:React.MouseEvent,action:()=>void)=>{if(event.detail>0)action();};

  const onKeyDown = (event: React.KeyboardEvent) => {
    // Keep WASD/Space/ESC from entering Phaser while this checkpoint owns focus.
    event.stopPropagation();
    if (event.key === 'Escape') event.preventDefault();
    if (event.key !== 'Tab') return;
    const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    event.preventDefault();
    const next = index < 0 ? (event.shiftKey ? buttons.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };

  return <div className="learning-backdrop" onKeyDown={onKeyDown} onKeyUp={event => event.stopPropagation()}>
    <section ref={panel} tabIndex={-1} className="learning-panel" role="dialog" aria-modal="true" aria-labelledby="learning-title" aria-describedby="learning-prompt">
      <div className="learning-topline"><span>{quiz.reason === 'crisis' ? 'TRẠM CỨU NGUY' : 'TRẠM TRI THỨC'}</span><span>{quiz.completedStages} / {quiz.totalStages} CHẶNG</span></div>
      <h2 id="learning-title">{quiz.title}</h2>
      <p className="learning-pause-note">Bấm chuột hoặc chạm để chọn đáp án và tiếp tục; phím di chuyển, Space và Enter không chọn đáp án. {online?'Bạn đứng yên, được bảo vệ khỏi bị cắt đuôi và không thể cắt đuôi đối thủ. Đối thủ và đồng hồ vẫn chạy; không chờ cả phòng.':'Luyện tập một mình: bạn đứng yên khi đọc câu hỏi; đồng hồ và thu nhập vẫn tiếp tục.'} Đúng: đọc giải thích rồi đi tiếp ngay. Sai: phải chờ {LEARNING_RULES.wrongDelaySeconds} giây.</p>
      {remainingSeconds!==undefined && <p className="learning-clock" role="timer">THỜI GIAN TRẬN CÒN {Math.floor(remainingSeconds/60)}:{Math.floor(remainingSeconds%60).toString().padStart(2,'0')}</p>}
      <p id="learning-prompt" className="learning-prompt">{quiz.question.prompt}</p>
      <div className="learning-options" role="group" aria-label="Chọn một đáp án">
        {quiz.question.options.map((option, index) => {
          const correct = quiz.answer?.correctIndex === index;
          const wrong = quiz.answer?.optionIndex === index && !quiz.answer.correct;
          return <button key={`${quiz.roundId}-${index}`} className={`learning-option${correct ? ' correct' : ''}${wrong ? ' wrong' : ''}`} disabled={!!quiz.answer} onClick={event=>pointerAction(event,()=>onAnswer(quiz.roundId,index))}>
            <span className="learning-letter">{'ABCD'[index]}</span><span>{option}</span>{correct && <span aria-label="Đáp án đúng">✓</span>}{wrong && <span aria-label="Bạn đã chọn đáp án sai">×</span>}
          </button>;
        })}
      </div>
      <div className="learning-feedback" role="status" aria-live="polite">
        {quiz.answer ? <><strong className={quiz.answer.correct ? 'feedback-correct' : 'feedback-review'}>{quiz.answer.correct ? `Chính xác! Khi đi tiếp: khiên ${LEARNING_RULES.correctShieldSeconds} giây và hồi tối đa ${LEARNING_RULES.correctRage} nộ.` : `Trả lời sai: chờ ${LEARNING_RULES.wrongDelaySeconds} giây để đọc lại. Không thưởng nộ; khiên cũ bị xóa khi đi tiếp.`}</strong><p>{quiz.answer.explanation}</p>{!quiz.answer.correct && quiz.penaltyRemainingSeconds>1e-8 && <p className="learning-penalty" role="timer">KHÓA DI CHUYỂN / CẮT ĐUÔI · CÒN {Math.ceil(quiz.penaltyRemainingSeconds-1e-8)} GIÂY</p>}</> : <p>Đúng: khiên {LEARNING_RULES.correctShieldSeconds} giây và hồi nộ. Sai: chờ {LEARNING_RULES.wrongDelaySeconds} giây, không nộ, xóa khiên cũ. Chọn đáp án để xem giải thích.</p>}
      </div>
      <p className="learning-source">Tham khảo: Giáo trình Kinh tế chính trị Mác – Lênin, chương 3, tr. {quiz.question.sourcePages.join(', ')}.</p>
      <div className="learning-bottom"><span>{quiz.answer?'Đã trả lời · Đọc giải thích để tiếp tục cuộc đua':'Trả lời chính xác để giành lợi thế'}</span><button className="pixel-button primary" disabled={!quiz.canContinue} onClick={event=>pointerAction(event,()=>onContinue(quiz.roundId))}>{quiz.canContinue ? 'TIẾP TỤC NGAY →' : quiz.answer?`CHỜ ${Math.max(1,Math.ceil(quiz.penaltyRemainingSeconds-1e-8))} GIÂY`:'HÃY CHỌN MỘT ĐÁP ÁN'}</button></div>
      <button className="learning-exit" onClick={event=>pointerAction(event,onExit)}>Kết thúc lượt chơi và về trang chủ</button>
    </section>
  </div>;
}
