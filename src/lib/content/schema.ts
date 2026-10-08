import { z } from "zod";

// The fixed shape of a site's copy. Claude must return exactly this, the
// admin editor saves through it, and templates render it as plain text.

// Any HTML-looking tag (<b>, </p>, <script, <!--, <?xml) is rejected. A bare
// "<" in prose ("< 2 weeks") is allowed.
const TAG_PATTERN = /<\s*\/?\s*[a-z!?][^>]*>?/i;

export function containsHtml(value: string): boolean {
  return TAG_PATTERN.test(value);
}

const text = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { message: `must be at least ${min} characters` })
    .max(max, { message: `must be at most ${max} characters` })
    .refine((v) => !containsHtml(v), { message: "must be plain text (no HTML tags)" });

export const LIMITS = {
  headline: [10, 80],
  subheadline: [20, 200],
  serviceName: [3, 50],
  serviceDescription: [20, 240],
  about: [150, 1200],
  area: [2, 40],
  question: [10, 140],
  answer: [20, 500],
  ctaHeading: [5, 80],
  ctaBody: [10, 220],
  ctaButton: [2, 30],
} as const;

export const ServiceSchema = z.object({
  name: text(...LIMITS.serviceName),
  description: text(...LIMITS.serviceDescription),
});

export const FaqSchema = z.object({
  question: text(...LIMITS.question),
  answer: text(...LIMITS.answer),
});

export const SiteContentSchema = z.object({
  headline: text(...LIMITS.headline),
  subheadline: text(...LIMITS.subheadline),
  services: z.array(ServiceSchema).min(4).max(6),
  about: text(...LIMITS.about),
  serviceAreas: z.array(text(...LIMITS.area)).min(1).max(12),
  faq: z.array(FaqSchema).min(4).max(5),
  callToAction: z.object({
    heading: text(...LIMITS.ctaHeading),
    body: text(...LIMITS.ctaBody),
    buttonLabel: text(...LIMITS.ctaButton),
  }),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

// Same shape without length/count limits. Sent to the API as the structured
// output format (which only supports a subset of JSON Schema); the real
// limits are enforced afterwards with SiteContentSchema.
export const SiteContentWireSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  services: z.array(z.object({ name: z.string(), description: z.string() })),
  about: z.string(),
  serviceAreas: z.array(z.string()),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  callToAction: z.object({
    heading: z.string(),
    body: z.string(),
    buttonLabel: z.string(),
  }),
});

/** Human-readable list of validation problems, e.g. "services[2].name: must be ..." */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path
      .map((p, idx) => (typeof p === "number" ? `[${p}]` : idx === 0 ? String(p) : `.${String(p)}`))
      .join("");
    return `${path || "(root)"}: ${i.message}`;
  });
}
