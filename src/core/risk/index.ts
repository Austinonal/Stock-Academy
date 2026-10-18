/** Simple returns between consecutive values. */
export function returns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) out.push(values[i - 1] === 0 ? 0 : values[i] / values[i - 1] - 1);
  return out;
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** Sample standard deviation (n−1). NaN when fewer than 2 points. */
export function stdev(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return NaN;
  const x = a.slice(-n); const y = b.slice(-n);
  const mx = mean(x); const my = mean(y);
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx === 0 || syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy);
}

/** Peak-to-trough drawdown series (≤ 0) and the max drawdown (most negative). */
export function drawdowns(equity: number[]) {
  let peak = -Infinity;
  const series = equity.map((v) => { peak = Math.max(peak, v); return peak > 0 ? v / peak - 1 : 0; });
  return { series, max: series.length ? Math.min(...series) : 0 };
}

/** Gain needed to recover from a loss: −50% needs +100%. */
export const recoveryGain = (loss: number) => (loss >= 1 ? Infinity : 1 / (1 - loss) - 1);

/** Shares such that (entry − stop) × shares ≈ portfolio × riskFraction. Educational math only. */
export function positionSize(p: { portfolio: number; riskFraction: number; entry: number; stop: number }) {
  const errors: string[] = [];
  if (!(p.portfolio > 0)) errors.push('มูลค่าพอร์ตต้องมากกว่า 0');
  if (!(p.riskFraction > 0 && p.riskFraction <= 0.2)) errors.push('สัดส่วนความเสี่ยงต่อไม้ควรอยู่ระหว่าง 0–20%');
  if (!(p.entry > 0) || !(p.stop > 0)) errors.push('ราคาเข้าและราคาจุดที่สมมติฐานผิดต้องมากกว่า 0');
  if (p.stop >= p.entry) errors.push('ตัวอย่างนี้เป็นฝั่งซื้อ (long) ราคา stop ต้องต่ำกว่าราคาเข้า');
  if (errors.length) return { ok: false as const, errors };
  const riskAmount = p.portfolio * p.riskFraction;
  const perShare = p.entry - p.stop;
  const shares = Math.floor(riskAmount / perShare);
  const positionValue = shares * p.entry;
  return { ok: true as const, riskAmount, perShare, shares, positionValue, portfolioShare: positionValue / p.portfolio, exceedsPortfolio: positionValue > p.portfolio };
}

/** Losing streak: equity left after n consecutive losses of `loss` fraction each. */
export const afterLosingStreak = (n: number, loss: number) => (1 - loss) ** n;

/**
 * Monte Carlo of trade sequences with fixed-fraction risk. Each trade: win → +risk×rr, loss → −risk (of current equity).
 * Shows the RANGE of outcomes from the same edge — not a forecast.
 */
export function monteCarlo(p: { winRate: number; rr: number; risk: number; trades: number; runs: number }, rand: () => number) {
  const finals: number[] = [];
  const dds: number[] = [];
  let ruin = 0;
  for (let r = 0; r < p.runs; r++) {
    let eq = 1; let peak = 1; let maxDd = 0;
    for (let t = 0; t < p.trades; t++) {
      eq *= rand() < p.winRate ? 1 + p.risk * p.rr : 1 - p.risk;
      peak = Math.max(peak, eq);
      maxDd = Math.min(maxDd, eq / peak - 1);
    }
    finals.push(eq); dds.push(maxDd);
    if (maxDd <= -0.5) ruin++;
  }
  const q = (xs: number[], k: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(k * s.length))]; };
  return {
    expectancyR: p.winRate * p.rr - (1 - p.winRate),
    final: { p5: q(finals, 0.05), p50: q(finals, 0.5), p95: q(finals, 0.95) },
    maxDrawdown: { p50: q(dds, 0.5), p5: q(dds, 0.05) }, // p5 = worst 5%
    probDd50: ruin / p.runs,
    probLoss: finals.filter((f) => f < 1).length / p.runs,
  };
}
