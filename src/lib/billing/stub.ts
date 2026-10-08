import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import type { BillingEvent, BillingProvider } from "./types";

// Stub provider. In development the preview's checkout button opens a fake
// checkout page (/checkout/stub) that fires signed webhooks at
// /api/billing/webhook, exercising the same path a real provider will use.
// In production it offers no online checkout: the banner says "Reply to the
// text to activate" and the admin uses "Mark as paid".

const SIGNATURE_HEADER = "x-stub-signature";

const StubPayload = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(["payment_succeeded", "payment_failed", "subscription_canceled"]),
  businessId: z.string().uuid(),
  subscriptionRef: z.string().min(1).max(100),
  plan: z.enum(["monthly", "yearly"]).optional(),
  currentPeriodEnd: z.string().datetime().nullable().optional(),
});
export type StubPayload = z.infer<typeof StubPayload>;

function signingKey(): string {
  // Derived from CRON_SECRET so the stub needs no extra env var.
  return createHmac("sha256", env.cronSecret).update("stub-billing-webhook").digest("hex");
}

export function signStubPayload(body: string): string {
  return createHmac("sha256", signingKey()).update(body).digest("hex");
}

export const stubProvider: BillingProvider = {
  id: "stub",

  checkoutAvailable() {
    return !env.isProduction;
  },

  async createCheckout({ businessId, slug, plan }) {
    if (env.isProduction) throw new Error("The stub provider has no checkout in production");
    const q = new URLSearchParams({ business: businessId, slug, plan });
    return `/checkout/stub?${q}`;
  },

  async parseWebhook({ headers, body }): Promise<BillingEvent> {
    if (env.isProduction) throw new Error("Stub webhooks are disabled in production");
    const given = Buffer.from(headers.get(SIGNATURE_HEADER) ?? "");
    const expected = Buffer.from(signStubPayload(body));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new Error("Invalid signature");
    }
    const p = StubPayload.parse(JSON.parse(body));
    return {
      provider: "stub",
      eventId: p.id,
      type: p.type,
      businessId: p.businessId,
      subscriptionRef: p.subscriptionRef,
      plan: p.plan,
      currentPeriodEnd: p.currentPeriodEnd ?? null,
      raw: p,
    };
  },
};

export const STUB_SIGNATURE_HEADER = SIGNATURE_HEADER;
