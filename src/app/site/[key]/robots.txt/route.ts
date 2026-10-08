import { canonicalUrl, getSiteByKey } from "@/lib/sites/live";

export const revalidate = 300;

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const site = await getSiteByKey(key);
  const body =
    site?.status === "live"
      ? `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl(site, key)}/sitemap.xml\n`
      : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
