export type DcfInput = {
  fcf0: number; // last-year free cash flow (million THB)
  growth: number; // annual FCF growth during forecast (fraction)
  years: number; // forecast horizon
  discountRate: number; // WACC / required return (fraction)
  terminalGrowth: number; // perpetual growth after horizon (fraction)
  netDebt: number; // debt − cash (million THB)
  shares: number; // millions
};

export type DcfResult =
  | { ok: true; pvForecast: number; pvTerminal: number; enterpriseValue: number; equityValue: number; perShare: number; terminalShare: number; flows: { year: number; fcf: number; pv: number }[] }
  | { ok: false; errors: string[] };

export function validateDcf(i: DcfInput): string[] {
  const e: string[] = [];
  for (const [k, v] of Object.entries(i)) if (!Number.isFinite(v)) e.push(`${k} ต้องเป็นตัวเลข`);
  if (e.length) return e;
  if (i.discountRate <= i.terminalGrowth) e.push('อัตราคิดลดต้องมากกว่าอัตราเติบโตระยะยาว ไม่เช่นนั้น terminal value จะไม่มีที่สิ้นสุด/ติดลบ');
  if (i.discountRate <= 0 || i.discountRate > 0.5) e.push('อัตราคิดลดควรอยู่ระหว่าง 0–50%');
  if (i.terminalGrowth > 0.06) e.push('อัตราเติบโตระยะยาวเกิน 6% ต่อปีตลอดไปไม่สมจริง (สูงกว่าการเติบโตของเศรษฐกิจระยะยาว)');
  if (i.years < 1 || i.years > 20 || !Number.isInteger(i.years)) e.push('ระยะพยากรณ์ต้องเป็นจำนวนเต็ม 1–20 ปี');
  if (i.shares <= 0) e.push('จำนวนหุ้นต้องมากกว่า 0');
  if (i.fcf0 <= 0) e.push('FCF ปีล่าสุด ≤ 0 — DCF แบบง่ายนี้ใช้ไม่ได้ ต้องสร้างสมมติฐานกระแสเงินสดรายปีเอง');
  return e;
}

export function dcf(i: DcfInput): DcfResult {
  const errors = validateDcf(i);
  if (errors.length) return { ok: false, errors };
  const flows = [];
  let fcf = i.fcf0;
  let pvForecast = 0;
  for (let t = 1; t <= i.years; t++) {
    fcf *= 1 + i.growth;
    const pv = fcf / (1 + i.discountRate) ** t;
    pvForecast += pv;
    flows.push({ year: t, fcf, pv });
  }
  const tv = (fcf * (1 + i.terminalGrowth)) / (i.discountRate - i.terminalGrowth);
  const pvTerminal = tv / (1 + i.discountRate) ** i.years;
  const enterpriseValue = pvForecast + pvTerminal;
  const equityValue = enterpriseValue - i.netDebt;
  return { ok: true, pvForecast, pvTerminal, enterpriseValue, equityValue, perShare: equityValue / i.shares, terminalShare: pvTerminal / enterpriseValue, flows };
}

/** Per-share value grid over discount rate × terminal growth. Invalid combos are null. */
export function sensitivity(base: DcfInput, rates: number[], growths: number[]) {
  return rates.map((r) => growths.map((g) => {
    const res = dcf({ ...base, discountRate: r, terminalGrowth: g });
    return res.ok ? res.perShare : null;
  }));
}
