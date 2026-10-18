import { useMemo, useRef, useState } from 'react';
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Callout, Empty, Field, Loading, PageHeader } from '../../components/ui';
import { usePersistent } from '../../storage/usePersistent';
import { download } from '../../lib/format';

export type Entry = {
  id: string; date: string; symbol: string; horizon: string; thesis: string; evidenceFor: string; evidenceAgainst: string;
  invalidation: string; risks: string; valuation: string; tradePlan: string; outcome: string; lessons: string; tags: string[]; updatedAt: string;
};
const FIELDS: { key: keyof Entry; label: string; long?: boolean; required?: boolean }[] = [
  { key: 'thesis', label: 'Thesis / สมมติฐาน', long: true, required: true },
  { key: 'evidenceFor', label: 'หลักฐานสนับสนุน', long: true },
  { key: 'evidenceAgainst', label: 'หลักฐานที่ขัดแย้ง', long: true },
  { key: 'invalidation', label: 'เงื่อนไขที่ทำให้ thesis ผิด', long: true, required: true },
  { key: 'risks', label: 'ความเสี่ยงหลัก', long: true },
  { key: 'valuation', label: 'สมมติฐานมูลค่า (ถ้ามี)', long: true },
  { key: 'tradePlan', label: 'เหตุผลเข้า/ออก (paper trade เท่านั้น)', long: true },
  { key: 'outcome', label: 'ผลลัพธ์', long: true },
  { key: 'lessons', label: 'สิ่งที่ได้เรียนรู้', long: true },
];
const blank = (): Entry => ({ id: '', date: new Date().toISOString().slice(0, 10), symbol: '', horizon: '', thesis: '', evidenceFor: '', evidenceAgainst: '', invalidation: '', risks: '', valuation: '', tradePlan: '', outcome: '', lessons: '', tags: [], updatedAt: '' });
const MAX = 5000;

export function isEntry(v: unknown): v is Entry {
  const e = v as Entry;
  return typeof e?.id === 'string' && typeof e.thesis === 'string' && typeof e.date === 'string' && Array.isArray(e.tags) && FIELDS.every((f) => typeof e[f.key] === 'string');
}
const isEntries = (v: unknown): v is Entry[] => Array.isArray(v) && v.every(isEntry);

