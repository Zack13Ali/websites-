import { describe, expect, it } from "vitest";
import { liveSiteUrl, previewUrl, resolveHost } from "@/lib/hosts";

describe("resolveHost with a production root domain", () => {
  const root = "minitebuild.com";

  it.each([
    ["minitebuild.com"],
    ["www.minitebuild.com"],
    ["app.minitebuild.com"],
    ["MINITEBUILD.COM"],
    ["minitebuild.com."],
    ["minitebuild.com:443"],
  ])("%s -> app", (host) => {
    expect(resolveHost(host, root)).toEqual({ kind: "app" });
  });

  it.each([
    ["jj-general-contractor-irving.minitebuild.com", "jj-general-contractor-irving"],
    ["Elite-Remodeling-Frisco.Minitebuild.com", "elite-remodeling-frisco"],
    ["acme-dallas-2.minitebuild.com:443", "acme-dallas-2"],
  ])("%s -> site %s", (host, slug) => {
    expect(resolveHost(host, root)).toEqual({ kind: "site", slug });
  });

  it.each([
    ["a.b.minitebuild.com"], // nested subdomain
    ["admin.minitebuild.com"], // reserved
    ["api.minitebuild.com"],
    ["-bad-.minitebuild.com"],
    ["bad--slug.minitebuild.com"],
    ["under_score.minitebuild.com"],
    [`${"a".repeat(81)}.minitebuild.com`],
  ])("%s -> invalid", (host) => {
    expect(resolveHost(host, root)).toEqual({ kind: "invalid" });
  });

  it("does not treat look-alike domains as subdomains", () => {
    expect(resolveHost("evilminitebuild.com", root)).toEqual({ kind: "custom", domain: "evilminitebuild.com" });
    expect(resolveHost("minitebuild.com.evil.net", root)).toEqual({ kind: "custom", domain: "minitebuild.com.evil.net" });
  });

  it("treats other domains as custom domains", () => {
    expect(resolveHost("www.joesremodeling.com", root)).toEqual({ kind: "custom", domain: "www.joesremodeling.com" });
    expect(resolveHost("JoesRemodeling.com:443", root)).toEqual({ kind: "custom", domain: "joesremodeling.com" });
  });

  it("serves the app on Vercel and local hosts", () => {
    expect(resolveHost("minitebuild-git-main-me.vercel.app", root)).toEqual({ kind: "app" });
    expect(resolveHost("localhost:3000", root)).toEqual({ kind: "app" });
    expect(resolveHost("127.0.0.1:3000", root)).toEqual({ kind: "app" });
    expect(resolveHost(null, root)).toEqual({ kind: "app" });
  });

  it("rejects junk hosts", () => {
    expect(resolveHost("no_dots", root)).toEqual({ kind: "invalid" });
    expect(resolveHost("bad host.com", root)).toEqual({ kind: "invalid" });
  });
});

describe("resolveHost in local development (ROOT_DOMAIN=localhost:3000)", () => {
  const root = "localhost:3000";
  it("routes slug.localhost:3000 to the site", () => {
    expect(resolveHost("acme-dallas.localhost:3000", root)).toEqual({ kind: "site", slug: "acme-dallas" });
  });
  it("routes localhost:3000 to the app", () => {
    expect(resolveHost("localhost:3000", root)).toEqual({ kind: "app" });
  });
  it("does not match a different port as a subdomain", () => {
    expect(resolveHost("acme.localhost:4000", root)).toEqual({ kind: "invalid" });
  });
});

describe("URLs", () => {
  it("builds live and preview URLs", () => {
    expect(liveSiteUrl("acme-dallas", "minitebuild.com")).toBe("https://acme-dallas.minitebuild.com");
    expect(liveSiteUrl("acme-dallas", "localhost:3000")).toBe("http://acme-dallas.localhost:3000");
    expect(liveSiteUrl("acme-dallas", "minitebuild.com", "acme.com")).toBe("https://acme.com");
    expect(previewUrl("acme-dallas", "minitebuild.com")).toBe("https://minitebuild.com/p/acme-dallas");
  });
});
