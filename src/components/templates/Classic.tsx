import Image from "next/image";
import { CallButton, ContactDetails, FaqList, Paragraphs, SiteFooter, StickyCallBar, type TemplateProps } from "./shared";

// Classic: light, centered and trust-focused; navy on cream
// (from concepts/jj-general-contractor).
export default function Classic({ site }: TemplateProps) {
  const c = site.content;
  return (
    <div className="bg-cream text-ink">
      <header className="border-b border-stone-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-serif text-xl font-semibold text-navy">{site.name}</span>
          <CallButton
            site={site}
            label={site.phone ?? "Call"}
            className="hidden items-center gap-2 font-semibold text-navy hover:underline sm:inline-flex"
          />
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">
          {site.category ?? "General contractor"} · {site.city}
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight font-semibold text-navy-dk sm:text-6xl">{c.headline}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{c.subheadline}</p>
        <div className="mt-8 flex justify-center">
          <CallButton
            site={site}
            label={c.callToAction.buttonLabel}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 font-semibold text-white hover:bg-navy-dk"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-sm sm:aspect-[21/9]">
          <Image src={site.photos.hero} alt={`Remodeling by ${site.name}`} fill priority sizes="(min-width:1152px) 1152px, 100vw" className="object-cover" />
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center font-serif text-3xl font-semibold text-navy-dk sm:text-4xl">Services</h2>
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {c.services.map((s, i) => (
            <li key={s.name} className="flex gap-4">
              <span className="font-serif text-2xl font-semibold text-brass">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="mt-1 leading-relaxed text-muted">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="font-serif text-3xl font-semibold text-navy-dk sm:text-4xl">Who we are</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
            <Paragraphs text={c.about} />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["about", "work-1", "work-2", "work-3"] as const).map((slot) => (
              <div key={slot} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={site.photos[slot]} alt="" fill sizes="(min-width:640px) 180px, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-navy-dk">Proudly serving</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{c.serviceAreas.join(" · ")}</p>
      </section>

      <section className="bg-navy-tint">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center font-serif text-3xl font-semibold text-navy-dk sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-8">
            <FaqList site={site} itemClass="bg-paper" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="font-serif text-3xl font-semibold text-navy-dk sm:text-4xl">{c.callToAction.heading}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">{c.callToAction.body}</p>
        <CallButton
          site={site}
          label={c.callToAction.buttonLabel}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 font-semibold text-white hover:bg-navy-dk"
        />
        <ContactDetails site={site} className="mt-14 rounded-2xl bg-paper p-8 text-left" />
      </section>

      <SiteFooter site={site} className="border-t border-stone-line text-muted" />
      <StickyCallBar site={site} accent="bg-navy" />
    </div>
  );
}
