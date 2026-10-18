import type { Candle } from './types';
import { gauss, rng } from './random';

/** A regime is a stretch of bars with a drift and volatility (per bar, as fractions). */
export type Regime = { bars: number; drift: number; vol: number; gap?: number; label: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Business days (Mon–Fri) from start; ignores exchange holidays on purpose — data is synthetic. */
export function businessDays(start: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(start + 'T00:00:00Z');
  while (out.length < count) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function generateCandles(opts: { seed: number; start: string; startPrice: number; baseVolume: number; regimes: Regime[] }): Candle[] {
  const r = rng(opts.seed);
  const total = opts.regimes.reduce((s, g) => s + g.bars, 0);
  const days = businessDays(opts.start, total);
  const out: Candle[] = [];
  let prev = opts.startPrice;
  let i = 0;
  for (const g of opts.regimes) {
    for (let k = 0; k < g.bars; k++, i++) {
      const gap = k === 0 && g.gap ? g.gap : 0;
      const open = round2(Math.max(0.5, prev * (1 + gap + gauss(r) * g.vol * 0.3)));
      const close = round2(Math.max(0.5, open * (1 + g.drift + gauss(r) * g.vol)));
      const range = Math.abs(gauss(r)) * g.vol * 0.6 * open;
      const high = round2(Math.max(open, close) + range * r());
      const low = round2(Math.max(0.1, Math.min(open, close) - range * r()));
      const volMult = 1 + Math.abs(close - open) / open / Math.max(g.vol, 1e-4) * 0.5 + (gap ? 2 : 0);
      out.push({ time: days[i], open, high, low, close, volume: Math.round(opts.baseVolume * volMult * (0.6 + r() * 0.8)) });
      prev = close;
    }
  }
  return out;
}
