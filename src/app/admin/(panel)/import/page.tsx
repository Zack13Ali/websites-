import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { startImport } from "./actions";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const { data: batches } = await supabaseAdmin()
    .from("import_batches")
    .select("id, filename, total, done, failed, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <section className="max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold">Import a lead list</h1>
        <p className="text-sm text-stone-600">
          CSV with a header row: <code className="rounded bg-stone-100 px-1">name,city,phone</code>. Up to 2,000 rows.
          Every row becomes a preview; rows that fail are skipped and listed with the reason.
        </p>
        <ActionForm action={startImport} className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
          <input name="file" type="file" accept=".csv,text/csv" required className="block w-full text-sm" />
          <SubmitButton pendingText="Uploading…">Start import</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Recent imports</h2>
        {!batches?.length ? (
          <p className="text-sm text-stone-500">None yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm">
            {batches.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <Link href={`/admin/import/${b.id}`} className="font-medium hover:underline">
                  {b.filename}
                </Link>
                <span className="text-stone-500">
                  {b.done + b.failed}/{b.total} processed · {b.failed} failed · {b.status} ·{" "}
                  {new Date(b.created_at).toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
