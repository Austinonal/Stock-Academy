import { ALL_LESSONS, CURRICULUM, type Quiz } from '../../content/curriculum';
import { isDue, newCard, review, type CardState, type Grade } from '../../core/learning/srs';
import { isObject, usePersistent } from '../../storage/usePersistent';

export const MASTERY = 0.8; // quiz score needed to show "พร้อมไปต่อ" — informational, never locks content

export type LessonProgress = { status: 'started' | 'done'; attempts: number; best: number | null; last: number | null; updatedAt: string };
export type Progress = { lessons: Record<string, LessonProgress> };
export type Deck = Record<string, CardState>;

const isProgress = (v: unknown): v is Progress => isObject(v) && isObject(v.lessons);
const isDeck = (v: unknown): v is Deck => isObject(v) && Object.values(v).every((c) => isObject(c) && typeof c.due === 'string' && typeof c.interval === 'number');

export const useProgress = () => usePersistent<Progress>('progress', { lessons: {} }, isProgress);
export const useDeck = () => usePersistent<Deck>('srs', {}, isDeck);

export function gradeQuiz(quiz: Quiz[], answers: (number | null)[]) {
  const correct = quiz.map((q, i) => answers[i] === q.answer);
  return { correct, score: quiz.length ? correct.filter(Boolean).length / quiz.length : 0 };
}

export function markStarted(p: Progress, id: string): Progress {
  if (p.lessons[id]) return p;
  return { lessons: { ...p.lessons, [id]: { status: 'started', attempts: 0, best: null, last: null, updatedAt: new Date().toISOString() } } };
}

export function markDone(p: Progress, id: string, done = true): Progress {
  const cur = p.lessons[id] ?? { status: 'started', attempts: 0, best: null, last: null, updatedAt: '' };
  return { lessons: { ...p.lessons, [id]: { ...cur, status: done ? 'done' : 'started', updatedAt: new Date().toISOString() } } };
}

export function recordQuiz(p: Progress, id: string, score: number): Progress {
  const cur = p.lessons[id] ?? { status: 'started', attempts: 0, best: null, last: null, updatedAt: '' };
  return { lessons: { ...p.lessons, [id]: { ...cur, attempts: cur.attempts + 1, last: score, best: Math.max(cur.best ?? 0, score), updatedAt: new Date().toISOString() } } };
}

/** Every quiz answer feeds the review deck: wrong → due tomorrow (reset), right → interval grows. */
export function applyQuizToDeck(deck: Deck, quiz: Quiz[], correct: boolean[], now = new Date()): Deck {
  const next = { ...deck };
  quiz.forEach((q, i) => { next[q.id] = review(next[q.id] ?? newCard(now), correct[i] ? 2 : 0, now); });
  return next;
}

export function gradeCard(deck: Deck, id: string, g: Grade, now = new Date()): Deck {
  return { ...deck, [id]: review(deck[id] ?? newCard(now), g, now) };
}

export type ReviewItem = { id: string; lessonId: string; kind: 'quiz'; quiz: Quiz } | { id: string; lessonId: string; kind: 'card'; q: string; a: string };

/** Due today: flashcards of started lessons (new or due) + quiz questions already seen and due. */
export function dueItems(progress: Progress, deck: Deck, now = new Date()): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const l of ALL_LESSONS) {
    if (!progress.lessons[l.id]) continue;
    for (const f of l.flashcards) if (isDue(deck[f.id], now)) out.push({ id: f.id, lessonId: l.id, kind: 'card', q: f.q, a: f.a });
    for (const q of l.quiz) if (deck[q.id] && isDue(deck[q.id], now)) out.push({ id: q.id, lessonId: l.id, kind: 'quiz', quiz: q });
  }
  return out;
}

export function stats(p: Progress) {
  const done = ALL_LESSONS.filter((l) => p.lessons[l.id]?.status === 'done').length;
  const next = ALL_LESSONS.find((l) => p.lessons[l.id]?.status !== 'done');
  const quizzes = Object.values(p.lessons).filter((x) => x.best !== null);
  const avg = quizzes.length ? quizzes.reduce((a, x) => a + (x.best as number), 0) / quizzes.length : null;
  const levels = CURRICULUM.map((lv) => ({ id: lv.id, level: lv.level, title: lv.title, total: lv.lessons.length, done: lv.lessons.filter((l) => p.lessons[l.id]?.status === 'done').length }));
  return { done, total: ALL_LESSONS.length, next, avg, attempts: Object.values(p.lessons).reduce((a, x) => a + x.attempts, 0), levels };
}
