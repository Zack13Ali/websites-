import { describe, expect, it } from "vitest";
import { SiteContentSchema, containsHtml, formatIssues } from "@/lib/content/schema";
import { fixtureCopy } from "@/lib/ai/fixture-copy";

function valid() {
  return structuredClone(
    fixtureCopy({
      name: "JJ General Contractor",
      city: "Irving",
      address: null,
      phone: null,
      hours: [],
      category: null,
    }),
  );
}

describe("SiteContentSchema", () => {
  it("accepts the fixture copy", () => {
    expect(SiteContentSchema.safeParse(valid()).success).toBe(true);
  });

  it("trims whitespace", () => {
    const c = valid();
    c.headline = `   ${c.headline}   `;
    const r = SiteContentSchema.parse(c);
    expect(r.headline).toBe(c.headline.trim());
  });

  it.each([
    ["headline", "<b>Best</b> remodeling in town"],
    ["headline", "Remodeling <script>alert(1)</script>"],
    ["subheadline", "We build kitchens and baths.<br>Call today for a free estimate!"],
    ["about", "<p>" + "We build things. ".repeat(12) + "</p>"],
    ["about", "Hello <!-- comment --> " + "x".repeat(160)],
    ["headline", "Kitchens & baths <img src=x onerror=alert(1)>"],
  ])("rejects HTML tags in %s: %s", (field, value) => {
    const c = valid() as Record<string, unknown>;
    c[field] = value;
    const r = SiteContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues(r.error).join(" ")).toMatch(/plain text/);
  });

  it("rejects HTML in nested fields", () => {
    const c = valid();
    c.services[1].description = "Tile work <em>done right</em> every single time we show up.";
    c.faq[0].answer = "Yes, <a href='x'>click here</a> to book a visit with us soon.";
    const r = SiteContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    if (!r.success) {
      const issues = formatIssues(r.error);
      expect(issues).toContain("services[1].description: must be plain text (no HTML tags)");
      expect(issues).toContain("faq[0].answer: must be plain text (no HTML tags)");
    }
  });

  it("allows a bare < or > in prose", () => {
    expect(containsHtml("Most bathrooms take < 3 weeks")).toBe(false);
    expect(containsHtml("Budgets > $10k welcome")).toBe(false);
    expect(containsHtml("a <b")).toBe(true);
  });

  it("enforces 4-6 services", () => {
    const c = valid();
    c.services = c.services.slice(0, 3);
    expect(SiteContentSchema.safeParse(c).success).toBe(false);
    const d = valid();
    d.services = [...d.services, ...d.services, ...d.services].slice(0, 7);
    expect(SiteContentSchema.safeParse(d).success).toBe(false);
  });

  it("enforces 4-5 FAQs", () => {
    const c = valid();
    c.faq = c.faq.slice(0, 3);
    expect(SiteContentSchema.safeParse(c).success).toBe(false);
    const d = valid();
    d.faq = [...d.faq, ...d.faq].slice(0, 6);
    expect(SiteContentSchema.safeParse(d).success).toBe(false);
  });

  it("enforces length limits", () => {
    const c = valid();
    c.headline = "x".repeat(81);
    const r = SiteContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues(r.error)).toContain("headline: must be at most 80 characters");

    const d = valid();
    d.about = "Too short.";
    expect(SiteContentSchema.safeParse(d).success).toBe(false);
  });

  it("requires every field", () => {
    const c = valid() as Record<string, unknown>;
    delete c.callToAction;
    expect(SiteContentSchema.safeParse(c).success).toBe(false);
    expect(SiteContentSchema.safeParse({}).success).toBe(false);
    expect(SiteContentSchema.safeParse("not an object").success).toBe(false);
  });

  it("requires at least one service area", () => {
    const c = valid();
    c.serviceAreas = [];
    expect(SiteContentSchema.safeParse(c).success).toBe(false);
  });

  it("produces valid fixture copy for many inputs", () => {
    for (const [name, city] of [
      ["A", "Dallas"],
      ["O'Brien & Sons Remodeling", "Fort Worth, TX"],
      ["Élite Builders", "Frisco"],
      ["X".repeat(120), "Y".repeat(60)],
    ]) {
      const c = fixtureCopy({ name, city, address: null, phone: null, hours: [], category: null });
      expect(SiteContentSchema.safeParse(c).success).toBe(true);
    }
  });
});
