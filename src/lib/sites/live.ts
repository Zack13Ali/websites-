import "server-only";
import { env } from "@/lib/env";
import { liveSiteUrl } from "@/lib/hosts";
import { getSiteByDomain, getSiteBySlug, type PublicSite } from "./public";

/** The [key] segment is a slug ({slug}.ROOT_DOMAIN) or a custom domain (has a dot). */
export async function getSiteByKey(key: string): Promise<PublicSite | null> {
  const k = decodeURIComponent(key).toLowerCase();
  return k.includes(".") ? getSiteByDomain(k) : getSiteBySlug(k);
}

export function canonicalUrl(site: PublicSite, key: string): string {
  return key.includes(".") ? `https://${key}` : liveSiteUrl(site.slug, env.rootDomain);
}

export function absoluteImage(src: string, base: string): string {
  return src.startsWith("http") ? src : `${base}${src}`;
}
