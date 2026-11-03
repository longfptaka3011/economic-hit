import React, { useEffect, useRef } from 'react';
import type { QuizView } from '@market-mayhem/shared';

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
  const continueButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>('.learning-option')?.focus();
  }, [quiz.roundId]);
  useEffect(() => {
    if (quiz.answer) {
      if (quiz.canContinue) continueButton.current?.focus();
      else panel.current?.focus();
    }
  }, [quiz.roundId, quiz.answer?.optionIndex, quiz.canContinue]);

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
      <p className="learning-pause-note">Bạn đứng yên và được bảo vệ khỏi bị cắt đuôi. {online?'Đối thủ':'Bot'} và đồng hồ vẫn chạy. Trả lời, đọc giải thích rồi tiếp tục ngay, không cần chờ người khác.</p>
      {remainingSeconds!==undefined && <p className="learning-clock" role="timer">THỜI GIAN TRẬN CÒN {Math.floor(remainingSeconds/60)}:{Math.floor(remainingSeconds%60).toString().padStart(2,'0')}</p>}
      <p id="learning-prompt" className="learning-prompt">{quiz.question.prompt}</p>
      <div className="learning-options" role="group" aria-label="Chọn một đáp án">
        {quiz.question.options.map((option, index) => {
          const correct = quiz.answer?.correctIndex === index;
          const wrong = quiz.answer?.optionIndex === index && !quiz.answer.correct;
          return <button key={`${quiz.roundId}-${index}`} className={`learning-option${correct ? ' correct' : ''}${wrong ? ' wrong' : ''}`} disabled={!!quiz.answer} onClick={() => onAnswer(quiz.roundId, index)}>
            <span className="learning-letter">{'ABCD'[index]}</span><span>{option}</span>{correct && <span aria-label="Đáp án đúng">✓</span>}{wrong && <span aria-label="Bạn đã chọn đáp án sai">×</span>}
          </button>;
        })}
      </div>
      <div className="learning-feedback" role="status" aria-live="polite">
        {quiz.answer ? <><strong className={quiz.answer.correct ? 'feedback-correct' : 'feedback-review'}>{quiz.answer.correct ? 'Chính xác! Tiếp tục để hồi tối đa 20 nộ.' : 'Cùng xem lại đáp án. Bạn vẫn có thể tiếp tục.'}</strong><p>{quiz.answer.explanation}</p></> : <p>Chọn đáp án để mở phần giải thích. Không có giới hạn thời gian trả lời.</p>}
      </div>
      <p className="learning-source">Tham khảo: Giáo trình Kinh tế chính trị Mác – Lênin, chương 3, tr. {quiz.question.sourcePages.join(', ')}.</p>
      <div className="learning-bottom"><span>{quiz.answer?'Đã trả lời · Đọc giải thích để tiếp tục cuộc đua':'Trả lời sớm để trở lại cuộc đua'}</span><button ref={continueButton} className="pixel-button primary" disabled={!quiz.canContinue} onClick={() => onContinue(quiz.roundId)}>{quiz.canContinue ? 'TIẾP TỤC NGAY →' : 'HÃY CHỌN MỘT ĐÁP ÁN'}</button></div>
      <button className="learning-exit" onClick={onExit}>Kết thúc lượt chơi và về trang chủ</button>
    </section>
  </div>;
}
