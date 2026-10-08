"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/ui";
import { getBusiness } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { markPaidManually } from "@/lib/billing/apply";
import { SiteContentSchema, containsHtml, formatIssues } from "@/lib/content/schema";
import { formatUsPhone, normalizeUsPhone } from "@/lib/phone";
import { refreshFromGoogle, regenerateCopy } from "@/lib/pipeline";
import { PHOTO_BUCKET } from "@/lib/sites/photos";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LEAD_TAGS, PHOTO_SLOTS, TEMPLATES, type Business, type PhotoSlot } from "@/lib/types";

async function load(id: string): Promise<Business> {
  await requireAdmin();
  const b = await getBusiness(id);
  if (!b) throw new Error("Business not found");
  return b;
}

async function update(id: string, values: Record<string, unknown>): Promise<NonNullable<ActionResult>> {
  const { error } = await supabaseAdmin().from("businesses").update(values).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/admin/b/${id}`);
  return { ok: true, message: "Saved." };
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (v: string) => v.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// --- Copy -------------------------------------------------------------------

export async function saveContent(id: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await load(id);
  const services = [0, 1, 2, 3, 4, 5]
    .map((i) => ({ name: str(fd, `service_name_${i}`), description: str(fd, `service_desc_${i}`) }))
    .filter((s) => s.name || s.description);
  const faq = [0, 1, 2, 3, 4]
    .map((i) => ({ question: str(fd, `faq_q_${i}`), answer: str(fd, `faq_a_${i}`) }))
    .filter((f) => f.question || f.answer);
  const parsed = SiteContentSchema.safeParse({
    headline: str(fd, "headline"),
    subheadline: str(fd, "subheadline"),
    services,
    about: str(fd, "about"),
    serviceAreas: lines(str(fd, "service_areas")),
    faq,
    callToAction: { heading: str(fd, "cta_heading"), body: str(fd, "cta_body"), buttonLabel: str(fd, "cta_button") },
  });
  if (!parsed.success) return { ok: false, message: "Not saved. Fix these:", errors: formatIssues(parsed.error) };
  return update(id, { content: parsed.data, generation_status: "ready", last_error: null });
}

export async function regenerate(id: string): Promise<ActionResult> {
  const b = await load(id);
  try {
    await regenerateCopy(b);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await supabaseAdmin().from("businesses").update({ last_error: message }).eq("id", id);
    return { ok: false, message };
  }
  revalidatePath(`/admin/b/${id}`);
  return { ok: true, message: "New copy generated." };
}

// --- Business details ------------------------------------------------------

const DetailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || normalizeUsPhone(v), "Phone must be a valid US number"),
  address: z.string().trim().max(300),
  category: z.string().trim().max(100),
  hours: z.array(z.string().max(100)).max(14),
});

export async function saveDetails(id: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await load(id);
  const parsed = DetailsSchema.safeParse({
    name: str(fd, "name"),
    city: str(fd, "city"),
    phone: str(fd, "phone"),
    address: str(fd, "address"),
    category: str(fd, "category"),
    hours: lines(str(fd, "hours")),
  });
  if (!parsed.success) return { ok: false, message: "Not saved.", errors: parsed.error.issues.map((i) => i.message) };
  const d = parsed.data;
  const bad = [d.name, d.city, d.address, d.category, ...d.hours].find(containsHtml);
  if (bad) return { ok: false, message: "Not saved: fields must be plain text (no HTML tags)." };
  return update(id, {
    name: d.name,
    city: d.city,
    phone: d.phone ? formatUsPhone(d.phone) : null,
    address: d.address || null,
    category: d.category || null,
    hours: d.hours,
  });
}

export async function refreshGoogle(id: string): Promise<ActionResult> {
  const b = await load(id);
  try {
    const found = await refreshFromGoogle(b);
    revalidatePath(`/admin/b/${id}`);
    return found
      ? { ok: true, message: "Updated address, hours, category and website from Google." }
      : { ok: false, message: "Google has no match for this business. Nothing changed." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Google lookup failed" };
  }
}

// --- Template, status ------------------------------------------------------

export async function setTemplate(id: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await load(id);
  const template = str(fd, "template");
  if (!TEMPLATES.some((t) => t.id === template)) return { ok: false, message: "Unknown template" };
  return update(id, { template });
}

export async function publish(id: string): Promise<ActionResult> {
  const b = await load(id);
  if (!b.content) return { ok: false, message: "This business has no copy yet." };
  return update(id, { status: "live", published_at: b.published_at ?? new Date().toISOString() });
}

export async function pause(id: string): Promise<ActionResult> {
  await load(id);
  return update(id, { status: "paused" });
}

export async function markPaid(id: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await load(id);
  const plan = str(fd, "plan") === "yearly" ? "yearly" : "monthly";
  try {
    await markPaidManually(id, plan);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Could not mark as paid" };
  }
  revalidatePath(`/admin/b/${id}`);
  return { ok: true, message: `Marked as paid (${plan}). The site is live.` };
}

export async function deleteBusiness(id: string): Promise<ActionResult> {
  const b = await load(id);
  if (b.status === "live") return { ok: false, message: "Pause the site before deleting it." };
  const paths = Object.values(b.photos).filter(Boolean) as string[];
  if (paths.length) await supabaseAdmin().storage.from(PHOTO_BUCKET).remove(paths);
  const { error } = await supabaseAdmin().from("businesses").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  redirect("/admin");
}

// --- Lead tracking ----------------------------------------------------------

export async function saveLead(id: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await load(id);
  const tags = LEAD_TAGS.filter((t) => fd.get(`tag_${t}`) === "on");
  const notes = str(fd, "notes").slice(0, 10_000);
  return update(id, { lead_tags: tags, notes });
}

// --- Photos -----------------------------------------------------------------

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadPhoto(id: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const b = await load(id);
  const slot = str(fd, "slot") as PhotoSlot;
  const file = fd.get("photo");
  if (!PHOTO_SLOTS.includes(slot)) return { ok: false, message: "Unknown photo slot" };
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a photo." };
  const ext = TYPES[file.type];
  if (!ext) return { ok: false, message: "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, message: "The photo is larger than 4 MB." };

  const path = `${b.id}/${slot}-${Date.now()}.${ext}`;
  const storage = supabaseAdmin().storage.from(PHOTO_BUCKET);
  const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return { ok: false, message: error.message };

  const old = b.photos[slot];
  const result = await update(id, { photos: { ...b.photos, [slot]: path } });
  if (old) await storage.remove([old]);
  return result.ok ? { ok: true, message: "Photo saved." } : result;
}

export async function resetPhoto(id: string, slot: PhotoSlot): Promise<ActionResult> {
  const b = await load(id);
  const old = b.photos[slot];
  if (!old) return { ok: true };
  const photos = { ...b.photos };
  delete photos[slot];
  const result = await update(id, { photos });
  await supabaseAdmin().storage.from(PHOTO_BUCKET).remove([old]);
  return result;
}
