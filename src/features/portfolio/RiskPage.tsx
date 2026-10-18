import { useMemo, useState } from 'react';
import { PriceChart } from '../../components/charts/PriceChart';
import { Callout, Loading, NumberField, PageHeader, Stat } from '../../components/ui';
import { DEMO_DEFS, demoProvider } from '../../core/market-data/demo';
import { rng } from '../../core/market-data/random';
import { afterLosingStreak, correlation, drawdowns, monteCarlo, positionSize, recoveryGain, returns, stdev } from '../../core/risk';
import { isObject, usePersistent } from '../../storage/usePersistent';
import { fmt, int, pct } from '../../lib/format';

const SYMS = DEMO_DEFS.map((d) => d.symbol);
const CLOSES = Object.fromEntries(SYMS.map((s) => [s, demoProvider.getSeries(s, '1D')!.candles.map((c) => c.close)]));
const TIMES = demoProvider.getSeries(SYMS[0], '1D')!.candles.map((c) => c.time);
const RETS = Object.fromEntries(SYMS.map((s) => [s, returns(CLOSES[s])]));
type Targets = Record<string, number>; // percent, rest = cash
const isTargets = (v: unknown): v is Targets => isObject(v) && Object.values(v).every((x) => typeof x === 'number');

export default function RiskPage() {
  const [targets, setTargets, { loading }] = usePersistent<Targets>('portfolio', { DMTECH: 25, DMBANK: 25, DMSTEEL: 15, DMFOOD: 25 }, isTargets);
  const total = SYMS.reduce((a, s) => a + (targets[s] ?? 0), 0);
  const cashPct = 100 - total;
  const invalid = total > 100 || SYMS.some((s) => (targets[s] ?? 0) < 0 || !Number.isFinite(targets[s] ?? 0));

  // Buy & hold from day 0 with target weights (no rebalancing) — shows how actual weights drift
  const sim = useMemo(() => {
    if (invalid) return null;
    const start = 100_000;
    const shares = Object.fromEntries(SYMS.map((s) => [s, (start * (targets[s] ?? 0) / 100) / CLOSES[s][0]]));
    const cash = start * cashPct / 100;
    const values = TIMES.map((_, i) => cash + SYMS.reduce((a, s) => a + shares[s] * CLOSES[s][i], 0));
    const last = values.at(-1)!;
    const actual = Object.fromEntries(SYMS.map((s) => [s, (shares[s] * CLOSES[s].at(-1)!) / last * 100]));
    const r = returns(values);
    return { values, actual, actualCash: cash / last * 100, ret: last / start - 1, vol: stdev(r) * Math.sqrt(252), dd: drawdowns(values) };
  }, [targets, invalid, cashPct]);

  const [ps, setPs] = useState({ portfolio: 100_000, riskPct: 1, entry: 50, stop: 46 });
  const size = positionSize({ portfolio: ps.portfolio, riskFraction: ps.riskPct / 100, entry: ps.entry, stop: ps.stop });
  const [mc, setMc] = useState({ winRate: 45, rr: 2, risk: 2, trades: 100 });
  const mcValid = mc.winRate > 0 && mc.winRate < 100 && mc.rr > 0 && mc.rr <= 10 && mc.risk > 0 && mc.risk <= 50 && Number.isInteger(mc.trades) && mc.trades >= 10 && mc.trades <= 1000;
  const mcRes = useMemo(() => (mcValid ? monteCarlo({ winRate: mc.winRate / 100, rr: mc.rr, risk: mc.risk / 100, trades: mc.trades, runs: 2000 }, rng(42)) : null), [mc, mcValid]);

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="พอร์ต & ความเสี่ยง (Portfolio & Risk Lab)" subtitle="ทดลองการกระจายพอร์ต ความผันผวน drawdown และคณิตศาสตร์ของการกำหนดขนาดสถานะ" demo />
      <section className="card" aria-labelledby="alloc">
        <h2 id="alloc" className="h2">1. จัดสรรพอร์ตทดลอง (เป้าหมาย %)</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-5">
          {SYMS.map((s) => <NumberField key={s} label={`${s} · ${DEMO_DEFS.find((d) => d.symbol === s)!.sector}`} suffix="%" value={targets[s] ?? 0} onChange={(n) => setTargets((t) => ({ ...t, [s]: n }))} min={0} max={100} />)}
          <Stat label="เงินสด (ส่วนที่เหลือ)" value={`${fmt(cashPct, 1)}%`} />
        </div>
        {invalid && <div className="mt-2"><Callout kind="warn">สัดส่วนรวมต้องไม่เกิน 100% และไม่ติดลบ (ตอนนี้ {fmt(total, 1)}%)</Callout></div>}
        {sim && (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Stat label="ผลตอบแทนทั้งช่วง (buy & hold)" value={pct(sim.ret)} tone={sim.ret >= 0 ? 'up' : 'down'} />
              <Stat label="Volatility ต่อปี" value={pct(sim.vol)} hint="SD ผลตอบแทนรายวัน × √252" />
              <Stat label="Max drawdown" value={pct(sim.dd.max)} />
              <Stat label="ต้องกำไรเท่าไรเพื่อฟื้นจาก max DD" value={pct(recoveryGain(-sim.dd.max))} />
            </div>
            <div className="mt-3"><PriceChart candles={sim.values.map((v, i) => ({ time: TIMES[i], open: v, high: v, low: v, close: v, volume: 0 }))} chartType="line" showVolume={false} height={220} ariaLabel="มูลค่าพอร์ต" /></div>
            <h3 className="mt-3 font-medium">เป้าหมาย vs สัดส่วนจริง ณ วันสุดท้าย (ไม่ rebalance)</h3>
            <div className="mt-1 overflow-x-auto"><table className="tbl"><thead><tr><th>สินทรัพย์</th><th>กลุ่ม</th><th className="text-right">เป้าหมาย</th><th className="text-right">จริง</th><th className="text-right">ส่วนต่าง</th></tr></thead>
              <tbody>{SYMS.map((s) => <tr key={s}><td className="font-mono">{s}</td><td>{DEMO_DEFS.find((d) => d.symbol === s)!.sector}</td><td className="text-right">{fmt(targets[s] ?? 0, 1)}%</td><td className="text-right">{fmt(sim.actual[s], 1)}%</td><td className="text-right">{fmt(sim.actual[s] - (targets[s] ?? 0), 1)}</td></tr>)}
                <tr><td>เงินสด</td><td>—</td><td className="text-right">{fmt(cashPct, 1)}%</td><td className="text-right">{fmt(sim.actualCash, 1)}%</td><td className="text-right">{fmt(sim.actualCash - cashPct, 1)}</td></tr></tbody></table></div>
            {Math.max(...SYMS.map((s) => sim.actual[s])) > 40 && <div className="mt-2"><Callout kind="warn">มีสินทรัพย์เดียวเกิน 40% ของพอร์ต — ความเสี่ยงจากการกระจุกตัวสูง</Callout></div>}
          </>
        )}
        <h3 className="mt-4 font-medium">Correlation ของผลตอบแทนรายวัน (252 วันล่าสุด)</h3>
        <div className="mt-1 overflow-x-auto"><table className="tbl"><thead><tr><th />{SYMS.map((s) => <th key={s} className="text-right">{s}</th>)}</tr></thead>
          <tbody>{SYMS.map((a) => <tr key={a}><th>{a}</th>{SYMS.map((b) => <td key={b} className="text-right tabular-nums">{fmt(correlation(RETS[a].slice(-252), RETS[b].slice(-252)))}</td>)}</tr>)}</tbody></table></div>
        <p className="muted mt-1 text-xs">ข้อมูลจำลองสร้างแต่ละ symbol แยกกัน correlation จึงใกล้ 0 — ในตลาดจริงหุ้นมักเคลื่อนไหวไปด้วยกันมากกว่านี้ โดยเฉพาะช่วงวิกฤต การกระจายการลงทุนไม่ได้กำจัดความเสี่ยงทุกชนิด</p>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="card" aria-labelledby="size">
          <h2 id="size" className="h2">2. Position sizing calculator</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <NumberField label="มูลค่าพอร์ต" suffix="฿" value={ps.portfolio} onChange={(n) => setPs({ ...ps, portfolio: n })} />
            <NumberField label="ยอมเสี่ยงต่อไม้" suffix="% ของพอร์ต" value={ps.riskPct} step={0.1} onChange={(n) => setPs({ ...ps, riskPct: n })} />
            <NumberField label="ราคาเข้า (สมมติ)" value={ps.entry} onChange={(n) => setPs({ ...ps, entry: n })} />
            <NumberField label="ราคาที่ถือว่าสมมติฐานผิด (stop)" value={ps.stop} onChange={(n) => setPs({ ...ps, stop: n })} />
          </div>
          {!size.ok ? <div className="mt-3"><Callout kind="warn"><ul className="list-disc pl-4">{size.errors.map((e) => <li key={e}>{e}</li>)}</ul></Callout></div> : (
            <div className="mt-3 space-y-1 text-sm">
              <p>เงินที่ยอมเสี่ยง = {int(ps.portfolio)} × {ps.riskPct}% = <strong>{fmt(size.riskAmount)} ฿</strong></p>
              <p>ความเสี่ยงต่อหุ้น = {ps.entry} − {ps.stop} = <strong>{fmt(size.perShare)} ฿</strong></p>
              <p>จำนวนหุ้น = {fmt(size.riskAmount)} ÷ {fmt(size.perShare)} = <strong>{int(size.shares)} หุ้น</strong> (มูลค่า {fmt(size.positionValue)} ฿ = {pct(size.portfolioShare)} ของพอร์ต)</p>
              {size.exceedsPortfolio && <Callout kind="warn">ขนาดที่คำนวณได้เกินมูลค่าพอร์ต — stop แคบมากจนสูตรต้องใช้ leverage ซึ่งเพิ่มความเสี่ยงอย่างมาก</Callout>}
              <Callout kind="warn">นี่คือคณิตศาสตร์ของสถานการณ์สมมติ ไม่ใช่คำแนะนำจำนวนเงิน และ stop ไม่รับประกันราคา — ถ้าเกิด gap ผ่าน stop ขาดทุนจริงอาจมากกว่า {fmt(size.riskAmount)} ฿ เช่น gap ลง 15% จากราคาเข้า จะขาดทุน {fmt(size.shares * ps.entry * 0.15)} ฿</Callout>
            </div>
          )}
        </section>
        <section className="card" aria-labelledby="rec">
          <h2 id="rec" className="h2">3. Recovery math & ขาดทุนติดต่อกัน</h2>
          <table className="tbl mt-2"><thead><tr><th>ขาดทุน</th><th className="text-right">ต้องกำไรเพื่อกลับทุน</th></tr></thead>
            <tbody>{[0.1, 0.2, 0.3, 0.5, 0.75, 0.9].map((l) => <tr key={l}><td>−{pct(l, 0)}</td><td className="text-right">+{pct(recoveryGain(l), 1)}</td></tr>)}</tbody></table>
          <table className="tbl mt-3"><thead><tr><th>ขาดทุนติดต่อกัน</th><th className="text-right">เสี่ยง 1%/ไม้</th><th className="text-right">เสี่ยง 5%/ไม้</th><th className="text-right">เสี่ยง 10%/ไม้</th></tr></thead>
            <tbody>{[5, 10, 20].map((n) => <tr key={n}><td>{n} ครั้ง</td>{[0.01, 0.05, 0.1].map((r) => <td key={r} className="text-right">{pct(afterLosingStreak(n, r) - 1, 1)}</td>)}</tr>)}</tbody></table>
        </section>
      </div>

      <section className="card mt-3" aria-labelledby="mc">
        <h2 id="mc" className="h2">4. Monte Carlo: ลำดับผลการเทรด</h2>
        <p className="muted mt-1">จำลอง 2,000 เส้นทางจากความได้เปรียบเดียวกัน เพื่อเห็นว่าผลลัพธ์กระจายกว้างแค่ไหน (seed คงที่ ทำซ้ำได้)</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-4">
          <NumberField label="Win rate" suffix="%" value={mc.winRate} onChange={(n) => setMc({ ...mc, winRate: n })} />
          <NumberField label="กำไรเฉลี่ยต่อขาดทุนเฉลี่ย (R)" value={mc.rr} step={0.1} onChange={(n) => setMc({ ...mc, rr: n })} />
          <NumberField label="เสี่ยงต่อไม้" suffix="% ของพอร์ต" value={mc.risk} step={0.5} onChange={(n) => setMc({ ...mc, risk: n })} />
          <NumberField label="จำนวนเทรด" value={mc.trades} step={10} onChange={(n) => setMc({ ...mc, trades: n })} />
        </div>
        {!mcRes ? <div className="mt-2"><Callout kind="warn">ค่าไม่ถูกต้อง: win rate 0–100, R 0–10, เสี่ยง 0–50%, จำนวนเทรด 10–1000</Callout></div> : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Expectancy (R ต่อเทรด)" value={fmt(mcRes.expectancyR)} tone={mcRes.expectancyR >= 0 ? 'up' : 'down'} />
            <Stat label="พอร์ตปลายทาง: แย่ 5%" value={pct(mcRes.final.p5 - 1)} />
            <Stat label="พอร์ตปลายทาง: มัธยฐาน" value={pct(mcRes.final.p50 - 1)} />
            <Stat label="พอร์ตปลายทาง: ดี 5%" value={pct(mcRes.final.p95 - 1)} />
            <Stat label="Max DD มัธยฐาน / แย่ 5%" value={`${pct(mcRes.maxDrawdown.p50, 0)} / ${pct(mcRes.maxDrawdown.p5, 0)}`} />
            <Stat label="โอกาส drawdown ≥ 50%" value={pct(mcRes.probDd50, 1)} />
          </div>
        )}
        <p className="muted mt-2 text-xs">สังเกต: expectancy บวกยังขาดทุนได้ในบางเส้นทาง และการเพิ่มความเสี่ยงต่อไม้ทำให้โอกาส drawdown ลึกเพิ่มขึ้นเร็วมาก (แนวคิด risk of ruin)</p>
      </section>
    </>
  );
}
