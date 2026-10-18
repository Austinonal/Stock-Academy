import { useMemo, useState } from 'react';
import { CATEGORY_TH, TERMS, type Category } from '../../content/glossary/terms';
import { Empty, Field, PageHeader } from '../../components/ui';

export default function GlossaryPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TERMS.filter((t) => (cat === 'all' || t.cat === cat) && (!s || t.en.toLowerCase().includes(s) || t.th.includes(s) || t.simple.includes(s)));
  }, [q, cat]);

  return (
    <>
      <PageHeader title="คลังศัพท์ (Glossary)" subtitle={`${TERMS.length} คำ ค้นหาได้ทั้งไทยและอังกฤษ`} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Field label="ค้นหา">{(id) => <input id={id} className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น แนวรับ, RSI, drawdown" />}</Field>
        <Field label="หมวด">{(id) => (
          <select id={id} className="input" value={cat} onChange={(e) => setCat(e.target.value as Category | 'all')}>
            <option value="all">ทั้งหมด</option>
            {Object.entries(CATEGORY_TH).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}
          </select>)}</Field>
      </div>
      <p className="muted mb-2" role="status">พบ {list.length} คำ</p>
      {list.length === 0 ? <Empty title="ไม่พบคำที่ค้นหา" /> : (
        <dl className="grid gap-3 md:grid-cols-2">
          {list.map((t) => (
            <div key={t.id} id={t.id} className="card">
              <dt><span className="font-semibold">{t.th}</span> <span className="text-slate-500">({t.en})</span> <span className="ml-1 rounded bg-slate-100 px-1.5 text-[11px] dark:bg-slate-800">{CATEGORY_TH[t.cat]}</span></dt>
              <dd className="mt-1 text-sm">{t.simple}</dd>
              <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.detail}</dd>
              {t.related.length > 0 && <dd className="mt-2 text-xs">ที่เกี่ยวข้อง: {t.related.map((r) => {
                const rt = TERMS.find((x) => x.en === r);
                return rt ? <a key={r} href={`#/glossary`} onClick={(e) => { e.preventDefault(); setCat('all'); setQ(rt.en); }} className="mr-2 text-cyan-700 underline dark:text-cyan-400">{rt.th}</a> : <span key={r} className="mr-2">{r}</span>;
              })}</dd>}
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
