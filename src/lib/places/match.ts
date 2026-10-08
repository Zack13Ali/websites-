import { normalizeUsPhone } from "@/lib/phone";

// Subset of a Places API (New) Place we request. Photos and reviews are
// deliberately never requested (see FIELD_MASK in client.ts).
export type GooglePlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  primaryTypeDisplayName?: { text: string };
  websiteUri?: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string | null;
  phone: string | null;
  hours: string[];
  category: string | null;
  websiteUrl: string | null;
};

export type PlaceMatch = { place: PlaceDetails; matchedBy: "phone" | "city" };

export function toDetails(p: GooglePlace): PlaceDetails {
  return {
    placeId: p.id,
    name: p.displayName?.text?.trim() || "",
    address: p.formattedAddress ?? null,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    hours: p.regularOpeningHours?.weekdayDescriptions ?? [],
    category: p.primaryTypeDisplayName?.text ?? null,
    websiteUrl: p.websiteUri ?? null,
  };
}

function cityToken(city: string): string {
  // "Irving, TX" -> "irving"
  return city.split(",")[0].trim().toLowerCase();
}

/**
 * Match rule: a result whose phone equals the lead's phone wins. Otherwise
 * the first (top-ranked) result whose address is in the lead's city.
 * Otherwise no match.
 */
export function pickPlace(
  results: GooglePlace[],
  lead: { phone?: string | null; city: string },
): PlaceMatch | null {
  const leadPhone = normalizeUsPhone(lead.phone);
  if (leadPhone) {
    const byPhone = results.find(
      (r) =>
        normalizeUsPhone(r.nationalPhoneNumber) === leadPhone ||
        normalizeUsPhone(r.internationalPhoneNumber) === leadPhone,
    );
    if (byPhone) return { place: toDetails(byPhone), matchedBy: "phone" };
  }
  const city = cityToken(lead.city);
  if (city) {
    const inCity = results.find((r) => r.formattedAddress?.toLowerCase().includes(city));
    if (inCity) return { place: toDetails(inCity), matchedBy: "city" };
  }
  return null;
}
