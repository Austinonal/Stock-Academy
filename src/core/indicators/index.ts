import type { Candle } from '../market-data/types';

/** Output convention: same length as input; `null` during warm-up or when undefined (never a fake 0). */
export type Series = (number | null)[];

const nulls = (n: number): Series => new Array(n).fill(null);
const closes = (c: Candle[]) => c.map((x) => x.close);

export function sma(values: Series, period: number): Series {
  const out = nulls(values.length);
  if (period < 1) return out;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    // a null inside the window resets the run — avoids averaging over missing data
    if (v === null || !Number.isFinite(v)) { sum = 0; count = 0; continue; }
    sum += v; count++;
    if (count > period) { sum -= values[i - period] as number; count = period; }
    if (count === period) out[i] = sum / period;
  }
  return out;
}

/** EMA seeded with the SMA of the first `period` values; alpha = 2/(period+1). */
export function ema(values: Series, period: number, alpha = 2 / (period + 1)): Series {
  const out = nulls(values.length);
  if (period < 1) return out;
  let prev: number | null = null;
  let seedSum = 0;
  let seedCount = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null) { if (prev === null) { seedSum = 0; seedCount = 0; } else out[i] = null; continue; }
    if (prev === null) {
      seedSum += v; seedCount++;
      if (seedCount === period) { prev = seedSum / period; out[i] = prev; }
    } else {
      prev = alpha * v + (1 - alpha) * prev;
      out[i] = prev;
    }
  }
  return out;
}

/** Wilder smoothing (RMA) = EMA with alpha 1/period. Used by RSI, ATR, ADX. */
export const rma = (values: Series, period: number) => ema(values, period, 1 / period);

export function wma(values: Series, period: number): Series {
  const out = nulls(values.length);
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < values.length; i++) {
    let s = 0;
    let ok = true;
    for (let k = 0; k < period; k++) {
      const v = values[i - k];
      if (v === null) { ok = false; break; }
      s += v * (period - k);
    }
    if (ok) out[i] = s / denom;
  }
  return out;
}

export function vwma(c: Candle[], period: number): Series {
  const pv = sma(c.map((x) => x.close * x.volume), period);
  const v = sma(c.map((x) => x.volume), period);
  return pv.map((x, i) => (x === null || !v[i] ? null : x / (v[i] as number)));
}

export function stdev(values: Series, period: number): Series {
  const mean = sma(values, period);
  return mean.map((m, i) => {
    if (m === null) return null;
    let s = 0;
    for (let k = 0; k < period; k++) s += ((values[i - k] as number) - m) ** 2;
    return Math.sqrt(s / period); // population stdev, as in Bollinger's definition
  });
}

export function macd(c: Candle[], fast = 12, slow = 26, signal = 9) {
  const cl = closes(c);
  const f = ema(cl, fast);
  const s = ema(cl, slow);
  const line = f.map((x, i) => (x === null || s[i] === null ? null : x - (s[i] as number)));
  const sig = ema(line, signal);
  const hist = line.map((x, i) => (x === null || sig[i] === null ? null : x - (sig[i] as number)));
  return { line, signal: sig, hist };
}

/** RSI with Wilder smoothing. All-gain window → 100, flat window → 50. */
export function rsi(c: Candle[], period = 14): Series {
  const cl = closes(c);
  const gains: Series = [null];
  const losses: Series = [null];
  for (let i = 1; i < cl.length; i++) {
    const d = cl[i] - cl[i - 1];
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }
  const g = rma(gains, period);
  const l = rma(losses, period);
  return g.map((gv, i) => {
    const lv = l[i];
    if (gv === null || lv === null) return null;
    if (lv === 0) return gv === 0 ? 50 : 100;
    return 100 - 100 / (1 + gv / lv);
  });
}

export function bollinger(c: Candle[], period = 20, mult = 2) {
  const cl = closes(c);
  const mid = sma(cl, period);
  const sd = stdev(cl, period);
  const upper = mid.map((m, i) => (m === null ? null : m + mult * (sd[i] as number)));
  const lower = mid.map((m, i) => (m === null ? null : m - mult * (sd[i] as number)));
  const percentB = cl.map((x, i) => {
    const u = upper[i]; const lo = lower[i];
    return u === null || lo === null || u === lo ? null : (x - lo) / (u - lo);
  });
  const bandwidth = mid.map((m, i) => (m === null || m === 0 ? null : ((upper[i] as number) - (lower[i] as number)) / m));
  return { mid, upper, lower, percentB, bandwidth };
}

export function trueRange(c: Candle[]): Series {
  return c.map((x, i) => (i === 0 ? x.high - x.low : Math.max(x.high - x.low, Math.abs(x.high - c[i - 1].close), Math.abs(x.low - c[i - 1].close))));
}

export const atr = (c: Candle[], period = 14) => rma(trueRange(c), period);

export function keltner(c: Candle[], period = 20, mult = 2, atrPeriod = 10) {
  const mid = ema(closes(c), period);
  const a = atr(c, atrPeriod);
  return {
    mid,
    upper: mid.map((m, i) => (m === null || a[i] === null ? null : m + mult * (a[i] as number))),
    lower: mid.map((m, i) => (m === null || a[i] === null ? null : m - mult * (a[i] as number))),
  };
}

