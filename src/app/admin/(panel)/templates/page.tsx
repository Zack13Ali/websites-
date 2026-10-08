import Link from "next/link";
import { SiteTemplate } from "@/components/templates";
import { fixtureCopy } from "@/lib/ai/fixture-copy";
import { photoUrl } from "@/lib/sites/photos";
import type { PublicSite } from "@/lib/sites/public";
import { PHOTO_SLOTS, TEMPLATES, type PhotoSlot, type TemplateId } from "@/lib/types";

// Template gallery with sample content, for checking designs.
const SAMPLE: PublicSite = {
  id: "sample",
  slug: "sample",
  name: "Sample Remodeling Co.",
  city: "Irving",
  phone: "(214) 555-0101",
  address: "100 Main St, Irving, TX 75060",
  hours: ["Monday–Friday: 7:00 AM – 5:00 PM", "Saturday: 8:00 AM – 12:00 PM", "Sunday: Closed"],
  category: "General Contractor",
  template: "bold",
  content: fixtureCopy({
    name: "Sample Remodeling Co.",
    city: "Irving",
    address: null,
    phone: null,
    hours: [],
    category: null,
  }),
  photos: Object.fromEntries(PHOTO_SLOTS.map((s) => [s, photoUrl(s, {})])) as Record<PhotoSlot, string>,
  status: "preview",
  publishedAt: null,
  updatedAt: new Date().toISOString(),
};

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const current = (TEMPLATES.find((x) => x.id === t)?.id ?? "bold") as TemplateId;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-2xl font-semibold">Templates</h1>
        {TEMPLATES.map((x) => (
          <Link key={x.id} href={`?t=${x.id}`} className={x.id === current ? "btn-primary" : "btn"}>
            {x.label}
          </Link>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white [transform:translateZ(0)]">
        <SiteTemplate site={SAMPLE} template={current} />
      </div>
    </div>
  );
}
