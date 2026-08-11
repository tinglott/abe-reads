import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from './config';
import { queuePending, takePending, type Progress, type QuizResult } from './storage';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/**
 * Anonymous sign-in keeps the app usable by a child with no email,
 * while still giving every learner a stable id for row-level security.
 */
export async function ensureSession(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    if (data.session?.user) return data.session.user.id;
    const { data: signed, error } = await sb.auth.signInAnonymously();
    if (error) return null;
    return signed.user?.id ?? null;
  } catch {
    return null;
  }
}

export type SyncOutcome = { synced: number; queued: number; ok: boolean };

/** Push one result; queue it locally when offline or unconfigured. */
export async function pushResult(r: QuizResult, packId: string): Promise<SyncOutcome> {
  const sb = supabase();
  if (!sb) {
    await queuePending(r);
    return { synced: 0, queued: 1, ok: false };
  }
  const uid = await ensureSession();
  if (!uid) {
    await queuePending(r);
    return { synced: 0, queued: 1, ok: false };
  }
  try {
    const { error } = await sb.from('quiz_results').insert({
      user_id: uid,
      pack_id: packId,
      quiz_key: r.quizKey,
      score: r.score,
      total: r.total,
      missed: r.missed,
      completed_at: r.at,
    });
    if (error) throw error;
    return { synced: 1, queued: 0, ok: true };
  } catch {
    await queuePending(r);
    return { synced: 0, queued: 1, ok: false };
  }
}

/** Drain the offline queue; safe to call on every app start. */
export async function flushPending(packId: string): Promise<SyncOutcome> {
  const sb = supabase();
  if (!sb) return { synced: 0, queued: 0, ok: false };
  const uid = await ensureSession();
  if (!uid) return { synced: 0, queued: 0, ok: false };

  const pending = await takePending();
  if (pending.length === 0) return { synced: 0, queued: 0, ok: true };

  try {
    const { error } = await sb.from('quiz_results').insert(
      pending.map((r) => ({
        user_id: uid,
        pack_id: packId,
        quiz_key: r.quizKey,
        score: r.score,
        total: r.total,
        missed: r.missed,
        completed_at: r.at,
      })),
    );
    if (error) throw error;
    return { synced: pending.length, queued: 0, ok: true };
  } catch {
    for (const r of pending) await queuePending(r);
    return { synced: 0, queued: pending.length, ok: false };
  }
}

/** Mirror the reading position so a learner can switch devices. */
export async function pushProgress(p: Progress, packId: string): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;
  const uid = await ensureSession();
  if (!uid) return false;
  try {
    const { error } = await sb.from('progress').upsert(
      {
        user_id: uid,
        pack_id: packId,
        page: p.page,
        stars: p.stars,
        pages_read: p.pagesRead,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,pack_id' },
    );
    return !error;
  } catch {
    return false;
  }
}
