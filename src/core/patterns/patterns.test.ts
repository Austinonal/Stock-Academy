import { detectAt, detectAll } from './candles';
import type { Candle } from '../market-data/types';
import { demoProvider } from '../market-data/demo';

const c = (o: number, h: number, l: number, cl: number, i = 0): Candle => ({ time: `2024-01-${String(i + 1).padStart(2, '0')}`, open: o, high: h, low: l, close: cl, volume: 1 });
const down = [c(20, 20.5, 19, 19.5, 0), c(19.5, 19.8, 18.5, 19, 1), c(19, 19.2, 18, 18.5, 2), c(18.5, 18.7, 17.5, 18, 3), c(18, 18.2, 17, 17.5, 4)];
const up = down.map((_, i) => c(10 + i, 11 + i, 9.5 + i, 10.5 + i, i));
const ids = (cs: Candle[]) => detectAt(cs, cs.length - 1).map((h) => h.id);

describe('candlestick detectors', () => {
  it('doji family', () => {
    expect(ids([c(10, 11, 9, 10.05)])).toContain('longLeggedDoji');
    expect(ids([c(10, 10.02, 8, 10)])).toContain('dragonflyDoji');
    expect(ids([c(10, 12, 9.99, 10)])).toContain('gravestoneDoji');
  });
  it('marubozu and spinning top', () => {
    expect(ids([c(10, 12, 10, 12)])).toContain('marubozu');
    expect(ids([c(10, 11, 9, 10.4)])).toContain('spinningTop');
  });
  it('hammer needs prior downtrend; same shape after uptrend is hanging man', () => {
    const shape = (i: number, base: number) => c(base, base + 0.1, base - 2.2, base + 0.5, i);
    expect(ids([...down, shape(5, 17.5)])).toContain('hammer');
    expect(ids([...up, shape(5, 15)])).toContain('hangingMan');
    expect(ids([shape(0, 10)])).not.toContain('hammer'); // no context → not labelled
  });
  it('shooting star after uptrend', () => {
    expect(ids([...up, c(15, 17.2, 14.95, 15.4, 5)])).toContain('shootingStar');
  });
  it('engulfing and harami', () => {
    expect(ids([c(10, 10.2, 8.8, 9), c(8.8, 10.5, 8.7, 10.4, 1)])).toContain('bullishEngulfing');
    expect(ids([c(9, 10.2, 8.8, 10), c(10.2, 10.3, 8.5, 8.7, 1)])).toContain('bearishEngulfing');
    expect(ids([c(12, 12.2, 9.8, 10), c(10.5, 11.2, 10.4, 11, 1)])).toContain('bullishHarami');
  });
  it('piercing line and dark cloud cover', () => {
    expect(ids([c(12, 12.1, 10, 10.2), c(9.8, 11.5, 9.7, 11.4, 1)])).toContain('piercingLine');
    expect(ids([c(10, 12.1, 9.9, 12), c(12.3, 12.4, 10.6, 10.7, 1)])).toContain('darkCloudCover');
  });
  it('morning / evening star', () => {
    expect(ids([c(12, 12.1, 9.9, 10), c(9.8, 10, 9.5, 9.7, 1), c(9.9, 11.6, 9.8, 11.5, 2)])).toContain('morningStar');
    expect(ids([c(10, 12.1, 9.9, 12), c(12.2, 12.5, 12, 12.3, 1), c(12.1, 12.2, 10.4, 10.5, 2)])).toContain('eveningStar');
  });
  it('three soldiers / crows', () => {
    expect(ids([c(10, 11.1, 9.9, 11), c(10.5, 12.1, 10.4, 12, 1), c(11.5, 13.1, 11.4, 13, 2)])).toContain('threeWhiteSoldiers');
    expect(ids([c(13, 13.1, 11.9, 12), c(12.5, 12.6, 10.9, 11, 1), c(11.5, 11.6, 9.9, 10, 2)])).toContain('threeBlackCrows');
  });
  it('tweezers, inside and outside bars', () => {
    expect(ids([c(10, 12, 9.9, 11.8), c(11.8, 12, 10.5, 10.6, 1)])).toContain('tweezerTop');
    expect(ids([c(12, 12.1, 10, 10.2), c(10.2, 11.5, 10, 11.4, 1)])).toContain('tweezerBottom');
    expect(ids([c(10, 12, 8, 11), c(10.5, 11.5, 9, 11, 1)])).toContain('insideBar');
    expect(ids([c(10, 11, 9, 10.5), c(10.5, 12, 8, 9, 1)])).toContain('outsideBar');
  });
  it('a plain medium candle matches nothing (no false positive)', () => {
    expect(ids([c(10, 10.8, 9.6, 10.6)])).toEqual([]);
  });
  it('never looks ahead: detection at i is unchanged by later bars', () => {
    const d = demoProvider.getSeries('DMTECH', '1D')!.candles;
    expect(detectAt(d.slice(0, 101), 100)).toEqual(detectAt(d, 100));
    expect(detectAll(d.slice(0, 50)).every((h) => h.index < 50)).toBe(true);
  });
});

describe('pattern lab examples', () => {
  it('every hand-built example is detected as its label (and "none" examples detect nothing)', async () => {
    const { EXAMPLES, toCandles } = await import('./examples');
    for (const ex of EXAMPLES) for (const scale of [1, 3.7]) {
      const cs = toCandles(ex.bars, scale);
      const got = detectAt(cs, cs.length - 1).map((h) => h.id);
      if (ex.label === 'none') expect(got).toEqual([]);
      else expect(got).toContain(ex.label);
    }
  });
});
