import Constants from 'expo-constants';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  hfToken?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * Env vars win over app.json extra, so the same build works in CI,
 * on a device with a .env, or from a plain checkout with neither.
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || '';
export const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN || extra.hfToken || '';

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const hasHuggingFace = Boolean(HF_TOKEN);
