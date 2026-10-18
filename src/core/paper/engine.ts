import type { Candle } from '../market-data/types';

export type CostModel = { feeRate: number; minFee: number; slippageBps: number };
/** Assumptions for learning only — not any real broker's fee schedule. */
export const DEFAULT_COSTS: CostModel = { feeRate: 0.0015, minFee: 0, slippageBps: 5 };

export type Side = 'buy' | 'sell';
export type Order = { id: string; symbol: string; side: Side; qty: number; type: 'market' | 'limit'; limit?: number; placedAt: string; status: 'pending' | 'filled' | 'rejected' | 'cancelled'; note?: string };
export type Fill = { orderId: string; symbol: string; side: Side; qty: number; price: number; fee: number; time: string; realized: number; reason: string };
export type Position = { qty: number; avgCost: number }; // avgCost includes buy fees

export type PaperState = {
  initialCash: number; cash: number; costs: CostModel;
  cursor: number; // index into the shared demo calendar; orders fill on bar cursor+1
  positions: Record<string, Position>; orders: Order[]; fills: Fill[];
  equityCurve: { time: string; equity: number }[];
};

export const newPaperState = (initialCash = 100_000, cursor = 60, costs = DEFAULT_COSTS): PaperState =>
  ({ initialCash, cash: initialCash, costs, cursor, positions: {}, orders: [], fills: [], equityCurve: [] });

export const fee = (notional: number, c: CostModel) => Math.max(c.minFee, notional * c.feeRate);

export function validateOrder(s: PaperState, o: Pick<Order, 'symbol' | 'side' | 'qty' | 'type' | 'limit'>, refPrice: number): string | null {
  if (!Number.isInteger(o.qty) || o.qty <= 0) return 'จำนวนหุ้นต้องเป็นจำนวนเต็มบวก';
  if (o.type === 'limit' && (!Number.isFinite(o.limit) || (o.limit as number) <= 0)) return 'ราคา limit ต้องเป็นตัวเลขมากกว่า 0';
  if (o.side === 'sell') {
    const held = s.positions[o.symbol]?.qty ?? 0;
    const pendingSell = s.orders.filter((x) => x.status === 'pending' && x.symbol === o.symbol && x.side === 'sell').reduce((a, x) => a + x.qty, 0);
    if (o.qty > held - pendingSell) return `ขายเกินจำนวนที่ถือ (ถือ ${held}, รอขายอยู่ ${pendingSell}) — แอปนี้ไม่จำลองการ short`;
  } else {
    const px = o.type === 'limit' ? (o.limit as number) : refPrice * (1 + s.costs.slippageBps / 10_000);
    const need = o.qty * px + fee(o.qty * px, s.costs);
    if (need > s.cash) return `เงินสดไม่พอ (ต้องใช้ประมาณ ${need.toFixed(2)} มีอยู่ ${s.cash.toFixed(2)})`;
  }
  return null;
}

let seq = 0;
export function placeOrder(s: PaperState, o: Pick<Order, 'symbol' | 'side' | 'qty' | 'type' | 'limit'>, refPrice: number, time: string): { state: PaperState; error?: string } {
  const error = validateOrder(s, o, refPrice);
  if (error) return { state: s, error };
  const order: Order = { ...o, id: `o${Date.now().toString(36)}${(seq++).toString(36)}`, placedAt: time, status: 'pending' };
  return { state: { ...s, orders: [...s.orders, order] } };
}

export function cancelOrder(s: PaperState, id: string): PaperState {
  return { ...s, orders: s.orders.map((o) => (o.id === id && o.status === 'pending' ? { ...o, status: 'cancelled' } : o)) };
}

/**
 * Advance one bar. Pending orders fill against the NEW bar only (never a price known before the order):
 * market → that bar's open ± slippage; limit buy → if low ≤ limit, at min(open, limit); limit sell → if high ≥ limit, at max(open, limit).
 */
