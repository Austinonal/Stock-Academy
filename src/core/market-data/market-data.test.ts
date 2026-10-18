import { demoProvider, DEMO_DEFS } from './demo';
import { validateSeries, checkCandle } from './validate';
import { parseCandlesCsv, candlesToCsv } from './csv';
import { resample } from './resample';
import { parseSeriesJson } from './providers';

describe('demo data', () => {
  it('is deterministic and passes validation for every symbol/timeframe', () => {
    for (const d of DEMO_DEFS) for (const tf of ['1D', '1W', '1M'] as const) {
      const s = demoProvider.getSeries(d.symbol, tf)!;
      expect(s.meta.source).toBe('synthetic');
      expect(validateSeries(s.candles).issues).toEqual([]);
    }
    const a = demoProvider.getSeries('DMTECH', '1D')!.candles;
    expect(a.length).toBe(520);
    expect(a[100]).toEqual(new (demoProvider.constructor as typeof import('./demo').DemoMarketDataProvider)().getSeries('DMTECH', '1D')!.candles[100]);
  });
});

describe('validation', () => {
  const ok = { time: '2024-01-02', open: 10, high: 11, low: 9, close: 10.5, volume: 100 };
  it('accepts a valid bar', () => expect(checkCandle(ok)).toEqual([]));
  it('rejects broken OHLC relationships, NaN and negative volume', () => {
    expect(checkCandle({ ...ok, high: 10.2 })).toContain('high ต้อง ≥ max(open, close)');
    expect(checkCandle({ ...ok, low: 10.4 })).toContain('low ต้อง ≤ min(open, close)');
    expect(checkCandle({ ...ok, close: NaN }).length).toBeGreaterThan(0);
    expect(checkCandle({ ...ok, volume: -1 })).toContain('volume ห้ามติดลบ');
  });
  it('flags unsorted and duplicate timestamps and counts gaps', () => {
    const r = validateSeries([ok, { ...ok, time: '2024-01-01' }, { ...ok, time: '2024-01-01' }, { ...ok, time: '2024-02-01' }]);
    expect(r.issues.map((i) => i.index)).toEqual([1, 2]);
    expect(r.gaps).toBe(1);
  });
});

describe('csv', () => {
  it('parses with aliases, sorts, reports row errors', () => {
    const r = parseCandlesCsv('date,o,h,l,c,vol\n2024-01-03,10,11,9,10,5\n2024/1/2,10,11,9,10,5\n2024-01-04,10,9,9,10,5');
    expect(r.fatal).toBeUndefined();
    expect(r.candles.map((c) => c.time)).toEqual(['2024-01-02', '2024-01-03']);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].row).toBe(4);
  });
  it('fails clearly on missing columns', () => {
    expect(parseCandlesCsv('Date,Price\n2024-01-01,10').fatal).toMatch(/ไม่พบคอลัมน์/);
  });
  it('handles quoted cells and does not evaluate content', () => {
    const r = parseCandlesCsv('Date,Open,High,Low,Close,Volume\n2024-01-02,"10",11,9,10,"1,000"');
    expect(r.candles[0].volume).toBe(1000);
    expect(parseCandlesCsv('Date,Open,High,Low,Close,Volume\n=cmd(),1,1,1,1,1').errors).toHaveLength(1);
  });
  it('round-trips', () => {
    const c = demoProvider.getSeries('DMFOOD', '1D')!.candles.slice(0, 20);
    expect(parseCandlesCsv(candlesToCsv(c)).candles).toEqual(c);
  });
});

describe('resample', () => {
  it('aggregates OHLCV into weeks', () => {
    const d = [
      { time: '2024-01-01', open: 1, high: 2, low: 1, close: 1.5, volume: 10 },
      { time: '2024-01-02', open: 1.5, high: 3, low: 0.5, close: 2, volume: 20 },
      { time: '2024-01-08', open: 2, high: 2, low: 2, close: 2, volume: 1 },
    ];
    expect(resample(d, '1W')).toEqual([
      { time: '2024-01-01', open: 1, high: 3, low: 0.5, close: 2, volume: 30 },
      { time: '2024-01-08', open: 2, high: 2, low: 2, close: 2, volume: 1 },
    ]);
  });
});

describe('json import', () => {
  it('rejects invalid bars and accepts valid', () => {
    expect('error' in parseSeriesJson('{bad')).toBe(true);
    expect('error' in parseSeriesJson(JSON.stringify({ symbol: 'X', candles: [{ time: '2024-01-01', open: 1, high: 0.5, low: 1, close: 1, volume: 1 }] }))).toBe(true);
    const r = parseSeriesJson(JSON.stringify({ symbol: 'abc', candles: [{ time: '2024-01-01', open: 1, high: 1, low: 1, close: 1, volume: 1 }] }));
    expect(r).toMatchObject({ symbol: 'ABC' });
  });
});
