import "server-only";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/server";

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === env.adminEmail;
}

/** Returns the admin user, or null. getUser() verifies the JWT with Supabase. */
export async function getAdmin() {
  const supabase = await supabaseAuth();
  const { data } = await supabase.auth.getUser();
  return data.user && isAdminEmail(data.user.email) ? data.user : null;
}

/** For admin pages: redirect to login. */
export async function requireAdminPage() {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

/** For server actions and API routes: throw. */
export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) throw new Error("Not authorized");
  return user;
}
