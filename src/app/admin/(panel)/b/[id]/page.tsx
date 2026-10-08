import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessFlags, StatusBadge } from "@/components/admin/badges";
import { ActionForm, CopyButton, SubmitButton } from "@/components/admin/ui";
import { PRODUCT, formatPrice } from "@/config/product";
import { getBusiness } from "@/lib/admin-data";
import { LIMITS } from "@/lib/content/schema";
import { env } from "@/lib/env";
import { liveSiteUrl, previewUrl } from "@/lib/hosts";
import { photoUrl } from "@/lib/sites/photos";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LEAD_TAGS, PHOTO_SLOTS, TEMPLATES } from "@/lib/types";
import * as act from "./actions";
import { PhotoUploader } from "./photo-uploader";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="ml-1 text-xs text-stone-500">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const lim = (k: keyof typeof LIMITS) => `${LIMITS[k][0]}–${LIMITS[k][1]} chars`;

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getBusiness(id);
  if (!b) notFound();
  const { data: subs } = await supabaseAdmin()
    .from("subscriptions")
    .select("provider, provider_ref, plan, status, current_period_end, created_at")
    .eq("business_id", id)
    .order("created_at", { ascending: false });

  const preview = previewUrl(b.slug, env.rootDomain);
  const live = liveSiteUrl(b.slug, env.rootDomain, b.custom_domain);
  const c = b.content;
  const bind = <A extends unknown[], R>(fn: (id: string, ...a: A) => R) => fn.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin" className="text-sm text-stone-500 hover:underline">
          ← All businesses
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{b.name}</h1>
          <StatusBadge status={b.status} />
          <BusinessFlags b={b} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            <a href={`/p/${b.slug}`} target="_blank" className="text-sky-700 hover:underline">
              Preview
            </a>
            <CopyButton text={preview} label="Copy preview link" />
          </span>
          {b.status === "live" && (
            <span className="flex items-center gap-2">
              <a href={live} target="_blank" className="text-sky-700 hover:underline">
                Live site
              </a>
              <CopyButton text={live} label="Copy live link" />
            </span>
          )}
          <span className="text-stone-500">Created {new Date(b.created_at).toLocaleString("en-US")}</span>
        </div>
        {b.website_url && (
          <p className="text-sm text-stone-600">
            Google lists an existing website:{" "}
            <a href={b.website_url} target="_blank" rel="noopener noreferrer nofollow" className="text-sky-700 underline">
              {b.website_url}
            </a>
          </p>
        )}
        {!b.places_verified && (
          <p className="text-sm text-stone-600">Not found on Google. Details come from the CSV; confirm them on the call.</p>
        )}
        {b.last_error && <p className="text-sm text-red-700">Last error: {b.last_error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Status">
            <div className="flex flex-wrap gap-2">
              {b.status !== "live" && (
                <ActionForm action={async () => { "use server"; return act.publish(id); }}>
                  <SubmitButton>Publish</SubmitButton>
                </ActionForm>
              )}
              {b.status === "live" && (
                <ActionForm action={async () => { "use server"; return act.pause(id); }} confirm="Pause this live site?">
                  <SubmitButton className="btn-danger">Pause</SubmitButton>
                </ActionForm>
              )}
            </div>
            <ActionForm action={bind(act.markPaid)} className="mt-4 space-y-2 border-t border-stone-100 pt-4">
              <p className="text-sm font-medium">Mark as paid</p>
              <select name="plan" className="input" defaultValue="monthly">
                <option value="monthly">Monthly · {formatPrice("monthly")}</option>
                <option value="yearly">Yearly · {formatPrice("yearly")}</option>
              </select>
              <SubmitButton className="btn">Mark as paid and go live</SubmitButton>
            </ActionForm>
            {subs && subs.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-stone-100 pt-4 text-xs text-stone-600">
                {subs.map((s) => (
                  <li key={s.provider + s.provider_ref}>
                    {s.provider} · {s.plan} · <strong>{s.status}</strong>
                    {s.current_period_end && ` · renews ${new Date(s.current_period_end).toLocaleDateString("en-US")}`}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Lead">
            <ActionForm action={bind(act.saveLead)} className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                {LEAD_TAGS.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 capitalize">
                    <input type="checkbox" name={`tag_${t}`} defaultChecked={b.lead_tags.includes(t)} />
                    {t}
                  </label>
                ))}
              </div>
              <textarea name="notes" defaultValue={b.notes} rows={5} className="input" placeholder="Call notes" />
              <SubmitButton className="btn">Save lead</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Template">
            <ActionForm action={bind(act.setTemplate)} className="flex gap-2">
              <select name="template" defaultValue={b.template} className="input">
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <SubmitButton className="btn">Save</SubmitButton>
            </ActionForm>
            <Link href="/admin/templates" className="mt-2 inline-block text-xs text-stone-500 hover:underline">
              See all templates
            </Link>
          </Card>

          <Card
            title="Business details"
            actions={
              <ActionForm action={async () => { "use server"; return act.refreshGoogle(id); }}>
                <SubmitButton className="btn px-2 py-1 text-xs" pendingText="Looking up…">
                  Refresh from Google
                </SubmitButton>
              </ActionForm>
            }
          >
            <ActionForm action={bind(act.saveDetails)} className="space-y-3">
              <Field label="Name">
                <input name="name" defaultValue={b.name} required className="input" />
              </Field>
              <Field label="City">
                <input name="city" defaultValue={b.city} required className="input" />
              </Field>
              <Field label="Phone">
                <input name="phone" defaultValue={b.phone ?? ""} className="input" />
              </Field>
              <Field label="Address">
                <input name="address" defaultValue={b.address ?? ""} className="input" />
              </Field>
              <Field label="Category">
                <input name="category" defaultValue={b.category ?? ""} className="input" />
              </Field>
              <Field label="Hours" hint="one line per day">
                <textarea name="hours" defaultValue={b.hours.join("\n")} rows={7} className="input" />
              </Field>
              <p className="text-xs text-stone-500">
                {b.places_fetched_at ? `Google checked ${new Date(b.places_fetched_at).toLocaleString("en-US")}.` : ""}{" "}
                {b.owner_confirmed ? "Confirmed by the owner (paid)." : "Not yet confirmed by the owner."}
              </p>
              <SubmitButton className="btn">Save details</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Danger zone">
            <ActionForm action={async () => { "use server"; return act.deleteBusiness(id); }} confirm={`Delete ${b.name}? This cannot be undone.`}>
              <SubmitButton className="btn-danger">Delete business</SubmitButton>
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Site copy"
            actions={
              <ActionForm
                action={async () => { "use server"; return act.regenerate(id); }}
                confirm="Replace all copy with newly generated copy?"
              >
                <SubmitButton className="btn px-2 py-1 text-xs" pendingText="Writing… (up to a minute)">
                  Regenerate copy
                </SubmitButton>
              </ActionForm>
            }
          >
            {!c ? (
              <p className="text-sm text-stone-500">No copy yet. Use Regenerate copy.</p>
            ) : (
              <ActionForm action={bind(act.saveContent)} className="space-y-4">
                <Field label="Headline" hint={lim("headline")}>
                  <input name="headline" defaultValue={c.headline} className="input" />
                </Field>
                <Field label="Subheadline" hint={lim("subheadline")}>
                  <textarea name="subheadline" defaultValue={c.subheadline} rows={2} className="input" />
                </Field>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Services <span className="text-xs font-normal text-stone-500">4–6; leave a row empty to drop it</span>
                  </legend>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-3">
                      <input name={`service_name_${i}`} defaultValue={c.services[i]?.name ?? ""} placeholder="Name" className="input" />
                      <textarea name={`service_desc_${i}`} defaultValue={c.services[i]?.description ?? ""} placeholder="Description" rows={2} className="input sm:col-span-2" />
                    </div>
                  ))}
                </fieldset>
                <Field label="About" hint={`${lim("about")}; blank line between paragraphs`}>
                  <textarea name="about" defaultValue={c.about} rows={7} className="input" />
                </Field>
                <Field label="Service areas" hint="one per line, 1–12">
                  <textarea name="service_areas" defaultValue={c.serviceAreas.join("\n")} rows={5} className="input" />
                </Field>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    FAQ <span className="text-xs font-normal text-stone-500">4–5</span>
                  </legend>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-1 rounded-md bg-stone-50 p-2">
                      <input name={`faq_q_${i}`} defaultValue={c.faq[i]?.question ?? ""} placeholder="Question" className="input" />
                      <textarea name={`faq_a_${i}`} defaultValue={c.faq[i]?.answer ?? ""} placeholder="Answer" rows={2} className="input" />
                    </div>
                  ))}
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Call to action</legend>
                  <input name="cta_heading" defaultValue={c.callToAction.heading} placeholder="Heading" className="input" />
                  <textarea name="cta_body" defaultValue={c.callToAction.body} placeholder="Text" rows={2} className="input" />
                  <input name="cta_button" defaultValue={c.callToAction.buttonLabel} placeholder="Button label" className="input" />
                </fieldset>
                <SubmitButton>Save copy</SubmitButton>
              </ActionForm>
            )}
          </Card>

          <Card title="Photos">
            <p className="mb-4 text-sm text-stone-500">
              Stock photos are used until you upload the owner&apos;s. Uploads are resized and stored in Supabase Storage.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PHOTO_SLOTS.map((slot) => (
                <div key={slot} className="space-y-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
                    <Image src={photoUrl(slot, b.photos, b.trade)} alt="" fill sizes="240px" className="object-cover" />
                    <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                      {slot} · {b.photos[slot] ? "owner" : "stock"}
                    </span>
                  </div>
                  <PhotoUploader slot={slot} action={bind(act.uploadPhoto)} />
                  {b.photos[slot] && (
                    <ActionForm action={async () => { "use server"; return act.resetPhoto(id, slot); }}>
                      <SubmitButton className="btn px-2 py-1 text-xs">Use stock photo</SubmitButton>
                    </ActionForm>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <p className="text-xs text-stone-400">
            {PRODUCT.name} · slug <code>{b.slug}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
