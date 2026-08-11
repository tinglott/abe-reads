import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { pack } from '@/lib/content';
import {
  EMPTY_PROGRESS,
  loadProgress,
  resetProgress,
  saveProgress,
  type Progress,
  type QuizResult,
} from '@/lib/storage';
import { flushPending, pushProgress, pushResult } from '@/lib/supabase';
import { hasSupabase } from '@/lib/config';

type Ctx = {
  progress: Progress;
  ready: boolean;
  cloudEnabled: boolean;
  markPageRead: (page: number) => void;
  recordResult: (r: QuizResult) => Promise<void>;
  reset: () => Promise<void>;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  /**
   * Screens mount and report activity immediately, which can happen before the
   * stored progress has finished loading. Writing then would clobber saved
   * results, so early updates are buffered here and replayed after the load.
   */
  const readyRef = useRef(false);
  const bufferedPages = useRef<number[]>([]);
  const bufferedResults = useRef<QuizResult[]>([]);

  const persist = useCallback((next: Progress) => {
    void saveProgress(next);
    if (hasSupabase) void pushProgress(next, pack.id);
  }, []);

  const applyPage = useCallback((prev: Progress, page: number): Progress => {
    const key = String(page);
    const pagesRead = prev.pagesRead.includes(key) ? prev.pagesRead : [...prev.pagesRead, key];
    return { ...prev, page: Math.max(prev.page, page), pagesRead };
  }, []);

  const applyResult = useCallback((prev: Progress, r: QuizResult): Progress => {
    const earned = r.total > 0 && r.score / r.total >= 0.8;
    const stars = earned && !prev.stars.includes(r.quizKey) ? [...prev.stars, r.quizKey] : prev.stars;
    return { ...prev, stars, results: [...prev.results, r].slice(-100) };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await loadProgress();
      if (!alive) return;

      // Replay anything captured while loading, on top of the stored state.
      let merged = stored;
      for (const p of bufferedPages.current) merged = applyPage(merged, p);
      for (const r of bufferedResults.current) merged = applyResult(merged, r);
      const hadBuffered =
        bufferedPages.current.length > 0 || bufferedResults.current.length > 0;
      bufferedPages.current = [];
      bufferedResults.current = [];

      readyRef.current = true;
      setProgress(merged);
      setReady(true);
      if (hadBuffered) persist(merged);
      if (hasSupabase) void flushPending(pack.id);
    })();
    return () => {
      alive = false;
    };
  }, [applyPage, applyResult, persist]);

  const markPageRead = useCallback(
    (page: number) => {
      if (!readyRef.current) {
        bufferedPages.current.push(page);
        return;
      }
      setProgress((prev) => {
        const next = applyPage(prev, page);
        persist(next);
        return next;
      });
    },
    [applyPage, persist],
  );

  const recordResult = useCallback(
    async (r: QuizResult) => {
      if (!readyRef.current) {
        bufferedResults.current.push(r);
      } else {
        setProgress((prev) => {
          const next = applyResult(prev, r);
          persist(next);
          return next;
        });
      }
      // Always attempt the cloud write; it queues locally when offline.
      await pushResult(r, pack.id);
    },
    [applyResult, persist],
  );

  const reset = useCallback(async () => {
    await resetProgress();
    bufferedPages.current = [];
    bufferedResults.current = [];
    setProgress(EMPTY_PROGRESS);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      progress,
      ready,
      cloudEnabled: hasSupabase,
      markPageRead,
      recordResult,
      reset,
    }),
    [progress, ready, markPageRead, recordResult, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
