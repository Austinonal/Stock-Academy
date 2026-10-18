import { LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3 } from './levels0to3';
import { LEVELS_4_TO_16 } from './levels4to16';
import type { Lesson, Level } from './types';

export const CURRICULUM: Level[] = [LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3, ...LEVELS_4_TO_16];
export const ALL_LESSONS: (Lesson & { levelId: string; level: number })[] = CURRICULUM.flatMap((l) => l.lessons.map((x) => ({ ...x, levelId: l.id, level: l.level })));
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);
export type { Lesson, Level, Quiz, Flashcard } from './types';
