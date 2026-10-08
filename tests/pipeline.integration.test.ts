// Runs against the local Supabase (npm run test:db) with fixture Places/AI.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

vi.stubEnv("ANTHROPIC_API_KEY", "");
vi.stubEnv("GOOGLE_PLACES_API_KEY", "");

const { parseLeadCsv } = await import("@/lib/csv");
const { createBatch, runWorker } = await import("@/lib/queue");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

const tag = Date.now().toString(36);

describe("import pipeline", () => {
  let batchId: string;

  beforeAll(async () => {
    const csv = [
      "name,city,phone",
      `Test Builders ${tag},Irving,(214) 555-0101`,
      `Notfound Remodel ${tag},Fort Worth,214-555-0102`,
      `Website Homes ${tag},Frisco,`,
      `Bad Phone ${tag},Dallas,12345`,
      `Test Builders ${tag},Irving,(214) 555-0101`, // same Google listing again
    ].join("\n");
    const parsed = parseLeadCsv(csv);
    if (!parsed.ok) throw new Error(parsed.error);
    batchId = await createBatch("test.csv", parsed.rows);
    // Two workers in parallel must not double-process a row.
    await Promise.all([runWorker({ chunkSize: 2 }), runWorker({ chunkSize: 2 })]);
  }, 60_000);

  it("finishes the batch with correct counters", async () => {
    const { data: batch } = await db.from("import_batches").select("*").eq("id", batchId).single();
    expect(batch).toMatchObject({ total: 5, done: 4, failed: 1, status: "completed" });
  });

  it("records the failure reason for the invalid row", async () => {
    const { data: jobs } = await db
      .from("import_jobs")
      .select("row_number,status,error,business_id,attempts")
      .eq("batch_id", batchId)
      .order("row_number");
    expect(jobs!.map((j) => j.status)).toEqual(["done", "done", "done", "failed", "done"]);
    expect(jobs![3].error).toContain("not a valid US phone number");
    expect(jobs!.filter((j) => j.status === "done").every((j) => j.attempts === 1)).toBe(true);
    // The duplicate row points at the first row's business.
    expect(jobs![4].business_id).toBe(jobs![0].business_id);
  });

  it("creates businesses with the right tags and slugs", async () => {
    const { data: rows } = await db
      .from("businesses")
      .select("slug,name,phone,places_verified,website_url,content,status,generation_status")
      .eq("batch_id", batchId)
      .order("created_at");
    expect(rows).toHaveLength(3);
    const byName = (prefix: string) => rows!.find((r) => r.name.startsWith(prefix))!;
    const [verified, unverified, hasWebsite] = [byName("Test"), byName("Notfound"), byName("Website")];

    expect(verified.slug).toBe(`test-builders-${tag}-irving`);
    expect(verified.places_verified).toBe(true);
    expect(verified.phone).toBe("(214) 555-0101");
    expect(verified.status).toBe("preview");
    expect(verified.generation_status).toBe("ready");
    expect(verified.content.services.length).toBeGreaterThanOrEqual(4);

    // Not on Google: still generated, from CSV data, tagged unverified.
    expect(unverified.places_verified).toBe(false);
    expect(unverified.name).toBe(`Notfound Remodel ${tag}`);
    expect(unverified.phone).toBe("(214) 555-0102");

    // Already has a website: still generated, website recorded.
    expect(hasWebsite.website_url).toBe("https://example.com/");
  });

  it("adds -2 on a slug clash", async () => {
    const parsed = parseLeadCsv(`name,city,phone\nNotfound Remodel ${tag},Fort Worth,`);
    if (!parsed.ok) throw new Error(parsed.error);
    const id = await createBatch("clash.csv", parsed.rows);
    await runWorker();
    const { data } = await db.from("businesses").select("slug").eq("batch_id", id).single();
    expect(data!.slug).toBe(`notfound-remodel-${tag}-fort-worth-2`);
  }, 30_000);
});
