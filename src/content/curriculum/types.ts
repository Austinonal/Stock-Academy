export type Block = {
  h?: string;
  p?: string[];
  list?: string[];
  formula?: string;
  example?: string[]; // step-by-step numeric example
  note?: string;
  table?: { head: string[]; rows: string[][] };
};

export type Quiz = { id: string; q: string; choices: string[]; answer: number; why: string[] };
export type Flashcard = { id: string; q: string; a: string };
export type Ref = { label: string; url: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  outline?: boolean; // true = structured outline, full lesson still to be written
  prerequisites: string[];
  objectives: string[];
  blocks: Block[];
  widget?: 'compound' | 'realReturn';
  tryIt?: { label: string; to: string }[];
  mistakes: string[];
  quiz: Quiz[];
  flashcards: Flashcard[];
  recap: string[];
  refs: Ref[];
};

export type Level = {
  id: string;
  level: number;
  title: string;
  en: string;
  difficulty: 'เริ่มต้น' | 'พื้นฐาน' | 'กลาง' | 'สูง';
  prerequisites: string[];
  objectives: string[];
  tags: string[];
  lessons: Lesson[];
};
