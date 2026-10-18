import type { Candle } from '../market-data/types';

export type PatternId =
  | 'doji' | 'longLeggedDoji' | 'dragonflyDoji' | 'gravestoneDoji' | 'spinningTop' | 'marubozu'
  | 'hammer' | 'hangingMan' | 'invertedHammer' | 'shootingStar'
  | 'bullishEngulfing' | 'bearishEngulfing' | 'bullishHarami' | 'bearishHarami' | 'piercingLine' | 'darkCloudCover'
  | 'morningStar' | 'eveningStar' | 'threeWhiteSoldiers' | 'threeBlackCrows'
  | 'tweezerTop' | 'tweezerBottom' | 'insideBar' | 'outsideBar';

export type PatternHit = { id: PatternId; index: number; bars: number; reason: string };

export const PATTERN_INFO: Record<PatternId, { th: string; en: string; bias: 'bullish' | 'bearish' | 'neutral'; rule: string }> = {
  doji: { th: 'โดจิ', en: 'Doji', bias: 'neutral', rule: 'body ≤ 10% ของช่วง high–low' },
  longLeggedDoji: { th: 'โดจิขายาว', en: 'Long-legged Doji', bias: 'neutral', rule: 'โดจิที่ไส้บนและล่างยาวทั้งคู่ (≥ 35% ของช่วง)' },
  dragonflyDoji: { th: 'โดจิแมลงปอ', en: 'Dragonfly Doji', bias: 'bullish', rule: 'โดจิที่ไส้ล่างยาว ไส้บนแทบไม่มี (≤ 10%)' },
  gravestoneDoji: { th: 'โดจิป้ายหลุมศพ', en: 'Gravestone Doji', bias: 'bearish', rule: 'โดจิที่ไส้บนยาว ไส้ล่างแทบไม่มี (≤ 10%)' },
  spinningTop: { th: 'ลูกข่าง', en: 'Spinning Top', bias: 'neutral', rule: 'body 10–30% ของช่วง และไส้ทั้งสองข้างยาวกว่า body' },
  marubozu: { th: 'มารูโบซุ', en: 'Marubozu', bias: 'neutral', rule: 'body ≥ 95% ของช่วง (แทบไม่มีไส้)' },
  hammer: { th: 'ค้อน', en: 'Hammer', bias: 'bullish', rule: 'ไส้ล่าง ≥ 2× body, ไส้บน ≤ body, เกิดหลังราคาลง (5 แท่งก่อนหน้า)' },
  hangingMan: { th: 'คนแขวนคอ', en: 'Hanging Man', bias: 'bearish', rule: 'รูปร่างเหมือนค้อน แต่เกิดหลังราคาขึ้น' },
  invertedHammer: { th: 'ค้อนกลับหัว', en: 'Inverted Hammer', bias: 'bullish', rule: 'ไส้บน ≥ 2× body, ไส้ล่าง ≤ body, เกิดหลังราคาลง' },
  shootingStar: { th: 'ดาวตก', en: 'Shooting Star', bias: 'bearish', rule: 'รูปร่างเหมือนค้อนกลับหัว แต่เกิดหลังราคาขึ้น' },
  bullishEngulfing: { th: 'กลืนกินขาขึ้น', en: 'Bullish Engulfing', bias: 'bullish', rule: 'แท่งแดงตามด้วยแท่งเขียวที่ body ครอบ body แท่งก่อนทั้งหมด' },
  bearishEngulfing: { th: 'กลืนกินขาลง', en: 'Bearish Engulfing', bias: 'bearish', rule: 'แท่งเขียวตามด้วยแท่งแดงที่ body ครอบ body แท่งก่อนทั้งหมด' },
  bullishHarami: { th: 'ฮารามิขาขึ้น', en: 'Bullish Harami', bias: 'bullish', rule: 'แท่งแดงใหญ่ตามด้วยแท่งเล็กที่ body อยู่ภายใน body แท่งก่อน' },
  bearishHarami: { th: 'ฮารามิขาลง', en: 'Bearish Harami', bias: 'bearish', rule: 'แท่งเขียวใหญ่ตามด้วยแท่งเล็กที่ body อยู่ภายใน body แท่งก่อน' },
  piercingLine: { th: 'เส้นทะลุ', en: 'Piercing Line', bias: 'bullish', rule: 'แท่งแดง → แท่งเขียวเปิดต่ำกว่า low เดิมแล้วปิดเกินครึ่ง body แท่งแดง (แต่ไม่ครอบทั้งหมด)' },
  darkCloudCover: { th: 'เมฆดำปกคลุม', en: 'Dark Cloud Cover', bias: 'bearish', rule: 'แท่งเขียว → แท่งแดงเปิดสูงกว่า high เดิมแล้วปิดต่ำกว่าครึ่ง body แท่งเขียว' },
  morningStar: { th: 'ดาวรุ่ง', en: 'Morning Star', bias: 'bullish', rule: 'แดงใหญ่ (body ≥ 50% ของช่วง) → แท่ง body เล็ก → เขียวที่ปิดเกินครึ่ง body แท่งแรก' },
  eveningStar: { th: 'ดาวค่ำ', en: 'Evening Star', bias: 'bearish', rule: 'เขียวใหญ่ (body ≥ 50% ของช่วง) → แท่ง body เล็ก → แดงที่ปิดต่ำกว่าครึ่ง body แท่งแรก' },
  threeWhiteSoldiers: { th: 'สามทหารขาว', en: 'Three White Soldiers', bias: 'bullish', rule: 'แท่งเขียว 3 แท่งติด ปิดสูงขึ้นทุกแท่ง เปิดภายใน body แท่งก่อน body ≥ 50% ของช่วง' },
  threeBlackCrows: { th: 'สามอีกาดำ', en: 'Three Black Crows', bias: 'bearish', rule: 'แท่งแดง 3 แท่งติด ปิดต่ำลงทุกแท่ง เปิดภายใน body แท่งก่อน body ≥ 50% ของช่วง' },
  tweezerTop: { th: 'แหนบยอด', en: 'Tweezer Top', bias: 'bearish', rule: 'สองแท่งติดกันที่ high เท่ากัน (ต่างกัน ≤ 0.1%) แท่งแรกเขียว แท่งสองแดง' },
  tweezerBottom: { th: 'แหนบก้น', en: 'Tweezer Bottom', bias: 'bullish', rule: 'สองแท่งติดกันที่ low เท่ากัน (ต่างกัน ≤ 0.1%) แท่งแรกแดง แท่งสองเขียว' },
  insideBar: { th: 'แท่งใน', en: 'Inside Bar', bias: 'neutral', rule: 'high ต่ำกว่า และ low สูงกว่าแท่งก่อนหน้า' },
  outsideBar: { th: 'แท่งนอก', en: 'Outside Bar', bias: 'neutral', rule: 'high สูงกว่า และ low ต่ำกว่าแท่งก่อนหน้า' },
};

