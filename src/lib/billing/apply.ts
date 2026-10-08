import "server-only";
import { randomUUID } from "node:crypto";
import type { Plan } from "@/config/product";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingEvent } from "./types";

export type ApplyResult = "applied" | "duplicate" | "unknown_business";

/** Applies a verified billing event exactly once (see apply_billing_event in SQL). */
export async function applyBillingEvent(e: BillingEvent): Promise<ApplyResult> {
  const { data, error } = await supabaseAdmin().rpc("apply_billing_event", {
    p_provider: e.provider,
    p_event_id: e.eventId,
    p_type: e.type,
    p_business_id: e.businessId,
    p_subscription_ref: e.subscriptionRef,
    p_plan: e.plan ?? null,
    p_period_end: e.currentPeriodEnd ?? null,
    p_payload: e.raw ?? {},
  });
  if (error) throw new Error(error.message);
  return data as ApplyResult;
}

export function periodEnd(plan: Plan, from = new Date()): string {
  const d = new Date(from);
  if (plan === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/** Admin "Mark as paid": records a manual subscription and goes live. */
export async function markPaidManually(businessId: string, plan: Plan): Promise<void> {
  const ref = `manual-${randomUUID()}`;
  const result = await applyBillingEvent({
    provider: "manual",
    eventId: ref,
    type: "payment_succeeded",
    businessId,
    subscriptionRef: ref,
    plan,
    currentPeriodEnd: periodEnd(plan),
    raw: { source: "admin" },
  });
  if (result === "unknown_business") throw new Error("Business not found");
}
