import type { ChartPattern, Pt } from '../../content/trading/chartPatterns';

const pts = (ps: Pt[]) => ps.map(([x, y]) => `${x},${100 - y}`).join(' ');
const common = { fill: 'none', vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Schematic only: solid = price so far, dashed = what textbooks expect, dotted = a failed pattern. */
export function PatternDiagram({ p }: { p: ChartPattern }) {
  const up = p.bias !== 'bearish';
  const end = (ps: Pt[]) => ps[ps.length - 1];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible" role="img"
      aria-label={`แผนภาพ ${p.th}: ${p.summary}`}>
      {[25, 50, 75].map((y) => <line key={y} x1={0} x2={100} y1={y} y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} {...common} />)}
      {p.lines.map((l, i) => <polyline key={i} points={pts(l)} className="stroke-amber-500" strokeWidth={1.5} strokeDasharray="4 3" {...common} />)}
      <polyline points={pts(p.failure)} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1.5} strokeDasharray="1 4" {...common} />
      {p.altProjection && <polyline points={pts(p.altProjection)} className="stroke-red-500" strokeWidth={2} strokeDasharray="6 4" {...common} />}
      <polyline points={pts(p.projection)} className={up ? 'stroke-green-500' : 'stroke-red-500'} strokeWidth={2} strokeDasharray="6 4" {...common} />
      <polyline points={pts(p.shape)} className="stroke-slate-800 dark:stroke-slate-100" strokeWidth={2.25} {...common} />
      <line x1={end(p.shape)[0]} x2={end(p.shape)[0]} y1={0} y2={100} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth={1} strokeDasharray="2 3" {...common} />
    </svg>
  );
}

export function DiagramLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <li className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-slate-800 dark:bg-slate-100" />ราคาที่เกิดขึ้นแล้ว</li>
      <li className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-amber-500" />เส้นคอ / เส้นแนวโน้ม</li>
      <li className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-green-500" />สิ่งที่ตำราคาด (ไม่ใช่สิ่งที่ต้องเกิด)</li>
      <li className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dotted border-slate-400" />กรณีรูปแบบล้มเหลว</li>
      <li className="flex items-center gap-1.5"><span className="h-3 w-0 border-l border-dashed border-slate-400" />จุดที่ต้องตัดสินใจ</li>
    </ul>
  );
}
