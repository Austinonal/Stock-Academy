import { useEffect, useRef, useState } from 'react';
import { Download, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { Callout, Field, PageHeader } from '../../components/ui';
import { useTheme } from '../../app/theme';
import { candlesToCsv, DEFAULT_ALIASES, MAX_CSV_BYTES, parseCandlesCsv, type CsvResult } from '../../core/market-data/csv';
import { parseSeriesJson } from '../../core/market-data/providers';
import { demoProvider } from '../../core/market-data/demo';
import { validateSeries } from '../../core/market-data/validate';
import type { Candle } from '../../core/market-data/types';
import { clearAll, DATA_VERSION, exportAll, importAll, parseBackup, removeItem, storageMode, type Backup } from '../../storage/db';
import { useImported } from '../market';
import { download, int } from '../../lib/format';

const SCHEMA_DOC = `รูปแบบ CSV ที่รองรับ (เปิดด้วย Excel ได้)
- แถวแรกเป็น header: Date,Open,High,Low,Close,Volume
- Date: YYYY-MM-DD (รองรับ YYYY/MM/DD และ timestamp ISO — ใช้เฉพาะส่วนวันที่)
- ตัวเลขใช้จุดทศนิยม คั่นหลักพันด้วย , ได้ถ้าครอบด้วย "..."
- ข้อมูลรายวัน เรียงหรือไม่เรียงก็ได้ (ระบบจะเรียงให้) วันที่ซ้ำจะใช้แถวแรก
- กฎ: High ≥ max(Open, Close), Low ≤ min(Open, Close), Volume ≥ 0
- ขนาดไม่เกิน ${MAX_CSV_BYTES / 1024 / 1024} MB / 50,000 แถว

รูปแบบ JSON
{ "symbol": "MYDATA", "name": "ชื่อ", "candles": [ { "time": "2024-01-02", "open": 10, "high": 11, "low": 9.5, "close": 10.5, "volume": 1000 } ] }

ใช้เฉพาะข้อมูลที่คุณมีสิทธิ์ใช้งาน ข้อมูลอยู่ในเบราว์เซอร์นี้เท่านั้น`;

export default function DataCenterPage() {
  const { dark, toggle } = useTheme();
  const [mode, setMode] = useState<string>('…');
  const [imported, setImported] = useImported();
  const [csv, setCsv] = useState<{ name: string; res: CsvResult; gaps: number } | null>(null);
  const [symbol, setSymbol] = useState('MYDATA');
  const [aliases, setAliases] = useState(() => Object.fromEntries(Object.entries(DEFAULT_ALIASES).map(([k, v]) => [k, v.join(', ')])) as Record<keyof Candle, string>);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [backup, setBackup] = useState<Backup | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);
  useEffect(() => { storageMode().then(setMode); }, []);

  const readFile = async (f: File, max = MAX_CSV_BYTES) => {
    if (f.size > max) { setMsg({ ok: false, text: `ไฟล์ ${f.name} ใหญ่เกิน ${(max / 1024 / 1024).toFixed(0)} MB — ไม่ได้ประมวลผล` }); return null; }
    return f.text();
  };
  const parseCsv = (text: string, name: string) => {
    const al = Object.fromEntries(Object.entries(aliases).map(([k, v]) => [k, v.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)])) as Record<keyof Candle, string[]>;
    const res = parseCandlesCsv(text, al);
    setCsv({ name, res, gaps: validateSeries(res.candles).gaps });
  };
  const symOk = /^[A-Z0-9._-]{1,12}$/.test(symbol) && !demoProvider.listSymbols().includes(symbol);
  const commitCsv = () => {
    if (!csv || !symOk || csv.res.candles.length < 2) return;
    if (imported[symbol] && !confirm(`มีข้อมูล ${symbol} อยู่แล้ว — แทนที่?`)) return;
    setImported((x) => ({ ...x, [symbol]: { name: csv.name, source: 'csv', candles: csv.res.candles, importedAt: new Date().toISOString() } }));
    setMsg({ ok: true, text: `นำเข้า ${symbol} แล้ว ${csv.res.candles.length} แท่ง — เลือกใช้ได้ในทุกหน้าที่มีตัวเลือก Symbol` });
    setCsv(null);
  };

  return (
    <>
      <PageHeader title="ตั้งค่า & Data Center" subtitle="ธีม การนำเข้า/ส่งออกข้อมูล การสำรอง และความเป็นส่วนตัว" />
      {msg && <div className="mb-3"><Callout kind={msg.ok ? 'info' : 'warn'}>{msg.text}</Callout></div>}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2">การแสดงผล</h2>
          <button className="btn mt-2" onClick={toggle}>{dark ? <><Sun size={16} /> เปลี่ยนเป็นธีมสว่าง</> : <><Moon size={16} /> เปลี่ยนเป็นธีมมืด</>}</button>
        </section>
        <section className="card">
          <h2 className="h2">ความเป็นส่วนตัว & ที่เก็บข้อมูล</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>ไม่มี login, cloud sync, analytics หรือ telemetry — ข้อมูลไม่ถูกส่งออกจากอุปกรณ์</li>
            <li>ที่เก็บข้อมูล: <strong>{mode === 'indexeddb' ? 'IndexedDB ของเบราว์เซอร์นี้' : mode === 'memory' ? 'หน่วยความจำชั่วคราว (IndexedDB ใช้ไม่ได้ — ข้อมูลจะหายเมื่อปิดแท็บ)' : mode}</strong> · schema v{DATA_VERSION}</li>
            <li>ถ้าล้างข้อมูลเบราว์เซอร์หรือใช้โหมดไม่ระบุตัวตน ข้อมูลอาจหาย — ส่งออกไฟล์สำรองเป็นระยะ</li>
          </ul>
        </section>
      </div>

      <section className="card mt-3" aria-labelledby="imp">
        <h2 id="imp" className="h2">นำเข้าข้อมูลราคา</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn" onClick={() => download('sample-candles.csv', candlesToCsv(demoProvider.getSeries('DMFOOD', '1D')!.candles.slice(0, 120)), 'text/csv')}><Download size={14} /> ดาวน์โหลดตัวอย่าง CSV</button>
          <button className="btn" onClick={() => download('schema-th.txt', SCHEMA_DOC, 'text/plain')}><Download size={14} /> คู่มือรูปแบบข้อมูล</button>
          <button className="btn btn-primary" onClick={() => csvRef.current?.click()}><Upload size={14} /> เลือกไฟล์ CSV</button>
          <button className="btn" onClick={() => jsonRef.current?.click()}><Upload size={14} /> เลือกไฟล์ JSON</button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="ไฟล์ CSV" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const t = await readFile(f); if (t !== null) parseCsv(t, f.name.replace(/\.[^.]+$/, '').slice(0, 60)); }} />
          <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" aria-label="ไฟล์ JSON" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
            const t = await readFile(f); if (t === null) return;
            const r = parseSeriesJson(t);
            if ('error' in r) { setMsg({ ok: false, text: `JSON: ${r.error}` }); return; }
            if (demoProvider.listSymbols().includes(r.symbol)) { setMsg({ ok: false, text: `symbol ${r.symbol} ชนกับข้อมูล demo — เปลี่ยนชื่อในไฟล์` }); return; }
            if (imported[r.symbol] && !confirm(`มีข้อมูล ${r.symbol} อยู่แล้ว — แทนที่?`)) return;
            setImported((x) => ({ ...x, [r.symbol]: { name: r.name, source: 'json', candles: r.candles, importedAt: new Date().toISOString() } }));
            setMsg({ ok: true, text: `นำเข้า ${r.symbol} แล้ว ${r.candles.length} แท่ง` });
          }} />
        </div>
        <details className="mt-3"><summary className="cursor-pointer text-sm">กำหนดชื่อคอลัมน์ที่ยอมรับ (column aliases)</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">{(Object.keys(aliases) as (keyof Candle)[]).map((k) => (
            <Field key={k} label={k}>{(id) => <input id={id} className="input" value={aliases[k]} onChange={(e) => setAliases({ ...aliases, [k]: e.target.value })} />}</Field>))}</div>
          <p className="muted mt-1 text-xs">คั่นหลายชื่อด้วย , ไม่สนตัวพิมพ์เล็ก/ใหญ่</p>
        </details>

        {csv && (
          <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800" aria-label="ตัวอย่างก่อนนำเข้า">
            <h3 className="font-medium">ตัวอย่างก่อนนำเข้า: {csv.name}</h3>
            {csv.res.fatal ? <Callout kind="warn">{csv.res.fatal}</Callout> : (
              <>
                <p className="mt-1 text-sm">ทั้งหมด {int(csv.res.totalRows)} แถว · ผ่าน <strong>{int(csv.res.candles.length)}</strong> · ไม่ผ่าน <strong>{csv.res.errors.length}</strong>{csv.gaps > 0 && ` · พบช่วงข้อมูลขาดหาย (> 5 วัน) ${csv.gaps} จุด — ระบบไม่เติมแท่งปลอม`}</p>
                {csv.res.errors.length > 0 && <div className="mt-2 max-h-40 overflow-auto text-xs"><table className="tbl"><thead><tr><th>แถว</th><th>ปัญหา</th></tr></thead><tbody>{csv.res.errors.slice(0, 200).map((er, i) => <tr key={i}><td>{er.row || '—'}</td><td>{er.message}</td></tr>)}</tbody></table></div>}
                {csv.res.candles.length > 0 && <div className="mt-2 overflow-x-auto text-xs"><table className="tbl"><thead><tr><th>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th></tr></thead><tbody>{csv.res.candles.slice(0, 5).map((c) => <tr key={c.time}><td>{c.time}</td><td>{c.open}</td><td>{c.high}</td><td>{c.low}</td><td>{c.close}</td><td>{c.volume}</td></tr>)}</tbody></table></div>}
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Field label="ตั้งชื่อ symbol" error={symOk ? null : 'A–Z, 0–9, . _ - ไม่เกิน 12 ตัว และห้ามซ้ำกับ demo'}>{(id) => <input id={id} className="input w-40" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />}</Field>
                  <button className="btn btn-primary" disabled={!symOk || csv.res.candles.length < 2} onClick={commitCsv}>ยืนยันนำเข้า {int(csv.res.candles.length)} แท่ง</button>
                  <button className="btn" onClick={() => setCsv(null)}>ยกเลิก</button>
                </div>
                {csv.res.errors.length > csv.res.candles.length && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">แถวที่ไม่ผ่านมีมากกว่าแถวที่ผ่าน — ตรวจรูปแบบไฟล์อีกครั้งก่อนนำเข้า</p>}
              </>
            )}
          </div>
        )}

        <h3 className="mt-4 font-medium">ข้อมูลที่นำเข้าแล้ว</h3>
        {Object.keys(imported).length === 0 ? <p className="muted">ยังไม่มี</p> : (
          <ul className="mt-1 space-y-1 text-sm">{Object.entries(imported).map(([sym, s]) => (
            <li key={sym} className="flex items-center gap-2"><span className="font-mono font-semibold">{sym}</span><span className="muted">{s.name} · {s.source.toUpperCase()} · {s.candles.length} แท่ง · {s.candles[0]?.time} → {s.candles.at(-1)?.time}</span>
              <button className="btn btn-danger !px-1.5" aria-label={`ลบ ${sym}`} onClick={() => confirm(`ลบข้อมูล ${sym}?`) && setImported((x) => { const n = { ...x }; delete n[sym]; return n; })}><Trash2 size={12} /></button></li>))}</ul>
        )}
      </section>

      <section className="card mt-3" aria-labelledby="bk">
        <h2 id="bk" className="h2">สำรอง / กู้คืน / รีเซ็ต</h2>
        <p className="muted mt-1">ไฟล์สำรองรวม progress, flashcards, journal, พอร์ตจำลอง, เส้นที่วาด, preset และข้อมูลที่นำเข้า</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={async () => download(`stocklab-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await exportAll(), null, 2))}><Download size={14} /> ส่งออกข้อมูลทั้งหมด</button>
          <button className="btn" onClick={() => backupRef.current?.click()}><Upload size={14} /> นำเข้าไฟล์สำรอง</button>
          <input ref={backupRef} type="file" accept=".json,application/json" className="hidden" aria-label="ไฟล์สำรอง" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
            const t = await readFile(f, 20 * 1024 * 1024); if (t === null) return;
            const r = parseBackup(t);
            if (!r.ok) setMsg({ ok: false, text: r.error }); else { setBackup(r.backup); setMsg(null); }
          }} />
        </div>
        {backup && (
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
            <p>ไฟล์สำรองจาก {backup.exportedAt.slice(0, 16).replace('T', ' ')} มี {Object.keys(backup.data).length} รายการ: {Object.keys(backup.data).join(', ')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn" onClick={async () => { await importAll(backup, 'merge'); setBackup(null); location.reload(); }}>รวมกับข้อมูลเดิม (คีย์ที่ซ้ำจะถูกแทนที่)</button>
              <button className="btn btn-danger" onClick={async () => { if (!confirm('แทนที่ข้อมูลทั้งหมดในเครื่องด้วยไฟล์นี้? ข้อมูลปัจจุบันที่ไม่ได้สำรองจะหาย')) return; await importAll(backup, 'replace'); setBackup(null); location.reload(); }}>แทนที่ทั้งหมด</button>
              <button className="btn" onClick={() => setBackup(null)}>ยกเลิก</button>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <button className="btn btn-danger" onClick={async () => { if (!confirm('รีเซ็ตความคืบหน้าการเรียนและ flashcards? (แนะนำให้ส่งออกไฟล์สำรองก่อน)')) return; await removeItem('progress'); await removeItem('srs'); setMsg({ ok: true, text: 'รีเซ็ตความคืบหน้าแล้ว' }); }}>รีเซ็ตความคืบหน้าการเรียน</button>
          <button className="btn btn-danger" onClick={async () => { if (!confirm('ลบข้อมูลทั้งหมดของแอปในเบราว์เซอร์นี้? ไม่สามารถย้อนกลับได้ (แนะนำให้ส่งออกไฟล์สำรองก่อน)')) return; await clearAll(); location.reload(); }}>ลบข้อมูลทั้งหมด</button>
        </div>
      </section>

      <section className="card mt-3">
        <h2 className="h2">แหล่งข้อมูล (Data providers)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li><strong>Demo</strong> — ข้อมูลจำลองแบบ deterministic (seed คงที่) ของบริษัทสมมติ 4 แห่ง · ใช้งานอยู่</li>
          <li><strong>CSV / JSON</strong> — นำเข้าข้อมูลที่คุณมีสิทธิ์ใช้ · ใช้งานได้</li>
          <li><strong>Live</strong> — ยังไม่เปิดใช้: ไม่มีการดึงหรือจำลองข้อมูลสด และไม่ scrape เว็บไซต์ใด (มีเพียง interface สำหรับต่อยอดกับผู้ให้บริการที่มีใบอนุญาตในอนาคต)</li>
        </ul>
      </section>
    </>
  );
}
