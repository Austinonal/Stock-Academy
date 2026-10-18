import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Loading, PageHeader } from '../../components/ui';
import { dueItems, gradeCard, useDeck, useProgress, type ReviewItem } from './state';
import type { Grade } from '../../core/learning/srs';

const GRADES: { g: Grade; label: string }[] = [{ g: 0, label: 'จำไม่ได้' }, { g: 1, label: 'ยาก' }, { g: 2, label: 'จำได้' }, { g: 3, label: 'ง่ายมาก' }];

export default function ReviewPage() {
  const [progress, , ps] = useProgress();
  const [deck, setDeck, ds] = useDeck();
  const [session, setSession] = useState<ReviewItem[] | null>(null);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const due = useMemo(() => (ps.loading || ds.loading ? [] : dueItems(progress, deck)), [progress, deck, ps.loading, ds.loading]);

  if (ps.loading || ds.loading) return <Loading />;
  // Freeze the queue at session start so grading a card doesn't reshuffle what's left
  const queue = session ?? due;
  const item = queue[pos];

  const grade = (g: Grade) => {
    if (!item) return;
    if (!session) setSession(queue);
    setDeck((d) => gradeCard(d, item.id, g));
    setPos((p) => p + 1); setRevealed(false); setPicked(null);
  };

  return (
    <>
      <PageHeader title="ทบทวนวันนี้ (Spaced Repetition)" subtitle="flashcard ของบทที่เริ่มเรียนแล้ว และคำถาม quiz ที่ถึงรอบทบทวน — ตอบได้ดี ช่วงห่างจะเพิ่มขึ้น จำไม่ได้จะกลับมาพรุ่งนี้" />
      {!item ? (
        <Empty title={pos > 0 ? `ทบทวนครบ ${pos} รายการแล้ว` : 'ไม่มีรายการที่ต้องทบทวนวันนี้'}>
          {pos === 0 && <>เริ่มเรียนบทเรียนและทำ quiz ใน <Link className="underline" to="/learn">ห้องเรียน</Link> เพื่อสร้างรายการทบทวน</>}
        </Empty>
      ) : (
        <div className="card mx-auto max-w-2xl">
          <div className="mb-2 text-xs text-slate-500">{pos + 1} / {queue.length} · {item.kind === 'quiz' ? 'คำถาม quiz' : 'flashcard'}</div>
          {item.kind === 'card' ? (
            <>
              <p className="text-lg font-medium">{item.q}</p>
              {revealed ? <p className="mt-3 rounded bg-slate-100 p-3 dark:bg-slate-800">{item.a}</p> : <button className="btn mt-3" onClick={() => setRevealed(true)}>แสดงคำตอบ</button>}
            </>
          ) : (
            <>
              <p className="text-lg font-medium">{item.quiz.q}</p>
              <div className="mt-3 grid gap-1.5">{item.quiz.choices.map((c, j) => (
                <button key={j} disabled={picked !== null} onClick={() => { setPicked(j); setRevealed(true); }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${picked !== null && j === item.quiz.answer ? 'border-green-500 bg-green-50 dark:bg-green-950/40' : picked === j ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
                  {c}{picked !== null && (j === picked || j === item.quiz.answer) && <span className="block text-xs text-slate-500">{item.quiz.why[j]}</span>}
                </button>))}</div>
            </>
          )}
          {revealed && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-500">ประเมินตัวเอง:</p>
              <div className="flex flex-wrap gap-2">
                {(item.kind === 'quiz' ? GRADES.filter((x) => (picked === item.quiz.answer ? x.g > 0 : x.g === 0)) : GRADES).map((x) => <button key={x.g} className="btn" onClick={() => grade(x.g)}>{x.label}</button>)}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
