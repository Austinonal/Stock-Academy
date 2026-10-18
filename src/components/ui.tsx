import { AlertTriangle, FlaskConical, Info } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import type { Metric } from '../core/fundamentals/ratios';

export function DemoBadge({ text = 'ข้อมูลจำลอง (Synthetic/Demo)' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-500/60 dark:bg-amber-950 dark:text-amber-300" title="สร้างด้วยอัลกอริทึม ไม่ใช่ราคาหรืองบการเงินจริง">
      <FlaskConical size={12} aria-hidden /> {text}
    </span>
  );
}

export function PageHeader({ title, subtitle, demo, children }: { title: string; subtitle?: string; demo?: boolean; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2"><h1 className="h1">{title}</h1>{demo && <DemoBadge />}</div>
        {subtitle && <p className="muted mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Callout({ kind = 'info', children }: { kind?: 'info' | 'warn'; children: ReactNode }) {
  const Icon = kind === 'warn' ? AlertTriangle : Info;
  const cls = kind === 'warn'
    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200'
    : 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100';
  return <div role={kind === 'warn' ? 'alert' : 'note'} className={`flex gap-2.5 rounded-xl border p-3.5 text-sm leading-relaxed ${cls}`}><Icon size={16} className="mt-0.5 shrink-0" aria-hidden /><div>{children}</div></div>;
}

export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children(id)}
      {hint && !error && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-0.5 text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  );
}

export function NumberField({ label, value, onChange, step = 'any', min, max, hint, error, suffix }: {
  label: string; value: number; onChange: (n: number) => void; step?: number | 'any'; min?: number; max?: number; hint?: string; error?: string | null; suffix?: string;
}) {
  return (
    <Field label={suffix ? `${label} (${suffix})` : label} hint={hint} error={error}>
      {(id) => <input id={id} type="number" className="input" value={Number.isFinite(value) ? value : ''} step={step} min={min} max={max}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />}
    </Field>
  );
}

export function Stat({ label, value, tone, hint }: { label: string; value: ReactNode; tone?: 'up' | 'down'; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" title={hint}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold tracking-tight tabular-nums ${tone === 'up' ? 'text-green-600 dark:text-green-400' : tone === 'down' ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</div>
    </div>
  );
}

export function MetricValue({ m, format }: { m: Metric; format: (n: number) => string }) {
  return m.value === null
    ? <span className="cursor-help text-slate-500 underline decoration-dotted" title={m.na}>N/A<span className="sr-only"> — {m.na}</span></span>
    : <span className="tabular-nums">{format(m.value)}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700"><p className="font-medium">{title}</p>{children && <div className="muted mt-1">{children}</div>}</div>;
}

/** Skeleton in the shape of a typical page (header, stat row, content) instead of a bare text line. */
export function Loading({ label = 'กำลังโหลด…' }: { label?: string }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-8 w-64" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      <div className="skeleton mt-4 h-64" />
    </div>
  );
}

/** Signed value colored by sign, with +/− so color is never the only cue. */
export function Signed({ n, children }: { n: number; children: ReactNode }) {
  return <span className={`tabular-nums ${n > 0 ? 'text-green-600 dark:text-green-400' : n < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{n > 0 ? '+' : ''}{children}</span>;
}
