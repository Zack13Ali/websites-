// Hostname routing and URL building. Pure functions (no env access) so they
// can be unit tested and used from middleware.
//
//   ROOT_DOMAIN, www.ROOT_DOMAIN, app.ROOT_DOMAIN -> the app (admin, previews)
//   {slug}.ROOT_DOMAIN                            -> that business's live site
//   *.vercel.app, localhost, 127.0.0.1            -> the app
//   anything else                                 -> looked up as a custom domain

export type HostRoute =
  | { kind: "app" }
  | { kind: "site"; slug: string }
  | { kind: "custom"; domain: string }
  | { kind: "invalid" };

const APP_SUBDOMAINS = new Set(["www", "app"]);
// Subdomains that must never be a business site.
const RESERVED = new Set(["admin", "api", "mail", "smtp", "ftp", "status", "help", "support", "billing", "cdn", "static"]);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function clean(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

function stripPort(host: string): string {
  return host.replace(/:\d+$/, "");
}

export function resolveHost(rawHost: string | null | undefined, rawRoot: string): HostRoute {
  if (!rawHost) return { kind: "app" };
  const host = clean(rawHost);
  const root = clean(rawRoot);
  // Compare with the port only when ROOT_DOMAIN has one (localhost:3000).
  const h = root.includes(":") ? host : stripPort(host);
  const r = root.includes(":") ? root : stripPort(root);

  if (h === r) return { kind: "app" };

  if (h.endsWith(`.${r}`)) {
    const sub = h.slice(0, -(r.length + 1));
    if (APP_SUBDOMAINS.has(sub)) return { kind: "app" };
    if (sub.includes(".") || RESERVED.has(sub) || !SLUG.test(sub) || sub.length > 80) return { kind: "invalid" };
    return { kind: "site", slug: sub };
  }

  const bare = stripPort(host);
  if (bare === "localhost" || bare === "127.0.0.1" || bare.endsWith(".vercel.app")) return { kind: "app" };
  if (!/^[a-z0-9.-]+$/.test(bare) || !bare.includes(".")) return { kind: "invalid" };
  return { kind: "custom", domain: bare };
}

function protocolFor(root: string): string {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(root) || root.endsWith(".localhost") ? "http" : "https";
}

/** Public address of a live site: https://{slug}.ROOT_DOMAIN */
export function liveSiteUrl(slug: string, root: string, customDomain?: string | null): string {
  if (customDomain) return `https://${customDomain}`;
  return `${protocolFor(root)}://${slug}.${root}`;
}

/** Shareable preview link (the one texted to leads): https://ROOT_DOMAIN/p/{slug} */
export function previewUrl(slug: string, root: string): string {
  return `${protocolFor(root)}://${root}/p/${slug}`;
}

export function appUrl(root: string, path = "/"): string {
  return `${protocolFor(root)}://${root}${path}`;
}
