import Link from "next/link";
import { BusinessFlags, Chip, StatusBadge } from "@/components/admin/badges";
import { CopyButton } from "@/components/admin/ui";
import { PAGE_SIZE, listBusinesses } from "@/lib/admin-data";
import { env } from "@/lib/env";
import { previewUrl } from "@/lib/hosts";
import type { BusinessStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: BusinessStatus[] = ["preview", "live", "paused"];

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as BusinessStatus) ? (sp.status as BusinessStatus) : "";
  const { rows, total, page } = await listBusinesses({ q: sp.q, status, page: Number(sp.page) || 1 });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(status ? { status } : {}), page: String(p) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          Businesses <span className="text-base font-normal text-stone-500">({total})</span>
        </h1>
        <form className="flex flex-wrap gap-2" role="search">
          <input name="q" defaultValue={sp.q} placeholder="Search name, city, phone" className="input w-56" />
          <select name="status" defaultValue={status} className="input w-auto">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn">Filter</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
          No businesses yet. <Link href="/admin/import" className="underline">Import a CSV</Link> or{" "}
          <Link href="/admin/new" className="underline">add one</Link>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Preview link</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((b) => {
                const link = previewUrl(b.slug, env.rootDomain);
                return (
                  <tr key={b.id} className="align-top hover:bg-stone-50">
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/b/${b.id}`} className="font-medium hover:underline">
                        {b.name}
                      </Link>
                      <div className="text-xs text-stone-500">
                        {b.city}
                        {b.phone ? ` · ${b.phone}` : ""}
                      </div>
                      <div className="mt-1">
                        <BusinessFlags b={b} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-3 py-2.5 capitalize">{b.template}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {b.lead_tags.map((t) => (
                          <Chip key={t}>{t}</Chip>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <a href={`/p/${b.slug}`} target="_blank" className="max-w-56 truncate text-sky-700 hover:underline" title={link}>
                          /p/{b.slug}
                        </a>
                        <CopyButton text={link} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-stone-500">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm">
          {page > 1 ? <Link className="btn" href={`?${qs(page - 1)}`}>← Newer</Link> : <span />}
          <span className="text-stone-500">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link className="btn" href={`?${qs(page + 1)}`}>Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
