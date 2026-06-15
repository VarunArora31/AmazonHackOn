/**
 * Supabase Browser Client
 * Used client-side for auth operations.
 * Session persists in localStorage — survives tab close/reopen.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseBrowser() {
  if (supabaseInstance) return supabaseInstance;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  
  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: "campusflow-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseInstance;
}

// For backward compat — lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseBrowser() as any)[prop];
  },
});