export function donchian(c: Candle[], period = 20) {
  const upper = nulls(c.length);
  const lower = nulls(c.length);
  for (let i = period - 1; i < c.length; i++) {
    let hi = -Infinity; let lo = Infinity;
    for (let k = i - period + 1; k <= i; k++) { hi = Math.max(hi, c[k].high); lo = Math.min(lo, c[k].low); }
    upper[i] = hi; lower[i] = lo;
  }
  return { upper, lower, mid: upper.map((u, i) => (u === null ? null : (u + (lower[i] as number)) / 2)) };
}

export function stochastic(c: Candle[], kPeriod = 14, dPeriod = 3, smooth = 1) {
  const { upper, lower } = donchian(c, kPeriod);
  const raw = c.map((x, i) => {
    const u = upper[i]; const l = lower[i];
    if (u === null || l === null) return null;
    return u === l ? 50 : ((x.close - l) / (u - l)) * 100;
  });
  const k = smooth > 1 ? sma(raw, smooth) : raw;
  return { k, d: sma(k, dPeriod) };
}

export function williamsR(c: Candle[], period = 14): Series {
  return stochastic(c, period).k.map((k) => (k === null ? null : k - 100));
}

export function roc(c: Candle[], period = 12): Series {
  return c.map((x, i) => (i < period || c[i - period].close === 0 ? null : ((x.close - c[i - period].close) / c[i - period].close) * 100));
}

export function cci(c: Candle[], period = 20): Series {
  const tp = c.map((x) => (x.high + x.low + x.close) / 3);
  const m = sma(tp, period);
  return m.map((mv, i) => {
    if (mv === null) return null;
    let md = 0;
    for (let k = 0; k < period; k++) md += Math.abs(tp[i - k] - mv);
    md /= period;
    return md === 0 ? 0 : (tp[i] - mv) / (0.015 * md);
  });
}

export function obv(c: Candle[]): Series {
  let v = 0;
  return c.map((x, i) => {
    if (i > 0) v += x.close > c[i - 1].close ? x.volume : x.close < c[i - 1].close ? -x.volume : 0;
    return v;
  });
}

const mfm = (x: Candle) => (x.high === x.low ? 0 : ((x.close - x.low) - (x.high - x.close)) / (x.high - x.low));

export function adLine(c: Candle[]): Series {
  let v = 0;
  return c.map((x) => (v += mfm(x) * x.volume));
}

export function cmf(c: Candle[], period = 20): Series {
  const mfv = sma(c.map((x) => mfm(x) * x.volume), period);
  const vol = sma(c.map((x) => x.volume), period);
  return mfv.map((m, i) => (m === null || !vol[i] ? null : m / (vol[i] as number)));
}

export function mfi(c: Candle[], period = 14): Series {
  const tp = c.map((x) => (x.high + x.low + x.close) / 3);
  const out = nulls(c.length);
  for (let i = period; i < c.length; i++) {
    let pos = 0; let neg = 0;
    for (let k = i - period + 1; k <= i; k++) {
      const flow = tp[k] * c[k].volume;
      if (tp[k] > tp[k - 1]) pos += flow; else if (tp[k] < tp[k - 1]) neg += flow;
    }
    out[i] = neg === 0 ? (pos === 0 ? 50 : 100) : 100 - 100 / (1 + pos / neg);
  }
  return out;
}

/** ADX / +DI / -DI per Wilder (RMA smoothing). */
export function adx(c: Candle[], period = 14) {
  const plusDM: Series = [null];
  const minusDM: Series = [null];
  for (let i = 1; i < c.length; i++) {
    const up = c[i].high - c[i - 1].high;
    const down = c[i - 1].low - c[i].low;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
  }
  const tr: Series = trueRange(c).map((t, i) => (i === 0 ? null : t));
  const trS = rma(tr, period);
  const pS = rma(plusDM, period);
  const mS = rma(minusDM, period);
  const plusDI = trS.map((t, i) => (t === null || t === 0 ? null : (100 * (pS[i] as number)) / t));
  const minusDI = trS.map((t, i) => (t === null || t === 0 ? null : (100 * (mS[i] as number)) / t));
  const dx = plusDI.map((p, i) => {
    const m = minusDI[i];
    if (p === null || m === null) return null;
    return p + m === 0 ? 0 : (100 * Math.abs(p - m)) / (p + m);
  });
  return { adx: rma(dx, period), plusDI, minusDI };
}

/** Classic floor-trader pivots from one bar (usually the previous period). */
export function pivotPoints(prev: Pick<Candle, 'high' | 'low' | 'close'>) {
  const p = (prev.high + prev.low + prev.close) / 3;
  return { p, r1: 2 * p - prev.low, s1: 2 * p - prev.high, r2: p + (prev.high - prev.low), s2: p - (prev.high - prev.low) };
}

export const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
/** Retracement levels between a swing `from` → `to` price. */
export function fibLevels(from: number, to: number, ratios = FIB_RATIOS) {
  return ratios.map((r) => ({ ratio: r, price: to - (to - from) * r }));
}