const body = (c: Candle) => Math.abs(c.close - c.open);
const range = (c: Candle) => c.high - c.low;
const upper = (c: Candle) => c.high - Math.max(c.open, c.close);
const lower = (c: Candle) => Math.min(c.open, c.close) - c.low;
const bull = (c: Candle) => c.close > c.open;
const bear = (c: Candle) => c.close < c.open;
const mid = (c: Candle) => (c.open + c.close) / 2;

/** Prior trend from the 5 bars before index i: close change direction. Context only — not a forecast. */
function priorTrend(cs: Candle[], i: number): 'up' | 'down' | 'flat' {
  if (i < 5) return 'flat';
  const ch = (cs[i - 1].close - cs[i - 5].close) / cs[i - 5].close;
  return ch > 0.01 ? 'up' : ch < -0.01 ? 'down' : 'flat';
}

/** Rule-based detector: returns every pattern that ends at bar `i`. Uses only bars ≤ i (no look-ahead). */
export function detectAt(cs: Candle[], i: number): PatternHit[] {
  const hits: PatternHit[] = [];
  const c = cs[i];
  if (!c) return hits;
  const r = range(c);
  const hit = (id: PatternId, bars: number, reason: string) => hits.push({ id, index: i, bars, reason });
  if (r > 0) {
    const b = body(c) / r; const u = upper(c) / r; const l = lower(c) / r;
    if (b <= 0.1) {
      if (l <= 0.1 && u >= 0.6) hit('gravestoneDoji', 1, `body ${(b * 100).toFixed(0)}%, ไส้บน ${(u * 100).toFixed(0)}%`);
      else if (u <= 0.1 && l >= 0.6) hit('dragonflyDoji', 1, `body ${(b * 100).toFixed(0)}%, ไส้ล่าง ${(l * 100).toFixed(0)}%`);
      else if (u >= 0.35 && l >= 0.35) hit('longLeggedDoji', 1, `body ${(b * 100).toFixed(0)}%, ไส้บน/ล่าง ${(u * 100).toFixed(0)}%/${(l * 100).toFixed(0)}%`);
      else hit('doji', 1, `body เพียง ${(b * 100).toFixed(0)}% ของช่วง`);
    } else if (b <= 0.3 && upper(c) > body(c) && lower(c) > body(c)) hit('spinningTop', 1, `body ${(b * 100).toFixed(0)}% และไส้ทั้งสองข้างยาวกว่า body`);
    if (b >= 0.95) hit('marubozu', 1, `body ${(b * 100).toFixed(0)}% ของช่วง`);
    const t = priorTrend(cs, i);
    if (b > 0.1 && lower(c) >= 2 * body(c) && upper(c) <= body(c)) {
      if (t === 'down') hit('hammer', 1, 'ไส้ล่าง ≥ 2× body หลังราคาลง');
      if (t === 'up') hit('hangingMan', 1, 'ไส้ล่าง ≥ 2× body หลังราคาขึ้น');
    }
    if (b > 0.1 && upper(c) >= 2 * body(c) && lower(c) <= body(c)) {
      if (t === 'down') hit('invertedHammer', 1, 'ไส้บน ≥ 2× body หลังราคาลง');
      if (t === 'up') hit('shootingStar', 1, 'ไส้บน ≥ 2× body หลังราคาขึ้น');
    }
  }
  const p = cs[i - 1];
  if (p) {
    const pTop = Math.max(p.open, p.close); const pBot = Math.min(p.open, p.close);
    const cTop = Math.max(c.open, c.close); const cBot = Math.min(c.open, c.close);
    if (bear(p) && bull(c) && cTop > pTop && cBot < pBot) hit('bullishEngulfing', 2, 'body เขียวครอบ body แดงก่อนหน้า');
    if (bull(p) && bear(c) && cTop > pTop && cBot < pBot) hit('bearishEngulfing', 2, 'body แดงครอบ body เขียวก่อนหน้า');
    if (body(p) > 0 && body(c) < body(p) * 0.6 && cTop < pTop && cBot > pBot) {
      if (bear(p)) hit('bullishHarami', 2, 'body เล็กอยู่ภายใน body แดงก่อนหน้า');
      if (bull(p)) hit('bearishHarami', 2, 'body เล็กอยู่ภายใน body เขียวก่อนหน้า');
    }
    if (bear(p) && bull(c) && c.open < p.low && c.close > mid(p) && c.close < p.open) hit('piercingLine', 2, 'เปิดต่ำกว่า low เดิม ปิดเกินครึ่ง body แดง');
    if (bull(p) && bear(c) && c.open > p.high && c.close < mid(p) && c.close > p.open) hit('darkCloudCover', 2, 'เปิดสูงกว่า high เดิม ปิดต่ำกว่าครึ่ง body เขียว');
    const tol = c.high * 0.001;
    if (bull(p) && bear(c) && Math.abs(c.high - p.high) <= tol) hit('tweezerTop', 2, 'high สองแท่งเท่ากัน');
    if (bear(p) && bull(c) && Math.abs(c.low - p.low) <= c.low * 0.001) hit('tweezerBottom', 2, 'low สองแท่งเท่ากัน');
    if (c.high < p.high && c.low > p.low) hit('insideBar', 2, 'ช่วงราคาอยู่ภายในแท่งก่อนหน้า');
    if (c.high > p.high && c.low < p.low) hit('outsideBar', 2, 'ช่วงราคาครอบแท่งก่อนหน้า');
  }
  const a = cs[i - 2];
  if (a && p) {
    const strong = (x: Candle) => range(x) > 0 && body(x) / range(x) >= 0.5;
    const small = range(p) > 0 && body(p) <= Math.min(body(a), body(c)) * 0.5;
    if (bear(a) && strong(a) && small && bull(c) && c.close > mid(a)) hit('morningStar', 3, 'แดงใหญ่ → แท่งเล็ก → เขียวปิดเกินครึ่งแท่งแรก');
    if (bull(a) && strong(a) && small && bear(c) && c.close < mid(a)) hit('eveningStar', 3, 'เขียวใหญ่ → แท่งเล็ก → แดงปิดต่ำกว่าครึ่งแท่งแรก');
    if ([a, p, c].every((x) => bull(x) && strong(x)) && p.close > a.close && c.close > p.close && p.open >= a.open && p.open <= a.close && c.open >= p.open && c.open <= p.close)
      hit('threeWhiteSoldiers', 3, 'เขียวแข็งแรง 3 แท่ง ปิดสูงขึ้นต่อเนื่อง');
    if ([a, p, c].every((x) => bear(x) && strong(x)) && p.close < a.close && c.close < p.close && p.open <= a.open && p.open >= a.close && c.open <= p.open && c.open >= p.close)
      hit('threeBlackCrows', 3, 'แดงแข็งแรง 3 แท่ง ปิดต่ำลงต่อเนื่อง');
  }
  return hits;
}

export function detectAll(cs: Candle[]): PatternHit[] {
  return cs.flatMap((_, i) => detectAt(cs, i));
}
