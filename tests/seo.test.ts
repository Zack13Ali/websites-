import { describe, expect, it } from "vitest";
import { openingHours, postalAddress, safeJsonForScript } from "@/lib/sites/seo";

describe("LocalBusiness helpers", () => {
  it("parses a US formatted address", () => {
    expect(postalAddress("123 Main St, Suite 4, Irving, TX 75060, USA")).toEqual({
      "@type": "PostalAddress",
      streetAddress: "123 Main St, Suite 4",
      addressLocality: "Irving",
      addressRegion: "TX",
      postalCode: "75060",
      addressCountry: "US",
    });
    expect(postalAddress("Somewhere odd")).toMatchObject({ streetAddress: "Somewhere odd" });
    expect(postalAddress(null)).toBeUndefined();
  });

  it("parses Google hours, including split shifts, closed days and narrow spaces", () => {
    expect(
      openingHours([
        "Monday: 7:00 AM – 5:00 PM",
        "Saturday: 8:00 AM – 12:00 PM, 1:00 PM – 3:30 PM",
        "Sunday: Closed",
        "Tuesday: Open 24 hours",
      ]),
    ).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "07:00", closes: "17:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "12:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "13:00", closes: "15:30" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "00:00", closes: "23:59" },
    ]);
    expect(openingHours([])).toBeUndefined();
  });

  it("produces JSON that cannot close a script tag", () => {
    const out = safeJsonForScript({ name: "</script><script>alert(1)</script> & co" });
    expect(out).not.toMatch(/[<>&]/);
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script> & co");
  });
});
