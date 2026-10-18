import { LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3 } from './levels0to3';
import { OUTLINE_LEVELS } from './outlines';
import type { Lesson, Level } from './types';

export const CURRICULUM: Level[] = [LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3, ...OUTLINE_LEVELS];
export const ALL_LESSONS: (Lesson & { levelId: string; level: number })[] = CURRICULUM.flatMap((l) => l.lessons.map((x) => ({ ...x, levelId: l.id, level: l.level })));
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);
export type { Lesson, Level, Quiz, Flashcard } from './types';
