import { advance, cancelOrder, equity, newPaperState, placeOrder, realizedTotal, unrealized } from './engine';
import type { Candle } from '../market-data/types';

const bar = (time: string, open: number, high: number, low: number, close: number): Candle => ({ time, open, high, low, close, volume: 1 });
const costs = { feeRate: 0.001, minFee: 0, slippageBps: 0 };

describe('paper trading engine', () => {
  it('market buy fills at NEXT bar open with fee; sell realizes P&L', () => {
    let s = newPaperState(10_000, 0, costs);
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 100, type: 'market' }, 50, '2024-01-01').state;
    expect(s.cash).toBe(10_000); // nothing filled yet
    s = advance(s, { A: bar('2024-01-02', 51, 52, 50, 52) });
    expect(s.positions.A.qty).toBe(100);
    expect(s.cash).toBeCloseTo(10_000 - 5100 - 5.1);
    expect(s.positions.A.avgCost).toBeCloseTo(51.051);
    expect(unrealized(s, { A: 52 })).toBeCloseTo(100 * (52 - 51.051));
    expect(equity(s, { A: 52 })).toBeCloseTo(s.cash + 5200);
    s = placeOrder(s, { symbol: 'A', side: 'sell', qty: 100, type: 'market' }, 52, '2024-01-02').state;
    s = advance(s, { A: bar('2024-01-03', 55, 56, 54, 55) });
    expect(s.positions.A).toBeUndefined();
    expect(realizedTotal(s)).toBeCloseTo(5500 - 5.5 - 5105.1);
    expect(s.cash).toBeCloseTo(10_000 + realizedTotal(s));
  });
  it('applies slippage against the trader', () => {
    let s = newPaperState(10_000, 0, { ...costs, slippageBps: 100 });
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 10, type: 'market' }, 50, 't').state;
    s = advance(s, { A: bar('d', 50, 50, 50, 50) });
    expect(s.fills[0].price).toBeCloseTo(50.5);
  });
  it('limit orders wait until touched and fill at the better of open/limit', () => {
    let s = newPaperState(10_000, 0, costs);
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 10, type: 'limit', limit: 48 }, 50, 't').state;
    s = advance(s, { A: bar('d1', 50, 51, 49, 50) });
    expect(s.orders[0].status).toBe('pending');
    s = advance(s, { A: bar('d2', 47, 49, 46, 48) }); // gaps below limit → open 47
    expect(s.fills[0].price).toBe(47);
  });
  it('rejects overselling, invalid qty and insufficient cash', () => {
    const s = newPaperState(1_000, 0, costs);
    expect(placeOrder(s, { symbol: 'A', side: 'sell', qty: 1, type: 'market' }, 10, 't').error).toMatch(/ขายเกิน/);
    expect(placeOrder(s, { symbol: 'A', side: 'buy', qty: 1.5, type: 'market' }, 10, 't').error).toMatch(/จำนวนเต็ม/);
    expect(placeOrder(s, { symbol: 'A', side: 'buy', qty: 1000, type: 'market' }, 10, 't').error).toMatch(/เงินสดไม่พอ/);
    expect(placeOrder(s, { symbol: 'A', side: 'buy', qty: 1, type: 'limit', limit: 0 }, 10, 't').error).toMatch(/limit/);
  });
  it('rejects at fill time when a gap makes cash insufficient', () => {
    let s = newPaperState(1_000, 0, costs);
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 99, type: 'market' }, 10, 't').state;
    s = advance(s, { A: bar('d', 12, 12, 12, 12) });
    expect(s.orders[0].status).toBe('rejected');
    expect(s.cash).toBe(1_000);
  });
  it('cancel removes a pending order from processing', () => {
    let s = newPaperState(1_000, 0, costs);
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 1, type: 'market' }, 10, 't').state;
    s = cancelOrder(s, s.orders[0].id);
    s = advance(s, { A: bar('d', 10, 10, 10, 10) });
    expect(s.fills).toHaveLength(0);
    expect(s.equityCurve).toHaveLength(1);
  });
  it('averages cost across multiple buys', () => {
    let s = newPaperState(10_000, 0, { ...costs, feeRate: 0 });
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 10, type: 'market' }, 10, 't').state;
    s = advance(s, { A: bar('d1', 10, 10, 10, 10) });
    s = placeOrder(s, { symbol: 'A', side: 'buy', qty: 10, type: 'market' }, 20, 't').state;
    s = advance(s, { A: bar('d2', 20, 20, 20, 20) });
    expect(s.positions.A).toEqual({ qty: 20, avgCost: 15 });
  });
});
