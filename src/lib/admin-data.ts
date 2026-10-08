import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Business, BusinessStatus } from "@/lib/types";

export const PAGE_SIZE = 50;

export async function listBusinesses(opts: { q?: string; status?: BusinessStatus | ""; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  let query = supabaseAdmin()
    .from("businesses")
    .select(
      "id, slug, name, city, phone, status, template, places_verified, website_url, owner_confirmed, lead_tags, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.q) {
    // Strip PostgREST filter syntax characters from the search term.
    const term = opts.q.replace(/[%,()*\\]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%,phone.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as Pick<Business, keyof Business>[], total: count ?? 0, page };
}

export async function getBusiness(id: string): Promise<Business | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabaseAdmin().from("businesses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Business | null;
}
