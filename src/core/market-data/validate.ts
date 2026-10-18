import type { Candle } from './types';

export type CandleIssue = { index: number; message: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Checks one bar's internal consistency. Returns Thai error messages. */
export function checkCandle(c: Candle): string[] {
  const errs: string[] = [];
  if (!DATE_RE.test(c.time) || Number.isNaN(Date.parse(c.time))) errs.push(`วันที่ "${c.time}" ไม่ใช่รูปแบบ YYYY-MM-DD`);
  for (const k of ['open', 'high', 'low', 'close', 'volume'] as const) {
    if (!Number.isFinite(c[k])) errs.push(`${k} ไม่ใช่ตัวเลขที่ถูกต้อง`);
  }
  if (errs.length) return errs;
  if (c.high < Math.max(c.open, c.close)) errs.push('high ต้อง ≥ max(open, close)');
  if (c.low > Math.min(c.open, c.close)) errs.push('low ต้อง ≤ min(open, close)');
  if (c.high < c.low) errs.push('high ต้อง ≥ low');
  if (c.low <= 0) errs.push('ราคาต้องมากกว่า 0');
  if (c.volume < 0) errs.push('volume ห้ามติดลบ');
  return errs;
}

/** Full-series validation: per-bar checks + ordering + duplicates. Missing bars are reported, never filled. */
export function validateSeries(candles: Candle[]): { issues: CandleIssue[]; gaps: number } {
  const issues: CandleIssue[] = [];
  let gaps = 0;
  candles.forEach((c, i) => {
    for (const m of checkCandle(c)) issues.push({ index: i, message: m });
    if (i > 0) {
      const prev = candles[i - 1].time;
      if (c.time === prev) issues.push({ index: i, message: `วันที่ ${c.time} ซ้ำกับแถวก่อนหน้า` });
      else if (c.time < prev) issues.push({ index: i, message: `ลำดับเวลาไม่เรียงจากเก่าไปใหม่ (${prev} → ${c.time})` });
      else if ((Date.parse(c.time) - Date.parse(prev)) / 86_400_000 > 5) gaps++;
    }
  });
  return { issues, gaps };
}
