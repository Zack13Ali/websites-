import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteTemplate } from "@/components/templates";
import { telHref } from "@/lib/phone";
import { absoluteImage, canonicalUrl, getSiteByKey } from "@/lib/sites/live";
import { localBusinessJsonLd, safeJsonForScript, siteDescription, siteTitle } from "@/lib/sites/seo";

// A business's live site, served at {slug}.ROOT_DOMAIN via middleware rewrite.
export const revalidate = 60;

type Props = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const site = await getSiteByKey(key);
  if (!site || site.status === "preview") return { title: "Not found", robots: { index: false } };
  if (site.status === "paused") {
    return { title: `${site.name} | Temporarily unavailable`, robots: { index: false, follow: false } };
  }
  const url = canonicalUrl(site, key);
  const title = siteTitle(site);
  const description = siteDescription(site);
  const image = absoluteImage(site.photos.hero, url);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: "website", url, title, description, siteName: site.name, images: [{ url: image }], locale: "en_US" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    other: { "format-detection": "telephone=yes" },
  };
}

export default async function LiveSite({ params }: Props) {
  const { key } = await params;
  const site = await getSiteByKey(key);
  // Unpaid previews are only reachable at /p/{slug}.
  if (!site || site.status === "preview") notFound();
  if (site.status === "paused") return <Unavailable name={site.name} phone={site.phone} />;

  const url = canonicalUrl(site, key);
  const jsonLd = localBusinessJsonLd(site, url, absoluteImage(site.photos.hero, url));
  return (
    <>
      <script type="application/ld+json">{safeJsonForScript(jsonLd)}</script>
      <SiteTemplate site={site} />
    </>
  );
}

function Unavailable({ name, phone }: { name: string; phone: string | null }) {
  const tel = telHref(phone);
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="font-serif text-3xl font-semibold">{name}</h1>
        <p className="text-lg text-muted">This website is temporarily unavailable.</p>
        {tel && (
          <p>
            You can still reach us at{" "}
            <a href={tel} className="font-semibold underline underline-offset-4">
              {phone}
            </a>
            .
          </p>
        )}
      </div>
    </main>
  );
}