export function advance(s: PaperState, nextBars: Record<string, Candle | undefined>): PaperState {
  let cash = s.cash;
  const positions = { ...s.positions };
  const fills: Fill[] = [];
  const slip = s.costs.slippageBps / 10_000;
  const orders = s.orders.map((o): Order => {
    if (o.status !== 'pending') return o;
    const bar = nextBars[o.symbol];
    if (!bar) return o;
    let price: number | null = null;
    let reason = '';
    if (o.type === 'market') {
      price = o.side === 'buy' ? bar.open * (1 + slip) : bar.open * (1 - slip);
      reason = `Market: ราคาเปิดแท่งถัดไป ${bar.open} ${o.side === 'buy' ? '+' : '−'} slippage ${s.costs.slippageBps} bps`;
    } else if (o.side === 'buy' && bar.low <= (o.limit as number)) {
      price = Math.min(bar.open, o.limit as number);
      reason = bar.open <= (o.limit as number) ? `Limit: เปิดต่ำกว่า limit ได้ราคาเปิด ${bar.open}` : `Limit: ราคาลงแตะ ${o.limit}`;
    } else if (o.side === 'sell' && bar.high >= (o.limit as number)) {
      price = Math.max(bar.open, o.limit as number);
      reason = bar.open >= (o.limit as number) ? `Limit: เปิดสูงกว่า limit ได้ราคาเปิด ${bar.open}` : `Limit: ราคาขึ้นแตะ ${o.limit}`;
    }
    if (price === null) return o; // limit not reached — stays pending
    price = Math.round(price * 10_000) / 10_000;
    const notional = price * o.qty;
    const f = fee(notional, s.costs);
    const pos = positions[o.symbol] ?? { qty: 0, avgCost: 0 };
    if (o.side === 'buy') {
      if (notional + f > cash) return { ...o, status: 'rejected', note: 'เงินสดไม่พอ ณ ราคาที่ fill จริง' };
      cash -= notional + f;
      const qty = pos.qty + o.qty;
      positions[o.symbol] = { qty, avgCost: (pos.qty * pos.avgCost + notional + f) / qty };
      fills.push({ orderId: o.id, symbol: o.symbol, side: 'buy', qty: o.qty, price, fee: f, time: bar.time, realized: 0, reason });
    } else {
      if (o.qty > pos.qty) return { ...o, status: 'rejected', note: 'จำนวนหุ้นไม่พอขาย' };
      cash += notional - f;
      const realized = notional - f - o.qty * pos.avgCost;
      const qty = pos.qty - o.qty;
      if (qty === 0) delete positions[o.symbol]; else positions[o.symbol] = { qty, avgCost: pos.avgCost };
      fills.push({ orderId: o.id, symbol: o.symbol, side: 'sell', qty: o.qty, price, fee: f, time: bar.time, realized, reason });
    }
    return { ...o, status: 'filled' };
  });
  const next = { ...s, cash, positions, orders, fills: [...s.fills, ...fills], cursor: s.cursor + 1 };
  const anyBar = Object.values(nextBars).find(Boolean);
  const marks = Object.fromEntries(Object.entries(nextBars).filter(([, b]) => b).map(([k, b]) => [k, (b as Candle).close]));
  return anyBar ? { ...next, equityCurve: [...s.equityCurve, { time: anyBar.time, equity: equity(next, marks) }] } : next;
}

export const marketValue = (s: PaperState, marks: Record<string, number>) =>
  Object.entries(s.positions).reduce((a, [sym, p]) => a + p.qty * (marks[sym] ?? p.avgCost), 0);

/** equity = cash + Σ qty × mark price (close of current bar). */
export const equity = (s: PaperState, marks: Record<string, number>) => s.cash + marketValue(s, marks);

export const unrealized = (s: PaperState, marks: Record<string, number>) =>
  Object.entries(s.positions).reduce((a, [sym, p]) => a + p.qty * ((marks[sym] ?? p.avgCost) - p.avgCost), 0);

export const realizedTotal = (s: PaperState) => s.fills.reduce((a, f) => a + f.realized, 0);
