import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Session-aware client for auth only (who is logged in). Table access goes
// through supabaseAdmin() after requireAdmin().
export async function supabaseAuth() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: middleware refreshes the session.
        }
      },
    },
  });
}
