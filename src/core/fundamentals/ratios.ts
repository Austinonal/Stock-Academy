import type { Company, FiscalYear } from './companies';

/** A metric is either a number or N/A with the reason — never a meaningless number. */
export type Metric = { value: number; na?: undefined } | { value: null; na: string };
const ok = (value: number): Metric => (Number.isFinite(value) ? { value } : { value: null, na: 'คำนวณไม่ได้' });
const na = (reason: string): Metric => ({ value: null, na: reason });

export function div(a: number, b: number, zeroReason = 'ตัวหารเป็นศูนย์'): Metric {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return na('ข้อมูลไม่ครบ');
  return b === 0 ? na(zeroReason) : ok(a / b);
}

export function incomeStatement(y: FiscalYear) {
  const grossProfit = y.revenue - y.cogs;
  const ebitda = grossProfit - y.opex;
  const ebit = ebitda - y.depreciation;
  const pretax = ebit - y.interestExpense + y.oneOff;
  const tax = Math.max(pretax, 0) * y.taxRate; // no tax credit on losses — simplification
  const netIncome = pretax - tax;
  const coreNetIncome = netIncome - y.oneOff * (1 - y.taxRate);
  return { grossProfit, ebitda, ebit, pretax, tax, netIncome, coreNetIncome };
}

export function cagr(start: number, end: number, years: number): Metric {
  if (years <= 0) return na('ช่วงเวลาต้องมากกว่า 0 ปี');
  if (start <= 0 || end <= 0) return na('CAGR ใช้ได้เมื่อค่าต้นและปลายเป็นบวก');
  return ok((end / start) ** (1 / years) - 1);
}

export function ratios(co: Company, yearIndex = co.years.length - 1) {
  const y = co.years[yearIndex];
  const prev = co.years[yearIndex - 1];
  const is = incomeStatement(y);
  const marketCap = co.price * y.sharesBasic;
  const netDebt = y.totalDebt - y.cash;
  const ev = marketCap + netDebt;
  const fcf = y.operatingCashFlow - y.capex;
  const eps = div(is.netIncome, y.sharesBasic);
  const dilutedEps = div(is.netIncome, y.sharesDiluted);
  const avgEquity = prev ? (prev.equity + y.equity) / 2 : y.equity;
  const avgAssets = prev ? (prev.totalAssets + y.totalAssets) / 2 : y.totalAssets;
  const investedCapital = y.equity + y.totalDebt - y.cash;
  const isFin = co.sector === 'Financials';
  const finNa = (m: Metric): Metric => (isFin ? na('ไม่เหมาะกับสถาบันการเงิน (โครงสร้างหนี้ต่างจากธุรกิจทั่วไป)') : m);

  return {
    year: y.year,
    is,
    marketCap,
    ev: finNa(ok(ev)),
    fcf,
    eps,
    dilutedEps,
    bvps: div(y.equity, y.sharesBasic),
    pe: is.netIncome <= 0 ? na('กำไรสุทธิ ≤ 0 — P/E ไม่มีความหมาย') : div(co.price, is.netIncome / y.sharesBasic),
    pb: y.equity <= 0 ? na('ส่วนของผู้ถือหุ้นติดลบหรือเป็นศูนย์') : div(marketCap, y.equity),
    ps: div(marketCap, y.revenue, 'ไม่มีรายได้'),
    evEbitda: finNa(is.ebitda <= 0 ? na('EBITDA ≤ 0 — EV/EBITDA ไม่มีความหมาย') : div(ev, is.ebitda)),
    evSales: finNa(div(ev, y.revenue, 'ไม่มีรายได้')),
    grossMargin: finNa(div(is.grossProfit, y.revenue, 'ไม่มีรายได้')),
    operatingMargin: div(is.ebit, y.revenue, 'ไม่มีรายได้'),
    netMargin: div(is.netIncome, y.revenue, 'ไม่มีรายได้'),
    roe: avgEquity <= 0 ? na('ส่วนของผู้ถือหุ้นเฉลี่ย ≤ 0') : div(is.netIncome, avgEquity),
    roa: div(is.netIncome, avgAssets),
    roic: finNa(investedCapital <= 0 ? na('เงินทุนที่ใช้ ≤ 0 (เงินสดมากกว่าหนี้+ทุน)') : div(is.ebit * (1 - y.taxRate), investedCapital)),
    currentRatio: finNa(div(y.currentAssets, y.currentLiabilities, 'ไม่มีหนี้สินหมุนเวียน')),
    quickRatio: finNa(div(y.currentAssets - y.inventory, y.currentLiabilities, 'ไม่มีหนี้สินหมุนเวียน')),
    debtToEquity: finNa(y.equity <= 0 ? na('ส่วนของผู้ถือหุ้น ≤ 0') : div(y.totalDebt, y.equity)),
    interestCoverage: finNa(y.interestExpense === 0 ? na('ไม่มีดอกเบี้ยจ่าย') : div(is.ebit, y.interestExpense)),
    fcfYield: div(fcf, marketCap),
    dividendYield: div(y.dividendsPaid, marketCap),
    payoutRatio: is.netIncome <= 0 ? na('กำไร ≤ 0 — จ่ายปันผลจากกำไรสะสม/เงินสด') : div(y.dividendsPaid, is.netIncome),
    revenueGrowth: prev ? div(y.revenue - prev.revenue, prev.revenue) : na('ไม่มีข้อมูลปีก่อน'),
  };
}

export type Ratios = ReturnType<typeof ratios>;
