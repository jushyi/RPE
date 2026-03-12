import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import type { Database } from './types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars — auth will not work until .env is configured');
}

// Use MMKV instead of expo-sqlite localStorage polyfill for auth storage.
// expo-sqlite's localStorage shim has a fragile SQLite file handle that
// crashes on removeItemSync during sign-out.
const mmkv = createMMKV();

const mmkvAuthStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => { mmkv.remove(key); },
};

export const supabase: SupabaseClient<Database> = supabaseUrl
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: mmkvAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as SupabaseClient<Database>);

// Stop auto-refresh when backgrounded to prevent offline logout
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
