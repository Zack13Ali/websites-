import "server-only";
import { cache } from "react";
import { SiteContentSchema, type SiteContent } from "@/lib/content/schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PHOTO_SLOTS, type BusinessStatus, type PhotoSlot, type TemplateId } from "@/lib/types";
import { photoUrl } from "./photos";

// The only path public pages use to read a business. Selects just what a
// site needs to render; notes, tags, Google ids, errors etc. never leave
// the server.
const PUBLIC_COLUMNS =
  "id, slug, name, city, trade, phone, address, hours, category, template, content, photos, status, published_at, updated_at";

export type PublicSite = {
  id: string;
  slug: string;
  name: string;
  city: string;
  phone: string | null;
  address: string | null;
  hours: string[];
  category: string | null;
  template: TemplateId;
  content: SiteContent;
  photos: Record<PhotoSlot, string>; // resolved URLs
  status: BusinessStatus;
  publishedAt: string | null;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  city: string;
  trade: string;
  phone: string | null;
  address: string | null;
  hours: unknown;
  category: string | null;
  template: TemplateId;
  content: unknown;
  photos: Partial<Record<PhotoSlot, string>> | null;
  status: BusinessStatus;
  published_at: string | null;
  updated_at: string;
};

function toPublic(row: Row | null): PublicSite | null {
  if (!row) return null;
  // Content is validated on every write, but a site never renders unchecked data.
  const content = SiteContentSchema.safeParse(row.content);
  if (!content.success) return null;
  const photos = Object.fromEntries(
    PHOTO_SLOTS.map((slot) => [slot, photoUrl(slot, row.photos ?? {}, row.trade)]),
  ) as Record<PhotoSlot, string>;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    phone: row.phone,
    address: row.address,
    hours: Array.isArray(row.hours) ? row.hours.filter((h): h is string => typeof h === "string") : [],
    category: row.category,
    template: row.template,
    content: content.data,
    photos,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export const getSiteBySlug = cache(async (slug: string): Promise<PublicSite | null> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const { data } = await supabaseAdmin().from("businesses").select(PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();
  return toPublic(data as Row | null);
});

export const getSiteByDomain = cache(async (domain: string): Promise<PublicSite | null> => {
  const { data } = await supabaseAdmin()
    .from("businesses")
    .select(PUBLIC_COLUMNS)
    .eq("custom_domain", domain.toLowerCase())
    .maybeSingle();
  return toPublic(data as Row | null);
});
