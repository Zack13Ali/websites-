import "server-only";
import type { LeadInput, ParsedRow } from "@/lib/csv";
import { generateBusiness } from "@/lib/pipeline";
import { supabaseAdmin } from "@/lib/supabase/admin";

type JobRow = { id: string; batch_id: string; input: LeadInput; attempts: number };

/** Creates a batch and one queued job per row. Invalid rows are failed up front. */
export async function createBatch(filename: string, rows: ParsedRow[]): Promise<string> {
  const db = supabaseAdmin();
  const invalid = rows.filter((r) => !r.ok).length;
  const { data: batch, error } = await db
    .from("import_batches")
    .insert({
      filename: filename.slice(0, 200),
      total: rows.length,
      failed: invalid,
      status: invalid === rows.length ? "completed" : "queued",
      completed_at: invalid === rows.length ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const jobs = rows.map((r) => ({
    batch_id: batch.id,
    row_number: r.rowNumber,
    input: r.input,
    status: r.ok ? "queued" : "failed",
    error: r.ok ? null : r.error,
  }));
  for (let i = 0; i < jobs.length; i += 500) {
    const { error: jobsError } = await db.from("import_jobs").insert(jobs.slice(i, i + 500));
    if (jobsError) throw new Error(jobsError.message);
  }
  return batch.id as string;
}

function describe(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.slice(0, 500) || "Unknown error";
}

async function runJob(job: JobRow): Promise<void> {
  const db = supabaseAdmin();
  let businessId: string | null = null;
  let error: string | null = null;
  try {
    businessId = (await generateBusiness(job.input, { batchId: job.batch_id })).businessId;
  } catch (err) {
    error = describe(err);
  }
  const { error: finishError } = await db.rpc("finish_import_job", {
    p_job_id: job.id,
    p_business_id: businessId,
    p_error: error,
  });
  if (finishError) throw new Error(finishError.message);
}

export type WorkerResult = { processed: number; remaining: number };

/**
 * Processes queued jobs in small chunks until the queue is empty or the time
 * budget runs out. Safe to run concurrently (jobs are claimed with
 * FOR UPDATE SKIP LOCKED). Called by the progress page and by pg_cron.
 */
export async function runWorker(opts: { chunkSize?: number; budgetMs?: number } = {}): Promise<WorkerResult> {
  const chunkSize = opts.chunkSize ?? 3;
  // Deadline for *starting* a chunk; a started chunk runs to completion.
  const deadline = Date.now() + (opts.budgetMs ?? 20_000);
  const db = supabaseAdmin();
  let processed = 0;

  while (Date.now() < deadline) {
    const { data, error } = await db.rpc("claim_import_jobs", { p_limit: chunkSize });
    if (error) throw new Error(error.message);
    const jobs = (data ?? []) as JobRow[];
    if (jobs.length === 0) break;
    await Promise.all(jobs.map(runJob));
    processed += jobs.length;
  }

  const { count } = await db
    .from("import_jobs")
    .select("id", { count: "exact", head: true })
    .in("status", ["queued", "processing"]);
  return { processed, remaining: count ?? 0 };
}
