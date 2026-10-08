import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Stage 1 placeholder: proves the admin session + secret-key DB access work.
export default async function AdminHome() {
  const { count, error } = await supabaseAdmin()
    .from("businesses")
    .select("id", { count: "exact", head: true });
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Businesses</h1>
      {error ? (
        <p className="text-red-700">Database error: {error.message}</p>
      ) : (
        <p className="text-stone-600">{count ?? 0} businesses in the database.</p>
      )}
    </div>
  );
}
