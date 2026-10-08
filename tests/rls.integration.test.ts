// Runs only when a local Supabase is up (npm run test:db).
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  auth: { persistSession: false },
});
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

const tables = ["businesses", "import_batches", "import_jobs", "subscriptions", "billing_events"];

describe("row-level security", () => {
  it.each(tables)("publishable key cannot read %s", async (t) => {
    const { data, error } = await anon.from(t).select("*").limit(1);
    // Either a permission error or an empty result; never rows.
    expect(error ? true : data?.length === 0).toBe(true);
    if (error) expect(error.code).toBe("42501");
  });

  it("publishable key cannot insert a business", async () => {
    const { error } = await anon.from("businesses").insert({ slug: "rls-test", name: "x" });
    expect(error).not.toBeNull();
  });

  it("publishable key cannot call queue functions", async () => {
    const { error } = await anon.rpc("claim_import_jobs", { p_limit: 1 });
    expect(error).not.toBeNull();
  });

  it("secret key can read businesses", async () => {
    const { error } = await admin.from("businesses").select("id").limit(1);
    expect(error).toBeNull();
  });
});
