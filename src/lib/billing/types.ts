import type { Plan } from "@/config/product";

/** A provider event, normalized. */
export type BillingEvent = {
  provider: string;
  /** Provider's unique event id; each id is processed once. */
  eventId: string;
  type: "payment_succeeded" | "payment_failed" | "subscription_canceled";
  businessId: string;
  /** Provider's subscription id. */
  subscriptionRef: string;
  plan?: Plan;
  currentPeriodEnd?: string | null;
  raw: unknown;
};

export interface BillingProvider {
  readonly id: string;
  /** Whether leads can pay online from the preview. */
  checkoutAvailable(): boolean;
  /** URL to send the lead to for payment. */
  createCheckout(input: {
    businessId: string;
    businessName: string;
    slug: string;
    plan: Plan;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string>;
  /** Verify the webhook signature and normalize the payload. Throws if invalid. */
  parseWebhook(req: { headers: Headers; body: string }): Promise<BillingEvent>;
}
