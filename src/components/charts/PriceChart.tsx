import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarSeries, CandlestickSeries, ColorType, createChart, createSeriesMarkers, HistogramSeries, LineSeries, LineStyle,
  type IChartApi, type ISeriesApi, type Logical, type SeriesMarker, type SeriesType, type Time,
} from 'lightweight-charts';
import type { Candle } from '../../core/market-data/types';
import type { IndicatorLine } from '../../core/indicators/catalog';
import { FIB_RATIOS } from '../../core/indicators';
import { useTheme } from '../../app/theme';
import { fmt, int } from '../../lib/format';

export type ChartType = 'candlestick' | 'line' | 'bar';
export type Tool = 'none' | 'hline' | 'trend' | 'ray' | 'rect' | 'fib';
export type Point = { time: string; price: number };
export type Drawing = { id: string; kind: Exclude<Tool, 'none'>; a: Point; b?: Point };
export type Pane = { title: string; lines: IndicatorLine[]; levels?: number[] };

type Props = {
  candles: Candle[];
  chartType?: ChartType;
  showVolume?: boolean;
  overlays?: IndicatorLine[];
  panes?: Pane[];
  markers?: SeriesMarker<Time>[];
  height?: number;
  drawing?: { tool: Tool; items: Drawing[]; onAdd: (d: Drawing) => void; selected: string | null; onSelect: (id: string | null) => void };
  ariaLabel?: string;
};

const UP = '#16a34a';
const DOWN = '#dc2626';
const toLine = (c: Candle[], data: (number | null)[]) => c.map((x, i) => (data[i] === null ? { time: x.time as Time } : { time: x.time as Time, value: data[i] as number }));

