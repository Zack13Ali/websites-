"use server";

import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { supabaseAuth } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fail = (msg: string) => redirect(`/admin/login?error=${encodeURIComponent(msg)}`);

  // Same message either way so the form doesn't reveal the admin address.
  if (!isAdminEmail(email)) fail("Invalid email or password.");

  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail("Invalid email or password.");
  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
