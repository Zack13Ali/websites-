import type { GooglePlace } from "./match";
import sample from "./fixtures/search-text.json";
import { normalizeUsPhone } from "@/lib/phone";

// Stand-in for the Places API when GOOGLE_PLACES_API_KEY is not set.
// Deterministic, so the whole pipeline can be exercised offline:
//   - a name containing "notfound"  -> no results (business gets "unverified")
//   - a name containing "website"   -> result has websiteUri ("has website")
//   - otherwise                     -> one result in the searched city

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function fixtureSearch(lead: { name: string; city: string; phone?: string | null }): GooglePlace[] {
  const q = `${lead.name} ${lead.city}`.toLowerCase();
  if (q.includes("notfound")) return [];

  const template = sample.places[0] as GooglePlace;
  const city = lead.city.split(",")[0].trim() || "Springfield";
  const name = lead.name.trim();
  const h = hash(q);
  const digits = normalizeUsPhone(lead.phone) ?? `${200 + (h % 700)}555${String(1000 + (h % 9000))}`;
  const phone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

  return [
    {
      ...template,
      id: `fixture_${h.toString(36)}`,
      displayName: { text: name },
      formattedAddress: `${100 + (h % 900)} Main St, ${city}, TX 75000, USA`,
      nationalPhoneNumber: phone,
      internationalPhoneNumber: `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
      websiteUri: q.includes("website") ? "https://example.com/" : undefined,
    },
  ];
}
