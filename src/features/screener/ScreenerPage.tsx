import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Save, Trash2 } from 'lucide-react';
import { Callout, Empty, Field, PageHeader } from '../../components/ui';
import { buildUniverse, screen, type Filters, type NumericKey, type ScreenRow } from '../../core/fundamentals/universe';
import { usePersistent } from '../../storage/usePersistent';
import { fmt, int, pct } from '../../lib/format';

const UNIVERSE = buildUniverse();
const SECTORS = [...new Set(UNIVERSE.map((r) => r.sector))];
// Percent fields are entered as % in the UI and stored as fractions
const COLS: { key: NumericKey; label: string; pct?: boolean; show: (r: ScreenRow) => string }[] = [
  { key: 'price', label: 'ราคา (฿)', show: (r) => fmt(r.price) },
  { key: 'marketCap', label: 'Market cap (ล้าน฿)', show: (r) => int(r.marketCap) },
  { key: 'pe', label: 'P/E', show: (r) => (r.pe === null ? 'N/A' : fmt(r.pe, 1)) },
  { key: 'pb', label: 'P/B', show: (r) => fmt(r.pb) },
  { key: 'revenueGrowth', label: 'รายได้โต (%)', pct: true, show: (r) => pct(r.revenueGrowth) },
  { key: 'netMargin', label: 'Net margin (%)', pct: true, show: (r) => pct(r.netMargin) },
  { key: 'debtToEquity', label: 'D/E', show: (r) => fmt(r.debtToEquity) },
  { key: 'dividendYield', label: 'ปันผล (%)', pct: true, show: (r) => pct(r.dividendYield) },
  { key: 'avgVolume', label: 'Volume เฉลี่ย', show: (r) => int(r.avgVolume) },
];
type Preset = { name: string; filters: Filters };
const EMPTY: Filters = { sector: 'all', query: '', ranges: {} };
const isPresets = (v: unknown): v is Preset[] => Array.isArray(v) && v.every((p) => typeof p?.name === 'string' && typeof p?.filters === 'object');

export default function ScreenerPage() {
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<{ key: NumericKey | 'symbol'; dir: 1 | -1 }>({ key: 'marketCap', dir: -1 });
  const [presets, setPresets] = usePersistent<Preset[]>('screenerPresets', [], isPresets);
  const [presetName, setPresetName] = useState('');

  const results = useMemo(() => {
    const scaled: Filters = { ...f, ranges: Object.fromEntries(Object.entries(f.ranges).map(([k, v]) => {
      const c = COLS.find((x) => x.key === k);
      const s = (n?: number) => (n === undefined || !c?.pct ? n : n / 100);
      return [k, { min: s(v?.min), max: s(v?.max) }];
    })) };
    const res = screen(UNIVERSE, scaled);
    return res.sort((a, b) => {
      const av = a.row[sort.key]; const bv = b.row[sort.key];
      if (av === null) return 1; if (bv === null) return -1; // N/A always last
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
  }, [f, sort]);

  const setRange = (key: NumericKey, side: 'min' | 'max', raw: string) =>
    setF((x) => ({ ...x, ranges: { ...x.ranges, [key]: { ...x.ranges[key], [side]: raw === '' ? undefined : Number(raw) } } }));

  return (
    <>
      <PageHeader title="คัดกรองหุ้น (Stock Screener)" subtitle={`ชุดข้อมูลบริษัทสมมติ ${UNIVERSE.length} บริษัท — เงื่อนไขทุกข้อเป็น AND`} demo />
      <Callout>การคัดกรองเป็นเพียงการลดจำนวนตัวเลือกให้ไปวิเคราะห์ต่อ ไม่ใช่การตัดสินว่าธุรกิจดีหรือแย่ และแอปนี้ไม่จัดอันดับ "หุ้นดีที่สุด"</Callout>
      <div className="card mt-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="ค้นหา symbol / ชื่อ">{(id) => <input id={id} className="input w-48" value={f.query} onChange={(e) => setF({ ...f, query: e.target.value })} />}</Field>
          <Field label="กลุ่มอุตสาหกรรม">{(id) => (
            <select id={id} className="input w-48" value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })}>
              <option value="all">ทั้งหมด</option>{SECTORS.map((s) => <option key={s}>{s}</option>)}
            </select>)}</Field>
          <button className="btn" onClick={() => setF(EMPTY)}>ล้างตัวกรอง</button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COLS.map((c) => (
            <fieldset key={c.key} className="flex items-end gap-1">
              <legend className="label">{c.label}</legend>
              <input type="number" className="input" placeholder="ต่ำสุด" aria-label={`${c.label} ต่ำสุด`} value={f.ranges[c.key]?.min ?? ''} onChange={(e) => setRange(c.key, 'min', e.target.value)} />
              <span className="pb-1.5 text-slate-400">–</span>
              <input type="number" className="input" placeholder="สูงสุด" aria-label={`${c.label} สูงสุด`} value={f.ranges[c.key]?.max ?? ''} onChange={(e) => setRange(c.key, 'max', e.target.value)} />
            </fieldset>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <Field label="บันทึกชุดตัวกรอง">{(id) => <input id={id} className="input w-48" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="ชื่อ preset" maxLength={40} />}</Field>
          <button className="btn" disabled={!presetName.trim()} onClick={() => { setPresets((p) => [...p.filter((x) => x.name !== presetName.trim()), { name: presetName.trim(), filters: f }]); setPresetName(''); }}><Save size={14} /> บันทึก</button>
          {presets.map((p) => (
            <span key={p.name} className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700">
              <button className="px-2 py-1 text-sm hover:underline" onClick={() => setF(p.filters)}>{p.name}</button>
              <button className="border-l border-slate-300 px-1.5 py-1 dark:border-slate-700" aria-label={`ลบ preset ${p.name}`} onClick={() => setPresets((xs) => xs.filter((x) => x.name !== p.name))}><Trash2 size={12} /></button>
            </span>
          ))}
        </div>
      </div>

      <p className="muted mt-3" role="status">ผ่านเงื่อนไข {results.length} จาก {UNIVERSE.length} บริษัท</p>
      {results.length === 0 ? <Empty title="ไม่มีบริษัทที่ผ่านทุกเงื่อนไข">ลองผ่อนเงื่อนไขบางข้อ — บริษัทที่ค่าเป็น N/A (เช่น P/E ของบริษัทขาดทุน) จะไม่ผ่านเงื่อนไขของช่องนั้น</Empty> : (
        <div className="card mt-2 overflow-x-auto p-0">
          <table className="tbl">
            <thead><tr>
              {[{ key: 'symbol' as const, label: 'Symbol' }, ...COLS].map((c) => (
                <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                  <button className="inline-flex items-center gap-1" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (-s.dir as 1 | -1) : -1 }))}>
                    {c.label}{sort.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                </th>))}
              <th>เหตุผลที่ผ่าน</th>
            </tr></thead>
            <tbody>{results.map(({ row, reasons }) => (
              <tr key={row.symbol}>
                <td><span className="font-mono font-semibold">{row.symbol}</span><div className="text-xs text-slate-500">{row.name} · {row.sector}</div></td>
                {COLS.map((c) => <td key={c.key} className="tabular-nums">{c.show(row)}</td>)}
                <td className="text-xs text-slate-500">{reasons.length ? reasons.join(', ') : '—'}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
