import { runBacktest, signals, metrics, type BacktestConfig } from './engine';
import { demoProvider } from '../market-data/demo';
import type { Candle } from '../market-data/types';

const cfg = (over: Partial<BacktestConfig> = {}): BacktestConfig => ({
  strategy: { kind: 'smaCross', fast: 2, slow: 3 }, initialCash: 10_000, commissionRate: 0, slippageBps: 0, allocation: 1, periodsPerYear: 252, ...over,
});
const bars = (closes: number[], opens = closes): Candle[] => closes.map((c, i) => ({ time: `2024-02-${String(i + 1).padStart(2, '0')}`, open: opens[i], high: Math.max(c, opens[i]) + 1, low: Math.min(c, opens[i]) - 1, close: c, volume: 1 }));

describe('backtest engine', () => {
  it('no look-ahead: signals up to bar i are unchanged when future bars are removed', () => {
    const c = demoProvider.getSeries('DMSTEEL', '1D')!.candles;
    for (const s of [{ kind: 'smaCross', fast: 10, slow: 30 }, { kind: 'breakout', entry: 20, exit: 10 }, { kind: 'rsiReversion', period: 14, buyBelow: 30, sellAbove: 60 }] as const) {
      const full = signals(c, s);
      expect(signals(c.slice(0, 200), s)).toEqual(full.slice(0, 200));
    }
  });
  it('signal at close of bar i fills at open of bar i+1', () => {
    // closes rise from bar 3 → fast SMA crosses above slow at bar 3 close → entry at bar 4 open (=100)
    const c = bars([10, 10, 10, 20, 30, 30, 5, 5, 5], [10, 10, 10, 20, 100, 30, 5, 7, 5]);
    const r = runBacktest(c, cfg());
    expect(r.trades[0].entryTime).toBe(c[4].time);
    expect(r.trades[0].entryPrice).toBe(100);
  });
  it('deducts commission and slippage', () => {
    const c = demoProvider.getSeries('DMTECH', '1D')!.candles;
    const free = runBacktest(c, cfg({ strategy: { kind: 'smaCross', fast: 10, slow: 30 } }));
    const costly = runBacktest(c, cfg({ strategy: { kind: 'smaCross', fast: 10, slow: 30 }, commissionRate: 0.002, slippageBps: 20 }));
    expect(costly.metrics.fees).toBeGreaterThan(0);
    expect(costly.equity.at(-1)!.value).toBeLessThan(free.equity.at(-1)!.value);
    expect(free.trades.length).toBe(costly.trades.length);
  });
  it('equity is cash + marked position and never negative', () => {
    const c = demoProvider.getSeries('DMBANK', '1D')!.candles;
    const r = runBacktest(c, cfg({ strategy: { kind: 'breakout', entry: 20, exit: 10 }, commissionRate: 0.001 }));
    expect(r.equity).toHaveLength(c.length);
    expect(r.equity.every((e) => e.value > 0)).toBe(true);
  });
  it('metrics formulas', () => {
    const t = (pnl: number) => ({ entryTime: '', entryPrice: 1, exitTime: '', exitPrice: 1, qty: 1, pnl, returnPct: 0, fees: 0, bars: 1 });
    const m = metrics([100, 120, 90, 110], [t(30), t(-10), t(-20)], cfg({ initialCash: 100 }), 0, 2, 4);
    expect(m.maxDrawdown).toBeCloseTo(90 / 120 - 1);
    expect(m.profitFactor).toBeCloseTo(1);
    expect(m.winRate).toBeCloseTo(1 / 3);
    expect(m.expectancy).toBeCloseTo(0);
    expect(m.sharpe).toBeNull(); // too few returns → N/A, not a fake number
    expect(m.cagr).toBeNull(); // < 1 year
    expect(metrics([100, 110], [t(10)], cfg({ initialCash: 100 }), 0, 1, 2).profitFactor).toBe(Infinity);
  });
});

describe('backtest windows', () => {
  it('out-of-sample window starts flat and uses only its own bars for equity', () => {
    const c = demoProvider.getSeries('DMTECH', '1D')!.candles;
    const split = 364;
    const oos = runBacktest(c, cfg({ strategy: { kind: 'smaCross', fast: 10, slow: 30 } }), split);
    expect(oos.equity).toHaveLength(c.length - split);
    expect(oos.equity[0].time).toBe(c[split].time);
    expect(oos.trades.every((t) => t.entryTime > c[split].time)).toBe(true);
    const ins = runBacktest(c, cfg({ strategy: { kind: 'smaCross', fast: 10, slow: 30 } }), 0, split);
    expect(ins.equity.at(-1)!.time).toBe(c[split - 1].time);
  });
});
