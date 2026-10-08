import Image from "next/image";
import { CallButton, ContactDetails, FaqList, Paragraphs, SiteFooter, StickyCallBar, type TemplateProps } from "./shared";

// Split: modern two-column hero, white with brass accents.
export default function Split({ site }: TemplateProps) {
  const c = site.content;
  return (
    <div className="bg-white text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-lg font-bold tracking-tight">{site.name}</span>
        <CallButton
          site={site}
          label="Free estimate"
          className="hidden items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black sm:inline-flex"
        />
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-12 lg:pb-24">
        <div className="order-2 lg:order-1">
          <span className="inline-block rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brass">
            Serving {site.city}
          </span>
          <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">{c.headline}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{c.subheadline}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CallButton
              site={site}
              label={c.callToAction.buttonLabel}
              className="inline-flex items-center gap-2 rounded-md bg-brass px-6 py-3.5 font-semibold text-white hover:brightness-110"
            />
            <a href="#faq" className="font-semibold underline underline-offset-4">
              Common questions
            </a>
          </div>
        </div>
        <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-3xl lg:order-2 lg:aspect-[4/5]">
          <Image src={site.photos.hero} alt={`Work by ${site.name}`} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Services</h2>
              <p className="mt-3 text-muted">Everything handled by one team, start to finish.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl bg-stone-line sm:grid-cols-2 lg:col-span-2">
              {c.services.map((s) => (
                <article key={s.name} className="bg-paper p-6 sm:odd:last:col-span-2">
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">About us</h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
            <Paragraphs text={c.about} />
          </div>
          <h3 className="mt-10 text-sm font-semibold uppercase tracking-wider text-brass">Service area</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-muted sm:grid-cols-3">
            {c.serviceAreas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["about", "work-1", "work-2", "work-3"] as const).map((slot, i) => (
            <div key={slot} className={`relative overflow-hidden rounded-2xl ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`}>
              <Image src={site.photos[slot]} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-8">
            <FaqList site={site} itemClass="bg-paper" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-3xl bg-ink px-6 py-12 text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.callToAction.heading}</h2>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{c.callToAction.body}</p>
          <CallButton
            site={site}
            label={c.callToAction.buttonLabel}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-brass px-6 py-3.5 font-semibold hover:brightness-110"
          />
          <ContactDetails site={site} className="mt-12 border-t border-white/15 pt-10" />
        </div>
      </section>

      <SiteFooter site={site} className="text-muted" />
      <StickyCallBar site={site} accent="bg-ink" />
    </div>
  );
}
