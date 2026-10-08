"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { parseLeadCsv } from "@/lib/csv";
import { createBatch, runWorker } from "@/lib/queue";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_BYTES = 2 * 1024 * 1024;

export async function startImport(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file." };
  if (file.size > MAX_BYTES) return { ok: false, message: "The file is larger than 2 MB." };

  const parsed = parseLeadCsv(await file.text());
  if (!parsed.ok) return { ok: false, message: parsed.error };

  const batchId = await createBatch(file.name || "upload.csv", parsed.rows);
  redirect(`/admin/import/${batchId}`);
}

export type BatchProgress = {
  status: string;
  total: number;
  done: number;
  failed: number;
  jobs: {
    row_number: number;
    status: string;
    error: string | null;
    input: { name?: string; city?: string };
    business_id: string | null;
  }[];
};

/**
 * Called repeatedly by the progress page: runs the worker for a short slice
 * (so the batch moves while the page is open), then returns progress.
 * pg_cron keeps the queue moving after the page is closed.
 */
export async function driveBatch(batchId: string): Promise<BatchProgress | null> {
  await requireAdmin();
  const db = supabaseAdmin();
  const { data: before } = await db.from("import_batches").select("status").eq("id", batchId).maybeSingle();
  if (!before) return null;
  if (before.status !== "completed") await runWorker({ chunkSize: 3, budgetMs: 5_000 });

  const [{ data: batch }, { data: jobs }] = await Promise.all([
    db.from("import_batches").select("status, total, done, failed").eq("id", batchId).single(),
    db
      .from("import_jobs")
      .select("row_number, status, error, input, business_id")
      .eq("batch_id", batchId)
      .order("row_number"),
  ]);
  return { ...(batch as Omit<BatchProgress, "jobs">), jobs: (jobs ?? []) as BatchProgress["jobs"] };
}
