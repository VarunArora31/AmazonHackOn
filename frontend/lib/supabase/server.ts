/**
 * Supabase Server Client (Service Role)
 *
 * Uses the service role key to bypass RLS.
 * Only use server-side (API routes, webhooks). Never expose to the client.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the service role key.
 * Lazily initialized to avoid build-time crashes when env vars are missing.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add them to .env.local for local dev."
    );
  }

  client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

// ─── Type helpers for whatsapp_tasks table ──────────────────────

export interface WhatsAppTask {
  id: string;
  phone_number: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  scheduled_time: string | null;
  created_at: string;
}

export type WhatsAppTaskInsert = Omit<WhatsAppTask, "id" | "created_at">;
