import type { PublicSite } from "./public";

// SEO helpers for live sites: title, description, LocalBusiness JSON-LD.

export function siteTitle(site: PublicSite): string {
  const what = site.category && !/^(point of interest|establishment)$/i.test(site.category) ? site.category : "General Contractor";
  return `${site.name} | ${what} in ${site.city.split(",")[0].trim()}`;
}

export function siteDescription(site: PublicSite): string {
  const d = site.content.subheadline;
  return d.length <= 160 ? d : `${d.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}

/** "123 Main St, Irving, TX 75060, USA" -> PostalAddress (best effort). */
export function postalAddress(address: string | null) {
  if (!address) return undefined;
  const parts = address.split(",").map((p) => p.trim());
  if (parts[parts.length - 1]?.match(/^(USA|United States)$/i)) parts.pop();
  const m = parts.length >= 3 ? parts[parts.length - 1].match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/) : null;
  if (!m) return { "@type": "PostalAddress", streetAddress: address, addressCountry: "US" };
  return {
    "@type": "PostalAddress",
    streetAddress: parts.slice(0, -2).join(", "),
    addressLocality: parts[parts.length - 2],
    addressRegion: m[1],
    postalCode: m[2],
    addressCountry: "US",
  };
}

const DAYS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function to24h(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
}

/** Google's "Monday: 7:00 AM – 5:00 PM" lines -> OpeningHoursSpecification (skips anything unparseable). */
export function openingHours(lines: string[]) {
  const specs = [];
  for (const line of lines) {
    const m = line.replace(/ | /g, " ").match(/^(\w+):\s*(.+)$/);
    const day = m && DAYS[m[1].toLowerCase()];
    if (!m || !day) continue;
    if (/open 24 hours/i.test(m[2])) {
      specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: "00:00", closes: "23:59" });
      continue;
    }
    for (const range of m[2].split(",")) {
      const [a, b] = range.split(/\s*[–-]\s*/);
      const opens = a && to24h(a);
      const closes = b && to24h(b);
      if (opens && closes) specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens, closes });
    }
  }
  return specs.length ? specs : undefined;
}

export function localBusinessJsonLd(site: PublicSite, url: string, imageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: site.name,
    url,
    description: site.content.subheadline,
    telephone: site.phone ?? undefined,
    image: imageUrl,
    address: postalAddress(site.address),
    areaServed: site.content.serviceAreas.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: openingHours(site.hours),
    makesOffer: site.content.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.description },
    })),
  };
}

/** JSON for a <script> text node: no "<", ">" or "&" can break out of the element. */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
