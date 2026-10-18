import { useMemo, useState } from 'react';
import { Callout, Field, MetricValue, NumberField, PageHeader, Stat } from '../../components/ui';
import { COMPANIES } from '../../core/fundamentals/companies';
import { cagr, incomeStatement, ratios, type Metric, type Ratios } from '../../core/fundamentals/ratios';
import { dcf, sensitivity, type DcfInput } from '../../core/fundamentals/dcf';
import { fmt, int, pct } from '../../lib/format';

const x2 = (n: number) => `${n.toFixed(2)}×`;
type RatioKey = { [K in keyof Ratios]: Ratios[K] extends Metric ? K : never }[keyof Ratios];
const GROUPS: { title: string; items: [RatioKey, string, (n: number) => string][] }[] = [
  { title: 'มูลค่า (Valuation)', items: [['pe', 'P/E', x2], ['pb', 'P/B', x2], ['ps', 'P/S', x2], ['evEbitda', 'EV/EBITDA', x2], ['evSales', 'EV/Sales', x2], ['fcfYield', 'FCF Yield', (n) => pct(n)], ['dividendYield', 'Dividend Yield', (n) => pct(n)]] },
  { title: 'ความสามารถทำกำไร', items: [['grossMargin', 'Gross margin', (n) => pct(n)], ['operatingMargin', 'Operating margin', (n) => pct(n)], ['netMargin', 'Net margin', (n) => pct(n)], ['roe', 'ROE', (n) => pct(n)], ['roa', 'ROA', (n) => pct(n)], ['roic', 'ROIC', (n) => pct(n)]] },
  { title: 'ฐานะการเงิน', items: [['currentRatio', 'Current ratio', x2], ['quickRatio', 'Quick ratio', x2], ['debtToEquity', 'Debt/Equity', x2], ['interestCoverage', 'Interest coverage', x2], ['payoutRatio', 'Payout ratio', (n) => pct(n)]] },
  { title: 'ต่อหุ้น & การเติบโต', items: [['eps', 'EPS (บาท)', (n) => fmt(n)], ['dilutedEps', 'Diluted EPS (บาท)', (n) => fmt(n)], ['bvps', 'Book value/หุ้น', (n) => fmt(n)], ['revenueGrowth', 'Revenue growth YoY', (n) => pct(n)]] },
];
const EXERCISES: [RatioKey, string, string][] = [
  ['grossMargin', 'Gross margin (%)', '(รายได้ − ต้นทุนขาย) / รายได้ × 100'],
  ['netMargin', 'Net margin (%)', 'กำไรสุทธิ / รายได้ × 100'],
  ['currentRatio', 'Current ratio (เท่า)', 'สินทรัพย์หมุนเวียน / หนี้สินหมุนเวียน'],
  ['debtToEquity', 'Debt/Equity (เท่า)', 'หนี้สินที่มีภาระดอกเบี้ย / ส่วนของผู้ถือหุ้น'],
  ['pe', 'P/E (เท่า)', 'ราคา / (กำไรสุทธิ / จำนวนหุ้น)'],
];

