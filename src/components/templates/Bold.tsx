import Image from "next/image";
import { CallButton, ContactDetails, FaqList, Paragraphs, SiteFooter, StickyCallBar, type TemplateProps } from "./shared";

// Bold: full-bleed dark hero, forest + brass (from concepts/elite-remodeling).
export default function Bold({ site }: TemplateProps) {
  const c = site.content;
  const work = [site.photos["work-1"], site.photos["work-2"], site.photos["work-3"], site.photos["work-4"]];
  return (
    <div className="relative bg-paper text-ink">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-white sm:px-6">
          <span className="font-serif text-xl font-semibold">{site.name}</span>
          <CallButton
            site={site}
            label="Call now"
            className="hidden items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10 sm:inline-flex"
          />
        </div>
      </header>

      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-forest-dk text-white">
        <Image src={site.photos.hero} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-dk via-forest-dk/60 to-transparent" />
        <div className="mx-auto w-full max-w-6xl px-4 pt-28 pb-14 sm:px-6 sm:pb-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brass">{site.city}</p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight font-semibold sm:text-6xl">{c.headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">{c.subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CallButton
              site={site}
              label={c.callToAction.buttonLabel}
              className="inline-flex items-center gap-2 rounded-full bg-brass px-6 py-3.5 font-semibold text-white hover:brightness-110"
            />
            <a href="#services" className="inline-flex items-center rounded-full border border-white/40 px-6 py-3.5 font-semibold hover:bg-white/10">
              Our services
            </a>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">What we do</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {c.services.map((s) => (
            <article key={s.name} className="rounded-2xl border border-stone-line bg-white p-6">
              <div className="mb-4 h-1 w-10 rounded bg-brass" />
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image src={site.photos.about} alt={`A project by ${site.name}`} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">About {site.name}</h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
              <Paragraphs text={c.about} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Recent work</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {work.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
              <Image src={src} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-forest text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold">Areas we serve</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {c.serviceAreas.map((a) => (
              <li key={a} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Questions homeowners ask</h2>
        <div className="mt-8">
          <FaqList site={site} itemClass="border border-stone-line bg-white" />
        </div>
      </section>

      <section className="bg-forest-dk text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{c.callToAction.heading}</h2>
          <p className="mt-3 max-w-2xl text-lg text-white/85">{c.callToAction.body}</p>
          <CallButton
            site={site}
            label={c.callToAction.buttonLabel}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brass px-6 py-3.5 font-semibold hover:brightness-110"
          />
          <ContactDetails site={site} className="mt-12 border-t border-white/15 pt-10" />
        </div>
      </section>

      <SiteFooter site={site} className="bg-forest-dk text-white/70" />
      <StickyCallBar site={site} accent="bg-brass" />
    </div>
  );
}
