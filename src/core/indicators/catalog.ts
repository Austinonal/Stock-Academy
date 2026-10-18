import type { Candle } from '../market-data/types';
import * as I from './index';

export type IndicatorLine = { key: string; label: string; data: I.Series; color: string };
export type IndicatorDef = {
  id: string;
  name: string;
  group: 'Trend' | 'Momentum' | 'Volatility' | 'Volume';
  overlay: boolean; // true = drawn on price pane; false = separate pane
  params: { key: string; label: string; default: number; min: number; max: number }[];
  compute: (c: Candle[], p: Record<string, number>) => IndicatorLine[];
  levels?: number[]; // reference lines for oscillators, e.g. RSI 30/70
  formula: string;
  meaning: string;
  pitfalls: string;
};

const C = { a: '#22d3ee', b: '#f59e0b', c: '#a78bfa', d: '#94a3b8' };

/** Only indicators listed here are exposed in the UI — each one is implemented in ./index.ts and unit-tested. */
export const INDICATORS: IndicatorDef[] = [
  { id: 'sma', name: 'SMA — ค่าเฉลี่ยเคลื่อนที่อย่างง่าย', group: 'Trend', overlay: true,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 250 }],
    compute: (c, p) => [{ key: 'sma', label: `SMA ${p.period}`, data: I.sma(c.map((x) => x.close), p.period), color: C.a }],
    formula: 'SMA = (P₁ + P₂ + … + Pₙ) / n', meaning: 'เฉลี่ยราคาปิด n แท่งล่าสุดเท่า ๆ กัน ช่วยลด noise และดูทิศทางโดยรวม',
    pitfalls: 'ตามหลังราคาเสมอ (lag) ยิ่ง period ยาวยิ่งช้า ในตลาด sideways จะตัดขึ้นลงบ่อยจนเกิดสัญญาณหลอก' },
  { id: 'ema', name: 'EMA — ค่าเฉลี่ยเคลื่อนที่แบบเอ็กซ์โพเนนเชียล', group: 'Trend', overlay: true,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 250 }],
    compute: (c, p) => [{ key: 'ema', label: `EMA ${p.period}`, data: I.ema(c.map((x) => x.close), p.period), color: C.b }],
    formula: 'EMAₜ = α·Pₜ + (1−α)·EMAₜ₋₁, α = 2/(n+1); ค่าแรก = SMA n แท่ง', meaning: 'ให้น้ำหนักราคาล่าสุดมากกว่า จึงตอบสนองเร็วกว่า SMA',
    pitfalls: 'เร็วขึ้นแต่ก็ไวต่อ noise มากขึ้น ค่าช่วงต้นขึ้นกับวิธี seed' },
  { id: 'wma', name: 'WMA — ค่าเฉลี่ยถ่วงน้ำหนัก', group: 'Trend', overlay: true,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 250 }],
    compute: (c, p) => [{ key: 'wma', label: `WMA ${p.period}`, data: I.wma(c.map((x) => x.close), p.period), color: C.c }],
    formula: 'WMA = Σ(Pₜ₋ₖ × (n−k)) / (n(n+1)/2)', meaning: 'น้ำหนักลดลงแบบเส้นตรงจากแท่งล่าสุดไปแท่งเก่า', pitfalls: 'ยังคงตามหลังราคา ไม่ได้ทำนายอนาคต' },
  { id: 'vwma', name: 'VWMA — ค่าเฉลี่ยถ่วงด้วยปริมาณ', group: 'Trend', overlay: true,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 250 }],
    compute: (c, p) => [{ key: 'vwma', label: `VWMA ${p.period}`, data: I.vwma(c, p.period), color: C.d }],
    formula: 'VWMA = Σ(P×V) / ΣV ในช่วง n แท่ง', meaning: 'แท่งที่มี volume สูงมีน้ำหนักมากกว่า', pitfalls: 'volume ผิดปกติแท่งเดียวดึงเส้นได้มาก' },
  { id: 'bb', name: 'Bollinger Bands', group: 'Volatility', overlay: true,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 100 }, { key: 'mult', label: 'σ', default: 2, min: 1, max: 4 }],
    compute: (c, p) => { const b = I.bollinger(c, p.period, p.mult); return [
      { key: 'u', label: 'BB Upper', data: b.upper, color: C.c }, { key: 'm', label: 'BB Mid', data: b.mid, color: C.d }, { key: 'l', label: 'BB Lower', data: b.lower, color: C.c }]; },
    formula: 'Mid = SMA n; Upper/Lower = Mid ± k × ส่วนเบี่ยงเบนมาตรฐาน', meaning: 'กรอบที่กว้างขึ้นเมื่อผันผวนมาก แคบลงเมื่อผันผวนน้อย',
    pitfalls: 'ราคาแตะกรอบบนไม่ได้แปลว่า "แพงเกิน" ต้องลง ในขาขึ้นแรงราคาเดินเลียบกรอบบนได้นาน' },
  { id: 'keltner', name: 'Keltner Channels', group: 'Volatility', overlay: true,
    params: [{ key: 'period', label: 'EMA', default: 20, min: 2, max: 100 }, { key: 'mult', label: '× ATR', default: 2, min: 1, max: 4 }],
    compute: (c, p) => { const k = I.keltner(c, p.period, p.mult); return [
      { key: 'u', label: 'KC Upper', data: k.upper, color: C.b }, { key: 'm', label: 'KC Mid', data: k.mid, color: C.d }, { key: 'l', label: 'KC Lower', data: k.lower, color: C.b }]; },
    formula: 'Mid = EMA n; กรอบ = Mid ± k × ATR(10)', meaning: 'คล้าย Bollinger แต่ใช้ ATR วัดความกว้าง', pitfalls: 'ไม่ใช่แนวรับแนวต้านที่แน่นอน' },
  { id: 'donchian', name: 'Donchian Channels', group: 'Volatility', overlay: true,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 100 }],
    compute: (c, p) => { const d = I.donchian(c, p.period); return [
      { key: 'u', label: 'DC High', data: d.upper, color: C.a }, { key: 'l', label: 'DC Low', data: d.lower, color: C.a }]; },
    formula: 'Upper = High สูงสุด n แท่ง, Lower = Low ต่ำสุด n แท่ง (รวมแท่งปัจจุบัน)', meaning: 'ใช้ดู breakout ของกรอบราคา',
    pitfalls: 'breakout หลอก (false breakout) เกิดได้บ่อย โดยเฉพาะเมื่อ volume ไม่ยืนยัน' },
  { id: 'rsi', name: 'RSI — Relative Strength Index', group: 'Momentum', overlay: false, levels: [30, 70],
    params: [{ key: 'period', label: 'Period', default: 14, min: 2, max: 50 }],
    compute: (c, p) => [{ key: 'rsi', label: `RSI ${p.period}`, data: I.rsi(c, p.period), color: C.c }],
    formula: 'RSI = 100 − 100/(1+RS), RS = ค่าเฉลี่ยกำไร/ค่าเฉลี่ยขาดทุน (Wilder smoothing)', meaning: 'วัดแรงส่งของการขึ้นเทียบการลง ค่า 0–100',
    pitfalls: 'RSI > 70 ไม่ได้แปลว่าต้องกลับตัวทันที ในขาขึ้นแรง RSI ค้างโซนสูงได้นาน' },
  { id: 'macd', name: 'MACD', group: 'Trend', overlay: false, levels: [0],
    params: [{ key: 'fast', label: 'Fast', default: 12, min: 2, max: 50 }, { key: 'slow', label: 'Slow', default: 26, min: 3, max: 100 }, { key: 'signal', label: 'Signal', default: 9, min: 2, max: 50 }],
    compute: (c, p) => { const m = I.macd(c, p.fast, p.slow, p.signal); return [
      { key: 'line', label: 'MACD', data: m.line, color: C.a }, { key: 'sig', label: 'Signal', data: m.signal, color: C.b }, { key: 'hist', label: 'Histogram', data: m.hist, color: C.d }]; },
    formula: 'MACD = EMA fast − EMA slow; Signal = EMA ของ MACD; Histogram = MACD − Signal', meaning: 'ดูทิศทางและการเปลี่ยนแรงส่งของแนวโน้ม',
    pitfalls: 'เป็นค่าที่มาจาก EMA จึงตามหลังราคา สัญญาณตัดกันในตลาด sideways มักหลอก' },
  { id: 'stoch', name: 'Stochastic %K/%D', group: 'Momentum', overlay: false, levels: [20, 80],
    params: [{ key: 'k', label: '%K', default: 14, min: 2, max: 50 }, { key: 'd', label: '%D', default: 3, min: 1, max: 10 }],
    compute: (c, p) => { const s = I.stochastic(c, p.k, p.d); return [{ key: 'k', label: '%K', data: s.k, color: C.a }, { key: 'd', label: '%D', data: s.d, color: C.b }]; },
    formula: '%K = (Close − LowestLow) / (HighestHigh − LowestLow) × 100; %D = SMA ของ %K', meaning: 'ราคาปิดอยู่ตรงไหนของกรอบ n แท่งล่าสุด',
    pitfalls: 'ไวมาก แกว่งขึ้นลงบ่อย ไม่ควรใช้เดี่ยว ๆ' },
  { id: 'willr', name: 'Williams %R', group: 'Momentum', overlay: false, levels: [-80, -20],
    params: [{ key: 'period', label: 'Period', default: 14, min: 2, max: 50 }],
    compute: (c, p) => [{ key: 'w', label: '%R', data: I.williamsR(c, p.period), color: C.c }],
    formula: '%R = (HighestHigh − Close) / (HighestHigh − LowestLow) × −100', meaning: 'กลับด้านของ Stochastic ค่า −100 ถึง 0', pitfalls: 'เหมือน Stochastic' },
  { id: 'roc', name: 'ROC — Rate of Change', group: 'Momentum', overlay: false, levels: [0],
    params: [{ key: 'period', label: 'Period', default: 12, min: 1, max: 100 }],
    compute: (c, p) => [{ key: 'roc', label: `ROC ${p.period}`, data: I.roc(c, p.period), color: C.a }],
    formula: 'ROC = (Pₜ − Pₜ₋ₙ) / Pₜ₋ₙ × 100', meaning: 'เปลี่ยนแปลงกี่ % เทียบ n แท่งก่อน', pitfalls: 'ขึ้นกับราคาแท่งอ้างอิงแท่งเดียว จึงกระโดดได้' },
  { id: 'cci', name: 'CCI — Commodity Channel Index', group: 'Momentum', overlay: false, levels: [-100, 100],
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 100 }],
    compute: (c, p) => [{ key: 'cci', label: `CCI ${p.period}`, data: I.cci(c, p.period), color: C.b }],
    formula: 'CCI = (TP − SMA(TP)) / (0.015 × Mean Deviation), TP = (H+L+C)/3', meaning: 'ราคาห่างจากค่าเฉลี่ยเท่าไรเมื่อเทียบความแกว่งปกติ', pitfalls: 'ไม่มีขอบเขตบนล่าง ค่าสุดโต่งไม่ได้แปลว่าต้องกลับตัว' },
  { id: 'atr', name: 'ATR — Average True Range', group: 'Volatility', overlay: false,
    params: [{ key: 'period', label: 'Period', default: 14, min: 2, max: 50 }],
    compute: (c, p) => [{ key: 'atr', label: `ATR ${p.period}`, data: I.atr(c, p.period), color: C.d }],
    formula: 'TR = max(H−L, |H−Cₚ|, |L−Cₚ|); ATR = Wilder average ของ TR', meaning: 'วัดความกว้างการแกว่งเฉลี่ยเป็นหน่วยราคา ใช้ตั้งระยะ stop หรือ position sizing',
    pitfalls: 'ไม่บอกทิศทาง บอกแค่ขนาดการแกว่ง' },
  { id: 'adx', name: 'ADX / +DI / −DI', group: 'Trend', overlay: false, levels: [25],
    params: [{ key: 'period', label: 'Period', default: 14, min: 2, max: 50 }],
    compute: (c, p) => { const a = I.adx(c, p.period); return [
      { key: 'adx', label: 'ADX', data: a.adx, color: C.a }, { key: 'p', label: '+DI', data: a.plusDI, color: '#22c55e' }, { key: 'm', label: '−DI', data: a.minusDI, color: '#ef4444' }]; },
    formula: '+DI/−DI จาก Directional Movement / ATR; ADX = Wilder average ของ |+DI − −DI| / (+DI + −DI) × 100', meaning: 'ADX วัด "ความแรง" ของแนวโน้ม ไม่ใช่ทิศทาง',
    pitfalls: 'ADX สูงในขาลงก็ได้ ต้องดู DI ประกอบ และตามหลังมาก' },
  { id: 'obv', name: 'OBV — On-Balance Volume', group: 'Volume', overlay: false,
    params: [],
    compute: (c) => [{ key: 'obv', label: 'OBV', data: I.obv(c), color: C.a }],
    formula: 'ถ้าปิดสูงกว่าเมื่อวาน +Volume, ต่ำกว่า −Volume', meaning: 'สะสม volume ตามทิศทางราคา', pitfalls: 'ค่าสัมบูรณ์ไม่มีความหมาย ดูแค่ทิศทางเทียบกับราคา' },
  { id: 'ad', name: 'Accumulation/Distribution', group: 'Volume', overlay: false,
    params: [],
    compute: (c) => [{ key: 'ad', label: 'A/D', data: I.adLine(c), color: C.b }],
    formula: 'A/D += ((C−L)−(H−C))/(H−L) × Volume', meaning: 'ดูว่าปิดใกล้ high หรือ low พร้อม volume', pitfalls: 'ไม่สนใจ gap ระหว่างแท่ง' },
  { id: 'cmf', name: 'Chaikin Money Flow', group: 'Volume', overlay: false, levels: [0],
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 100 }],
    compute: (c, p) => [{ key: 'cmf', label: `CMF ${p.period}`, data: I.cmf(c, p.period), color: C.c }],
    formula: 'CMF = Σ(MFM × V) / ΣV ในช่วง n แท่ง', meaning: 'A/D แบบเฉลี่ยช่วงเวลา ค่า −1 ถึง 1', pitfalls: 'ข้อมูล volume ต้องเชื่อถือได้' },
  { id: 'mfi', name: 'MFI — Money Flow Index', group: 'Volume', overlay: false, levels: [20, 80],
    params: [{ key: 'period', label: 'Period', default: 14, min: 2, max: 50 }],
    compute: (c, p) => [{ key: 'mfi', label: `MFI ${p.period}`, data: I.mfi(c, p.period), color: C.b }],
    formula: 'MFI = 100 − 100/(1 + Positive Flow / Negative Flow), Flow = TP × Volume', meaning: 'RSI ที่ถ่วงด้วย volume', pitfalls: 'เหมือน RSI — โซนสุดโต่งไม่ใช่สัญญาณกลับตัวแน่นอน' },
  { id: 'volsma', name: 'Volume SMA', group: 'Volume', overlay: false,
    params: [{ key: 'period', label: 'Period', default: 20, min: 2, max: 100 }],
    compute: (c, p) => [{ key: 'vs', label: `Vol SMA ${p.period}`, data: I.sma(c.map((x) => x.volume), p.period), color: C.d }],
    formula: 'ค่าเฉลี่ย volume n แท่ง', meaning: 'ใช้เทียบว่า volume วันนี้สูง/ต่ำกว่าปกติ', pitfalls: 'วันที่มีเหตุการณ์พิเศษทำให้ค่าเฉลี่ยบิด' },
];

export const defaultParams = (d: IndicatorDef) => Object.fromEntries(d.params.map((p) => [p.key, p.default]));
