import { rng } from '../market-data/random';
import { COMPANIES } from './companies';
import { ratios } from './ratios';

/** Screener row. Values that don't apply are null (e.g. P/E when earnings ≤ 0). All fictional. */
export type ScreenRow = {
  symbol: string; name: string; sector: string; price: number; marketCap: number; avgVolume: number;
  pe: number | null; pb: number | null; revenueGrowth: number | null; netMargin: number | null; debtToEquity: number | null; dividendYield: number | null;
};

const SECTORS: [string, { pe: [number, number]; margin: [number, number]; growth: [number, number]; de: [number, number]; div: [number, number] }][] = [
  ['Technology', { pe: [18, 60], margin: [-0.1, 0.25], growth: [0.05, 0.45], de: [0, 0.6], div: [0, 0.015] }],
  ['Consumer Staples', { pe: [12, 28], margin: [0.03, 0.12], growth: [0, 0.08], de: [0.2, 1.0], div: [0.02, 0.05] }],
  ['Materials', { pe: [5, 15], margin: [-0.05, 0.12], growth: [-0.2, 0.25], de: [0.5, 1.6], div: [0, 0.07] }],
  ['Energy', { pe: [6, 14], margin: [0.02, 0.15], growth: [-0.15, 0.2], de: [0.4, 1.4], div: [0.03, 0.08] }],
  ['Healthcare', { pe: [15, 40], margin: [0.05, 0.2], growth: [0.03, 0.2], de: [0.1, 0.8], div: [0.005, 0.025] }],
  ['Property', { pe: [7, 18], margin: [0.08, 0.25], growth: [-0.05, 0.12], de: [0.6, 2.0], div: [0.03, 0.07] }],
];

const lerp = (r: () => number, [a, b]: [number, number]) => a + (b - a) * r();
const NAMES = ['อัลฟา', 'เบต้า', 'แกมมา', 'เดลต้า', 'โอเมก้า', 'ซิกม่า'];

export function buildUniverse(seed = 2024): ScreenRow[] {
  const r = rng(seed);
  const rows: ScreenRow[] = COMPANIES.map((c) => {
    const k = ratios(c);
    return { symbol: c.symbol, name: c.name, sector: c.sector, price: c.price, marketCap: k.marketCap, avgVolume: Math.round(1e6 + r() * 5e6),
      pe: k.pe.value, pb: k.pb.value, revenueGrowth: k.revenueGrowth.value, netMargin: k.netMargin.value, debtToEquity: k.debtToEquity.value, dividendYield: k.dividendYield.value };
  });
  SECTORS.forEach(([sector, p], si) => {
    for (let i = 0; i < 6; i++) {
      const margin = lerp(r, p.margin);
      const price = +(5 + r() * 195).toFixed(2);
      rows.push({
        symbol: `DM${sector.slice(0, 3).toUpperCase()}${i + 1}`, name: `${NAMES[i]}${['เทค', 'ฟู้ด', 'แมท', 'เอนเนอร์จี', 'เฮลท์', 'พร็อพ'][si]} (สมมติ)`, sector, price,
        marketCap: Math.round(500 + r() ** 2 * 150_000), avgVolume: Math.round(1e5 + r() ** 2 * 2e7),
        pe: margin <= 0 ? null : +lerp(r, p.pe).toFixed(1), pb: +(0.5 + r() * 6).toFixed(2), revenueGrowth: +lerp(r, p.growth).toFixed(4),
        netMargin: +margin.toFixed(4), debtToEquity: +lerp(r, p.de).toFixed(2), dividendYield: margin <= 0 ? 0 : +lerp(r, p.div).toFixed(4),
      });
    }
  });
  return rows;
}

export type NumericKey = 'marketCap' | 'pe' | 'pb' | 'revenueGrowth' | 'netMargin' | 'debtToEquity' | 'dividendYield' | 'price' | 'avgVolume';
export type Filters = { sector: string; query: string; ranges: Partial<Record<NumericKey, { min?: number; max?: number }>> };

/** AND filter. A null value never passes a range on that field (e.g. loss-making firm has no P/E). Returns why each row passed. */
export function screen(rows: ScreenRow[], f: Filters) {
  const q = f.query.trim().toLowerCase();
  const out: { row: ScreenRow; reasons: string[] }[] = [];
  for (const row of rows) {
    if (f.sector !== 'all' && row.sector !== f.sector) continue;
    if (q && !row.symbol.toLowerCase().includes(q) && !row.name.toLowerCase().includes(q)) continue;
    const reasons: string[] = [];
    let ok = true;
    for (const [k, rg] of Object.entries(f.ranges) as [NumericKey, { min?: number; max?: number }][]) {
      const hasMin = rg.min !== undefined && Number.isFinite(rg.min);
      const hasMax = rg.max !== undefined && Number.isFinite(rg.max);
      if (!hasMin && !hasMax) continue;
      const v = row[k];
      if (v === null || (hasMin && v < (rg.min as number)) || (hasMax && v > (rg.max as number))) { ok = false; break; }
      reasons.push(`${k} ${hasMin ? `≥ ${rg.min}` : ''}${hasMin && hasMax ? ' และ ' : ''}${hasMax ? `≤ ${rg.max}` : ''}`);
    }
    if (ok) out.push({ row, reasons });
  }
  return out;
}
