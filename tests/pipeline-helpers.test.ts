import { describe, expect, it } from "vitest";
import { nextFreeSlug, slugify } from "@/lib/slug";
import { formatUsPhone, normalizeUsPhone, telHref } from "@/lib/phone";
import { pickPlace, type GooglePlace } from "@/lib/places/match";

describe("slugs", () => {
  it("builds business-name-city", () => {
    expect(slugify("JJ General Contractor", "Irving")).toBe("jj-general-contractor-irving");
    expect(slugify("O'Brien & Sons", "Fort Worth, TX")).toBe("obrien-and-sons-fort-worth-tx");
    expect(slugify("Élite Rémodeling", "Frisco")).toBe("elite-remodeling-frisco");
    expect(slugify("!!!", "")).toBe("business");
  });

  it("caps length without a trailing hyphen", () => {
    const s = slugify("a".repeat(69) + " b", "c");
    expect(s.length).toBeLessThanOrEqual(70);
    expect(s.endsWith("-")).toBe(false);
  });

  it("adds -2, -3 on a clash", () => {
    expect(nextFreeSlug("acme-dallas", [])).toBe("acme-dallas");
    expect(nextFreeSlug("acme-dallas", ["acme-dallas"])).toBe("acme-dallas-2");
    expect(nextFreeSlug("acme-dallas", ["acme-dallas", "acme-dallas-2", "acme-dallas-co"])).toBe("acme-dallas-3");
  });
});

describe("phones", () => {
  it("normalizes US numbers", () => {
    expect(normalizeUsPhone("(214) 555-0101")).toBe("2145550101");
    expect(normalizeUsPhone("+1 214.555.0101")).toBe("2145550101");
    expect(normalizeUsPhone("555-0101")).toBeNull();
    expect(formatUsPhone("2145550101")).toBe("(214) 555-0101");
    expect(telHref("214-555-0101")).toBe("tel:+12145550101");
    expect(telHref("")).toBeNull();
  });
});

describe("pickPlace", () => {
  const places: GooglePlace[] = [
    { id: "a", displayName: { text: "Acme Dallas" }, formattedAddress: "1 Elm St, Dallas, TX", nationalPhoneNumber: "(214) 555-0000" },
    { id: "b", displayName: { text: "Acme Irving" }, formattedAddress: "2 Oak St, Irving, TX", nationalPhoneNumber: "(972) 555-0101" },
    { id: "c", displayName: { text: "Acme Irving 2" }, formattedAddress: "3 Pine St, Irving, TX", internationalPhoneNumber: "+1 469-555-0199" },
  ];

  it("prefers a phone match over rank", () => {
    expect(pickPlace(places, { phone: "469.555.0199", city: "Dallas" })).toMatchObject({
      matchedBy: "phone",
      place: { placeId: "c" },
    });
  });

  it("falls back to the top result in the city", () => {
    expect(pickPlace(places, { phone: "(999) 555-1234", city: "Irving, TX" })).toMatchObject({
      matchedBy: "city",
      place: { placeId: "b", name: "Acme Irving" },
    });
  });

  it("returns null when nothing is in the city", () => {
    expect(pickPlace(places, { phone: null, city: "Plano" })).toBeNull();
    expect(pickPlace([], { phone: "2145550000", city: "Dallas" })).toBeNull();
  });
});
