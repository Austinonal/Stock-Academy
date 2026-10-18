import type { Timeframe } from '../core/market-data/types';
import { Field } from '../components/ui';

export function SeriesPicker({ symbols, symbol, onSymbol, tf, onTf }: {
  symbols: { symbol: string; imported: boolean }[]; symbol: string; onSymbol: (s: string) => void; tf?: Timeframe; onTf?: (t: Timeframe) => void;
}) {
  return (
    <>
      <Field label="Symbol">{(id) => (
        <select id={id} className="input w-40" value={symbol} onChange={(e) => onSymbol(e.target.value)}>
          {symbols.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol}{s.imported ? ' (นำเข้า)' : ' (demo)'}</option>)}
        </select>)}</Field>
      {tf && onTf && (
        <Field label="Timeframe">{(id) => (
          <select id={id} className="input w-28" value={tf} onChange={(e) => onTf(e.target.value as Timeframe)}>
            <option value="1D">รายวัน</option><option value="1W">รายสัปดาห์</option><option value="1M">รายเดือน</option>
          </select>)}</Field>
      )}
    </>
  );
}
