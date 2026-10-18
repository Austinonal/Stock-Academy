import { useState } from 'react';
import type { Quiz } from '../../content/curriculum';
import { gradeQuiz } from './state';

/** Learner must answer every question before seeing results; scoring uses the answer key, never random. */
export function QuizView({ quiz, onSubmit }: { quiz: Quiz[]; onSubmit: (correct: boolean[], score: number) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [result, setResult] = useState<ReturnType<typeof gradeQuiz> | null>(null);
  const complete = answers.every((a) => a !== null);

  const submit = () => {
    const r = gradeQuiz(quiz, answers);
    setResult(r);
    onSubmit(r.correct, r.score);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (complete && !result) submit(); }} aria-label="แบบทดสอบ">
      <ol className="space-y-4">
        {quiz.map((q, i) => (
          <li key={q.id}>
            <fieldset>
              <legend className="font-medium">{i + 1}. {q.q}</legend>
              <div className="mt-2 grid gap-1.5">
                {q.choices.map((c, j) => {
                  const chosen = answers[i] === j;
                  const showRight = result && j === q.answer;
                  const showWrong = result && chosen && j !== q.answer;
                  return (
                    <label key={j} className={`flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm ${showRight ? 'border-green-500 bg-green-50 dark:bg-green-950/40' : showWrong ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : chosen ? 'border-green-500' : 'border-slate-200 dark:border-slate-700'}`}>
                      <input type="radio" name={q.id} checked={chosen} disabled={!!result} onChange={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))} />
                      <span className="flex-1">{c}{result && (chosen || j === q.answer) && <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{showRight ? '✓ ' : '✗ '}{q.why[j]}</span>}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {!result ? (
        <button type="submit" className="btn btn-primary mt-4" disabled={!complete}>{complete ? 'ส่งคำตอบ' : `ตอบให้ครบก่อน (${answers.filter((a) => a !== null).length}/${quiz.length})`}</button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3" role="status">
          <span className="text-lg font-semibold">คะแนน {result.correct.filter(Boolean).length}/{quiz.length}</span>
          <button type="button" className="btn" onClick={() => { setAnswers(quiz.map(() => null)); setResult(null); }}>ทำใหม่</button>
        </div>
      )}
    </form>
  );
}