export function PriceChart({ candles, chartType = 'candlestick', showVolume = true, overlays = [], panes = [], markers, height = 420, drawing, ariaLabel = 'กราฟราคา' }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ chart: IChartApi; main: ISeriesApi<SeriesType> } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const lastView = useRef<{ first: string; range: { from: number; to: number } | null }>({ first: '', range: null });
  const { dark } = useTheme();

  useEffect(() => {
    if (!el.current || candles.length === 0) return;
    const chart = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: dark ? '#0f172a' : '#ffffff' }, textColor: dark ? '#cbd5e1' : '#334155', attributionLogo: true, panes: { separatorColor: dark ? '#334155' : '#e2e8f0' } },
      grid: { vertLines: { color: dark ? '#1e293b' : '#f1f5f9' }, horzLines: { color: dark ? '#1e293b' : '#f1f5f9' } },
      timeScale: { borderColor: dark ? '#334155' : '#cbd5e1' },
      rightPriceScale: { borderColor: dark ? '#334155' : '#cbd5e1' },
    });
    let main: ISeriesApi<SeriesType>;
    if (chartType === 'line') {
      main = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 2 });
      main.setData(candles.map((c) => ({ time: c.time as Time, value: c.close })));
    } else {
      main = chartType === 'bar'
        ? chart.addSeries(BarSeries, { upColor: UP, downColor: DOWN })
        : chart.addSeries(CandlestickSeries, { upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN });
      main.setData(candles.map((c) => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));
    }
    if (showVolume) {
      const vol = chart.addSeries(HistogramSeries, { priceScaleId: 'vol', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      vol.setData(candles.map((c) => ({ time: c.time as Time, value: c.volume, color: c.close >= c.open ? 'rgba(22,163,74,.35)' : 'rgba(220,38,38,.35)' })));
    }
    for (const o of overlays) chart.addSeries(LineSeries, { color: o.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: o.label }).setData(toLine(candles, o.data));
    panes.forEach((p, k) => {
      const idx = k + 1;
      let first: ISeriesApi<SeriesType> | null = null;
      for (const l of p.lines) {
        const s = l.key === 'hist'
          ? chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, title: l.label }, idx)
          : chart.addSeries(LineSeries, { color: l.color, lineWidth: 1, priceLineVisible: false, title: l.label }, idx);
        if (l.key === 'hist') s.setData(candles.map((c, i) => (l.data[i] === null ? { time: c.time as Time } : { time: c.time as Time, value: l.data[i] as number, color: (l.data[i] as number) >= 0 ? 'rgba(22,163,74,.6)' : 'rgba(220,38,38,.6)' })));
        else s.setData(toLine(candles, l.data));
        first ??= s;
      }
      for (const lv of p.levels ?? []) first?.createPriceLine({ price: lv, color: '#64748b', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: true, title: '' });
    });
    chart.panes().forEach((p, i) => i > 0 && p.setHeight(120));
    if (markers?.length) createSeriesMarkers(main, markers);

    const first = candles[0].time;
    if (lastView.current.first === first && lastView.current.range) chart.timeScale().setVisibleLogicalRange(lastView.current.range);
    else if (candles.length > 160) chart.timeScale().setVisibleLogicalRange({ from: candles.length - 160, to: candles.length + 3 });
    else chart.timeScale().fitContent();

    const bump = () => setTick((t) => t + 1);
    const onRange = (r: { from: number; to: number } | null) => { lastView.current = { first, range: r }; bump(); };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    chart.timeScale().subscribeSizeChange(bump);
    chart.subscribeCrosshairMove((p) => { setHover(p.logical === undefined ? null : Math.round(p.logical)); bump(); });
    setApi({ chart, main });
    return () => { setApi(null); chart.remove(); };
  }, [candles, chartType, showVolume, overlays, panes, markers, dark]);

  const timeIndex = useMemo(() => new Map(candles.map((c, i) => [c.time, i])), [candles]);
  const shown = hover !== null && candles[hover] ? candles[hover] : candles[candles.length - 1];
  const prevClose = shown ? candles[candles.indexOf(shown) - 1]?.close : undefined;

  if (candles.length === 0) return <div className="grid h-64 place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">ไม่มีข้อมูลราคาให้แสดง — เลือก symbol อื่นหรือนำเข้าข้อมูลที่ Data Center</div>;

  return (
    <div className="relative" style={{ height: height + panes.length * 120 }}>
      <div ref={el} className="absolute inset-0" role="img" aria-label={`${ariaLabel} ${candles.length} แท่ง`} />
      {shown && (
        <div className="pointer-events-none absolute left-2 top-1 z-10 flex flex-wrap gap-x-3 rounded bg-white/80 px-1.5 text-xs tabular-nums dark:bg-slate-900/80" aria-live="polite">
          <span className="font-medium">{shown.time}</span>
          {chartType === 'line' ? <span>{fmt(shown.close)}</span> : <>
            <span>O {fmt(shown.open)}</span><span>H {fmt(shown.high)}</span><span>L {fmt(shown.low)}</span>
            <span className={shown.close >= shown.open ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>C {fmt(shown.close)}</span>
          </>}
          {prevClose !== undefined && prevClose !== 0 && <span>{shown.close >= prevClose ? '+' : ''}{fmt(((shown.close - prevClose) / Math.abs(prevClose)) * 100)}%</span>}
          {showVolume && <span>Vol {int(shown.volume)}</span>}
          {overlays.map((o) => <span key={o.label} style={{ color: o.color }}>{o.label} {fmt(o.data[candles.indexOf(shown)] ?? null)}</span>)}
        </div>
      )}
      {api && drawing && <DrawingLayer api={api} candles={candles} timeIndex={timeIndex} height={height} tick={tick} {...drawing} />}
    </div>
  );
}

