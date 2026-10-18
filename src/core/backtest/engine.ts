import type { Candle } from '../market-data/types';
import { donchian, rsi, sma } from '../indicators';
import { drawdowns, mean, returns, stdev } from '../risk';

export type StrategyConfig =
  | { kind: 'smaCross'; fast: number; slow: number }
  | { kind: 'breakout'; entry: number; exit: number }
  | { kind: 'rsiReversion'; period: number; buyBelow: number; sellAbove: number };

export type BacktestConfig = {
  strategy: StrategyConfig; initialCash: number; commissionRate: number; slippageBps: number;
  allocation: number; // fraction of equity used per entry (0–1)
  periodsPerYear: number; // 252 daily, 52 weekly, 12 monthly
};

export type Trade = { entryTime: string; entryPrice: number; exitTime: string; exitPrice: number; qty: number; pnl: number; returnPct: number; fees: number; bars: number };

export const STRATEGY_TEXT: Record<StrategyConfig['kind'], string> = {
  smaCross: 'ซื้อเมื่อ SMA เร็ว ตัดขึ้นเหนือ SMA ช้า (วัดที่ราคาปิด) และขายเมื่อตัดลง',
  breakout: 'ซื้อเมื่อราคาปิดสูงกว่า High สูงสุดของ N แท่งก่อนหน้า (ไม่รวมแท่งปัจจุบัน) และขายเมื่อปิดต่ำกว่า Low ต่ำสุดของ M แท่งก่อนหน้า',
  rsiReversion: 'ตัวอย่างการทดลองเท่านั้น: ซื้อเมื่อ RSI ปิดต่ำกว่าเกณฑ์ล่าง ขายเมื่อ RSI ปิดสูงกว่าเกณฑ์บน',
};

/**
 * Desired position (1 long / 0 flat) decided at the CLOSE of bar i, using only bars 0..i.
 * The engine fills that decision at the OPEN of bar i+1.
 */
export function signals(c: Candle[], s: StrategyConfig): (0 | 1)[] {
  const out: (0 | 1)[] = new Array(c.length).fill(0);
  const cl = c.map((x) => x.close);
  let pos: 0 | 1 = 0;
  if (s.kind === 'smaCross') {
    const f = sma(cl, s.fast); const sl = sma(cl, s.slow);
    for (let i = 0; i < c.length; i++) {
      if (f[i] !== null && sl[i] !== null) pos = (f[i] as number) > (sl[i] as number) ? 1 : 0;
      out[i] = pos;
    }
  } else if (s.kind === 'breakout') {
    const up = donchian(c, s.entry).upper; const dn = donchian(c, s.exit).lower;
    for (let i = 1; i < c.length; i++) {
      const hi = up[i - 1]; const lo = dn[i - 1]; // previous-window levels, excludes bar i itself
      if (pos === 0 && hi !== null && c[i].close > hi) pos = 1;
      else if (pos === 1 && lo !== null && c[i].close < lo) pos = 0;
      out[i] = pos;
    }
  } else {
    const r = rsi(c, s.period);
    for (let i = 0; i < c.length; i++) {
      const v = r[i];
      if (v !== null) { if (pos === 0 && v < s.buyBelow) pos = 1; else if (pos === 1 && v > s.sellAbove) pos = 0; }
      out[i] = pos;
    }
  }
  return out;
}

/**
 * Simulate bars [start, end). Signals are computed on the whole series but each uses only earlier bars,
 * so an out-of-sample window still gets indicator warm-up from the preceding data without look-ahead.
 */
export function runBacktest(all: Candle[], cfg: BacktestConfig, start = 0, end = all.length) {
  const sig = signals(all.slice(0, end), cfg.strategy).slice(start);
  const c = all.slice(start, end);
  const slip = cfg.slippageBps / 10_000;
  let cash = cfg.initialCash;
  let qty = 0;
  let entry: { time: string; price: number; fee: number; index: number } | null = null;
  const trades: Trade[] = [];
  const equity: { time: string; value: number }[] = [];
  let fees = 0;
  let barsInMarket = 0;

  for (let i = 0; i < c.length; i++) {
    const want = i > 0 ? sig[i - 1] : 0; // decision from previous close; nothing carried in from before `start`
    const bar = c[i];
    if (want === 1 && qty === 0) {
      const price = bar.open * (1 + slip);
      const budget = cash * cfg.allocation;
      const n = Math.floor(budget / (price * (1 + cfg.commissionRate)));
      if (n > 0) {
        const fee = n * price * cfg.commissionRate;
        cash -= n * price + fee; fees += fee; qty = n;
        entry = { time: bar.time, price, fee, index: i };
      }
    } else if (want === 0 && qty > 0 && entry) {
      const price = bar.open * (1 - slip);
      const fee = qty * price * cfg.commissionRate;
      cash += qty * price - fee; fees += fee;
      const pnl = qty * (price - entry.price) - fee - entry.fee;
      trades.push({ entryTime: entry.time, entryPrice: entry.price, exitTime: bar.time, exitPrice: price, qty, pnl, returnPct: pnl / (qty * entry.price + entry.fee), fees: fee + entry.fee, bars: i - entry.index });
      qty = 0; entry = null;
    }
    if (qty > 0) barsInMarket++;
    equity.push({ time: bar.time, value: cash + qty * bar.close }); // mark-to-market at close
  }
  const openTrade = entry && qty > 0 ? { entryTime: entry.time, entryPrice: entry.price, qty, markPrice: c[c.length - 1].close } : null;
  const bench = c.length ? c.map((x) => ({ time: x.time, value: (cfg.initialCash * x.close) / c[0].open })) : [];
  return { trades, equity, benchmark: bench, metrics: metrics(equity.map((e) => e.value), trades, cfg, fees, barsInMarket, c.length), openTrade };
}

export function metrics(eq: number[], trades: Trade[], cfg: BacktestConfig, fees: number, barsInMarket: number, bars: number) {
  const start = cfg.initialCash;
  const end = eq.length ? eq[eq.length - 1] : start;
  const r = returns(eq);
  const years = bars / cfg.periodsPerYear;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const sd = stdev(r);
  const downside = r.filter((x) => x < 0);
  const dsd = downside.length >= 2 ? Math.sqrt(downside.reduce((a, x) => a + x * x, 0) / downside.length) : NaN;
  const enough = r.length >= 30; // below this, ratios are too noisy to report
  return {
    totalReturn: end / start - 1,
    cagr: years >= 1 ? (end / start) ** (1 / years) - 1 : null, // annualizing < 1 year of data exaggerates
    maxDrawdown: drawdowns(eq).max,
    volatility: enough ? sd * Math.sqrt(cfg.periodsPerYear) : null,
    sharpe: enough && sd > 0 ? (mean(r) / sd) * Math.sqrt(cfg.periodsPerYear) : null, // risk-free = 0
    sortino: enough && dsd > 0 ? (mean(r) / dsd) * Math.sqrt(cfg.periodsPerYear) : null,
    trades: trades.length,
    winRate: trades.length ? wins.length / trades.length : null,
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : null) : grossProfit / grossLoss,
    expectancy: trades.length ? trades.reduce((a, t) => a + t.pnl, 0) / trades.length : null,
    avgWin: wins.length ? grossProfit / wins.length : null,
    avgLoss: losses.length ? -grossLoss / losses.length : null,
    exposure: bars ? barsInMarket / bars : 0,
    fees,
  };
}

export type BacktestResult = ReturnType<typeof runBacktest>;
