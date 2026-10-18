import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { PriceChart } from '../../components/charts/PriceChart';
import { Callout, Field, Loading, NumberField, PageHeader, Signed } from '../../components/ui';
import { runBacktest, STRATEGY_TEXT, type BacktestConfig, type BacktestResult, type StrategyConfig } from '../../core/backtest/engine';
import { drawdowns } from '../../core/risk';
import type { Candle, Timeframe } from '../../core/market-data/types';
import { useMarket } from '../market';
import { SeriesPicker } from '../SeriesPicker';
import { fmt, int, pct } from '../../lib/format';

const PPY: Record<Timeframe, number> = { '1D': 252, '1W': 52, '1M': 12 };
const DEFAULT_STRAT: Record<StrategyConfig['kind'], StrategyConfig> = {
  smaCross: { kind: 'smaCross', fast: 20, slow: 50 },
  breakout: { kind: 'breakout', entry: 20, exit: 10 },
  rsiReversion: { kind: 'rsiReversion', period: 14, buyBelow: 30, sellAbove: 55 },
};
const toCurve = (pts: { time: string; value: number }[]): Candle[] => pts.map((p) => ({ time: p.time, open: p.value, high: p.value, low: p.value, close: p.value, volume: 0 }));
const num = (n: number | null, f: (n: number) => string) => (n === null ? 'N/A' : n === Infinity ? '∞ (ไม่มีเทรดขาดทุน)' : f(n));

function validate(s: StrategyConfig, cfg: Omit<BacktestConfig, 'strategy'>): string[] {
  const e: string[] = [];
  const int = (v: number, lo: number, hi: number) => Number.isInteger(v) && v >= lo && v <= hi;
  if (s.kind === 'smaCross') { if (!int(s.fast, 2, 200) || !int(s.slow, 3, 400)) e.push('period ต้องเป็นจำนวนเต็ม (เร็ว 2–200, ช้า 3–400)'); if (s.fast >= s.slow) e.push('SMA เร็วต้องสั้นกว่า SMA ช้า'); }
  if (s.kind === 'breakout' && (!int(s.entry, 2, 200) || !int(s.exit, 2, 200))) e.push('จำนวนแท่งต้องเป็นจำนวนเต็ม 2–200');
  if (s.kind === 'rsiReversion') { if (!int(s.period, 2, 50)) e.push('RSI period 2–50'); if (!(s.buyBelow > 0 && s.buyBelow < s.sellAbove && s.sellAbove < 100)) e.push('ต้องเป็น 0 < เกณฑ์ซื้อ < เกณฑ์ขาย < 100'); }
  if (!(cfg.initialCash >= 1000)) e.push('เงินทุนอย่างน้อย 1,000');
  if (!(cfg.commissionRate >= 0 && cfg.commissionRate <= 0.02)) e.push('ค่าธรรมเนียม 0–2%');
  if (!(cfg.slippageBps >= 0 && cfg.slippageBps <= 200)) e.push('slippage 0–200 bps');
  if (!(cfg.allocation > 0 && cfg.allocation <= 1)) e.push('สัดส่วนเงินต่อการเข้าซื้อ 1–100%');
  return e;
}

