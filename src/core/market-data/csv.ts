import type { Candle } from './types';
import { checkCandle } from './validate';

export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 50_000;

export const DEFAULT_ALIASES: Record<keyof Candle, string[]> = {
  time: ['time', 'date', 'datetime', 'timestamp', 'วันที่'],
  open: ['open', 'o', 'เปิด'],
  high: ['high', 'h', 'สูงสุด'],
  low: ['low', 'l', 'ต่ำสุด'],
  close: ['close', 'c', 'adj close', 'ปิด'],
  volume: ['volume', 'vol', 'v', 'ปริมาณ'],
};

export type CsvRowError = { row: number; message: string };
export type CsvResult = { candles: Candle[]; errors: CsvRowError[]; fatal?: string; totalRows: number };

/** Minimal CSV line split with double-quote support. Cells are treated as plain data, never evaluated. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normDate(s: string): string {
  // accept YYYY-MM-DD, YYYY/MM/DD, or full ISO timestamps (date part only — daily data)
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : s;
}

export function parseCandlesCsv(text: string, aliases = DEFAULT_ALIASES): CsvResult {
  if (text.length > MAX_CSV_BYTES) return { candles: [], errors: [], totalRows: 0, fatal: `ไฟล์ใหญ่เกิน ${MAX_CSV_BYTES / 1024 / 1024} MB` };
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return { candles: [], errors: [], totalRows: 0, fatal: 'ไฟล์ไม่มีข้อมูล ต้องมี header และอย่างน้อย 1 แถว' };
  if (lines.length - 1 > MAX_CSV_ROWS) return { candles: [], errors: [], totalRows: lines.length - 1, fatal: `จำนวนแถวเกิน ${MAX_CSV_ROWS.toLocaleString()} แถว` };
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {} as Record<keyof Candle, number>;
  const missing: string[] = [];
  for (const k of Object.keys(aliases) as (keyof Candle)[]) {
    idx[k] = header.findIndex((h) => aliases[k].includes(h));
    if (idx[k] < 0) missing.push(k);
  }
  if (missing.length) {
    return { candles: [], errors: [], totalRows: lines.length - 1,
      fatal: `ไม่พบคอลัมน์: ${missing.join(', ')} — header ที่รองรับ เช่น "Date,Open,High,Low,Close,Volume" (พบ: ${header.join(', ')})` };
  }
  const candles: Candle[] = [];
  const errors: CsvRowError[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const num = (k: keyof Candle) => Number((cells[idx[k]] ?? '').replace(/,/g, ''));
    const c: Candle = { time: normDate(cells[idx.time] ?? ''), open: num('open'), high: num('high'), low: num('low'), close: num('close'), volume: num('volume') };
    const errs = checkCandle(c);
    if (errs.length) errors.push({ row: i + 1, message: errs.join('; ') });
    else candles.push(c);
  }
  candles.sort((a, b) => a.time.localeCompare(b.time));
  const dedup = candles.filter((c, i) => {
    if (i > 0 && candles[i - 1].time === c.time) { errors.push({ row: 0, message: `วันที่ ${c.time} ซ้ำ — ใช้เฉพาะแถวแรก` }); return false; }
    return true;
  });
  return { candles: dedup, errors, totalRows: lines.length - 1 };
}

export function candlesToCsv(candles: Candle[]): string {
  return ['Date,Open,High,Low,Close,Volume', ...candles.map((c) => `${c.time},${c.open},${c.high},${c.low},${c.close},${c.volume}`)].join('\n');
}
