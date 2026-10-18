import type { Candle, Timeframe } from './types';

function periodKey(time: string, tf: Timeframe): string {
  if (tf === '1M') return time.slice(0, 7);
  const d = new Date(time + 'T00:00:00Z');
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

/** Aggregate daily bars into weekly/monthly. Period time = first trading day in that period. */
export function resample(daily: Candle[], tf: Timeframe): Candle[] {
  if (tf === '1D') return daily;
  const out: Candle[] = [];
  let key = '';
  for (const c of daily) {
    const k = periodKey(c.time, tf);
    const last = out[out.length - 1];
    if (k !== key || !last) {
      out.push({ ...c });
      key = k;
    } else {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume += c.volume;
    }
  }
  return out;
}
