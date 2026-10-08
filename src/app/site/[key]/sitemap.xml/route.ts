import { canonicalUrl, getSiteByKey } from "@/lib/sites/live";

export const revalidate = 300;

// {slug}.ROOT_DOMAIN/sitemap.xml: one-page sites, so one URL.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const site = await getSiteByKey(key);
  if (!site || site.status !== "live") return new Response("Not found", { status: 404 });

  const loc = canonicalUrl(site, key) + "/";
  const lastmod = new Date(site.updatedAt).toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
