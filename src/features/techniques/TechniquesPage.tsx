import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Callout, PageHeader } from '../../components/ui';
import { TECHNIQUES, type Technique } from '../../content/trading/techniques';

const GROUPS = [...new Set(TECHNIQUES.map((t) => t.group))] as Technique['group'][];

export default function TechniquesPage() {
  const [group, setGroup] = useState<Technique['group'] | 'all'>('all');
  const list = TECHNIQUES.filter((t) => group === 'all' || t.group === group);
  return (
    <>
      <PageHeader title="เทคนิคการเทรด" subtitle="รวมวิธีที่ใช้กันทั่วไป เขียนเป็นกฎที่ทดสอบได้ พร้อมบอกว่าเหมาะกับตลาดแบบไหน พังเมื่อไร และคุมความเสี่ยงอย่างไร" />
      <Callout kind="warn">ไม่มีเทคนิคไหนชนะทุกสภาพตลาด ทุกวิธีมีช่วงที่ขาดทุนติดกัน — ทดสอบใน Backtester และ Paper Trading ก่อน และเลือกวิธีที่ตรงกับเวลาและนิสัยของตัวเอง เนื้อหานี้เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน</Callout>
      <div role="group" aria-label="กรองตามหมวด" className="mt-4 flex flex-wrap gap-1.5">
        {(['all', ...GROUPS] as const).map((g) => (
          <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}
            className={`btn !rounded-full ${group === g ? '!border-slate-900 !bg-slate-900 !text-white dark:!border-white dark:!bg-white dark:!text-slate-950' : ''}`}>
            {g === 'all' ? `ทั้งหมด (${TECHNIQUES.length})` : g}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {list.map((t) => (
          <article key={t.id} id={t.id} className="card flex flex-col">
            <header>
              <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{t.group}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">ระดับ{t.level}</span>
              </div>
              <h2 className="h2 mt-2">{t.th} <span className="text-sm font-normal text-slate-500">{t.en}</span></h2>
            </header>
            <p className="mt-2 text-sm leading-relaxed">{t.idea}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-green-50 p-2.5 dark:bg-green-500/10"><dt className="text-xs font-semibold text-green-800 dark:text-green-300">มักได้ผลเมื่อ</dt><dd className="mt-0.5">{t.works}</dd></div>
              <div className="rounded-lg bg-red-50 p-2.5 dark:bg-red-500/10"><dt className="text-xs font-semibold text-red-800 dark:text-red-300">มักพังเมื่อ</dt><dd className="mt-0.5">{t.fails}</dd></div>
            </dl>
            <h3 className="mt-3 text-xs font-semibold text-slate-500">กฎที่เขียนให้ทดสอบได้</h3>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm">{t.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-3 text-sm"><span className="text-xs font-semibold text-slate-500">คุมความเสี่ยง: </span>{t.risk}</p>
            <details className="mt-2 text-sm">
              <summary className="font-medium text-green-700 dark:text-green-400">กับดักที่พบบ่อย</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">{t.pitfalls.map((p) => <li key={p}>{p}</li>)}</ul>
            </details>
            {t.tryIt && <Link to={t.tryIt.to} className="btn mt-auto self-start !mt-4">{t.tryIt.label} <ArrowRight size={14} /></Link>}
          </article>
        ))}
      </div>
    </>
  );
}
