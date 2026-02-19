import { createClient } from '@supabase/supabase-js';

// These environment variables will be populated from .env or Netlify settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe initialization to prevent white screen if env vars are missing
const isSupabaseConfigured = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey;

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signOut: async () => { },
            signInWithPassword: async () => { throw new Error('Supabase not configured') },
            signUp: async () => { throw new Error('Supabase not configured') },
        }
    };

if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}
