import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PreviewBanner, type CheckoutOption } from "@/components/PreviewBanner";
import { SiteTemplate } from "@/components/templates";
import { checkoutAvailable } from "@/lib/billing";
import { env } from "@/lib/env";
import { liveSiteUrl } from "@/lib/hosts";
import { getSiteBySlug } from "@/lib/sites/public";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// Previews are never indexed (also sent as an X-Robots-Tag header, see
// next.config.ts).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return {
    title: site ? `${site.name} (preview)` : "Preview",
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();
  if (site.status === "live") redirect(liveSiteUrl(site.slug, env.rootDomain));

  const checkout: CheckoutOption = checkoutAvailable()
    ? {
        kind: "checkout",
        monthlyHref: `/checkout/${site.slug}?plan=monthly`,
        yearlyHref: `/checkout/${site.slug}?plan=yearly`,
      }
    : { kind: "contact", phone: env.salesPhone };

  return (
    <>
      <PreviewBanner businessName={site.name} checkout={checkout} />
      <SiteTemplate site={site} />
    </>
  );
}
