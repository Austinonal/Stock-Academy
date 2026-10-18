import { ALL_LESSONS, CURRICULUM } from './curriculum';
import { TERMS } from './glossary/terms';

describe('curriculum integrity', () => {
  it('has levels 0–16 in order', () => expect(CURRICULUM.map((l) => l.level)).toEqual([...Array(17).keys()]));
  it('ids are unique across lessons, quizzes and flashcards', () => {
    const ids = ALL_LESSONS.flatMap((l) => [l.id, ...l.quiz.map((q) => q.id), ...l.flashcards.map((f) => f.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every quiz has a valid answer key and one explanation per choice', () => {
    for (const l of ALL_LESSONS) for (const q of l.quiz) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.choices.length);
      expect(q.why).toHaveLength(q.choices.length);
    }
  });
  it('full lessons (L0–L3) meet the lesson template minimums', () => {
    const full = ALL_LESSONS.filter((l) => !l.outline);
    expect(full.length).toBeGreaterThanOrEqual(12);
    for (const l of full) {
      expect(l.quiz.length).toBeGreaterThanOrEqual(3);
      expect(l.recap.length).toBeGreaterThanOrEqual(3);
      expect(l.objectives.length).toBeGreaterThan(0);
      expect(l.refs.length).toBeGreaterThan(0);
      expect(l.blocks.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('prerequisites point at existing lessons', () => {
    const ids = new Set(ALL_LESSONS.map((l) => l.id));
    for (const l of ALL_LESSONS) for (const p of l.prerequisites) expect(ids.has(p)).toBe(true);
  });
});

describe('glossary', () => {
  it('has at least 100 unique terms with related links that resolve', () => {
    expect(TERMS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(TERMS.map((t) => t.id)).size).toBe(TERMS.length);
    const en = new Set(TERMS.map((t) => t.en));
    for (const t of TERMS) for (const r of t.related) expect(en.has(r), `${t.en} → ${r}`).toBe(true);
  });
});
