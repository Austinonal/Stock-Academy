/** Simplified SM-2 spaced repetition. grade: 0 = จำไม่ได้, 1 = ยาก, 2 = จำได้, 3 = ง่าย */
export type CardState = { ease: number; interval: number; reps: number; due: string; lapses: number };
export type Grade = 0 | 1 | 2 | 3;

const DAY = 86_400_000;
export const today = (now = new Date()) => now.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * DAY).toISOString().slice(0, 10);

export const newCard = (now = new Date()): CardState => ({ ease: 2.5, interval: 0, reps: 0, due: today(now), lapses: 0 });

export function review(c: CardState, g: Grade, now = new Date()): CardState {
  const t = today(now);
  if (g === 0) return { ease: Math.max(1.3, c.ease - 0.2), interval: 1, reps: 0, due: addDays(t, 1), lapses: c.lapses + 1 };
  const ease = Math.max(1.3, c.ease + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0));
  const base = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.interval * ease);
  const interval = Math.max(1, g === 1 ? Math.ceil(base * 0.6) : g === 3 ? Math.round(base * 1.3) : base);
  return { ease, interval, reps: c.reps + 1, due: addDays(t, interval), lapses: c.lapses };
}

export const isDue = (c: CardState | undefined, now = new Date()) => !c || c.due <= today(now);
