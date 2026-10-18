import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDot, Clock } from 'lucide-react';
import { CURRICULUM } from '../../content/curriculum';
import { Loading, PageHeader, Callout } from '../../components/ui';
import { MASTERY, useProgress } from './state';
import { pct } from '../../lib/format';

export default function LearnPage() {
  const [progress, , { loading, error }] = useProgress();
  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="ห้องเรียน (Learning Path)" subtitle="หลักสูตร 17 ระดับ จากศูนย์ถึง Capstone เรียนข้ามได้ทุกบท — เงื่อนไขก่อนเรียนเป็นคำแนะนำ ไม่ได้ล็อก" />
      {error && <Callout kind="warn">{error}</Callout>}
      <div className="space-y-4">
        {CURRICULUM.map((lv) => (
          <section key={lv.id} className="card" aria-labelledby={lv.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={lv.id} className="h2">Level {lv.level} — {lv.title} <span className="text-sm font-normal text-slate-500">({lv.en})</span></h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{lv.difficulty}</span>
            </div>
            <p className="muted mt-1">เป้าหมาย: {lv.objectives.join(' · ')}</p>
            {lv.prerequisites.length > 0 && <p className="mt-1 text-xs text-slate-500">แนะนำให้เรียนก่อน: {lv.prerequisites.join(', ')}</p>}
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {lv.lessons.map((l) => {
                const p = progress.lessons[l.id];
                const Icon = p?.status === 'done' ? CheckCircle2 : p ? CircleDot : Circle;
                return (
                  <li key={l.id}>
                    <Link to={`/learn/${l.id}`} className="flex items-center gap-3 rounded px-1 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <Icon size={18} className={p?.status === 'done' ? 'text-green-600' : p ? 'text-cyan-500' : 'text-slate-400'} aria-label={p?.status === 'done' ? 'เรียนจบ' : p ? 'กำลังเรียน' : 'ยังไม่เริ่ม'} />
                      <span className="flex-1">
                        <span className="font-medium">{l.title}</span>
                        {l.outline && <span className="ml-2 rounded bg-amber-100 px-1.5 text-[11px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">โครงร่าง</span>}
                        <span className="block text-xs text-slate-500">{l.summary}</span>
                      </span>
                      {p?.best !== undefined && p?.best !== null && (
                        <span className={`text-xs ${p.best >= MASTERY ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>quiz {pct(p.best, 0)}{p.best >= MASTERY ? ' · พร้อมไปต่อ' : ''}</span>
                      )}
                      <span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex"><Clock size={12} />{l.minutes} นาที</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
