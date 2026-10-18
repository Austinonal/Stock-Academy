import { useMemo, useState } from 'react';
import { Download, FastForward, RotateCcw, StepForward } from 'lucide-react';
import { PriceChart } from '../../components/charts/PriceChart';
import { Callout, Empty, Field, Loading, NumberField, PageHeader, Signed, Stat } from '../../components/ui';
import { demoProvider } from '../../core/market-data/demo';
import { advance, cancelOrder, equity, newPaperState, placeOrder, realizedTotal, unrealized, DEFAULT_COSTS, type PaperState, type Side } from '../../core/paper/engine';
import { isObject, usePersistent } from '../../storage/usePersistent';
import { download, fmt, int, pct } from '../../lib/format';
import type { Candle } from '../../core/market-data/types';

// Paper trading runs on the shared demo calendar (all demo symbols have the same trading days)
const SYMBOLS = demoProvider.listSymbols();
const DATA: Record<string, Candle[]> = Object.fromEntries(SYMBOLS.map((s) => [s, demoProvider.getSeries(s, '1D')!.candles]));
const LEN = Math.min(...Object.values(DATA).map((c) => c.length));
const isPaper = (v: unknown): v is PaperState => isObject(v) && typeof v.cash === 'number' && typeof v.cursor === 'number' && Array.isArray(v.orders) && isObject(v.positions);
const barsAt = (i: number) => Object.fromEntries(SYMBOLS.map((s) => [s, DATA[s][i]]));
const marksAt = (i: number) => Object.fromEntries(SYMBOLS.map((s) => [s, DATA[s][i].close]));

