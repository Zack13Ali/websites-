import { LIMITS } from "@/lib/content/schema";

export type CopyInput = {
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  hours: string[];
  category: string | null;
};

// Kept byte-stable so it can be prompt-cached across a batch.
export const SYSTEM_PROMPT = `You write website copy for small US general contractors and remodeling companies.

You receive a business's public details and return the copy for a one-page website as JSON in the given format. The site is shown to the owner as a preview before they buy, so it must read as if written for them specifically.

Rules:
- Plain text only. No HTML, no Markdown, no emoji. Never use the characters < or >.
- American English, warm and direct, short sentences, no hype words ("premier", "world-class", "unparalleled").
- Do not invent facts you were not given: no years in business, license numbers, awards, ratings, review quotes, prices, warranties, team member names, or "licensed and insured" claims. Write around them.
- Services: 4 to 6 typical services for this kind of business (for example kitchen remodeling, bathroom remodeling, additions, flooring, decks, repairs). Each has a short name and a one or two sentence description.
- About: 2 short paragraphs separated by a blank line, about how the business works with homeowners in its area.
- Service areas: the business's city first, then up to 7 real neighboring cities or towns you are confident are nearby. City names only, no states.
- FAQ: 4 or 5 questions homeowners actually ask a contractor (estimates, timelines, permits, what to expect), with honest, general answers.
- Call to action: invite the visitor to call for a free estimate. The button label is short, like "Call for a free estimate".

Length limits (characters): headline ${LIMITS.headline.join("-")}, subheadline ${LIMITS.subheadline.join("-")}, service name ${LIMITS.serviceName.join("-")}, service description ${LIMITS.serviceDescription.join("-")}, about ${LIMITS.about.join("-")}, each service area ${LIMITS.area.join("-")}, FAQ question ${LIMITS.question.join("-")}, FAQ answer ${LIMITS.answer.join("-")}, CTA heading ${LIMITS.ctaHeading.join("-")}, CTA body ${LIMITS.ctaBody.join("-")}, CTA button ${LIMITS.ctaButton.join("-")}.`;

export function userPrompt(input: CopyInput): string {
  const lines = [
    `Business name: ${input.name}`,
    `City: ${input.city}`,
    input.category ? `Google category: ${input.category}` : null,
    input.address ? `Address: ${input.address}` : null,
    input.phone ? `Phone: ${input.phone}` : null,
    input.hours.length ? `Hours:\n${input.hours.map((h) => `  ${h}`).join("\n")}` : null,
  ].filter(Boolean);
  return `Write the website copy for this business.\n\n${lines.join("\n")}`;
}
