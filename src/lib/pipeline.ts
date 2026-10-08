import "server-only";
import { generateCopy } from "@/lib/ai/generate-copy";
import { formatUsPhone } from "@/lib/phone";
import { findBusiness, refreshPlace } from "@/lib/places/client";
import type { PlaceDetails } from "@/lib/places/match";
import { nextFreeSlug, slugify } from "@/lib/slug";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TEMPLATES, type Business, type TemplateId } from "@/lib/types";
import type { LeadInput } from "@/lib/csv";

function placeColumns(place: PlaceDetails | null) {
  return place
    ? {
        place_id: place.placeId,
        address: place.address,
        hours: place.hours,
        category: place.category,
        website_url: place.websiteUrl,
        places_verified: true,
        places_fetched_at: new Date().toISOString(),
      }
    : {
        place_id: null,
        address: null,
        hours: [],
        category: null,
        website_url: null,
        places_verified: false,
        places_fetched_at: new Date().toISOString(),
      };
}

/** Spread templates across leads so a call list doesn't all look the same. */
function pickTemplate(seed: string): TemplateId {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TEMPLATES[h % TEMPLATES.length].id;
}

class DuplicatePlaceError extends Error {}

async function insertWithUniqueSlug(row: Record<string, unknown>, base: string): Promise<string> {
  const db = supabaseAdmin();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: taken, error: takenError } = await db
      .from("businesses")
      .select("slug")
      .like("slug", `${base}%`);
    if (takenError) throw new Error(takenError.message);
    const slug = nextFreeSlug(
      base,
      (taken ?? []).map((r) => r.slug as string),
    );
    const { data, error } = await db
      .from("businesses")
      .insert({ ...row, slug })
      .select("id")
      .single();
    if (!error) return data.id as string;
    if (error.code !== "23505") throw new Error(error.message);
    if (error.message.includes("businesses_place_id_key")) throw new DuplicatePlaceError();
    // Otherwise a slug race with another worker: pick again.
  }
  throw new Error("Could not find a free slug");
}

export type GenerateResult = { businessId: string; reused: boolean };

/**
 * One lead -> one preview site. Never skips a business: no Google match
 * means "unverified" and the CSV details are used; an existing website is
 * recorded (shown as "has website" in admin) but the preview is still built.
 */
export async function generateBusiness(
  lead: LeadInput,
  opts: { batchId?: string | null } = {},
): Promise<GenerateResult> {
  const db = supabaseAdmin();
  const match = await findBusiness(lead);
  const place = match?.place ?? null;

  // The same Google listing imported twice points at the existing site
  // instead of creating a duplicate.
  const findExisting = async () => {
    if (!place) return null;
    const { data } = await db.from("businesses").select("id").eq("place_id", place.placeId).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  };
  const existing = await findExisting();
  if (existing) return { businessId: existing, reused: true };

  const name = place?.name || lead.name;
  const phone = formatUsPhone(place?.phone || lead.phone) || null;
  const content = await generateCopy({
    name,
    city: lead.city,
    address: place?.address ?? null,
    phone,
    hours: place?.hours ?? [],
    category: place?.category ?? null,
  });

  let businessId: string;
  try {
    businessId = await insertWithUniqueSlug(
      {
        name,
        city: lead.city,
        phone,
        ...placeColumns(place),
        template: pickTemplate(name + lead.city),
        content,
        generation_status: "ready",
        batch_id: opts.batchId ?? null,
      },
      slugify(name, lead.city),
    );
  } catch (err) {
    // Another worker created this Google listing's site at the same time.
    const raced = err instanceof DuplicatePlaceError ? await findExisting() : null;
    if (raced) return { businessId: raced, reused: true };
    throw err;
  }
  return { businessId, reused: false };
}

/** Admin "Regenerate copy". */
export async function regenerateCopy(business: Business): Promise<void> {
  const content = await generateCopy({
    name: business.name,
    city: business.city,
    address: business.address,
    phone: business.phone,
    hours: business.hours,
    category: business.category,
  });
  const { error } = await supabaseAdmin()
    .from("businesses")
    .update({ content, generation_status: "ready", last_error: null })
    .eq("id", business.id);
  if (error) throw new Error(error.message);
}

/**
 * Admin "Refresh from Google". Updates the Google-sourced details only;
 * name, phone and copy stay as the admin left them. Returns false if Google
 * has no match.
 */
export async function refreshFromGoogle(business: Business): Promise<boolean> {
  const place = await refreshPlace({
    placeId: business.place_id,
    name: business.name,
    city: business.city,
    phone: business.phone,
  });
  const update = place ? placeColumns(place) : { places_fetched_at: new Date().toISOString() };
  const { error } = await supabaseAdmin().from("businesses").update(update).eq("id", business.id);
  if (error) throw new Error(error.message);
  return !!place;
}
