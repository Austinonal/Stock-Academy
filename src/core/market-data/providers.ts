import type { Candle, MarketDataProvider, MarketSeries, SeriesMeta, Timeframe } from './types';
import { resample } from './resample';
import { validateSeries } from './validate';

/** Holds user-imported series (CSV or JSON) in memory; same interface as the demo provider. */
export class ImportedMarketDataProvider implements MarketDataProvider {
  constructor(readonly id: 'csv' | 'json', private series: Record<string, { meta: Omit<SeriesMeta, 'timeframe'>; candles: Candle[] }>) {}
  listSymbols() { return Object.keys(this.series); }
  getSeries(symbol: string, timeframe: Timeframe): MarketSeries | null {
    const s = this.series[symbol];
    return s ? { meta: { ...s.meta, timeframe }, candles: resample(s.candles, timeframe) } : null;
  }
}

/** JSON import: { symbol, name?, candles: Candle[] } — validated strictly, rejected if any bar is invalid. */
export function parseSeriesJson(text: string): { symbol: string; name: string; candles: Candle[] } | { error: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { error: 'ไฟล์ไม่ใช่ JSON ที่ถูกต้อง' }; }
  if (typeof data !== 'object' || data === null) return { error: 'ต้องเป็น object' };
  const o = data as Record<string, unknown>;
  if (typeof o.symbol !== 'string' || !/^[A-Z0-9._-]{1,12}$/i.test(o.symbol)) return { error: 'ต้องมี "symbol" (ตัวอักษร/ตัวเลข ไม่เกิน 12 ตัว)' };
  if (!Array.isArray(o.candles) || o.candles.length === 0) return { error: 'ต้องมี "candles" เป็น array ที่ไม่ว่าง' };
  const candles: Candle[] = o.candles.map((c: Record<string, unknown>) => ({
    time: String(c?.time ?? ''), open: Number(c?.open), high: Number(c?.high), low: Number(c?.low), close: Number(c?.close), volume: Number(c?.volume),
  }));
  const { issues } = validateSeries(candles);
  if (issues.length) return { error: `ข้อมูลไม่ผ่านการตรวจ ${issues.length} จุด เช่น แถว ${issues[0].index + 1}: ${issues[0].message}` };
  return { symbol: o.symbol.toUpperCase(), name: typeof o.name === 'string' ? o.name.slice(0, 60) : o.symbol, candles };
}

/** Placeholder contract for a future licensed live feed. Intentionally returns nothing — no fake live data. */
export class LiveMarketDataProvider implements MarketDataProvider {
  readonly id = 'live';
  listSymbols(): string[] { return []; }
  getSeries(): MarketSeries | null { return null; }
}
