import type { SiteContent } from "@/lib/content/schema";

export type BusinessStatus = "preview" | "live" | "paused";
export type TemplateId = "bold" | "classic" | "split";
export type LeadTag = "called" | "texted" | "paid";

export const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "bold", label: "Bold" },
  { id: "classic", label: "Classic" },
  { id: "split", label: "Split" },
];
export const LEAD_TAGS: LeadTag[] = ["called", "texted", "paid"];

/** Photo slots a template can show. Stock is used for any slot not set. */
export const PHOTO_SLOTS = ["hero", "about", "work-1", "work-2", "work-3", "work-4"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export type Business = {
  id: string;
  slug: string;
  name: string;
  city: string;
  trade: string;
  phone: string | null;
  address: string | null;
  hours: string[];
  category: string | null;
  place_id: string | null;
  website_url: string | null;
  places_verified: boolean;
  places_fetched_at: string | null;
  owner_confirmed: boolean;
  owner_confirmed_at: string | null;
  template: TemplateId;
  content: SiteContent | null;
  photos: Partial<Record<PhotoSlot, string>>;
  status: BusinessStatus;
  custom_domain: string | null;
  generation_status: "pending" | "ready" | "failed";
  last_error: string | null;
  notes: string;
  lead_tags: LeadTag[];
  batch_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
