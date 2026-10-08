import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  images: {
    // Owner photos live in Supabase Storage.
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol.replace(":", "") as "http" | "https",
            hostname: supabase.hostname,
            port: supabase.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  poweredByHeader: false,
  experimental: {
    // CSV uploads (2 MB max) and photos (resized in the browser, 4 MB max).
    // Vercel caps request bodies at 4.5 MB.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  async headers() {
    return [
      { source: "/p/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/checkout/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
