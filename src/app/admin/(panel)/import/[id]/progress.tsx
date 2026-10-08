"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { driveBatch, type BatchProgress } from "../actions";

export function Progress({ batchId }: { batchId: string }) {
  const [p, setP] = useState<BatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    async function tick() {
      try {
        const next = await driveBatch(batchId);
        if (stopped) return;
        setP(next);
        setError(null);
        if (next && next.status !== "completed") setTimeout(tick, 1000);
      } catch (e) {
        if (stopped) return;
        setError(e instanceof Error ? e.message : "Lost connection, retrying…");
        setTimeout(tick, 5000);
      }
    }
    tick();
    return () => {
      stopped = true;
    };
  }, [batchId]);

  if (!p) return <p className="text-stone-500">Loading…</p>;
  const processed = p.done + p.failed;
  const pct = p.total ? Math.round((processed / p.total) * 100) : 100;
  const failed = p.jobs.filter((j) => j.status === "failed");
  const done = p.jobs.filter((j) => j.status === "done");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">
            {p.status === "completed" ? "Finished" : "Generating previews…"} {processed} of {p.total}
          </span>
          <span className="text-stone-500">
            {p.done} built · {p.failed} skipped
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {p.status !== "completed" && (
          <p className="mt-3 text-xs text-stone-500">You can close this page; the batch keeps running in the background.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>

      {failed.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Skipped rows</h2>
          <ul className="divide-y divide-stone-100 rounded-xl border border-red-200 bg-white text-sm">
            {failed.map((j) => (
              <li key={j.row_number} className="px-4 py-2">
                <span className="font-medium">Row {j.row_number}</span>
                {j.input.name ? ` · ${j.input.name}` : ""}
                {j.input.city ? `, ${j.input.city}` : ""}
                <span className="block text-red-700">{j.error}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Built</h2>
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm">
            {done.map((j) => (
              <li key={j.row_number} className="flex justify-between gap-2 px-4 py-2">
                <span>
                  Row {j.row_number} · {j.input.name}
                </span>
                {j.business_id && (
                  <Link href={`/admin/b/${j.business_id}`} className="text-sky-700 hover:underline">
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
