import { afterLosingStreak, correlation, drawdowns, positionSize, recoveryGain, returns, stdev } from './index';
import { review, newCard, isDue } from '../learning/srs';

describe('risk math', () => {
  it('returns, stdev, correlation', () => {
    const r = returns([100, 110, 99]); expect(r[0]).toBeCloseTo(0.1); expect(r[1]).toBeCloseTo(-0.1);
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(correlation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(correlation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
    expect(correlation([1, 1, 1], [1, 2, 3])).toBeNaN();
  });
  it('drawdown and recovery', () => {
    expect(drawdowns([100, 120, 60, 130]).max).toBeCloseTo(-0.5);
    expect(recoveryGain(0.5)).toBeCloseTo(1);
    expect(recoveryGain(1)).toBe(Infinity);
    expect(afterLosingStreak(5, 0.1)).toBeCloseTo(0.59049);
  });
  it('position sizing', () => {
    const r = positionSize({ portfolio: 100_000, riskFraction: 0.01, entry: 50, stop: 45 });
    expect(r.ok && r.shares).toBe(200);
    expect(positionSize({ portfolio: 100_000, riskFraction: 0.01, entry: 50, stop: 55 }).ok).toBe(false);
  });
});

describe('spaced repetition', () => {
  const now = new Date('2024-05-01T10:00:00Z');
  it('intervals grow with success and reset on failure', () => {
    let c = newCard(now);
    expect(isDue(c, now)).toBe(true);
    c = review(c, 2, now); expect(c.interval).toBe(1);
    c = review(c, 2, now); expect(c.interval).toBe(3);
    c = review(c, 2, now); expect(c.interval).toBe(8);
    expect(c.due).toBe('2024-05-09');
    expect(isDue(c, now)).toBe(false);
    c = review(c, 0, now);
    expect(c).toMatchObject({ interval: 1, reps: 0, lapses: 1 });
    expect(c.ease).toBeCloseTo(2.3);
  });
  it('easy grows faster than hard', () => {
    const base = review(review(newCard(now), 2, now), 2, now);
    expect(review(base, 3, now).interval).toBeGreaterThan(review(base, 1, now).interval);
  });
});

describe('monte carlo', () => {
  it('is reproducible with a seed and reflects the edge', async () => {
    const { rng } = await import('../market-data/random');
    const { monteCarlo } = await import('./index');
    const p = { winRate: 0.5, rr: 2, risk: 0.01, trades: 100, runs: 500 };
    const a = monteCarlo(p, rng(1));
    expect(monteCarlo(p, rng(1))).toEqual(a);
    expect(a.expectancyR).toBeCloseTo(0.5);
    expect(a.final.p50).toBeGreaterThan(1);
    const losing = monteCarlo({ ...p, winRate: 0.2 }, rng(1));
    expect(losing.final.p50).toBeLessThan(1);
    expect(monteCarlo({ ...p, risk: 0.2 }, rng(1)).probDd50).toBeGreaterThan(a.probDd50);
  });
});