export default function FundamentalPage() {
  const [sym, setSym] = useState('DMFOOD');
  const co = COMPANIES.find((c) => c.symbol === sym)!;
  const [yi, setYi] = useState(co.years.length - 1);
  const yearIndex = Math.min(yi, co.years.length - 1);
  const r = ratios(co, yearIndex);
  const y = co.years[yearIndex];
  const [cagrFrom, setCagrFrom] = useState(0);
  const from = Math.min(cagrFrom, co.years.length - 2);
  const g = cagr(co.years[from].revenue, co.years[co.years.length - 1].revenue, co.years.length - 1 - from);

  const defaults = (): DcfInput => {
    const last = co.years[co.years.length - 1];
    return { fcf0: last.operatingCashFlow - last.capex, growth: 0.05, years: 5, discountRate: 0.1, terminalGrowth: 0.02, netDebt: last.totalDebt - last.cash, shares: last.sharesDiluted };
  };
  const [dcfIn, setDcfIn] = useState<DcfInput>(defaults);
  const [dcfFor, setDcfFor] = useState(sym);
  if (dcfFor !== sym) { setDcfFor(sym); setDcfIn(defaults()); setYi(co.years.length - 1); }
  const res = dcf(dcfIn);
  const rates = [dcfIn.discountRate - 0.02, dcfIn.discountRate - 0.01, dcfIn.discountRate, dcfIn.discountRate + 0.01, dcfIn.discountRate + 0.02].map((v) => +v.toFixed(4));
  const growths = [dcfIn.terminalGrowth - 0.01, dcfIn.terminalGrowth, dcfIn.terminalGrowth + 0.01].map((v) => +v.toFixed(4));
  const grid = useMemo(() => sensitivity(dcfIn, rates, growths), [dcfIn]); // eslint-disable-line react-hooks/exhaustive-deps -- rates/growths derive from dcfIn
  const setD = (k: keyof DcfInput, pctInput = false) => (n: number) => setDcfIn((d) => ({ ...d, [k]: pctInput ? n / 100 : n }));

  const [ex, setEx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const exDef = EXERCISES[ex % EXERCISES.length];
  const truth = (r[exDef[0]] as Metric).value;
  const truthDisplay = truth === null ? null : exDef[1].includes('%') ? truth * 100 : truth;

  return (
    <>
      <PageHeader title="Fundamental Lab" subtitle="งบการเงินของบริษัทสมมติ อัตราส่วน และการประเมินมูลค่า — สูตรทั้งหมดคำนวณจริงและแสดง N/A พร้อมเหตุผลเมื่อตัวเลขไม่มีความหมาย" demo />
      <div className="card mb-3 flex flex-wrap items-end gap-3">
        <Field label="บริษัท">{(id) => (
          <select id={id} className="input w-72" value={sym} onChange={(e) => setSym(e.target.value)}>
            {COMPANIES.map((c) => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.style}</option>)}
          </select>)}</Field>
        <Field label="ปีงบการเงิน">{(id) => (
          <select id={id} className="input w-28" value={yearIndex} onChange={(e) => setYi(Number(e.target.value))}>
            {co.years.map((x, i) => <option key={x.year} value={i}>{x.year}</option>)}
          </select>)}</Field>
        <p className="muted max-w-xl">{co.profile}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="ราคาหุ้น (สมมติ)" value={`${fmt(co.price)} ฿`} />
        <Stat label="Market cap" value={`${int(r.marketCap)} ล้าน฿`} hint="ราคา × จำนวนหุ้น (basic)" />
        <Stat label="กำไรสุทธิ" value={`${int(r.is.netIncome)} ล้าน฿`} tone={r.is.netIncome >= 0 ? undefined : 'down'} />
        <Stat label="Free cash flow" value={`${int(r.fcf)} ล้าน฿`} hint="CFO − Capex" />
      </div>

      <section className="card mt-3 overflow-x-auto" aria-labelledby="fs">
        <h2 id="fs" className="h2">งบการเงินสรุป (ล้านบาท)</h2>
        <table className="tbl mt-2">
          <thead><tr><th>รายการ</th>{co.years.map((x) => <th key={x.year} className="text-right">{x.year}</th>)}</tr></thead>
          <tbody>
            {([
              ['รายได้', (fy) => fy.revenue], ['กำไรขั้นต้น', (fy) => incomeStatement(fy).grossProfit], ['EBITDA', (fy) => incomeStatement(fy).ebitda], ['EBIT', (fy) => incomeStatement(fy).ebit],
              ['รายการพิเศษ (ก่อนภาษี)', (fy) => fy.oneOff], ['กำไรสุทธิ', (fy) => incomeStatement(fy).netIncome], ['กำไรปกติ (ไม่รวมรายการพิเศษ)', (fy) => incomeStatement(fy).coreNetIncome],
              ['สินทรัพย์รวม', (fy) => fy.totalAssets], ['หนี้สินที่มีดอกเบี้ย', (fy) => fy.totalDebt], ['เงินสด', (fy) => fy.cash], ['ส่วนของผู้ถือหุ้น', (fy) => fy.equity],
              ['กระแสเงินสดจากการดำเนินงาน', (fy) => fy.operatingCashFlow], ['Capex', (fy) => -fy.capex], ['เงินปันผลจ่าย', (fy) => fy.dividendsPaid], ['จำนวนหุ้น (ล้าน, basic/diluted)', null],
            ] as [string, ((fy: (typeof co.years)[number]) => number) | null][]).map(([lab, f]) => (
              <tr key={lab}><td>{lab}</td>{co.years.map((fy) => <td key={fy.year} className="text-right tabular-nums">{f ? int(f(fy)) : `${fy.sharesBasic}/${fy.sharesDiluted}`}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <p className="muted mt-2 text-xs">สมมติฐานการคำนวณ: ภาษี {pct(y.taxRate, 0)} ของกำไรก่อนภาษีที่เป็นบวก (ไม่มีเครดิตภาษีจากขาดทุน), ROE/ROA ใช้ค่าเฉลี่ยต้น-ปลายปี</p>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {GROUPS.map((gr) => (
          <section key={gr.title} className="card">
            <h2 className="h2">{gr.title} — ปี {r.year}</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {gr.items.map(([k, lab, f]) => <div key={k} className="contents"><dt className="text-slate-600 dark:text-slate-400">{lab}</dt><dd className="text-right"><MetricValue m={r[k] as Metric} format={f} /></dd></div>)}
            </dl>
          </section>
        ))}
      </div>

      <section className="card mt-3">
        <h2 className="h2">CAGR รายได้</h2>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <Field label="ตั้งแต่ปี">{(id) => <select id={id} className="input w-28" value={from} onChange={(e) => setCagrFrom(Number(e.target.value))}>{co.years.slice(0, -1).map((x, i) => <option key={x.year} value={i}>{x.year}</option>)}</select>}</Field>
          <p className="pb-1.5 text-sm">ถึง {co.years[co.years.length - 1].year}: CAGR = <MetricValue m={g} format={(n) => pct(n, 2)} /> ต่อปี</p>
        </div>
        <p className="muted mt-1 text-xs">CAGR ไวต่อปีเริ่มต้น/สิ้นสุด — ธุรกิจวัฏจักรอย่าง DMSTEEL ให้ค่าต่างกันมากตามช่วงที่เลือก</p>
      </section>

      <section className="card mt-3" aria-labelledby="ex">
        <h2 id="ex" className="h2">ลองคำนวณเอง</h2>
        <p className="mt-1 text-sm">จากงบปี {r.year} ของ {co.symbol} คำนวณ <strong>{exDef[1]}</strong> <span className="text-slate-500">(สูตร: {exDef[2]})</span></p>
        <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const v = Number(answer); setChecked(truthDisplay === null ? answer.trim().toUpperCase() === 'N/A' : Number.isFinite(v) && Math.abs(v - truthDisplay) <= Math.max(0.01, Math.abs(truthDisplay) * 0.01)); }}>
          <Field label="คำตอบ (ตอบ N/A ถ้าคำนวณไม่ได้อย่างมีความหมาย)">{(id) => <input id={id} className="input w-40" value={answer} onChange={(e) => { setAnswer(e.target.value); setChecked(null); }} />}</Field>
          <button className="btn btn-primary" type="submit" disabled={!answer.trim()}>ตรวจ</button>
          <button className="btn" type="button" onClick={() => { setEx((e) => e + 1); setAnswer(''); setChecked(null); }}>ข้อถัดไป</button>
        </form>
        {checked !== null && <p className="mt-2 text-sm" role="status">{checked ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'} — คำตอบ: {truthDisplay === null ? `N/A (${(r[exDef[0]] as Metric).na})` : fmt(truthDisplay)} (ยอมรับคลาดเคลื่อน ±1%)</p>}
      </section>

      <section className="card mt-3" aria-labelledby="dcf">
        <h2 id="dcf" className="h2">DCF Valuation Calculator</h2>
        <p className="muted mt-1">ค่าเริ่มต้นดึงจากงบปีล่าสุดของ {co.symbol} — ปรับสมมติฐานเองได้ทุกช่อง</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <NumberField label="FCF ปีล่าสุด" suffix="ล้าน฿" value={dcfIn.fcf0} onChange={setD('fcf0')} />
          <NumberField label="อัตราเติบโต FCF ช่วงพยากรณ์" suffix="%" value={+(dcfIn.growth * 100).toFixed(2)} onChange={setD('growth', true)} />
          <NumberField label="จำนวนปีพยากรณ์" value={dcfIn.years} step={1} onChange={setD('years')} />
          <NumberField label="อัตราคิดลด (discount rate)" suffix="%" value={+(dcfIn.discountRate * 100).toFixed(2)} onChange={setD('discountRate', true)} />
          <NumberField label="อัตราเติบโตระยะยาว (terminal)" suffix="%" value={+(dcfIn.terminalGrowth * 100).toFixed(2)} onChange={setD('terminalGrowth', true)} />
          <NumberField label="หนี้สุทธิ (หนี้ − เงินสด)" suffix="ล้าน฿" value={dcfIn.netDebt} onChange={setD('netDebt')} />
          <NumberField label="จำนวนหุ้น (diluted)" suffix="ล้าน" value={dcfIn.shares} onChange={setD('shares')} />
          <button className="btn self-end" onClick={() => setDcfIn(defaults())}>คืนค่าเริ่มต้น</button>
        </div>
        {co.sector === 'Financials' && <Callout kind="warn">DCF จาก FCF ไม่เหมาะกับธนาคาร (หนี้สินคือวัตถุดิบ) — นักวิเคราะห์มักใช้ P/BV เทียบ ROE หรือ dividend discount model แทน</Callout>}
        {!res.ok ? <div className="mt-3"><Callout kind="warn"><ul className="list-disc pl-4">{res.errors.map((e) => <li key={e}>{e}</li>)}</ul></Callout></div> : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Stat label="มูลค่าต่อหุ้น (สมมติฐานนี้)" value={`${fmt(res.perShare)} ฿`} />
              <Stat label="เทียบราคาสมมติ" value={pct(res.perShare / co.price - 1)} tone={res.perShare >= co.price ? 'up' : 'down'} hint="+ = มูลค่าประเมินสูงกว่าราคา" />
              <Stat label="Enterprise value" value={`${int(res.enterpriseValue)} ล้าน฿`} />
              <Stat label="สัดส่วนจาก Terminal value" value={pct(res.terminalShare)} hint="ยิ่งสูง ยิ่งพึ่งสมมติฐานระยะยาว" />
            </div>
            <h3 className="mt-4 font-medium">Sensitivity: มูลค่าต่อหุ้น (฿) ตาม discount rate × terminal growth</h3>
            <div className="mt-2 overflow-x-auto"><table className="tbl">
              <thead><tr><th>r \ g</th>{growths.map((gv) => <th key={gv} className="text-right">{pct(gv)}</th>)}</tr></thead>
              <tbody>{rates.map((rv, i) => <tr key={rv}><th>{pct(rv)}</th>{grid[i].map((v, j) => <td key={j} className={`text-right tabular-nums ${i === 2 && j === 1 ? 'font-bold' : ''}`}>{v === null ? 'N/A' : fmt(v)}</td>)}</tr>)}</tbody>
            </table></div>
            <Callout kind="warn">DCF อ่อนไหวต่อสมมติฐานมาก: เปลี่ยน discount rate เพียง 1–2% มูลค่าเปลี่ยนหลายสิบเปอร์เซ็นต์ ตัวเลขนี้คือผลของสมมติฐานที่ใส่ ไม่ใช่ "มูลค่าที่แท้จริง" หรือราคาเป้าหมาย</Callout>
          </>
        )}
      </section>

      <section className="card mt-3 overflow-x-auto" aria-labelledby="cmp">
        <h2 id="cmp" className="h2">เปรียบเทียบทุกบริษัท (ปีล่าสุด)</h2>
        <table className="tbl mt-2">
          <thead><tr><th>Symbol</th><th>ลักษณะ</th><th className="text-right">P/E</th><th className="text-right">P/B</th><th className="text-right">ROE</th><th className="text-right">Net margin</th><th className="text-right">D/E</th><th className="text-right">Div. yield</th></tr></thead>
          <tbody>{COMPANIES.map((c) => { const k = ratios(c); return (
            <tr key={c.symbol}><td className="font-mono">{c.symbol}</td><td className="text-xs">{c.style}</td>
              <td className="text-right"><MetricValue m={k.pe} format={x2} /></td><td className="text-right"><MetricValue m={k.pb} format={x2} /></td>
              <td className="text-right"><MetricValue m={k.roe} format={(n) => pct(n)} /></td><td className="text-right"><MetricValue m={k.netMargin} format={(n) => pct(n)} /></td>
              <td className="text-right"><MetricValue m={k.debtToEquity} format={x2} /></td><td className="text-right"><MetricValue m={k.dividendYield} format={(n) => pct(n)} /></td></tr>); })}</tbody>
        </table>
        <Callout kind="warn">บริษัทเหล่านี้อยู่คนละอุตสาหกรรม — การเทียบ P/E หรือ margin ข้ามอุตสาหกรรมโดยตรงอาจทำให้เข้าใจผิด (เช่น ธุรกิจเติบโตเร็วมักมี P/E สูง ธุรกิจวัฏจักร P/E ต่ำในปีกำไรสูงสุด) ควรเทียบกับคู่แข่งในกลุ่มเดียวกัน</Callout>
      </section>
    </>
  );
}
