import { useMemo, useState } from 'react';
import type { SeriesMarker, Time } from 'lightweight-charts';
import { PriceChart } from '../../components/charts/PriceChart';
import { Callout, Field, Loading, PageHeader } from '../../components/ui';
import { detectAll, detectAt, PATTERN_INFO, type PatternId } from '../../core/patterns/candles';
import { EXAMPLES, toCandles } from '../../core/patterns/examples';
import { rng } from '../../core/market-data/random';
import { useMarket } from '../market';
import { SeriesPicker } from '../SeriesPicker';
import { fmt, pct } from '../../lib/format';

const NONE = 'none' as const;
type Choice = PatternId | typeof NONE;
const label = (c: Choice) => (c === NONE ? 'ไม่มีรูปแบบชัดเจน' : `${PATTERN_INFO[c].th} (${PATTERN_INFO[c].en})`);

function makeRound(round: number) {
  const r = rng(round * 7919 + 13);
  const ex = EXAMPLES[Math.floor(r() * EXAMPLES.length)];
  const candles = toCandles(ex.bars, 0.6 + r() * 3);
  const hits = detectAt(candles, candles.length - 1);
  const truth = new Set<Choice>(hits.length ? hits.map((h) => h.id) : [NONE]);
  const pool = (Object.keys(PATTERN_INFO) as PatternId[]).filter((p) => !truth.has(p));
  const distract: Choice[] = [];
  while (distract.length < 2) { const p = pool[Math.floor(r() * pool.length)]; if (!distract.includes(p)) distract.push(p); }
  const options = [...new Set<Choice>([[...truth][0], ...distract, NONE])].sort(() => r() - 0.5);
  return { candles, hits, truth, options };
}

