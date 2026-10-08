import type { PhotoSlot } from "@/lib/types";

export const PHOTO_BUCKET = "business-photos";

const STOCK: Record<string, Record<PhotoSlot, string>> = {
  general_contractor: {
    hero: "/stock/general-contractor/hero.jpg",
    about: "/stock/general-contractor/about.jpg",
    "work-1": "/stock/general-contractor/work-1.jpg",
    "work-2": "/stock/general-contractor/work-2.jpg",
    "work-3": "/stock/general-contractor/work-3.jpg",
    "work-4": "/stock/general-contractor/work-4.jpg",
  },
};

/** Owner photo from Supabase Storage if uploaded, otherwise the trade's stock photo. */
export function photoUrl(
  slot: PhotoSlot,
  photos: Partial<Record<PhotoSlot, string>>,
  trade = "general_contractor",
): string {
  const path = photos[slot];
  if (path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
    return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
  }
  return (STOCK[trade] ?? STOCK.general_contractor)[slot];
}
