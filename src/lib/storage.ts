import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuizResult = {
  quizKey: string;
  score: number;
  total: number;
  /** ISO timestamp */
  at: string;
  /** ids of questions answered wrong, so we can revisit them */
  missed: string[];
};

export type Progress = {
  /** highest story page the learner has reached (1-based) */
  page: number;
  /** stars earned: one per quiz completed with >= 80% */
  stars: string[];
  results: QuizResult[];
  /** cumulative words read aloud, purely for encouragement */
  pagesRead: string[];
};

export const EMPTY_PROGRESS: Progress = { page: 1, stars: [], results: [], pagesRead: [] };

const KEY = 'abe-reads:progress:v1';
const PENDING = 'abe-reads:pending:v1';

export async function loadProgress(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...EMPTY_PROGRESS, ...parsed };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function saveProgress(p: Progress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage full / unavailable: progress is best-effort, never crash a kid's session
  }
}

export async function resetProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
    await AsyncStorage.removeItem(PENDING);
  } catch {
    /* ignore */
  }
}

/** Results that could not reach Supabase yet (offline-first queue). */
export async function queuePending(r: QuizResult): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING);
    const list: QuizResult[] = raw ? JSON.parse(raw) : [];
    list.push(r);
    await AsyncStorage.setItem(PENDING, JSON.stringify(list.slice(-200)));
  } catch {
    /* ignore */
  }
}

export async function takePending(): Promise<QuizResult[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING);
    if (!raw) return [];
    await AsyncStorage.removeItem(PENDING);
    return JSON.parse(raw) as QuizResult[];
  } catch {
    return [];
  }
}