function MetricsTable({ runs }: { runs: { label: string; r: BacktestResult; bars: number }[] }) {
  const rows: [string, (r: BacktestResult) => React.ReactNode][] = [
    ['ผลตอบแทนรวม', (r) => <Signed n={r.metrics.totalReturn}>{pct(r.metrics.totalReturn, 2)}</Signed>],
    ['Buy & Hold (benchmark)', (r) => { const b = r.benchmark.at(-1)!.value / r.benchmark[0].value - 1; return <Signed n={b}>{pct(b, 2)}</Signed>; }],
    ['CAGR', (r) => num(r.metrics.cagr, (n) => pct(n, 2))],
    ['Max drawdown', (r) => pct(r.metrics.maxDrawdown, 2)],
    ['Volatility (annualized)', (r) => num(r.metrics.volatility, (n) => pct(n, 1))],
    ['Sharpe (rf = 0)', (r) => num(r.metrics.sharpe, (n) => fmt(n))],
    ['Sortino (rf = 0)', (r) => num(r.metrics.sortino, (n) => fmt(n))],
    ['จำนวนเทรด (ปิดแล้ว)', (r) => r.metrics.trades],
    ['Win rate', (r) => num(r.metrics.winRate, (n) => pct(n, 0))],
    ['Profit factor', (r) => num(r.metrics.profitFactor, (n) => fmt(n))],
    ['Expectancy ต่อเทรด (฿)', (r) => num(r.metrics.expectancy, (n) => fmt(n))],
    ['กำไรเฉลี่ย / ขาดทุนเฉลี่ย (฿)', (r) => `${num(r.metrics.avgWin, (n) => fmt(n))} / ${num(r.metrics.avgLoss, (n) => fmt(n))}`],
    ['Exposure (เวลาที่ถือหุ้น)', (r) => pct(r.metrics.exposure, 0)],
    ['ค่าธรรมเนียมรวม (฿)', (r) => fmt(r.metrics.fees)],
  ];
  return (
    <div className="overflow-x-auto"><table className="tbl">
      <thead><tr><th>Metric</th>{runs.map((x) => <th key={x.label} className="text-right">{x.label}<div className="text-[10px] font-normal">{x.bars} แท่ง</div></th>)}</tr></thead>
      <tbody>{rows.map(([lab, f]) => <tr key={lab}><td>{lab}</td>{runs.map((x) => <td key={x.label} className="text-right tabular-nums">{f(x.r)}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

export default function BacktestPage() {
  const market = useMarket();
  const [symbol, setSymbol] = useState('DMTECH');
  const [tf, setTf] = useState<Timeframe>('1D');
  const [strat, setStrat] = useState<StrategyConfig>(DEFAULT_STRAT.smaCross);
  const [cash, setCash] = useState(100_000);
  const [feePct, setFeePct] = useState(0.15);
  const [slip, setSlip] = useState(5);
  const [alloc, setAlloc] = useState(100);
  const [splitPct, setSplitPct] = useState(70);
  const [ran, setRan] = useState<{ key: string } | null>(null);

  const series = market.get(symbol, tf);
  const candles = useMemo(() => series?.candles ?? [], [series]);
  const base = { initialCash: cash, commissionRate: feePct / 100, slippageBps: slip, allocation: alloc / 100, periodsPerYear: PPY[tf] };
  const errors = [...validate(strat, base), ...(splitPct < 30 || splitPct > 90 ? ['สัดส่วน in-sample 30–90%'] : []), ...(candles.length < 60 ? ['ข้อมูลน้อยกว่า 60 แท่ง — เลือก timeframe รายวันหรือข้อมูลที่ยาวขึ้น'] : [])];
  const key = JSON.stringify({ symbol, tf, strat, base, splitPct });

  const result = useMemo(() => {
    if (!ran || errors.length) return null;
    const cfg: BacktestConfig = { ...base, strategy: strat };
    const split = Math.floor(candles.length * splitPct / 100);
    const full = runBacktest(candles, cfg);
    const dd = drawdowns(full.equity.map((e) => e.value)).series;
    return { full, ins: runBacktest(candles, cfg, 0, split), oos: runBacktest(candles, cfg, split), split, ddCurve: toCurve(full.equity.map((e, i) => ({ time: e.time, value: dd[i] * 100 }))) };
  }, [ran]); // eslint-disable-line react-hooks/exhaustive-deps -- recompute only when the user presses Run
  const stale = ran && ran.key !== key;

  const setS = (k: string) => (n: number) => setStrat((s) => ({ ...s, [k]: n }) as StrategyConfig);
  if (market.loading) return <Loading />;

  return (
    <>
      <PageHeader title="ทดสอบกลยุทธ์ย้อนหลัง (Backtester)" subtitle="ตัดสินใจที่ราคาปิดของแท่ง i → ซื้อ/ขายที่ราคาเปิดของแท่ง i+1 พร้อมหักค่าธรรมเนียมและ slippage" demo={series?.meta.source === 'synthetic'} />
      <div className="card grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-2"><SeriesPicker symbols={market.symbols} symbol={symbol} onSymbol={setSymbol} tf={tf} onTf={setTf} /></div>
        <Field label="กลยุทธ์ตัวอย่าง">{(id) => (
          <select id={id} className="input" value={strat.kind} onChange={(e) => setStrat(DEFAULT_STRAT[e.target.value as StrategyConfig['kind']])}>
            <option value="smaCross">SMA Crossover</option><option value="breakout">Donchian Breakout</option><option value="rsiReversion">RSI Mean Reversion (ทดลอง)</option>
          </select>)}</Field>
        {strat.kind === 'smaCross' && <><NumberField label="SMA เร็ว" value={strat.fast} step={1} onChange={setS('fast')} /><NumberField label="SMA ช้า" value={strat.slow} step={1} onChange={setS('slow')} /></>}
        {strat.kind === 'breakout' && <><NumberField label="เข้าเมื่อทะลุ High ของ N แท่ง" value={strat.entry} step={1} onChange={setS('entry')} /><NumberField label="ออกเมื่อหลุด Low ของ M แท่ง" value={strat.exit} step={1} onChange={setS('exit')} /></>}
        {strat.kind === 'rsiReversion' && <><NumberField label="RSI period" value={strat.period} step={1} onChange={setS('period')} /><NumberField label="ซื้อเมื่อ RSI <" value={strat.buyBelow} onChange={setS('buyBelow')} /><NumberField label="ขายเมื่อ RSI >" value={strat.sellAbove} onChange={setS('sellAbove')} /></>}
        <NumberField label="เงินทุนเริ่มต้น" suffix="฿" value={cash} onChange={setCash} />
        <NumberField label="ค่าธรรมเนียมต่อข้าง" suffix="%" value={feePct} step={0.01} onChange={setFeePct} />
        <NumberField label="Slippage ต่อข้าง" suffix="bps" value={slip} step={1} onChange={setSlip} />
        <NumberField label="เงินต่อการเข้าซื้อ" suffix="% ของเงินสด" value={alloc} onChange={setAlloc} />
        <NumberField label="In-sample" suffix="% แรกของข้อมูล" value={splitPct} step={5} onChange={setSplitPct} hint="ส่วนที่เหลือคือ out-of-sample" />
        <div className="flex items-end"><button className="btn btn-primary w-full justify-center" disabled={errors.length > 0} onClick={() => setRan({ key })}><Play size={16} /> รัน Backtest</button></div>
      </div>
      <p className="muted mt-2">กฎ: {STRATEGY_TEXT[strat.kind]} · Long-only, ถือได้ครั้งละหนึ่งสถานะ</p>
      {errors.length > 0 && <div className="mt-2"><Callout kind="warn"><ul className="list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul></Callout></div>}
      {stale && <div className="mt-2"><Callout>ตั้งค่าเปลี่ยนไปแล้ว — กด "รัน Backtest" อีกครั้งเพื่ออัปเดตผล</Callout></div>}

      {!result ? (!errors.length && <p className="muted mt-6 text-center">ตั้งค่าแล้วกด "รัน Backtest" — ผลทั้งหมดคำนวณจากการจำลองจริงบนข้อมูลที่เลือก</p>) : (
        <>
          <section className="card mt-3">
            <h2 className="h2">Equity curve (เส้นฟ้า) เทียบ Buy & Hold (เส้นเหลือง)</h2>
            <PriceChart candles={toCurve(result.full.equity)} chartType="line" showVolume={false} height={280} ariaLabel="equity curve"
              overlays={[{ key: 'bh', label: 'Buy & Hold', color: '#f59e0b', data: result.full.benchmark.map((b) => b.value) }]} />
            <h3 className="mt-3 font-medium">Drawdown</h3>
            <PriceChart candles={result.ddCurve} chartType="line" showVolume={false} height={160} ariaLabel="drawdown %" />
            <p className="muted mt-1 text-xs">เส้นแบ่ง in/out-of-sample: {candles[result.split]?.time}</p>
          </section>
          <section className="card mt-3">
            <h2 className="h2">ผลลัพธ์</h2>
            <MetricsTable runs={[{ label: 'ทั้งช่วง', r: result.full, bars: candles.length }, { label: 'In-sample', r: result.ins, bars: result.split }, { label: 'Out-of-sample', r: result.oos, bars: candles.length - result.split }]} />
            {result.full.openTrade && <p className="mt-2 text-sm">สถานะที่ยังเปิดอยู่ ณ แท่งสุดท้าย: {result.full.openTrade.qty} หุ้น เข้า {result.full.openTrade.entryTime} @ {fmt(result.full.openTrade.entryPrice)} (คิดใน equity แล้ว ไม่นับใน win rate)</p>}
          </section>
          <section className="card mt-3">
            <h2 className="h2">สมมติฐานของการทดสอบ</h2>
            <ul className="mt-2 list-disc pl-5 text-sm">
              <li>ข้อมูล: {symbol} ({series?.meta.source === 'synthetic' ? 'ข้อมูลจำลอง' : 'ข้อมูลนำเข้า'}), timeframe {tf}, {candles[0]?.time} ถึง {candles.at(-1)?.time}, {candles.length} แท่ง, ราคาไม่ได้ปรับ corporate actions</li>
              <li>เงินทุน {int(cash)} ฿ · ใช้เงิน {alloc}% ของเงินสดต่อการเข้าซื้อ · จำนวนหุ้นปัดลงเป็นจำนวนเต็ม</li>
              <li>ค่าธรรมเนียม {feePct}% ต่อข้าง + slippage {slip} bps ต่อข้าง (สมมติฐาน ไม่ใช่อัตราจริง)</li>
              <li>สัญญาณที่ราคาปิดแท่ง i → fill ราคาเปิดแท่ง i+1 · equity mark-to-market ด้วยราคาปิด</li>
              <li>Sharpe/Sortino: ผลตอบแทนราย{tf === '1D' ? 'วัน' : tf === '1W' ? 'สัปดาห์' : 'เดือน'} × √{PPY[tf]}, risk-free = 0; แสดง N/A เมื่อน้อยกว่า 30 งวด · CAGR แสดงเมื่อข้อมูล ≥ 1 ปี</li>
            </ul>
            <Callout kind="warn">ผลย้อนหลังไม่ใช่หลักฐานว่าจะเกิดซ้ำ ระวัง overfitting (ปรับพารามิเตอร์จนสวยใน in-sample), look-ahead bias, survivorship bias และข้อมูลที่ไม่ได้ปรับ corporate actions — ถ้าผล out-of-sample แย่กว่า in-sample มาก แปลว่ากลยุทธ์อาจแค่ "จำ" อดีต</Callout>
          </section>
          <section className="card mt-3 overflow-x-auto">
            <h2 className="h2">รายการเทรด ({result.full.trades.length})</h2>
            {result.full.trades.length === 0 ? <p className="muted mt-2">ไม่มีเทรดที่ปิดแล้ว</p> : (
              <table className="tbl mt-2"><thead><tr><th>เข้า</th><th>ราคาเข้า</th><th>ออก</th><th>ราคาออก</th><th>จำนวน</th><th>แท่ง</th><th>ค่าธรรมเนียม</th><th>กำไร/ขาดทุน</th></tr></thead>
                <tbody>{result.full.trades.map((t, i) => <tr key={i}><td>{t.entryTime}</td><td>{fmt(t.entryPrice)}</td><td>{t.exitTime}</td><td>{fmt(t.exitPrice)}</td><td>{int(t.qty)}</td><td>{t.bars}</td><td>{fmt(t.fees)}</td><td><Signed n={t.pnl}>{fmt(t.pnl)} ({pct(t.returnPct)})</Signed></td></tr>)}</tbody></table>
            )}
          </section>
        </>
      )}
    </>
  );
}
