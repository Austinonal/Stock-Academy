import { CHART_PATTERNS } from './chartPatterns';
import { TECHNIQUES } from './techniques';

const inBox = ([x, y]: [number, number]) => x >= 0 && x <= 100 && y >= 0 && y <= 100;
const BANNED = /กำไรชัวร์|ขึ้นแน่|ลงแน่|รับประกันกำไร|ซื้อเลย/;

describe('chart pattern library', () => {
  it('ids unique; every pattern has confirmation, target, invalidation and a failure path', () => {
    expect(new Set(CHART_PATTERNS.map((p) => p.id)).size).toBe(CHART_PATTERNS.length);
    for (const p of CHART_PATTERNS) {
      expect(p.confirm && p.target && p.invalidation).toBeTruthy();
      expect(p.failure.length).toBeGreaterThan(1);
      expect([...p.shape, ...p.projection, ...p.failure, ...(p.altProjection ?? []), ...p.lines.flat()].every(inBox), p.id).toBe(true);
    }
  });
  it('projection starts where the price path ends and moves in the stated direction', () => {
    for (const p of CHART_PATTERNS) {
      expect(p.projection[0], p.id).toEqual(p.shape[p.shape.length - 1]);
      const d = p.projection.at(-1)![1] - p.projection[0][1];
      if (p.bias === 'bullish') expect(d, p.id).toBeGreaterThan(0);
      if (p.bias === 'bearish') expect(d, p.id).toBeLessThan(0);
      if (p.bias === 'neutral') expect(p.altProjection, p.id).toBeDefined();
    }
  });
  it('techniques are complete and contain no promise language', () => {
    for (const t of TECHNIQUES) {
      expect(t.steps.length).toBeGreaterThanOrEqual(3);
      expect(t.works && t.fails && t.risk).toBeTruthy();
      expect(BANNED.test(JSON.stringify(t)), t.id).toBe(false);
    }
    for (const p of CHART_PATTERNS) expect(BANNED.test(JSON.stringify(p)), p.id).toBe(false);
  });
});
