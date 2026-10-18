import type { MarketDataProvider, MarketSeries, SeriesMeta, Timeframe } from './types';
import { generateCandles, type Regime } from './synthetic';
import { resample } from './resample';

type DemoDef = Omit<SeriesMeta, 'timeframe' | 'currency' | 'timezone' | 'source' | 'adjusted' | 'note'> & {
  seed: number; startPrice: number; baseVolume: number; regimes: Regime[]; story: string;
};

/** Fictional symbols — none of these are real listed companies. */
export const DEMO_DEFS: DemoDef[] = [
  { symbol: 'DMTECH', name: 'เดโมเทค (สมมติ)', sector: 'Technology', seed: 11, startPrice: 42, baseVolume: 2_400_000, story: 'ขาขึ้น → พักฐาน → breakout → ความผันผวนขยายตัว',
    regimes: [
      { bars: 160, drift: 0.0012, vol: 0.018, label: 'uptrend' },
      { bars: 90, drift: 0, vol: 0.011, label: 'sideways / volatility contraction' },
      { bars: 70, drift: 0.0025, vol: 0.02, gap: 0.04, label: 'breakout with gap' },
      { bars: 80, drift: -0.0008, vol: 0.032, label: 'volatility expansion' },
      { bars: 120, drift: 0.0006, vol: 0.017, label: 'noisy drift' },
    ] },
  { symbol: 'DMBANK', name: 'เดโมแบงก์ (สมมติ)', sector: 'Financials', seed: 22, startPrice: 128, baseVolume: 5_000_000, story: 'กรอบ sideways ยาว แล้วขาลงหลัง gap ลง',
    regimes: [
      { bars: 200, drift: 0.0001, vol: 0.009, label: 'sideways range' },
      { bars: 60, drift: -0.0022, vol: 0.016, gap: -0.05, label: 'breakdown with gap down' },
      { bars: 140, drift: -0.0007, vol: 0.013, label: 'downtrend' },
      { bars: 120, drift: 0.0005, vol: 0.01, label: 'base building' },
    ] },
  { symbol: 'DMSTEEL', name: 'เดโมสตีล (สมมติ)', sector: 'Materials', seed: 33, startPrice: 18, baseVolume: 9_000_000, story: 'ธุรกิจวัฏจักร: ขึ้นแรง ลงแรง ผันผวนสูง',
    regimes: [
      { bars: 120, drift: 0.002, vol: 0.025, label: 'cyclical upswing' },
      { bars: 100, drift: -0.0025, vol: 0.03, label: 'cyclical downswing' },
      { bars: 100, drift: 0.0002, vol: 0.022, label: 'choppy noise' },
      { bars: 200, drift: 0.0014, vol: 0.024, label: 'recovery' },
    ] },
  { symbol: 'DMFOOD', name: 'เดโมฟู้ด (สมมติ)', sector: 'Consumer Staples', seed: 44, startPrice: 64, baseVolume: 1_500_000, story: 'ธุรกิจมั่นคง ผันผวนต่ำ ขึ้นช้า ๆ',
    regimes: [
      { bars: 520, drift: 0.0004, vol: 0.008, label: 'steady low-volatility uptrend' },
    ] },
];

const NOTE = 'ข้อมูลจำลอง (Synthetic/Demo) — สร้างด้วยอัลกอริทึมจาก seed คงที่ ไม่ใช่ราคาหุ้นจริง';

export class DemoMarketDataProvider implements MarketDataProvider {
  readonly id = 'demo';
  private cache = new Map<string, MarketSeries>();
  listSymbols() { return DEMO_DEFS.map((d) => d.symbol); }
  getSeries(symbol: string, timeframe: Timeframe): MarketSeries | null {
    const key = symbol + timeframe;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const def = DEMO_DEFS.find((d) => d.symbol === symbol);
    if (!def) return null;
    const daily = generateCandles({ seed: def.seed, start: '2022-01-03', startPrice: def.startPrice, baseVolume: def.baseVolume, regimes: def.regimes });
    const s: MarketSeries = {
      meta: { symbol, name: def.name, sector: def.sector, timeframe, currency: 'THB', timezone: 'Asia/Bangkok', source: 'synthetic', adjusted: false, seed: def.seed, note: NOTE },
      candles: resample(daily, timeframe),
    };
    this.cache.set(key, s);
    return s;
  }
}

export const demoProvider = new DemoMarketDataProvider();
