import { useMemo, useState } from 'react';
import { PriceChart } from '../../components/charts/PriceChart';
import { Callout, Field, Loading, PageHeader } from '../../components/ui';
import { INDICATORS, defaultParams } from '../../core/indicators/catalog';
import { useMarket } from '../market';
import { SeriesPicker } from '../SeriesPicker';
import { useIndicatorLines, type Active } from './useIndicatorLines';
import { fmt } from '../../lib/format';

export default function IndicatorLabPage() {
  const market = useMarket();
  const [symbol, setSymbol] = useState('DMSTEEL');
  const [id, setId] = useState('rsi');
  const def = INDICATORS.find((d) => d.id === id)!;
  const [params, setParams] = useState<Record<string, number>>(defaultParams(def));
  const [compare, setCompare] = useState(false);
  const series = market.get(symbol, '1D');
  const candles = useMemo(() => series?.candles.slice(-250) ?? [], [series]);

  const p2 = useMemo(() => Object.fromEntries(def.params.map((p) => [p.key, Math.min(p.max, Math.max(p.min, Math.round(params[p.key] * 2)))])), [def, params]);
  const active = useMemo<Active[]>(() => [{ uid: 'a', id, params }, ...(compare && def.params.length ? [{ uid: 'b', id, params: p2 }] : [])], [id, params, compare, p2, def]);
  const lines = useIndicatorLines(candles, active);
  const recolored = useMemo(() => ({
    overlays: lines.overlays.map((o, i) => (compare && i >= lines.overlays.length / 2 ? { ...o, color: '#f472b6', label: `${o.label} (เทียบ)` } : o)),
    panes: lines.panes.map((p, i) => (i === 1 ? { ...p, title: `${p.title} (เทียบ)`, lines: p.lines.map((l) => ({ ...l, color: '#f472b6' })) } : p)),
  }), [lines, compare]);

  const first = def.compute(candles, params);
  const warm = first[0]?.data.findIndex((v) => v !== null) ?? -1;

  if (market.loading) return <Loading />;
  return (
    <>
      <PageHeader title="Indicator Lab" subtitle="เลือก indicator ปรับพารามิเตอร์ และเปรียบเทียบความไว — ทุกเส้นคำนวณจริงจากข้อมูลบนกราฟ" demo={series?.meta.source === 'synthetic'} />
      <div className="card mb-3 flex flex-wrap items-end gap-3">
        <SeriesPicker symbols={market.symbols} symbol={symbol} onSymbol={setSymbol} />
        <Field label="Indicator">{(fid) => (
          <select id={fid} className="input w-80" value={id} onChange={(e) => { const d = INDICATORS.find((x) => x.id === e.target.value)!; setId(d.id); setParams(defaultParams(d)); }}>
            {(['Trend', 'Momentum', 'Volatility', 'Volume'] as const).map((g) => <optgroup key={g} label={g}>{INDICATORS.filter((d) => d.group === g).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>)}
          </select>)}</Field>
        {def.params.map((p) => (
          <Field key={p.key} label={`${p.label} (${p.min}–${p.max})`}>{(fid) => (
            <input id={fid} type="number" className="input w-24" min={p.min} max={p.max} value={params[p.key]}
              onChange={(e) => { const v = Math.round(Number(e.target.value)); if (v >= p.min && v <= p.max) setParams((x) => ({ ...x, [p.key]: v })); }} />)}</Field>
        ))}
        {def.params.length > 0 && <label className="flex items-center gap-2 pb-1.5 text-sm"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> เทียบกับพารามิเตอร์ ×2 (สีชมพู)</label>}
      </div>
      <div className="card p-2"><PriceChart candles={candles} showVolume={def.group === 'Volume'} overlays={recolored.overlays} panes={recolored.panes} height={380} /></div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2">{def.name}</h2>
          <dl className="mt-2 space-y-2 text-sm">
            <div><dt className="font-medium">สูตร</dt><dd><pre className="whitespace-pre-wrap rounded bg-slate-100 p-2 font-mono text-xs dark:bg-slate-800">{def.formula}</pre></dd></div>
            <div><dt className="font-medium">ความหมาย</dt><dd>{def.meaning}</dd></div>
            <div><dt className="font-medium">การตีความผิดที่พบบ่อย / ข้อจำกัด</dt><dd>{def.pitfalls}</dd></div>
            <div><dt className="font-medium">ช่วง warm-up</dt><dd>{warm < 0 ? 'ข้อมูลไม่พอคำนวณเลย' : `${warm} แท่งแรกไม่มีค่า (แสดงเป็นช่องว่าง ไม่ใช่ 0)`}</dd></div>
            {def.params.length > 0 && <div><dt className="font-medium">พารามิเตอร์กับความไว</dt><dd>period สั้น = ตอบสนองเร็ว แต่สัญญาณหลอกมาก · period ยาว = เรียบและช้ากว่า เปิด "เทียบ" เพื่อดูความต่าง</dd></div>}
          </dl>
        </section>
        <section className="card">
          <h2 className="h2">ตัวอย่างตัวเลข 5 แท่งล่าสุด</h2>
          <div className="mt-2 overflow-x-auto"><table className="tbl"><thead><tr><th>วันที่</th><th>Close</th>{first.map((l) => <th key={l.key}>{l.label}</th>)}</tr></thead>
            <tbody>{candles.slice(-5).map((c, k) => { const i = candles.length - 5 + k; return <tr key={c.time}><td>{c.time}</td><td className="tabular-nums">{fmt(c.close)}</td>{first.map((l) => <td key={l.key} className="tabular-nums">{fmt(l.data[i])}</td>)}</tr>; })}</tbody></table></div>
          <Callout kind="warn">indicator สรุปข้อมูลในอดีต ไม่ได้ทำนายอนาคต และหลายตัวที่ "ตรงกัน" มักมาจากข้อมูลราคาชุดเดียวกัน จึงไม่ได้เป็นหลักฐานอิสระ</Callout>
        </section>
      </div>
    </>
  );
}
