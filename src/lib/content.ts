import raw from '@/content/lincoln.json';

export type StoryPage = {
  id: number;
  image: string;
  paragraphs: string[];
};

export type McQuestion = {
  id: string;
  type: 'mc';
  prompt: string;
  choices: string[];
  answerIndex: number;
  answer?: string;
  page?: number;
};

export type TfQuestion = {
  id: string;
  type: 'tf';
  prompt: string;
  answer: boolean;
  page?: number;
};

export type TextQuestion = {
  id: string;
  type: 'cloze' | 'text';
  prompt: string;
  answer: string;
  page?: number;
};

export type Question = McQuestion | TfQuestion | TextQuestion;

export type QuizKey =
  | 'easy'
  | 'cloze'
  | 'spelling'
  | 'fill'
  | 'vocab'
  | 'truefalse'
  | 'unscramble';

export type ContentPack = {
  id: string;
  title: string;
  subtitle: string;
  legacyCode: string;
  source: string;
  readingLevel: string;
  pages: StoryPage[];
  quizzes: Record<QuizKey, Question[]>;
};

export const pack = raw as unknown as ContentPack;

export type QuizMeta = {
  key: QuizKey;
  title: string;
  blurb: string;
  emoji: string;
  /** typed answers are harder; used to sort the menu by difficulty */
  level: 1 | 2 | 3;
};

export const QUIZZES: QuizMeta[] = [
  { key: 'easy', title: 'Quick Quiz', blurb: 'Pick the right answer', emoji: '⭐', level: 1 },
  { key: 'truefalse', title: 'True or False', blurb: 'Is it true?', emoji: '🤔', level: 1 },
  { key: 'vocab', title: 'Word Meanings', blurb: 'Match the meaning', emoji: '📖', level: 2 },
  { key: 'fill', title: 'Fill the Blank', blurb: 'Finish the sentence', emoji: '✏️', level: 2 },
  { key: 'spelling', title: 'Spelling', blurb: 'Find the correct spelling', emoji: '🔤', level: 2 },
  { key: 'cloze', title: 'Type the Word', blurb: 'Type the missing word', emoji: '⌨️', level: 3 },
  { key: 'unscramble', title: 'Word Scramble', blurb: 'Unscramble the letters', emoji: '🧩', level: 3 },
];

export function quizMeta(key: QuizKey): QuizMeta {
  const m = QUIZZES.find((q) => q.key === key);
  if (!m) throw new Error(`Unknown quiz: ${key}`);
  return m;
}

export function getQuiz(key: QuizKey): Question[] {
  return pack.quizzes[key] ?? [];
}

/** Normalise a typed answer for forgiving comparison (case, spaces, punctuation). */
export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function isCorrect(q: Question, given: string | number | boolean): boolean {
  if (q.type === 'mc') return given === q.answerIndex;
  if (q.type === 'tf') return given === q.answer;
  if (typeof given !== 'string') return false;
  return normalise(given) === normalise(q.answer);
}

/** Plain-text of the whole story, used for read-aloud and AI question generation. */
export function storyText(): string {
  return pack.pages.map((p) => p.paragraphs.join(' ')).join('\n\n');
}

export function pageText(page: StoryPage): string {
  return page.paragraphs.join(' ');
}
