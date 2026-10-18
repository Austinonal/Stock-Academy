import { useEffect, useMemo, useState } from 'react';
import { Eraser, MousePointer2, Pause, Play, Plus, SkipBack, SkipForward, Trash2, Undo2, X } from 'lucide-react';
import { PriceChart, type ChartType, type Drawing, type Tool } from '../../components/charts/PriceChart';
import { Callout, Field, Loading, PageHeader } from '../../components/ui';
import { INDICATORS, defaultParams } from '../../core/indicators/catalog';
import type { Timeframe } from '../../core/market-data/types';
import { useIndicatorLines, type Active } from '../indicators/useIndicatorLines';
import { useMarket } from '../market';
import { SeriesPicker } from '../SeriesPicker';
import { usePersistent } from '../../storage/usePersistent';

type ReplayEntry = { time: string; symbol: string; guess: 'up' | 'down' | 'unsure'; note: string; actual: 'up' | 'down' | 'flat'; changePct: number };

const RANGES = [{ id: '6m', label: '6 เดือน', bars: { '1D': 126, '1W': 26, '1M': 6 } }, { id: '1y', label: '1 ปี', bars: { '1D': 252, '1W': 52, '1M': 12 } }, { id: 'all', label: 'ทั้งหมด', bars: null }] as const;
const TOOLS: { id: Tool; label: string }[] = [{ id: 'none', label: 'เลือก/เลื่อน' }, { id: 'hline', label: 'เส้นแนวนอน' }, { id: 'trend', label: 'Trend line' }, { id: 'ray', label: 'Ray' }, { id: 'rect', label: 'กรอบโซน' }, { id: 'fib', label: 'Fibonacci' }];
const isDrawings = (v: unknown): v is Drawing[] => Array.isArray(v) && v.every((d) => typeof d?.id === 'string' && typeof d?.a?.price === 'number');
const isLog = (v: unknown): v is ReplayEntry[] => Array.isArray(v);

