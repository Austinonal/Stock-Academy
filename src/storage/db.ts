import Dexie, { type Table } from 'dexie';

/** Bump when a stored value's shape changes; add a migration in `migrate` below. */
export const DATA_VERSION = 1;

type Row = { key: string; value: unknown; updatedAt: number };

class StockLabDB extends Dexie {
  kv!: Table<Row, string>;
  constructor() {
    super('stocklab-th');
    this.version(1).stores({ kv: 'key' });
  }
}

const db = new StockLabDB();
const memory = new Map<string, unknown>();
let mode: 'indexeddb' | 'memory' | 'unknown' = 'unknown';

async function ready(): Promise<boolean> {
  if (mode === 'unknown') {
    try { await db.open(); mode = 'indexeddb'; } catch { mode = 'memory'; } // private mode / blocked storage
  }
  return mode === 'indexeddb';
}

export const storageMode = async () => { await ready(); return mode; };

export async function getItem<T>(key: string): Promise<T | undefined> {
  if (!(await ready())) return memory.get(key) as T | undefined;
  return (await db.kv.get(key))?.value as T | undefined;
}

export async function setItem(key: string, value: unknown): Promise<void> {
  if (!(await ready())) { memory.set(key, value); return; }
  await db.kv.put({ key, value, updatedAt: Date.now() });
}

export async function removeItem(key: string) {
  if (!(await ready())) { memory.delete(key); return; }
  await db.kv.delete(key);
}

export type Backup = { app: 'stocklab-th'; version: number; exportedAt: string; data: Record<string, unknown> };

export async function exportAll(): Promise<Backup> {
  const data: Record<string, unknown> = {};
  if (await ready()) for (const r of await db.kv.toArray()) data[r.key] = r.value;
  else memory.forEach((v, k) => (data[k] = v));
  return { app: 'stocklab-th', version: DATA_VERSION, exportedAt: new Date().toISOString(), data };
}

const KEY_RE = /^(progress|srs|paper|journal|screenerPresets|portfolio|replayLog|imported|drawings:[A-Z0-9._-]+:(1D|1W|1M))$/;

/** Validates a backup file. File content is untrusted: only known keys are accepted, nothing is executed. */
export function parseBackup(text: string): { ok: true; backup: Backup } | { ok: false; error: string } {
  let o: unknown;
  try { o = JSON.parse(text); } catch { return { ok: false, error: 'ไฟล์ไม่ใช่ JSON ที่ถูกต้อง' }; }
  const b = o as Partial<Backup>;
  if (b?.app !== 'stocklab-th' || typeof b.data !== 'object' || b.data === null) return { ok: false, error: 'ไม่ใช่ไฟล์สำรองของ StockLab TH' };
  if (typeof b.version !== 'number' || b.version > DATA_VERSION) return { ok: false, error: `เวอร์ชันข้อมูล ${b.version} ใหม่กว่าแอปนี้ (${DATA_VERSION})` };
  const bad = Object.keys(b.data).filter((k) => !KEY_RE.test(k));
  if (bad.length) return { ok: false, error: `พบคีย์ที่ไม่รู้จัก: ${bad.slice(0, 5).join(', ')}` };
  return { ok: true, backup: migrate(b as Backup) };
}

function migrate(b: Backup): Backup {
  return b; // v1 is the first schema — future versions transform `b.data` here
}

export async function importAll(b: Backup, mode: 'merge' | 'replace') {
  if (mode === 'replace') await clearAll();
  for (const [k, v] of Object.entries(b.data)) await setItem(k, v);
}

export async function clearAll() {
  if (await ready()) await db.kv.clear(); else memory.clear();
}
