import type { Business, BusinessStatus } from "@/lib/types";

const STATUS_STYLES: Record<BusinessStatus, string> = {
  preview: "bg-amber-100 text-amber-900",
  live: "bg-emerald-100 text-emerald-900",
  paused: "bg-stone-200 text-stone-700",
};

export function StatusBadge({ status }: { status: BusinessStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{status}</span>;
}

export function Chip({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "blue" | "red" | "green" }) {
  const tones = {
    stone: "bg-stone-100 text-stone-700",
    blue: "bg-sky-100 text-sky-900",
    red: "bg-red-100 text-red-800",
    green: "bg-emerald-100 text-emerald-800",
  };
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/** "unverified", "has website", "owner confirmed" flags. */
export function BusinessFlags({ b, linkWebsite = true }: { b: Pick<Business, "places_verified" | "website_url" | "owner_confirmed">; linkWebsite?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {!b.places_verified && <Chip tone="red">unverified</Chip>}
      {b.website_url &&
        (linkWebsite ? (
          <a href={b.website_url} target="_blank" rel="noopener noreferrer nofollow" title={b.website_url}>
            <Chip tone="blue">has website ↗</Chip>
          </a>
        ) : (
          <Chip tone="blue">has website</Chip>
        ))}
      {b.owner_confirmed && <Chip tone="green">owner confirmed</Chip>}
    </span>
  );
}