export default function PaperPage() {
  const [s, setS, { loading, error }] = usePersistent<PaperState>('paper', newPaperState(), isPaper);
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [side, setSide] = useState<Side>('buy');
  const [type, setType] = useState<'market' | 'limit'>('market');
  const [qty, setQty] = useState(100);
  const [limit, setLimit] = useState(NaN);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cfg, setCfg] = useState({ capital: 100_000, feePct: DEFAULT_COSTS.feeRate * 100, slip: DEFAULT_COSTS.slippageBps });

  const cursor = Math.min(s.cursor, LEN - 1);
  const now = DATA[symbol][cursor];
  const marks = marksAt(cursor);
  const eq = equity(s, marks);
  const view = useMemo(() => DATA[symbol].slice(Math.max(0, cursor - 150), cursor + 1), [symbol, cursor]);
  const curve = useMemo(() => s.equityCurve.map((p) => ({ time: p.time, open: p.equity, high: p.equity, low: p.equity, close: p.equity, volume: 0 })), [s.equityCurve]);
  const pending = s.orders.filter((o) => o.status === 'pending');

  if (loading) return <Loading />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = placeOrder(s, { symbol, side, qty, type, limit: type === 'limit' ? limit : undefined }, now.close, now.time);
    if (r.error) setMsg({ ok: false, text: r.error });
    else { setS(r.state); setMsg({ ok: true, text: `ส่งคำสั่งจำลองแล้ว — จะ fill ${type === 'market' ? 'ที่ราคาเปิดของแท่งถัดไป' : 'เมื่อราคาแท่งถัดไปแตะ limit'} เมื่อกด "เดินหน้า"` }); }
  };
  const step = (n: number) => setS((st) => { let x = st; for (let k = 0; k < n && x.cursor < LEN - 1; k++) x = advance(x, barsAt(x.cursor + 1)); return x; });
  const reset = () => {
    const errs = [!(cfg.capital >= 1000 && cfg.capital <= 1e9) && 'เงินทุนต้องอยู่ระหว่าง 1,000 – 1,000,000,000', !(cfg.feePct >= 0 && cfg.feePct <= 2) && 'ค่าธรรมเนียม 0–2%', !(cfg.slip >= 0 && cfg.slip <= 200) && 'slippage 0–200 bps'].filter(Boolean);
    if (errs.length) { setMsg({ ok: false, text: errs.join(' · ') }); return; }
    if (!confirm('รีเซ็ตพอร์ตจำลอง? คำสั่ง สถานะ และประวัติทั้งหมดจะถูกลบ (ส่งออกไว้ก่อนได้)')) return;
    setS(newPaperState(cfg.capital, 60, { feeRate: cfg.feePct / 100, minFee: 0, slippageBps: cfg.slip }));
    setMsg({ ok: true, text: 'รีเซ็ตแล้ว' });
  };
  const exportCsv = () => download('paper-trades.csv', ['time,symbol,side,qty,price,fee,realized,reason', ...s.fills.map((f) => [f.time, f.symbol, f.side, f.qty, f.price, f.fee.toFixed(2), f.realized.toFixed(2), `"${f.reason.replace(/"/g, '""')}"`].join(','))].join('\n'), 'text/csv');

  return (
    <>
      <PageHeader title="พอร์ตจำลอง (Paper Trading)" subtitle={`จำลองบนข้อมูลย้อนหลังทีละแท่ง — วันที่จำลองปัจจุบัน ${now.time} (แท่งที่ ${cursor + 1}/${LEN}) ไม่มีการส่งคำสั่งออกนอกเครื่อง`} demo>
        <button className="btn" onClick={() => step(1)} disabled={cursor >= LEN - 1}><StepForward size={16} /> เดินหน้า 1 แท่ง</button>
        <button className="btn" onClick={() => step(5)} disabled={cursor >= LEN - 1}><FastForward size={16} /> 5 แท่ง</button>
      </PageHeader>
      {error && <Callout kind="warn">{error}</Callout>}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="เงินสด" value={fmt(s.cash)} />
        <Stat label="มูลค่าหุ้นที่ถือ" value={fmt(eq - s.cash)} />
        <Stat label="Equity" value={fmt(eq)} hint="เงินสด + Σ จำนวน × ราคาปิดแท่งปัจจุบัน" />
        <Stat label="กำไร/ขาดทุนที่ยังไม่รับรู้" value={<Signed n={unrealized(s, marks)}>{fmt(unrealized(s, marks))}</Signed>} />
        <Stat label="กำไร/ขาดทุนที่รับรู้แล้ว" value={<Signed n={realizedTotal(s)}>{fmt(realizedTotal(s))}</Signed>} />
        <Stat label="ผลตอบแทนรวม" value={<Signed n={eq - s.initialCash}>{pct(eq / s.initialCash - 1, 2)}</Signed>} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-2 flex items-center justify-between"><h2 className="h2">{symbol} — ถึงวันที่จำลอง</h2><span className="text-sm tabular-nums">ปิดล่าสุด {fmt(now.close)}</span></div>
          <PriceChart candles={view} height={300} />
        </section>
        <section className="card">
          <h2 className="h2">ส่งคำสั่งจำลอง</h2>
          <form className="mt-2 space-y-2" onSubmit={submit}>
            <Field label="Symbol">{(id) => <select id={id} className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}>{SYMBOLS.map((x) => <option key={x}>{x}</option>)}</select>}</Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="ฝั่ง">{(id) => <select id={id} className="input" value={side} onChange={(e) => setSide(e.target.value as Side)}><option value="buy">ซื้อ</option><option value="sell">ขาย</option></select>}</Field>
              <Field label="ชนิด">{(id) => <select id={id} className="input" value={type} onChange={(e) => setType(e.target.value as 'market' | 'limit')}><option value="market">Market</option><option value="limit">Limit</option></select>}</Field>
            </div>
            <NumberField label="จำนวนหุ้น" value={qty} onChange={setQty} step={1} min={1} />
            {type === 'limit' && <NumberField label="ราคา limit" value={limit} onChange={setLimit} min={0} />}
            <p className="text-xs text-slate-500">ประมาณมูลค่า {fmt(qty * (type === 'limit' && Number.isFinite(limit) ? limit : now.close))} ฿ · ถืออยู่ {s.positions[symbol]?.qty ?? 0} หุ้น</p>
            <button className="btn btn-primary w-full justify-center" type="submit">ส่งคำสั่งจำลอง (ไม่ใช่เงินจริง)</button>
          </form>
          {msg && <p role="status" className={`mt-2 text-sm ${msg.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg.text}</p>}
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="card overflow-x-auto">
          <h2 className="h2">สถานะที่ถือ</h2>
          {Object.keys(s.positions).length === 0 ? <p className="muted mt-2">ยังไม่มีหุ้นในพอร์ต</p> : (
            <table className="tbl mt-2"><thead><tr><th>Symbol</th><th>จำนวน</th><th>ต้นทุนเฉลี่ย*</th><th>ราคาปัจจุบัน</th><th>มูลค่า</th><th>กำไร/ขาดทุน</th></tr></thead>
              <tbody>{Object.entries(s.positions).map(([sym, p]) => { const m = marks[sym]; const u = p.qty * (m - p.avgCost); return (
                <tr key={sym}><td className="font-mono">{sym}</td><td>{int(p.qty)}</td><td>{fmt(p.avgCost, 4)}</td><td>{fmt(m)}</td><td>{fmt(p.qty * m)}</td><td><Signed n={u}>{fmt(u)} ({pct(m / p.avgCost - 1)})</Signed></td></tr>); })}</tbody></table>
          )}
          <p className="mt-1 text-xs text-slate-500">*ต้นทุนเฉลี่ยรวมค่าธรรมเนียมฝั่งซื้อ</p>
        </section>
        <section className="card overflow-x-auto">
          <h2 className="h2">คำสั่งที่รอ ({pending.length})</h2>
          {pending.length === 0 ? <p className="muted mt-2">ไม่มีคำสั่งค้าง</p> : (
            <table className="tbl mt-2"><thead><tr><th>ส่งเมื่อ</th><th>Symbol</th><th>ฝั่ง</th><th>ชนิด</th><th>จำนวน</th><th /></tr></thead>
              <tbody>{pending.map((o) => <tr key={o.id}><td>{o.placedAt}</td><td>{o.symbol}</td><td>{o.side === 'buy' ? 'ซื้อ' : 'ขาย'}</td><td>{o.type}{o.limit ? ` @ ${o.limit}` : ''}</td><td>{o.qty}</td><td><button className="btn" onClick={() => setS(cancelOrder(s, o.id))}>ยกเลิก</button></td></tr>)}</tbody></table>
          )}
          {s.orders.some((o) => o.status === 'rejected') && <p className="mt-2 text-xs text-red-600">คำสั่งที่ถูกปฏิเสธ: {s.orders.filter((o) => o.status === 'rejected').map((o) => `${o.symbol} ${o.side} ${o.qty} (${o.note})`).join(' · ')}</p>}
        </section>
      </div>

      <section className="card mt-3">
        <h2 className="h2">Equity curve</h2>
        {curve.length < 2 ? <Empty title="ยังไม่มีข้อมูล">กด "เดินหน้า" เพื่อจำลองเวลา</Empty> : <PriceChart candles={curve} chartType="line" showVolume={false} height={220} ariaLabel="equity curve" />}
      </section>

      <section className="card mt-3 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="h2">ประวัติการ fill ({s.fills.length})</h2>
          <div className="flex gap-2"><button className="btn" disabled={!s.fills.length} onClick={exportCsv}><Download size={14} /> CSV</button><button className="btn" onClick={() => download('paper-state.json', JSON.stringify(s, null, 2))}><Download size={14} /> JSON</button></div></div>
        {s.fills.length > 0 && (
          <table className="tbl mt-2"><thead><tr><th>วันที่</th><th>Symbol</th><th>ฝั่ง</th><th>จำนวน</th><th>ราคา</th><th>ค่าธรรมเนียม</th><th>กำไรที่รับรู้</th><th>เหตุผลการ fill</th></tr></thead>
            <tbody>{s.fills.slice().reverse().map((f, i) => <tr key={i}><td>{f.time}</td><td>{f.symbol}</td><td>{f.side === 'buy' ? 'ซื้อ' : 'ขาย'}</td><td>{f.qty}</td><td>{fmt(f.price, 4)}</td><td>{fmt(f.fee)}</td><td>{f.side === 'sell' ? <Signed n={f.realized}>{fmt(f.realized)}</Signed> : '—'}</td><td className="text-xs">{f.reason}</td></tr>)}</tbody></table>
        )}
      </section>

      <section className="card mt-3">
        <h2 className="h2">ตั้งค่าการจำลอง</h2>
        <p className="muted mt-1">ค่าปัจจุบัน: ทุน {int(s.initialCash)} ฿ · ค่าธรรมเนียม {(s.costs.feeRate * 100).toFixed(3)}% · slippage {s.costs.slippageBps} bps — <strong>เป็นสมมติฐานเพื่อการเรียน ไม่ใช่อัตราจริงของโบรกเกอร์ใด</strong> การเปลี่ยนค่าจะมีผลเมื่อรีเซ็ต</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <NumberField label="เงินทุนเริ่มต้น" suffix="฿" value={cfg.capital} onChange={(n) => setCfg({ ...cfg, capital: n })} />
          <NumberField label="ค่าธรรมเนียม" suffix="%" value={cfg.feePct} onChange={(n) => setCfg({ ...cfg, feePct: n })} step={0.01} />
          <NumberField label="Slippage" suffix="bps" value={cfg.slip} onChange={(n) => setCfg({ ...cfg, slip: n })} step={1} />
          <button className="btn btn-danger" onClick={reset}><RotateCcw size={14} /> รีเซ็ตพอร์ต</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">กติกาการ fill: Market = ราคาเปิดแท่งถัดไป ± slippage · Limit ซื้อ = ถ้า Low ≤ limit ได้ min(Open, limit) · Limit ขาย = ถ้า High ≥ limit ได้ max(Open, limit) · ไม่จำลองการขาย short · ใช้ได้กับ symbol demo เท่านั้น</p>
      </section>
    </>
  );
}