export default function JournalPage() {
  const [entries, setEntries, { loading, error }] = usePersistent<Entry[]>('journal', [], isEntries);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [tagText, setTagText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter((e) => !s || [e.symbol, e.thesis, e.lessons, ...e.tags].some((x) => x.toLowerCase().includes(s))).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, q]);

  if (loading) return <Loading />;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const errs = FIELDS.filter((f) => f.required && !String(draft[f.key]).trim()).map((f) => `กรุณากรอก "${f.label}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errs.push('วันที่ไม่ถูกต้อง');
    if (FIELDS.some((f) => String(draft[f.key]).length > MAX)) errs.push(`แต่ละช่องไม่เกิน ${MAX} ตัวอักษร`);
    setErrors(errs);
    if (errs.length) return;
    const entry = { ...draft, id: draft.id || `j${Date.now().toString(36)}`, tags: tagText.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10), updatedAt: new Date().toISOString() };
    setEntries((xs) => (draft.id ? xs.map((x) => (x.id === draft.id ? entry : x)) : [entry, ...xs]));
    setDraft(null);
  };

  const importFile = async (file: File) => {
    if (file.size > 2_000_000) { setMsg('ไฟล์ใหญ่เกิน 2 MB'); return; }
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isEntries(data)) { setMsg('รูปแบบไฟล์ไม่ถูกต้อง — ต้องเป็นไฟล์ที่ส่งออกจากหน้า Journal นี้'); return; }
      const known = new Set(entries.map((e) => e.id));
      const fresh = data.filter((e) => !known.has(e.id));
      setEntries((xs) => [...fresh, ...xs]);
      setMsg(`นำเข้า ${fresh.length} รายการ (ข้าม ${data.length - fresh.length} รายการที่มี id ซ้ำ — ข้อมูลเดิมไม่ถูกเขียนทับ)`);
    } catch { setMsg('อ่านไฟล์ไม่ได้ — ต้องเป็น JSON'); }
  };

  return (
    <>
      <PageHeader title="บันทึกการลงทุน (Journal)" subtitle="บันทึกเหตุผลก่อนเห็นผล — ช่วยแยกกระบวนการคิดออกจากโชค เก็บเฉพาะในเครื่องนี้">
        <button className="btn btn-primary" onClick={() => { setDraft(blank()); setTagText(''); setErrors([]); }}><Plus size={16} /> บันทึกใหม่</button>
        <button className="btn" disabled={!entries.length} onClick={() => download('journal.json', JSON.stringify(entries, null, 2))}><Download size={16} /> ส่งออก</button>
        <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> นำเข้า</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
      </PageHeader>
      {error && <Callout kind="warn">{error}</Callout>}
      {msg && <p className="muted mb-2" role="status">{msg}</p>}

      {draft && (
        <form className="card mb-4 space-y-3" onSubmit={save} aria-label="แบบฟอร์มบันทึก">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="วันที่">{(id) => <input id={id} type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />}</Field>
            <Field label="Symbol / ชุดข้อมูล">{(id) => <input id={id} className="input" value={draft.symbol} maxLength={20} onChange={(e) => setDraft({ ...draft, symbol: e.target.value.toUpperCase() })} />}</Field>
            <Field label="ระยะเวลาที่สนใจ">{(id) => <input id={id} className="input" value={draft.horizon} maxLength={40} placeholder="เช่น 3–6 เดือน" onChange={(e) => setDraft({ ...draft, horizon: e.target.value })} />}</Field>
            <Field label="Tags (คั่นด้วย ,)">{(id) => <input id={id} className="input" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="breakout, valuation" />}</Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label + (f.required ? ' *' : '')}>{(id) => <textarea id={id} className="input min-h-20" value={String(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />}</Field>
            ))}
          </div>
          {errors.length > 0 && <Callout kind="warn"><ul className="list-disc pl-4">{errors.map((x) => <li key={x}>{x}</li>)}</ul></Callout>}
          <div className="flex gap-2"><button className="btn btn-primary" type="submit">บันทึก</button><button className="btn" type="button" onClick={() => setDraft(null)}>ยกเลิก</button></div>
        </form>
      )}

      <Field label="ค้นหาบันทึก (symbol, thesis, บทเรียน, tag)">{(id) => <input id={id} className="input mb-3 max-w-md" value={q} onChange={(e) => setQ(e.target.value)} />}</Field>
      {list.length === 0 ? <Empty title={entries.length ? 'ไม่พบบันทึกที่ค้นหา' : 'ยังไม่มีบันทึก'}>{!entries.length && 'เริ่มจากเขียน thesis และเงื่อนไขที่จะยอมรับว่าความคิดผิด'}</Empty> : (
        <ul className="space-y-3">
          {list.map((e) => (
            <li key={e.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><span className="font-mono font-semibold">{e.symbol || '—'}</span> <span className="text-sm text-slate-500">{e.date}{e.horizon && ` · ${e.horizon}`}</span>
                  <div className="mt-1 flex flex-wrap gap-1">{e.tags.map((t) => <button key={t} className="rounded bg-slate-100 px-1.5 text-xs dark:bg-slate-800" onClick={() => setQ(t)}>#{t}</button>)}</div></div>
                <div className="flex gap-1">
                  <button className="btn" aria-label="แก้ไข" onClick={() => { setDraft(e); setTagText(e.tags.join(', ')); setErrors([]); window.scrollTo({ top: 0 }); }}><Pencil size={14} /></button>
                  <button className="btn btn-danger" aria-label="ลบ" onClick={() => confirm('ลบบันทึกนี้?') && setEntries((xs) => xs.filter((x) => x.id !== e.id))}><Trash2 size={14} /></button>
                </div>
              </div>
              <dl className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                {FIELDS.filter((f) => String(e[f.key]).trim()).map((f) => <div key={f.key}><dt className="text-xs font-medium text-slate-500">{f.label}</dt><dd className="whitespace-pre-wrap">{String(e[f.key])}</dd></div>)}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
