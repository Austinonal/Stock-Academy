import { Link } from 'react-router-dom';
import { ArrowRight, Repeat } from 'lucide-react';
import { PageHeader, Stat, Loading, Callout, DemoBadge } from '../../components/ui';
import { dueItems, stats, useDeck, useProgress } from '../learning/state';
import { DEMO_DEFS } from '../../core/market-data/demo';
import { pct } from '../../lib/format';

export default function DashboardPage() {
  const [progress, , ps] = useProgress();
  const [deck, , ds] = useDeck();
  if (ps.loading || ds.loading) return <Loading />;
  const s = stats(progress);
  const due = dueItems(progress, deck).length;

  return (
    <>
      <PageHeader title="แดชบอร์ด" subtitle="ภาพรวมการเรียนรู้ของคุณ — ข้อมูลทั้งหมดเก็บในเบราว์เซอร์ของอุปกรณ์นี้" />
      {(ps.error || ds.error) && <Callout kind="warn">{ps.error ?? ds.error}</Callout>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="บทเรียนที่เรียนจบ" value={`${s.done} / ${s.total}`} />
        <Stat label="คะแนน quiz เฉลี่ย (ดีที่สุดต่อบท)" value={pct(s.avg, 0)} />
        <Stat label="จำนวนครั้งที่ทำ quiz" value={s.attempts} />
        <Stat label="รายการที่ควรทบทวนวันนี้" value={due} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2" aria-labelledby="next">
          <h2 id="next" className="h2">บทเรียนถัดไป</h2>
          {s.next ? (
            <div className="mt-2">
              <p className="text-sm text-slate-500">Level {s.next.level}</p>
              <p className="font-medium">{s.next.title}</p>
              <p className="muted mt-1">{s.next.summary}</p>
              <Link to={`/learn/${s.next.id}`} className="btn btn-primary mt-3">เริ่มเรียน <ArrowRight size={16} /></Link>
            </div>
          ) : <p className="muted mt-2">คุณเรียนครบทุกบทแล้ว 🎉 ลองทำ Capstone และทบทวนต่อ</p>}
          {due > 0 && <Link to="/review" className="btn mt-3 ml-2"><Repeat size={16} /> ทบทวน {due} รายการ</Link>}
        </section>
        <section className="card" aria-labelledby="data">
          <h2 id="data" className="h2">ข้อมูลที่ใช้อยู่</h2>
          <div className="mt-2"><DemoBadge /></div>
          <ul className="mt-2 space-y-1 text-sm">
            {DEMO_DEFS.map((d) => <li key={d.symbol}><span className="font-mono font-semibold">{d.symbol}</span> — <span className="muted">{d.story}</span></li>)}
          </ul>
          <p className="muted mt-2 text-xs">Symbol ทั้งหมดเป็นบริษัทสมมติ นำเข้าข้อมูลของคุณเองได้ที่ <Link className="underline" to="/data">Data Center</Link></p>
        </section>
      </div>
      <section className="card mt-4" aria-labelledby="levels">
        <h2 id="levels" className="h2">ความคืบหน้ารายระดับ</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {s.levels.map((l) => (
            <li key={l.id} className="text-sm">
              <div className="flex justify-between"><span>L{l.level} · {l.title}</span><span className="tabular-nums text-slate-500">{l.done}/{l.total}</span></div>
              <div className="mt-1 h-1.5 rounded bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={l.total} aria-valuenow={l.done} aria-label={`Level ${l.level}`}>
                <div className="h-1.5 rounded bg-cyan-500" style={{ width: `${(l.done / l.total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
