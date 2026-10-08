import "server-only";
import { stubProvider } from "./stub";
import type { BillingProvider } from "./types";

// The active billing provider. Add Paddle / Lemon Squeezy as another
// BillingProvider and select it here.
export function billingProvider(): BillingProvider {
  return stubProvider;
}

/** Whether the preview banner shows a checkout button (vs. "reply to the text"). */
export function checkoutAvailable(): boolean {
  return billingProvider().checkoutAvailable();
}

export type { BillingProvider, BillingEvent } from "./types";
