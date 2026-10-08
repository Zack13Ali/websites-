import { PRODUCT } from "@/config/product";
import { telHref } from "@/lib/phone";
import type { PublicSite } from "@/lib/sites/public";

// Building blocks shared by the three templates. All server components:
// the sites ship no client JavaScript. Every string is rendered as a React
// text node, never as HTML.

export type TemplateProps = { site: PublicSite };

export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

/** Sticky click-to-call: full-width bar on phones, floating pill on desktop. */
export function StickyCallBar({ site, accent }: { site: PublicSite; accent: string }) {
  const href = telHref(site.phone);
  if (!href) return null;
  return (
    <>
      <div className="h-20 sm:hidden" aria-hidden />
      <a
        href={href}
        className={`fixed inset-x-3 bottom-3 z-40 flex items-center justify-center gap-2 rounded-full px-5 py-4 text-base font-semibold text-white shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 ${accent}`}
        aria-label={`Call ${site.name} at ${site.phone}`}
      >
        <PhoneIcon />
        <span>Call {site.phone}</span>
      </a>
    </>
  );
}

export function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .95.68l1.5 4.49a1 1 0 0 1-.5 1.21l-2.26 1.13a11.04 11.04 0 0 0 5.52 5.52l1.13-2.26a1 1 0 0 1 1.21-.5l4.49 1.5a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.72 21 3 14.28 3 6V5Z"
      />
    </svg>
  );
}

export function CallButton({
  site,
  label,
  className,
}: {
  site: PublicSite;
  label: string;
  className: string;
}) {
  const href = telHref(site.phone);
  if (!href) return null;
  return (
    <a href={href} className={className}>
      <PhoneIcon />
      <span>{label}</span>
    </a>
  );
}

export function FaqList({ site, itemClass }: { site: PublicSite; itemClass: string }) {
  return (
    <div className="space-y-3">
      {site.content.faq.map((f, i) => (
        <details key={i} className={`group rounded-xl ${itemClass}`}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 font-semibold">
            <span>{f.question}</span>
            <span className="mt-0.5 shrink-0 transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="px-5 pb-5 leading-relaxed opacity-85">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function ContactDetails({ site, className = "" }: { site: PublicSite; className?: string }) {
  const href = telHref(site.phone);
  return (
    <div className={`grid gap-8 sm:grid-cols-2 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider opacity-70">Contact</h3>
        {href && (
          <p>
            <a href={href} className="text-lg font-semibold underline-offset-4 hover:underline">
              {site.phone}
            </a>
          </p>
        )}
        {site.address && <p className="opacity-85">{site.address}</p>}
      </div>
      {site.hours.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider opacity-70">Hours</h3>
          <ul className="space-y-1 text-sm opacity-85">
            {site.hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SiteFooter({ site, className = "" }: { site: PublicSite; className?: string }) {
  return (
    <footer className={`px-4 py-8 text-center text-sm ${className}`}>
      <p>
        © {new Date().getFullYear()} {site.name}. Serving {site.city} and nearby.
      </p>
      <p className="mt-1 opacity-60">Website by {PRODUCT.name}</p>
    </footer>
  );
}