export default function PatternLabPage() {
  const [round, setRound] = useState(1);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const q = useMemo(() => makeRound(round), [round]);

  const market = useMarket();
  const [symbol, setSymbol] = useState('DMSTEEL');
  const [filter, setFilter] = useState<PatternId>('bullishEngulfing');
  const [horizon, setHorizon] = useState(5);
  const series = market.get(symbol, '1D');
  const candles = useMemo(() => series?.candles ?? [], [series]);
  const allHits = useMemo(() => detectAll(candles), [candles]);
  const hits = allHits.filter((h) => h.id === filter);
  const markers = useMemo<SeriesMarker<Time>[]>(() => hits.map((h) => ({ time: candles[h.index].time as Time, position: PATTERN_INFO[h.id].bias === 'bearish' ? 'aboveBar' : 'belowBar', color: '#f59e0b', shape: 'circle', text: PATTERN_INFO[h.id].en })), [hits, candles]);
  // Historical study of what happened AFTER each occurrence — uses future bars on purpose, as a statistics lesson, never as a signal
  const fwd = hits.filter((h) => h.index + horizon < candles.length).map((h) => candles[h.index + horizon].close / candles[h.index].close - 1);
  const avg = fwd.length ? fwd.reduce((a, b) => a + b, 0) / fwd.length : null;
  const up = fwd.length ? fwd.filter((x) => x > 0).length / fwd.length : null;
  const baseline = candles.length > horizon ? candles.slice(0, -horizon).map((c, i) => candles[i + horizon].close / c.close - 1) : [];
  const baseUp = baseline.length ? baseline.filter((x) => x > 0).length / baseline.length : null;

  const answer = (c: Choice) => {
    if (picked) return;
    setPicked(c);
    setScore((s) => ({ right: s.right + (q.truth.has(c) ? 1 : 0), total: s.total + 1 }));
  };

  if (market.loading) return <Loading />;
  return (
    <>
      <PageHeader title="Pattern Lab" subtitle="ฝึกจำแนกแท่งเทียนด้วยเกณฑ์ที่วัดได้ และดูสถิติว่ารูปแบบ 'ได้ผล' จริงแค่ไหน" demo />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card" aria-labelledby="drill">
          <div className="flex items-baseline justify-between"><h2 id="drill" className="h2">แบบฝึก: แท่งสุดท้ายคือรูปแบบอะไร?</h2><span className="text-sm text-slate-500">ถูก {score.right}/{score.total}</span></div>
          <p className="muted mb-2">ดูบริบท 5 แท่งก่อนหน้าด้วย เพราะบางรูปแบบต้องอาศัยแนวโน้มก่อนหน้า</p>
          <PriceChart candles={q.candles} showVolume={false} height={240} ariaLabel="ตัวอย่างแท่งเทียน" />
          <div className="mt-3 grid gap-1.5">
            {q.options.map((o) => (
              <button key={o} onClick={() => answer(o)} disabled={!!picked}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${picked && q.truth.has(o) ? 'border-green-500 bg-green-50 dark:bg-green-950/40' : picked === o ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-slate-200 dark:border-slate-700'}`}>{label(o)}</button>
            ))}
          </div>
          {picked && (
            <div className="mt-3 text-sm" role="status">
              <p className="font-medium">{q.truth.has(picked) ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'}</p>
              {q.hits.length === 0 ? <p className="mt-1">ตัวตรวจจับไม่พบรูปแบบใดที่เข้าเกณฑ์ — แท่งทั่วไปส่วนใหญ่ไม่ได้เป็น "รูปแบบ"</p> :
                <ul className="mt-1 list-disc pl-5">{q.hits.map((h) => <li key={h.id}><strong>{label(h.id)}</strong>: {h.reason} (เกณฑ์: {PATTERN_INFO[h.id].rule})</li>)}</ul>}
              <button className="btn btn-primary mt-3" onClick={() => { setRound((r) => r + 1); setPicked(null); }}>ข้อถัดไป</button>
            </div>
          )}
        </section>
        <section className="card" aria-labelledby="rules">
          <h2 id="rules" className="h2">เกณฑ์ของตัวตรวจจับ</h2>
          <div className="mt-2 max-h-[520px] overflow-auto"><table className="tbl"><thead><tr><th>รูปแบบ</th><th>มุมมองเชิงตำรา</th><th>เกณฑ์</th></tr></thead>
            <tbody>{(Object.keys(PATTERN_INFO) as PatternId[]).map((k) => <tr key={k}><td>{PATTERN_INFO[k].th}<div className="text-xs text-slate-500">{PATTERN_INFO[k].en}</div></td><td>{PATTERN_INFO[k].bias}</td><td className="text-xs">{PATTERN_INFO[k].rule}</td></tr>)}</tbody></table></div>
          <p className="muted mt-2 text-xs">การตรวจจับอัตโนมัติต้องลดความซับซ้อน อาจไม่ตรงกับการอ่านของนักวิเคราะห์ทุกคน และ "มุมมองเชิงตำรา" ไม่ใช่การรับประกันทิศทาง</p>
        </section>
      </div>

      <section className="card mt-4" aria-labelledby="scan">
        <h2 id="scan" className="h2">สแกนข้อมูลย้อนหลัง + สถิติหลังเกิดรูปแบบ</h2>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <SeriesPicker symbols={market.symbols} symbol={symbol} onSymbol={setSymbol} />
          <Field label="รูปแบบ">{(id) => (
            <select id={id} className="input w-64" value={filter} onChange={(e) => setFilter(e.target.value as PatternId)}>
              {(Object.keys(PATTERN_INFO) as PatternId[]).map((k) => <option key={k} value={k}>{label(k)} — {allHits.filter((h) => h.id === k).length} ครั้ง</option>)}
            </select>)}</Field>
          <Field label="ดูผลหลังจากนั้น (แท่ง)">{(id) => <select id={id} className="input w-24" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>{[1, 5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}</select>}</Field>
        </div>
        <div className="mt-3 p-1"><PriceChart candles={candles} markers={markers} height={360} /></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>พบ <strong>{hits.length}</strong> ครั้ง</div>
          <div>ผลตอบแทนเฉลี่ย {horizon} แท่งหลังเกิด: <strong>{pct(avg, 2)}</strong></div>
          <div>สัดส่วนที่ราคาสูงขึ้น: <strong>{pct(up, 0)}</strong> (n = {fwd.length})</div>
          <div>ฐานเทียบ (ทุกวัน): <strong>{pct(baseUp, 0)}</strong></div>
        </div>
        <Callout kind="warn">นี่คือการศึกษาข้อมูลย้อนหลัง (ใช้ข้อมูลหลังเกิดรูปแบบโดยตั้งใจ) ไม่ใช่สัญญาณซื้อขาย ข้อมูลจำลองนี้ไม่มีกลไกที่ทำให้รูปแบบมีพลังทำนาย — ถ้าสัดส่วนใกล้ฐานเทียบ แปลว่ารูปแบบไม่ได้เพิ่มข้อมูล ตัวอย่างจำนวนน้อย (n &lt; 30) ยิ่งต้องระวัง</Callout>
        {hits.length > 0 && (
          <details className="mt-3"><summary className="cursor-pointer text-sm">รายการที่พบ ({hits.length})</summary>
            <div className="mt-2 max-h-60 overflow-auto"><table className="tbl"><thead><tr><th>วันที่</th><th>Close</th><th>เหตุผล</th><th>{horizon} แท่งต่อมา</th></tr></thead>
              <tbody>{hits.slice().reverse().map((h) => { const f = candles[h.index + horizon]; return <tr key={h.index}><td>{candles[h.index].time}</td><td>{fmt(candles[h.index].close)}</td><td className="text-xs">{h.reason}</td><td>{f ? pct(f.close / candles[h.index].close - 1) : 'ยังไม่มีข้อมูล'}</td></tr>; })}</tbody></table></div>
          </details>
        )}
      </section>
    </>
  );
}
