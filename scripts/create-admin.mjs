// Creates (or resets the password of) the single admin user.
//   node --env-file=.env.local scripts/create-admin.mjs 'a-strong-password'
import { createClient } from "@supabase/supabase-js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.argv[2];
if (!email || !password || password.length < 10) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs '<password, 10+ chars>'");
  console.error("ADMIN_EMAIL must be set.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
const existing = list.users.find((u) => u.email?.toLowerCase() === email);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
  if (error) throw error;
  console.log(`Updated password for ${email}`);
} else {
  const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  console.log(`Created admin user ${email}`);
}
