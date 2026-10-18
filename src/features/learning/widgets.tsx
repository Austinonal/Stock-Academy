import { useState } from 'react';
import { NumberField } from '../../components/ui';
import { fmt, pct } from '../../lib/format';

export function CompoundCalculator() {
  const [pv, setPv] = useState(10_000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const valid = pv > 0 && rate > -100 && rate <= 100 && Number.isInteger(years) && years >= 1 && years <= 60;
  const r = rate / 100;
  const rows = valid ? Array.from({ length: years }, (_, i) => ({ y: i + 1, simple: pv * (1 + r * (i + 1)), compound: pv * (1 + r) ** (i + 1) })) : [];
  const last = rows[rows.length - 1];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="เงินต้น" suffix="บาท" value={pv} onChange={setPv} min={1} error={pv > 0 ? null : 'ต้องมากกว่า 0'} />
        <NumberField label="อัตราต่อปี" suffix="%" value={rate} onChange={setRate} error={rate > -100 && rate <= 100 ? null : 'อยู่ระหว่าง −100 ถึง 100'} />
        <NumberField label="จำนวนปี" value={years} onChange={setYears} step={1} min={1} max={60} error={Number.isInteger(years) && years >= 1 && years <= 60 ? null : 'จำนวนเต็ม 1–60'} />
      </div>
      {last && (
        <>
          <p className="mt-3 text-sm">หลัง {years} ปี: ดอกเบี้ยธรรมดา <strong>{fmt(last.simple)}</strong> บาท · ทบต้น <strong>{fmt(last.compound)}</strong> บาท · ส่วนต่าง <strong>{fmt(last.compound - last.simple)}</strong> บาท</p>
          <div className="mt-2 max-h-48 overflow-auto"><table className="tbl"><thead><tr><th>ปี</th><th>ธรรมดา</th><th>ทบต้น</th></tr></thead>
            <tbody>{rows.map((x) => <tr key={x.y}><td>{x.y}</td><td className="tabular-nums">{fmt(x.simple)}</td><td className="tabular-nums">{fmt(x.compound)}</td></tr>)}</tbody></table></div>
        </>
      )}
    </div>
  );
}

export function RealReturnCalculator() {
  const [nom, setNom] = useState(2);
  const [inf, setInf] = useState(3);
  const ok = Number.isFinite(nom) && Number.isFinite(inf) && inf > -100;
  const real = ok ? (1 + nom / 100) / (1 + inf / 100) - 1 : NaN;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="ผลตอบแทนที่เป็นตัวเงิน" suffix="% ต่อปี" value={nom} onChange={setNom} />
        <NumberField label="เงินเฟ้อ" suffix="% ต่อปี" value={inf} onChange={setInf} error={inf > -100 ? null : 'ต้องมากกว่า −100'} />
      </div>
      <p className="mt-3 text-sm">ผลตอบแทนที่แท้จริง = (1 + {nom}%) / (1 + {inf}%) − 1 = <strong>{pct(real, 2)}</strong> (ประมาณแบบลบ: {ok ? (nom - inf).toFixed(2) : 'N/A'}%)</p>
    </div>
  );
}
