import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { Callout, PageHeader } from '../../components/ui';
import { CHART_PATTERNS, type ChartPattern } from '../../content/trading/chartPatterns';
import { DiagramLegend, PatternDiagram } from './PatternDiagram';

const KIND: Record<ChartPattern['kind'], string> = { reversal: 'กลับตัว', continuation: 'ไปต่อ', bilateral: 'ได้สองทาง' };
const BIAS: Record<ChartPattern['bias'], { label: string; cls: string }> = {
  bullish: { label: '▲ ตำรามองขึ้น', cls: 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-500/10' },
  bearish: { label: '▼ ตำรามองลง', cls: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-500/10' },
  neutral: { label: '◆ รอทิศทาง', cls: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' },
};

export default function ChartPatternsPage() {
  const [kind, setKind] = useState<ChartPattern['kind'] | 'all'>('all');
  const list = CHART_PATTERNS.filter((p) => kind === 'all' || p.kind === kind);

  return (
    <>
      <PageHeader title="รูปแบบกราฟ (Chart Patterns)" subtitle="รูปแบบราคาที่นักวิเคราะห์ใช้กันแพร่หลาย — แต่ละแบบบอกว่าตำราคาดว่าจะเกิดอะไรต่อ ต้องรอสัญญาณอะไร วัดเป้าอย่างไร และเมื่อไรถือว่าผิด">
        <Link to="/patterns" className="btn"><FlaskConical size={16} /> ฝึกแท่งเทียนใน Pattern Lab</Link>
      </PageHeader>
      <Callout kind="warn">รูปแบบกราฟบอก <strong>ความเป็นไปได้ที่นักวิเคราะห์คาด</strong> ไม่ใช่สิ่งที่จะเกิดแน่นอน รูปแบบล้มเหลวได้บ่อย และดูชัดกว่าจริงเมื่อมองย้อนหลัง จึงต้องรอการยืนยัน มีจุดที่ยอมรับว่าผิด และกำหนดขนาดความเสี่ยงก่อนเสมอ</Callout>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="กรองตามประเภท" className="flex flex-wrap gap-1.5">
          {(['all', 'reversal', 'continuation', 'bilateral'] as const).map((k) => (
            <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}
              className={`btn !rounded-full ${kind === k ? '!border-slate-900 !bg-slate-900 !text-white dark:!border-white dark:!bg-white dark:!text-slate-950' : ''}`}>
              {k === 'all' ? `ทั้งหมด (${CHART_PATTERNS.length})` : `${KIND[k]} (${CHART_PATTERNS.filter((p) => p.kind === k).length})`}
            </button>
          ))}
        </div>
        <DiagramLegend />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {list.map((p) => (
          <article key={p.id} id={p.id} className="card flex flex-col">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="h2">{p.th} <span className="text-sm font-normal text-slate-500">{p.en}</span></h2>
              <div className="flex gap-1.5 text-xs font-medium">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{KIND[p.kind]}</span>
                <span className={`rounded-md px-2 py-0.5 ${BIAS[p.bias].cls}`}>{BIAS[p.bias].label}</span>
              </div>
            </header>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60"><PatternDiagram p={p} /></div>
            <p className="mt-3 text-sm leading-relaxed">{p.summary}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"><dt className="text-xs font-semibold text-slate-500">ยืนยันเมื่อ</dt><dd className="mt-0.5">{p.confirm}</dd></div>
              <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"><dt className="text-xs font-semibold text-slate-500">ถือว่าผิดเมื่อ</dt><dd className="mt-0.5">{p.invalidation}</dd></div>
              <div className="rounded-lg border border-slate-200 p-2.5 sm:col-span-2 dark:border-slate-800"><dt className="text-xs font-semibold text-slate-500">วิธีวัดเป้าตามตำรา (measured move)</dt><dd className="mt-0.5">{p.target}</dd></div>
            </dl>
            <details className="mt-3 text-sm">
              <summary className="font-medium text-green-700 dark:text-green-400">วิธีสังเกตและข้อควรระวัง</summary>
              <h3 className="mt-2 text-xs font-semibold text-slate-500">วิธีสังเกต</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">{p.read.map((r) => <li key={r}>{r}</li>)}</ul>
              <h3 className="mt-2 text-xs font-semibold text-slate-500">กับดักที่พบบ่อย</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">{p.pitfalls.map((r) => <li key={r}>{r}</li>)}</ul>
            </details>
          </article>
        ))}
      </div>
      <p className="muted mt-6">ลองหารูปแบบเหล่านี้บนข้อมูลจำลองด้วยเครื่องมือวาดใน <Link className="underline" to="/chart">ห้องฝึกกราฟ</Link> แล้วใช้ Replay ดูว่าเกิดอะไรต่อ — ส่วนใหญ่จะพบว่าไม่ได้เป็นไปตามตำราทุกครั้ง</p>
    </>
  );
}
