"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { parseLeadCsv } from "@/lib/csv";
import { generateBusiness } from "@/lib/pipeline";

export async function createSingle(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  // Reuse the CSV row validation so single entry and imports behave the same.
  const field = (k: string) => `"${String(formData.get(k) ?? "").replace(/"/g, '""')}"`;
  const parsed = parseLeadCsv(`name,city,phone\n${field("name")},${field("city")},${field("phone")}`);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const row = parsed.rows[0];
  if (!row.ok) return { ok: false, message: row.error };

  let id: string;
  try {
    id = (await generateBusiness(row.input)).businessId;
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Generation failed" };
  }
  redirect(`/admin/b/${id}`);
}
