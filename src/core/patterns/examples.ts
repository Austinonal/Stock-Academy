import type { Candle } from '../market-data/types';
import { businessDays } from '../market-data/synthetic';
import type { PatternId } from './candles';

type Bar = [number, number, number, number]; // O H L C, on a ~10–20 price scale

const DOWN: Bar[] = [[20, 20.5, 19, 19.5], [19.5, 19.8, 18.5, 19], [19, 19.2, 18, 18.5], [18.5, 18.7, 17.5, 18], [18, 18.2, 17, 17.5]];
const UP: Bar[] = [[10, 11, 9.5, 10.5], [10.5, 11.6, 10.3, 11.4], [11.4, 12.4, 11.2, 12.2], [12.2, 13.3, 12, 13.1], [13.1, 14.2, 12.9, 14]];
const FLAT: Bar[] = [[15, 15.6, 14.5, 15.2], [15.2, 15.7, 14.7, 14.9], [14.9, 15.5, 14.6, 15.3], [15.3, 15.8, 14.8, 15], [15, 15.5, 14.6, 15.1]];

/** Hand-built examples (context + pattern bars). The quiz answer comes from the detector, not from this label. */
export const EXAMPLES: { label: PatternId | 'none'; bars: Bar[] }[] = [
  { label: 'hammer', bars: [...DOWN, [17.4, 18, 15.3, 17.9]] },
  { label: 'hangingMan', bars: [...UP, [14.1, 14.6, 12.2, 14.5]] },
  { label: 'shootingStar', bars: [...UP, [14.1, 16.3, 14.05, 14.5]] },
  { label: 'invertedHammer', bars: [...DOWN, [17.4, 19.6, 17.35, 17.8]] },
  { label: 'bullishEngulfing', bars: [...DOWN, [17.5, 17.6, 16.6, 16.8], [16.6, 17.9, 16.5, 17.8]] },
  { label: 'bearishEngulfing', bars: [...UP, [14, 14.9, 13.9, 14.8], [15, 15.1, 13.6, 13.7]] },
  { label: 'morningStar', bars: [...DOWN, [17.5, 17.6, 15.9, 16], [15.8, 16, 15.5, 15.7], [15.9, 17.2, 15.8, 17.1]] },
  { label: 'eveningStar', bars: [...UP, [14, 15.9, 13.9, 15.8], [16, 16.3, 15.8, 16.1], [15.9, 16, 14.3, 14.4]] },
  { label: 'threeWhiteSoldiers', bars: [...FLAT, [15, 16, 14.9, 15.9], [15.5, 16.8, 15.4, 16.7], [16.3, 17.6, 16.2, 17.5]] },
  { label: 'threeBlackCrows', bars: [...FLAT, [15.1, 15.2, 14.1, 14.2], [14.6, 14.7, 13.4, 13.5], [13.9, 14, 12.8, 12.9]] },
  { label: 'dragonflyDoji', bars: [...FLAT, [15, 15.02, 13.8, 15]] },
  { label: 'gravestoneDoji', bars: [...FLAT, [15, 16.2, 14.99, 15]] },
  { label: 'longLeggedDoji', bars: [...FLAT, [15, 16, 14, 15.05]] },
  { label: 'marubozu', bars: [...FLAT, [15, 16.5, 15, 16.5]] },
  { label: 'none', bars: [...FLAT, [15.1, 15.8, 14.9, 15.6]] },
  { label: 'none', bars: [...UP, [14, 14.3, 13.2, 13.5]] },
  { label: 'none', bars: [...DOWN, [17.4, 17.7, 16.7, 16.9]] },
];

export function toCandles(bars: Bar[], scale = 1): Candle[] {
  const days = businessDays('2024-03-04', bars.length);
  return bars.map(([o, h, l, c], i) => ({ time: days[i], open: +(o * scale).toFixed(2), high: +(h * scale).toFixed(2), low: +(l * scale).toFixed(2), close: +(c * scale).toFixed(2), volume: 1000 }));
}
