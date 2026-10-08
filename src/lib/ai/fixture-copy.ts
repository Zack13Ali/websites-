import { SiteContentSchema, type SiteContent } from "@/lib/content/schema";
import type { CopyInput } from "./prompt";

// Stand-in for Claude when ANTHROPIC_API_KEY is not set. Deterministic copy
// built from the business details, validated through the same schema.

const SERVICES = [
  { name: "Kitchen Remodeling", description: "New layouts, cabinets, counters and lighting, planned around how your family actually cooks and gathers." },
  { name: "Bathroom Remodeling", description: "Showers, tubs, tile and vanities, from a quick refresh to a full gut-and-rebuild." },
  { name: "Room Additions", description: "More space without moving: bedrooms, sunrooms and family rooms built to match your home." },
  { name: "Flooring", description: "Hardwood, tile, luxury vinyl and more, installed level, tight and ready for daily life." },
  { name: "Decks and Patios", description: "Outdoor living space built to handle the weather and look good doing it." },
  { name: "Home Repairs", description: "Drywall, doors, trim and the punch list you have been putting off, handled in one visit when possible." },
];

const NEARBY: Record<string, string[]> = {
  irving: ["Irving", "Grand Prairie", "Coppell", "Las Colinas", "Euless", "Arlington", "Dallas"],
  frisco: ["Frisco", "Plano", "McKinney", "Allen", "Little Elm", "Prosper", "The Colony"],
};

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function fixtureCopy(input: CopyInput): SiteContent {
  const city = input.city.split(",")[0].trim() || "your area";
  const h = hash(input.name + city);
  const count = 4 + (h % 3); // 4-6 services
  const start = h % SERVICES.length;
  const services = Array.from({ length: count }, (_, i) => SERVICES[(start + i) % SERVICES.length]);
  const areas = NEARBY[city.toLowerCase()] ?? [city.slice(0, 40), `Greater ${city}`.slice(0, 40)];

  const content = {
    headline: `Remodeling and repairs in ${city}, done right`.slice(0, 80),
    subheadline: `${input.name} helps ${city} homeowners plan and build kitchens, baths and home projects, with clear estimates and a crew that shows up.`.slice(0, 200),
    services,
    about:
      `${input.name} is a local general contractor serving homeowners in ${city} and the surrounding area. We handle projects from the first walkthrough to the final cleanup, so you have one team to call instead of juggling trades.\n\n` +
      `Every job starts with a visit to your home, a straight conversation about budget and timing, and a written estimate you can actually read. During the work we keep you updated and keep the site tidy, because it is still your home.`,
    serviceAreas: areas,
    faq: [
      { question: "Do you offer free estimates?", answer: "Yes. Call us to set up a time, we will walk the space with you and follow up with a written estimate." },
      { question: "How long does a typical remodel take?", answer: "A bathroom often takes two to four weeks and a kitchen four to eight, depending on scope and materials. We give you a schedule before work starts." },
      { question: "Do you handle permits?", answer: "When a project needs permits, we pull them and schedule the inspections so you do not have to." },
      { question: "Can I live at home during the work?", answer: "Usually, yes. We set up dust protection, keep a clear path through the house and clean up at the end of each day." },
      ...(h % 2 ? [{ question: "What areas do you serve?", answer: `We work throughout ${city} and nearby communities. Call and we will let you know if your address is in range.` }] : []),
    ],
    callToAction: {
      heading: "Ready to talk about your project?",
      body: `Call ${input.name} for a free, no-pressure estimate.`,
      buttonLabel: "Call for a free estimate",
    },
  };
  return SiteContentSchema.parse(content);
}
