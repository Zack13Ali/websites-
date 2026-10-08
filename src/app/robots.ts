import type { MetadataRoute } from "next";

// robots.txt for the app host (ROOT_DOMAIN). Business sites serve their own
// from /site/[key]/robots.txt via the hostname middleware.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/p/", "/checkout", "/api/"] },
  };
}
