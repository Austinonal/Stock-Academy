import * as I from './index';
import { INDICATORS, defaultParams } from './catalog';
import { demoProvider } from '../market-data/demo';
import type { Candle } from '../market-data/types';

const bar = (close: number, i: number, extra: Partial<Candle> = {}): Candle =>
  ({ time: `2024-01-${String(i + 1).padStart(2, '0')}`, open: close, high: close + 1, low: close - 1, close, volume: 100, ...extra });
const bars = (xs: number[]) => xs.map((x, i) => bar(x, i));
const near = (a: number | null, b: number) => { expect(a).not.toBeNull(); expect(a as number).toBeCloseTo(b, 8); };

describe('moving averages', () => {
  it('SMA warm-up is null, values are hand-checkable', () => {
    expect(I.sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
    expect(I.sma([], 3)).toEqual([]);
    expect(I.sma([1, 2], 3)).toEqual([null, null]);
  });
  it('SMA resets across missing values instead of averaging over them', () => {
    expect(I.sma([1, 2, null, 4, 5], 2)).toEqual([null, 1.5, null, null, 4.5]);
  });
  it('EMA seeds with SMA then applies alpha', () => {
    const e = I.ema([1, 2, 3, 4], 3); // seed = 2, alpha = .5 → 3, 3.5
    expect(e).toEqual([null, null, 2, 3]);
    expect(I.ema([1, 2, 3, 4, 5], 3)[4]).toBeCloseTo(4);
  });
  it('WMA weights the latest most', () => {
    expect(I.wma([1, 2, 3], 3)[2]).toBeCloseTo((1 + 4 + 9) / 6);
  });
  it('VWMA equals SMA when volume is constant and null when volume is zero', () => {
    const c = bars([1, 2, 3, 4]);
    expect(I.vwma(c, 2)).toEqual(I.sma([1, 2, 3, 4], 2));
    expect(I.vwma(c.map((x) => ({ ...x, volume: 0 })), 2)[3]).toBeNull();
  });
});

describe('oscillators', () => {
  it('RSI = 100 for all gains, 50 for flat prices, in [0,100]', () => {
    expect(I.rsi(bars([1, 2, 3, 4, 5, 6]), 3).slice(3)).toEqual([100, 100, 100]);
    expect(I.rsi(bars([5, 5, 5, 5, 5]), 3)[4]).toBe(50);
    const r = I.rsi(demoProvider.getSeries('DMSTEEL', '1D')!.candles, 14).filter((x) => x !== null) as number[];
    expect(Math.min(...r)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...r)).toBeLessThanOrEqual(100);
  });
  it('RSI first value matches Wilder hand calc', () => {
    // closes 1,2,1,2 period 2: changes +1,-1,+1. seed avgG=(1+0)/2=.5, avgL=(0+1)/2=.5 → 50; next: G=.75,L=.25 → 75
    expect(I.rsi(bars([1, 2, 1, 2]), 2)).toEqual([null, null, 50, 75]);
  });
  it('MACD line = EMA fast − EMA slow, hist = line − signal', () => {
    const c = demoProvider.getSeries('DMTECH', '1D')!.candles;
    const m = I.macd(c);
    const f = I.ema(c.map((x) => x.close), 12)[100] as number;
    const s = I.ema(c.map((x) => x.close), 26)[100] as number;
    near(m.line[100], f - s);
    near(m.hist[100], (m.line[100] as number) - (m.signal[100] as number));
    expect(m.line[24]).toBeNull();
    expect(m.signal[32]).toBeNull();
    expect(m.signal[33]).not.toBeNull();
  });
  it('Stochastic is 50 when range is flat and 100 at the high', () => {
    const flat = bars([5, 5, 5]).map((b) => ({ ...b, high: 5, low: 5 }));
    expect(I.stochastic(flat, 3, 1).k[2]).toBe(50);
    const up = [1, 2, 3].map((x, i) => bar(x, i, { high: x, low: x - 0.5 }));
    expect(I.stochastic(up, 3, 1).k[2]).toBe(100);
    expect(I.williamsR(up, 3)[2]).toBe(0);
  });
  it('ROC and CCI basics', () => {
    expect(I.roc(bars([10, 11, 12]), 2)).toEqual([null, null, 20]);
    expect(I.cci(bars([5, 5, 5]), 3)[2]).toBe(0);
  });
});

describe('volatility', () => {
  it('Bollinger uses population stdev', () => {
    const b = I.bollinger(bars([2, 4, 4, 4, 5, 5, 7, 9]), 8, 2);
    expect(b.mid[7]).toBe(5);
    expect(b.upper[7]).toBe(9); // σ = 2
    expect(b.lower[7]).toBe(1);
    expect(b.percentB[7]).toBe(1);
  });
  it('True range accounts for gaps, ATR seeds with mean TR', () => {
    const c: Candle[] = [
      { time: '2024-01-01', open: 10, high: 11, low: 9, close: 10, volume: 1 },
      { time: '2024-01-02', open: 14, high: 15, low: 13, close: 14, volume: 1 }, // gap: TR = 15-10 = 5
    ];
    expect(I.trueRange(c)).toEqual([2, 5]);
    expect(I.atr(c, 2)).toEqual([null, 3.5]);
  });
  it('Donchian includes the current bar', () => {
    const d = I.donchian(bars([1, 3, 2]), 2);
    expect(d.upper).toEqual([null, 4, 4]);
    expect(d.lower).toEqual([null, 0, 1]);
  });
});

describe('volume', () => {
  it('OBV adds/subtracts volume by close direction', () => {
    expect(I.obv(bars([1, 2, 2, 1]))).toEqual([0, 100, 100, 0]);
  });
  it('A/D and CMF use the money-flow multiplier; zero range contributes 0', () => {
    const c = [bar(10, 0, { high: 10, low: 8 }), bar(9, 1, { high: 9, low: 9 })];
    expect(I.adLine(c)).toEqual([100, 100]);
    expect(I.cmf(c, 2)[1]).toBe(0.5);
  });
  it('MFI is 100 when every typical price rises', () => {
    expect(I.mfi(bars([1, 2, 3, 4]), 3)[3]).toBe(100);
  });
});

describe('ADX', () => {
  it('strong uptrend → +DI > −DI and ADX rises; values bounded', () => {
    const c = bars(Array.from({ length: 60 }, (_, i) => 10 + i));
    const a = I.adx(c, 14);
    expect(a.plusDI[59]!).toBeGreaterThan(a.minusDI[59]!);
    expect(a.adx[59]!).toBeGreaterThan(50);
    expect(a.adx[59]!).toBeLessThanOrEqual(100);
    expect(a.adx[20]).toBeNull();
  });
});

describe('levels', () => {
  it('pivots and fib', () => {
    expect(I.pivotPoints({ high: 12, low: 6, close: 9 })).toEqual({ p: 9, r1: 12, s1: 6, r2: 15, s2: 3 });
    expect(I.fibLevels(100, 200).find((l) => l.ratio === 0.5)!.price).toBe(150);
  });
});

describe('catalog', () => {
  it('every exposed indicator computes full-length output without NaN on demo data and on a 3-bar series', () => {
    const c = demoProvider.getSeries('DMBANK', '1D')!.candles;
    for (const d of INDICATORS) for (const data of [c, c.slice(0, 3)]) {
      for (const line of d.compute(data, defaultParams(d))) {
        expect(line.data).toHaveLength(data.length);
        expect(line.data.every((v) => v === null || Number.isFinite(v))).toBe(true);
      }
    }
  });
});
