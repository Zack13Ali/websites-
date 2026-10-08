import "server-only";
import { env } from "@/lib/env";
import { pickPlace, toDetails, type GooglePlace, type PlaceDetails, type PlaceMatch } from "./match";
import { fixtureSearch } from "./fixtures";

// Google Places API (New). Never add photos or reviews to this mask.
const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "regularOpeningHours.weekdayDescriptions",
  "primaryTypeDisplayName",
  "websiteUri",
];
const SEARCH_MASK = FIELDS.map((f) => `places.${f}`).join(",");
const DETAILS_MASK = FIELDS.join(",");

export function placesUsesFixtures(): boolean {
  return !env.googlePlacesApiKey;
}

async function searchText(
  query: string,
  lead: { name: string; city: string; phone?: string | null },
): Promise<GooglePlace[]> {
  if (placesUsesFixtures()) return fixtureSearch(lead);
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlacesApiKey,
      "X-Goog-FieldMask": SEARCH_MASK,
    },
    body: JSON.stringify({ textQuery: query, regionCode: "US", languageCode: "en", pageSize: 5 }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google Places search failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { places?: GooglePlace[] };
  return json.places ?? [];
}

async function getPlace(placeId: string): Promise<GooglePlace | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": env.googlePlacesApiKey, "X-Goog-FieldMask": DETAILS_MASK },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Google Places details failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.json()) as GooglePlace;
}

/** Find a lead on Google: phone match first, then top result in the city. */
export async function findBusiness(lead: {
  name: string;
  city: string;
  phone?: string | null;
}): Promise<PlaceMatch | null> {
  const results = await searchText(`${lead.name} ${lead.city}`, lead);
  return pickPlace(results, lead);
}

/**
 * Admin "Refresh from Google": re-fetch by place_id when we have one,
 * otherwise search again (an "unverified" business may be on Google now).
 */
export async function refreshPlace(b: {
  placeId: string | null;
  name: string;
  city: string;
  phone?: string | null;
}): Promise<PlaceDetails | null> {
  if (b.placeId && !placesUsesFixtures()) {
    const p = await getPlace(b.placeId);
    if (p) return toDetails(p);
  }
  return (await findBusiness(b))?.place ?? null;
}
