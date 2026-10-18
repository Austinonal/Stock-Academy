import { useMemo } from 'react';
import { demoProvider } from '../core/market-data/demo';
import { ImportedMarketDataProvider } from '../core/market-data/providers';
import type { Candle, MarketSeries, Timeframe } from '../core/market-data/types';
import { isObject, usePersistent } from '../storage/usePersistent';

export type ImportedStore = Record<string, { name: string; source: 'csv' | 'json'; candles: Candle[]; importedAt: string }>;
const isStore = (v: unknown): v is ImportedStore => isObject(v) && Object.values(v).every((s) => isObject(s) && Array.isArray(s.candles));

export const useImported = () => usePersistent<ImportedStore>('imported', {}, isStore);

/** Demo symbols + user-imported series behind the same provider interface. */
export function useMarket() {
  const [imported, , { loading }] = useImported();
  return useMemo(() => {
    const imp = new ImportedMarketDataProvider('csv', Object.fromEntries(Object.entries(imported).map(([sym, s]) => [sym, {
      candles: s.candles,
      meta: { symbol: sym, name: s.name, sector: 'Imported', currency: 'THB' as const, timezone: 'Asia/Bangkok' as const, source: s.source, adjusted: false as const, note: `นำเข้าโดยผู้ใช้ (${s.source.toUpperCase()}) เมื่อ ${s.importedAt.slice(0, 10)} — ตรวจสิทธิ์การใช้ข้อมูลด้วยตนเอง` },
    }])));
    const symbols = [...demoProvider.listSymbols().map((s) => ({ symbol: s, imported: false })), ...imp.listSymbols().map((s) => ({ symbol: s, imported: true }))];
    const get = (symbol: string, tf: Timeframe): MarketSeries | null => demoProvider.getSeries(symbol, tf) ?? imp.getSeries(symbol, tf);
    return { symbols, get, loading };
  }, [imported, loading]);
}
