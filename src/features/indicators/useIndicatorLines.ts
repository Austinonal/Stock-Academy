import { useMemo } from 'react';
import type { Pane } from '../../components/charts/PriceChart';
import { INDICATORS, type IndicatorLine } from '../../core/indicators/catalog';
import type { Candle } from '../../core/market-data/types';

export type Active = { uid: string; id: string; params: Record<string, number> };

/** Splits active indicators into price overlays and separate panes, computed only from `data`. */
export function useIndicatorLines(data: Candle[], active: Active[]) {
  return useMemo(() => {
    const overlays: IndicatorLine[] = [];
    const panes: Pane[] = [];
    for (const a of active) {
      const def = INDICATORS.find((d) => d.id === a.id);
      if (!def) continue;
      const lines = def.compute(data, a.params);
      if (def.overlay) overlays.push(...lines); else panes.push({ title: def.name, lines, levels: def.levels });
    }
    return { overlays, panes };
  }, [data, active]);
}
