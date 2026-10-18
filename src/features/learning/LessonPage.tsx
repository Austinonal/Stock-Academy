import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FlaskConical } from 'lucide-react';
import { ALL_LESSONS, findLesson } from '../../content/curriculum';
import { Callout, Loading, PageHeader } from '../../components/ui';
import { applyQuizToDeck, markDone, markStarted, MASTERY, recordQuiz, useDeck, useProgress } from './state';
import { QuizView } from './QuizView';
import { CompoundCalculator, RealReturnCalculator } from './widgets';
import { pct } from '../../lib/format';

export default function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = findLesson(lessonId);
  const [progress, setProgress, { loading }] = useProgress();
  const [, setDeck] = useDeck();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  useEffect(() => { if (!loading && lesson) setProgress((p) => markStarted(p, lesson.id)); }, [loading, lesson, setProgress]);

  if (!lesson) return <div className="card"><h1 className="h1">ไม่พบบทเรียน</h1><Link to="/learn" className="btn mt-3">กลับห้องเรียน</Link></div>;
  if (loading) return <Loading />;
  const p = progress.lessons[lesson.id];
  const idx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
  const prev = ALL_LESSONS[idx - 1];
  const next = ALL_LESSONS[idx + 1];
  const done = p?.status === 'done';

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/learn" className="muted inline-flex items-center gap-1 hover:underline"><ArrowLeft size={14} /> ห้องเรียน · Level {lesson.level}</Link>
      <PageHeader title={lesson.title} subtitle={lesson.summary}>
        <button className={`btn ${done ? '' : 'btn-primary'}`} onClick={() => setProgress((x) => markDone(x, lesson.id, !done))} aria-pressed={done}>
          <CheckCircle2 size={16} /> {done ? 'เรียนจบแล้ว (กดเพื่อยกเลิก)' : 'ทำเครื่องหมายว่าเรียนจบ'}
        </button>
      </PageHeader>
      {lesson.outline && <Callout kind="warn">บทนี้เป็น <strong>โครงร่างหัวข้อ</strong> พร้อมแบบทดสอบ — เนื้อหาบทเรียนเต็มยังอยู่ระหว่างพัฒนา ใช้เป็นแผนที่การเรียนและลิงก์ไปยังห้องแล็บที่เกี่ยวข้อง</Callout>}

      <section className="card mt-4">
        <h2 className="h2">เป้าหมายการเรียนรู้</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        {lesson.prerequisites.length > 0 && <p className="mt-2 text-xs text-slate-500">ควรเรียนก่อน: {lesson.prerequisites.map((id) => <Link key={id} className="mr-2 underline" to={`/learn/${id}`}>{findLesson(id)?.title ?? id}</Link>)}</p>}
        <p className="mt-1 text-xs text-slate-500">เวลาโดยประมาณ {lesson.minutes} นาที</p>
      </section>

      <div className="mt-4 space-y-4">
        {lesson.blocks.map((b, i) => (
          <section key={i} className="space-y-2">
            {b.h && <h2 className="h2">{b.h}</h2>}
            {b.p?.map((t) => <p key={t} className="leading-relaxed">{t}</p>)}
            {b.list && <ul className="list-disc space-y-1 pl-5">{b.list.map((t) => <li key={t}>{t}</li>)}</ul>}
            {b.formula && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 font-mono text-sm dark:bg-slate-900">{b.formula}</pre>}
            {b.example && <div className="rounded-lg border-l-4 border-cyan-500 bg-cyan-50/60 p-3 dark:bg-cyan-950/30"><div className="mb-1 text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300">ตัวอย่างทีละขั้น</div><ol className="list-decimal space-y-1 pl-5 text-sm">{b.example.map((t) => <li key={t}>{t}</li>)}</ol></div>}
            {b.table && <div className="overflow-x-auto"><table className="tbl"><thead><tr>{b.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{b.table.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
            {b.note && <Callout kind="warn">{b.note}</Callout>}
          </section>
        ))}
      </div>

      {lesson.widget && (
        <section className="card mt-4"><h2 className="h2 mb-2">ลองคำนวณเอง</h2>{lesson.widget === 'compound' ? <CompoundCalculator /> : <RealReturnCalculator />}</section>
      )}
      {lesson.tryIt && <div className="mt-4 flex flex-wrap gap-2">{lesson.tryIt.map((t) => <Link key={t.label} to={t.to} className="btn"><FlaskConical size={16} /> {t.label}</Link>)}</div>}

      {lesson.mistakes.length > 0 && (
        <section className="mt-6"><h2 className="h2">ข้อผิดพลาดที่พบบ่อย</h2><ul className="mt-2 list-disc pl-5">{lesson.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></section>
      )}

      <section className="card mt-6" aria-labelledby="quiz">
        <div className="flex items-baseline justify-between"><h2 id="quiz" className="h2">แบบทดสอบท้ายบท</h2>
          {p?.best !== undefined && p?.best !== null && <span className="text-sm text-slate-500">ดีที่สุด {pct(p.best, 0)} · ทำแล้ว {p.attempts} ครั้ง{p.best >= MASTERY ? ' · พร้อมไปต่อ ✓' : ''}</span>}</div>
        <p className="muted mb-3">ลองตอบเองก่อน เฉลยและเหตุผลของแต่ละตัวเลือกจะแสดงหลังส่ง ข้อที่ตอบผิดจะถูกนัดทบทวนพรุ่งนี้</p>
        <QuizView key={lesson.id} quiz={lesson.quiz} onSubmit={(correct, score) => {
          setProgress((x) => recordQuiz(x, lesson.id, score));
          setDeck((d) => applyQuizToDeck(d, lesson.quiz, correct));
        }} />
      </section>

      {lesson.flashcards.length > 0 && (
        <section className="mt-6"><h2 className="h2">Active recall — ลองนึกคำตอบก่อนพลิก</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{lesson.flashcards.map((f) => (
            <button key={f.id} className="card text-left hover:border-cyan-500" onClick={() => setFlipped((s) => ({ ...s, [f.id]: !s[f.id] }))} aria-expanded={!!flipped[f.id]}>
              <div className="text-sm font-medium">{f.q}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{flipped[f.id] ? f.a : 'แตะเพื่อดูคำตอบ'}</div>
            </button>))}</div>
        </section>
      )}

      <section className="mt-6"><h2 className="h2">สรุปทบทวน</h2><ul className="mt-2 list-disc pl-5">{lesson.recap.map((r) => <li key={r}>{r}</li>)}</ul></section>
      <section className="mt-4"><h2 className="h2">อ่านต่อ</h2><ul className="mt-2 space-y-1">{lesson.refs.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-700 underline dark:text-cyan-400">{r.label} <ExternalLink size={12} /></a></li>)}</ul></section>

      <nav className="mt-8 flex justify-between gap-2" aria-label="บทเรียนก่อนหน้า/ถัดไป">
        {prev ? <Link className="btn" to={`/learn/${prev.id}`}><ArrowLeft size={16} /> {prev.title}</Link> : <span />}
        {next && <Link className="btn" to={`/learn/${next.id}`}>{next.title} <ArrowRight size={16} /></Link>}
      </nav>
    </article>
  );
}