export default function ChartPage() {
  const market = useMarket();
  const [symbol, setSymbol] = useState('DMTECH');
  const [tf, setTf] = useState<Timeframe>('1D');
  const [type, setType] = useState<ChartType>('candlestick');
  const [volume, setVolume] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('all');
  const [active, setActive] = useState<Active[]>([{ uid: 'a1', id: 'sma', params: { period: 20 } }, { uid: 'a2', id: 'sma', params: { period: 50 } }]);
  const [addId, setAddId] = useState('rsi');
  const [tool, setTool] = useState<Tool>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [drawings, setDrawings, ds] = usePersistent<Drawing[]>(`drawings:${symbol}:${tf}`, [], isDrawings);
  const [replay, setReplay] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [guess, setGuess] = useState<ReplayEntry['guess'] | null>(null);
  const [note, setNote] = useState('');
  const [log, setLog] = usePersistent<ReplayEntry[]>('replayLog', [], isLog);

  const series = market.get(symbol, tf);
  const all = useMemo(() => series?.candles ?? [], [series]);
  // Replay: everything downstream (chart + indicators) sees only bars up to the cursor — no look-ahead
  const base = useMemo(() => (replay === null ? all : all.slice(0, replay + 1)), [all, replay]);
  const { overlays, panes } = useIndicatorLines(base, active);
  const cut = useMemo(() => {
    const n = RANGES.find((r) => r.id === range)?.bars?.[tf];
    return n && replay === null ? Math.max(0, base.length - n) : 0;
  }, [range, tf, base.length, replay]);
  const view = useMemo(() => ({
    candles: base.slice(cut),
    overlays: overlays.map((o) => ({ ...o, data: o.data.slice(cut) })),
    panes: panes.map((p) => ({ ...p, lines: p.lines.map((l) => ({ ...l, data: l.data.slice(cut) })) })),
  }), [base, overlays, panes, cut]);

  const step = (d: 1 | -1) => {
    if (replay === null) return;
    const nextIdx = Math.min(all.length - 1, Math.max(30, replay + d));
    if (d === 1 && guess && nextIdx > replay) {
      const prev = all[replay].close; const cur = all[nextIdx].close;
      const ch = (cur - prev) / prev;
      setLog((l) => [...l, { time: all[nextIdx].time, symbol, guess, note, actual: (Math.abs(ch) < 0.002 ? 'flat' : ch > 0 ? 'up' : 'down') as ReplayEntry['actual'], changePct: ch * 100 }].slice(-500));
      setGuess(null); setNote('');
    }
    setReplay(nextIdx);
  };

  useEffect(() => {
    if (!playing || replay === null) return;
    if (replay >= all.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setReplay((r) => (r === null ? r : Math.min(all.length - 1, r + 1))), speed);
    return () => clearTimeout(t);
  }, [playing, replay, speed, all.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setDrawings((d) => d.filter((x) => x.id !== selected)); setSelected(null);
      }
      if (e.key === 'Escape') setTool('none');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, setDrawings]);

  if (market.loading) return <Loading />;
  const symLog = log.filter((x) => x.symbol === symbol);
  const scored = symLog.filter((x) => x.guess !== 'unsure');
  const hits = scored.filter((x) => x.guess === x.actual).length;

  return (
    <>
      <PageHeader title="ห้องฝึกกราฟ (Chart Playground)" subtitle={series?.meta.note} demo={series?.meta.source === 'synthetic'} />
      <div className="card mb-3 flex flex-wrap items-end gap-3">
        <SeriesPicker symbols={market.symbols} symbol={symbol} onSymbol={(s) => { setSymbol(s); setReplay(null); setSelected(null); }} tf={tf} onTf={(t) => { setTf(t); setReplay(null); setSelected(null); }} />
        <Field label="ประเภทกราฟ">{(id) => (
          <select id={id} className="input w-36" value={type} onChange={(e) => setType(e.target.value as ChartType)}>
            <option value="candlestick">แท่งเทียน</option><option value="bar">Bar (OHLC)</option><option value="line">เส้น (ราคาปิด)</option>
          </select>)}</Field>
        <Field label="ช่วงข้อมูล">{(id) => (
          <select id={id} className="input w-28" value={range} onChange={(e) => setRange(e.target.value as typeof range)} disabled={replay !== null} title={replay !== null ? 'ปิดใน replay mode' : undefined}>
            {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>)}</Field>
        <label className="flex items-center gap-2 pb-1.5 text-sm"><input type="checkbox" checked={volume} onChange={(e) => setVolume(e.target.checked)} /> Volume</label>
        <button className={`btn ${replay !== null ? 'btn-primary' : ''}`} onClick={() => { setPlaying(false); setReplay(replay === null ? Math.min(120, all.length - 1) : null); }}>
          {replay === null ? 'เริ่ม Replay' : 'ออกจาก Replay'}
        </button>
      </div>

      {replay !== null && (
        <div className="card mb-3 space-y-3" aria-label="ตัวควบคุม replay">
          <div className="flex flex-wrap items-end gap-2">
            <button className="btn" onClick={() => step(-1)} aria-label="แท่งก่อนหน้า"><SkipBack size={16} /></button>
            <button className="btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'หยุด' : 'เล่น'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
            <button className="btn" onClick={() => step(1)} disabled={replay >= all.length - 1} aria-label="เปิดแท่งถัดไป"><SkipForward size={16} /> เปิดแท่งถัดไป</button>
            <Field label="ความเร็ว">{(id) => <select id={id} className="input w-28" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value={1200}>ช้า</option><option value={700}>ปกติ</option><option value={250}>เร็ว</option></select>}</Field>
            <Field label={`จุดเริ่ม: แท่งที่ ${replay + 1} / ${all.length} (${all[replay]?.time})`}>{(id) => (
              <input id={id} type="range" className="w-64" min={30} max={all.length - 1} value={replay} onChange={(e) => { setPlaying(false); setReplay(Number(e.target.value)); }} />)}</Field>
          </div>
          <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <span className="text-sm">ก่อนเปิดแท่งถัดไป คุณคิดว่าราคาปิดจะ:</span>
            {(['up', 'down', 'unsure'] as const).map((g) => (
              <button key={g} className={`btn ${guess === g ? 'btn-primary' : ''}`} aria-pressed={guess === g} onClick={() => setGuess(g)}>{g === 'up' ? 'สูงขึ้น ▲' : g === 'down' ? 'ต่ำลง ▼' : 'ไม่แน่ใจ'}</button>
            ))}
            <input className="input max-w-xs" placeholder="เหตุผลสั้น ๆ (ไม่บังคับ)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="เหตุผล" />
          </div>
          <p className="muted">บันทึกแล้ว {symLog.length} ครั้งใน {symbol} · ตอบถูก {hits}/{scored.length} ครั้งที่ระบุทิศ{scored.length >= 10 ? ` (${((hits / scored.length) * 100).toFixed(0)}%)` : ''} — ข้อมูลจำลองนี้มีความสุ่มสูง ผลราว 50% คือสิ่งที่คาดได้ จุดประสงค์คือฝึกเขียนเหตุผลก่อนเห็นผล ไม่ใช่การทายถูก</p>
          {symLog.length > 0 && <button className="btn btn-danger" onClick={() => setLog((l) => l.filter((x) => x.symbol !== symbol))}>ล้างบันทึก replay ของ {symbol}</button>}
        </div>
      )}

      <div className="card mb-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label="เครื่องมือวาด">
        {TOOLS.map((t) => (
          <button key={t.id} className={`btn ${tool === t.id ? 'btn-primary' : ''}`} aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
            {t.id === 'none' && <MousePointer2 size={14} />}{t.label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-slate-300 dark:bg-slate-700" />
        <button className="btn" disabled={!selected} onClick={() => { setDrawings((d) => d.filter((x) => x.id !== selected)); setSelected(null); }}><Eraser size={14} /> ลบที่เลือก</button>
        <button className="btn" disabled={!drawings.length} onClick={() => setDrawings((d) => d.slice(0, -1))}><Undo2 size={14} /> Undo</button>
        <button className="btn btn-danger" disabled={!drawings.length} onClick={() => confirm('ลบเส้นทั้งหมดของ symbol/timeframe นี้?') && setDrawings([])}><Trash2 size={14} /> ลบทั้งหมด</button>
        <span className="muted text-xs">{tool === 'none' ? 'คลิกเส้นเพื่อเลือก · Delete เพื่อลบ' : tool === 'hline' ? 'คลิก 1 จุดบนกราฟ' : 'คลิก 2 จุดบนกราฟ · Esc เพื่อยกเลิก'} · บันทึกอัตโนมัติต่อ {symbol}/{tf}</span>
      </div>
      {ds.error && <Callout kind="warn">{ds.error}</Callout>}

      <div className="card p-2">
        <PriceChart candles={view.candles} chartType={type} showVolume={volume} overlays={view.overlays} panes={view.panes} height={460}
          drawing={{ tool, items: drawings, selected, onSelect: setSelected, onAdd: (d) => { setDrawings((x) => [...x, d]); setTool('none'); } }} />
      </div>

      <section className="card mt-3" aria-labelledby="ind">
        <h2 id="ind" className="h2">Indicators บนกราฟ</h2>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Field label="เพิ่ม indicator">{(id) => (
            <select id={id} className="input w-72" value={addId} onChange={(e) => setAddId(e.target.value)}>
              {INDICATORS.map((d) => <option key={d.id} value={d.id}>{d.name} {d.overlay ? '(บนราคา)' : '(แยก pane)'}</option>)}
            </select>)}</Field>
          <button className="btn" disabled={active.length >= 8} title={active.length >= 8 ? 'สูงสุด 8 ตัว' : undefined}
            onClick={() => { const d = INDICATORS.find((x) => x.id === addId)!; setActive((a) => [...a, { uid: `${Date.now()}`, id: d.id, params: defaultParams(d) }]); }}><Plus size={14} /> เพิ่ม</button>
        </div>
        <ul className="mt-3 space-y-2">
          {active.map((a) => {
            const def = INDICATORS.find((d) => d.id === a.id)!;
            return (
              <li key={a.uid} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                <span className="min-w-48 text-sm font-medium">{def.name}</span>
                {def.params.map((p) => (
                  <Field key={p.key} label={p.label}>{(id) => (
                    <input id={id} type="number" className="input w-20" min={p.min} max={p.max} value={a.params[p.key]}
                      onChange={(e) => { const v = Math.round(Number(e.target.value)); if (v >= p.min && v <= p.max) setActive((xs) => xs.map((x) => (x.uid === a.uid ? { ...x, params: { ...x.params, [p.key]: v } } : x))); }} />)}</Field>
                ))}
                <button className="btn ml-auto" onClick={() => setActive((xs) => xs.filter((x) => x.uid !== a.uid))} aria-label={`ลบ ${def.name}`}><X size={14} /></button>
              </li>
            );
          })}
        </ul>
        <p className="muted mt-2 text-xs">ค่า indicator คำนวณจากข้อมูลที่แสดงอยู่จริง (ใน replay คำนวณจากแท่งที่เปิดแล้วเท่านั้น) ช่วง warm-up จะไม่มีเส้น</p>
      </section>
    </>
  );
}