function DrawingLayer({ api, candles, timeIndex, height, tool, items, onAdd, selected, onSelect }: {
  api: { chart: IChartApi; main: ISeriesApi<SeriesType> }; candles: Candle[]; timeIndex: Map<string, number>; height: number; tick: number;
} & NonNullable<Props['drawing']>) {
  const [pending, setPending] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const ts = api.chart.timeScale();
  const width = ts.width();

  // Convert via logical index so points stay valid even when scrolled off-screen
  const toXY = (p: Point) => {
    const idx = timeIndex.get(p.time);
    const x = idx === undefined ? null : ts.logicalToCoordinate(idx as Logical);
    const y = api.main.priceToCoordinate(p.price);
    return x === null || y === null ? null : { x, y };
  };
  const fromXY = (x: number, y: number): Point | null => {
    const l = ts.coordinateToLogical(x);
    const price = api.main.coordinateToPrice(y);
    if (l === null || price === null) return null;
    const c = candles[Math.min(candles.length - 1, Math.max(0, Math.round(l)))];
    return { time: c.time, price: Math.round(price * 100) / 100 };
  };
  const evPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return fromXY(e.clientX - r.left, e.clientY - r.top);
  };
  const active = tool !== 'none';

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!active) return;
    const p = evPoint(e);
    if (!p) return;
    const id = `d${Date.now().toString(36)}`;
    if (tool === 'hline') { onAdd({ id, kind: 'hline', a: p }); return; }
    if (!pending) { setPending(p); return; }
    onAdd({ id, kind: tool, a: pending, b: p });
    setPending(null);
  };

  const render = (d: Drawing, preview = false) => {
    const a = toXY(d.a);
    const b = d.b ? toXY(d.b) : null;
    const sel = d.id === selected;
    const stroke = preview ? '#94a3b8' : sel ? '#f59e0b' : '#22d3ee';
    const common = { stroke, strokeWidth: sel ? 2.5 : 1.5, fill: 'none' };
    const hit = { onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect(sel ? null : d.id); }, style: { pointerEvents: preview || active ? 'none' : 'stroke', cursor: 'pointer' } as const };
    if (d.kind === 'hline') {
      const y = api.main.priceToCoordinate(d.a.price);
      if (y === null) return null;
      return <g key={d.id}><line x1={0} x2={width} y1={y} y2={y} {...common} /><line x1={0} x2={width} y1={y} y2={y} stroke="transparent" strokeWidth={10} {...hit} /><text x={4} y={y - 3} fill={stroke} fontSize={10}>{fmt(d.a.price)}</text></g>;
    }
    if (!a || !b) return null;
    if (d.kind === 'rect') {
      return <g key={d.id}><rect x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)} {...common} fill={sel ? 'rgba(245,158,11,.12)' : 'rgba(34,211,238,.1)'} />
        <rect x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)} fill="none" stroke="transparent" strokeWidth={10} {...hit} /></g>;
    }
    if (d.kind === 'fib') {
      const x1 = Math.min(a.x, b.x); const x2 = Math.max(a.x, b.x, x1 + 40);
      return <g key={d.id}>{FIB_RATIOS.map((r) => {
        const price = d.b!.price - (d.b!.price - d.a.price) * r;
        const y = api.main.priceToCoordinate(price);
        return y === null ? null : <g key={r}><line x1={x1} x2={x2} y1={y} y2={y} {...common} strokeDasharray={r === 0 || r === 1 ? undefined : '4 3'} /><line x1={x1} x2={x2} y1={y} y2={y} stroke="transparent" strokeWidth={8} {...hit} /><text x={x2 + 3} y={y + 3} fill={stroke} fontSize={10}>{(r * 100).toFixed(1)}% · {fmt(price)}</text></g>;
      })}</g>;
    }
    let x2: number = b.x;
    let y2: number = b.y;
    if (d.kind === 'ray' && b.x !== a.x) { // extend to the right edge
      const slope = (b.y - a.y) / (b.x - a.x);
      const ex = b.x > a.x ? width : 0;
      y2 = a.y + slope * (ex - a.x); x2 = ex;
    }
    return <g key={d.id}><line x1={a.x} y1={a.y} x2={x2} y2={y2} {...common} /><line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke="transparent" strokeWidth={10} {...hit} /></g>;
  };

  return (
    <svg className="absolute left-0 top-0 z-10" width={width} height={height - 28} style={{ pointerEvents: active ? 'all' : 'none', cursor: active ? 'crosshair' : 'default' }}
      onClick={onClick} onMouseMove={(e) => active && pending && setCursor(evPoint(e))} onMouseLeave={() => setCursor(null)} aria-hidden>
      {items.map((d) => render(d))}
      {pending && cursor && tool !== 'none' && tool !== 'hline' && render({ id: 'preview', kind: tool, a: pending, b: cursor }, true)}
      {pending && (() => { const p = toXY(pending); return p && <circle cx={p.x} cy={p.y} r={4} fill="#f59e0b" />; })()}
    </svg>
  );
}
