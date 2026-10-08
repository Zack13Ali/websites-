import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Secret-key client. Bypasses RLS, so it must only be used on the server
// after the caller has been authorized (admin session, worker secret,
// webhook signature) or for the narrow public-site read.
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
