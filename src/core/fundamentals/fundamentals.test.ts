import { COMPANIES } from './companies';
import { cagr, div, incomeStatement, ratios } from './ratios';
import { dcf, sensitivity, type DcfInput } from './dcf';

const food = COMPANIES.find((c) => c.symbol === 'DMFOOD')!;
const steel = COMPANIES.find((c) => c.symbol === 'DMSTEEL')!;
const bank = COMPANIES.find((c) => c.symbol === 'DMBANK')!;

describe('ratios', () => {
  it('income statement flows', () => {
    const is = incomeStatement(food.years[3]);
    expect(is.grossProfit).toBe(2650);
    expect(is.ebitda).toBe(1180);
    expect(is.ebit).toBe(890);
    expect(is.netIncome).toBeCloseTo((890 - 55) * 0.8);
  });
  it('computes valuation ratios from price and shares', () => {
    const r = ratios(food);
    expect(r.marketCap).toBe(70 * 400);
    expect(r.pe.value).toBeCloseTo(70 / (668 / 400));
    expect(r.pb.value).toBeCloseTo(28000 / 6300);
    expect(r.dividendYield.value).toBeCloseTo(480 / 28000);
    expect(r.revenueGrowth.value).toBeCloseTo(9250 / 8900 - 1);
  });
  it('returns N/A with a reason for loss years instead of a negative P/E', () => {
    const r = ratios(steel, 2); // 2023 loss year
    expect(r.is.netIncome).toBeLessThan(0);
    expect(r.pe.value).toBeNull();
    expect(r.pe.na).toMatch(/P\/E/);
    expect(r.payoutRatio.value).toBeNull();
  });
  it('blocks metrics that do not apply to banks', () => {
    const r = ratios(bank);
    expect(r.debtToEquity.value).toBeNull();
    expect(r.evEbitda.na).toMatch(/สถาบันการเงิน/);
    expect(r.roe.value).not.toBeNull();
  });
  it('div and cagr edge cases', () => {
    expect(div(1, 0).value).toBeNull();
    expect(div(NaN, 1).na).toBe('ข้อมูลไม่ครบ');
    expect(cagr(100, 121, 2).value).toBeCloseTo(0.1);
    expect(cagr(-5, 10, 2).value).toBeNull();
    expect(cagr(100, 120, 0).value).toBeNull();
  });
});

describe('dcf', () => {
  const base: DcfInput = { fcf0: 100, growth: 0, years: 1, discountRate: 0.1, terminalGrowth: 0, netDebt: 0, shares: 10 };
  it('matches hand calculation', () => {
    // year1 FCF 100 → PV 90.909; TV = 100/0.1 = 1000 → PV 909.09; EV = 1000
    const r = dcf(base);
    expect(r.ok && r.enterpriseValue).toBeCloseTo(1000);
    expect(r.ok && r.perShare).toBeCloseTo(100);
  });
  it('subtracts net debt', () => {
    const r = dcf({ ...base, netDebt: 200 });
    expect(r.ok && r.perShare).toBeCloseTo(80);
  });
  it('rejects r ≤ g, non-positive FCF and bad horizon', () => {
    expect(dcf({ ...base, terminalGrowth: 0.1 }).ok).toBe(false);
    expect(dcf({ ...base, fcf0: -5 }).ok).toBe(false);
    expect(dcf({ ...base, years: 0 }).ok).toBe(false);
    expect(dcf({ ...base, shares: NaN }).ok).toBe(false);
  });
  it('sensitivity: higher discount rate → lower value; invalid cells null', () => {
    const g = sensitivity({ ...base, years: 5, growth: 0.05 }, [0.08, 0.1, 0.12], [0.02, 0.1]);
    expect(g[0][0]!).toBeGreaterThan(g[1][0]!);
    expect(g[1][0]!).toBeGreaterThan(g[2][0]!);
    expect(g[0][1]).toBeNull();
  });
});
