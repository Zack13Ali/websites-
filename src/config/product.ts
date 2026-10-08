// Product-level settings. Rename the product or change prices here only.

export const PRODUCT = {
  name: "Minitebuild",
  prices: {
    monthly: 49, // USD per month
    yearly: 529, // USD per year
  },
  currency: "USD",
  // The only trade supported for now.
  trade: "general_contractor",
  tradeLabel: "General contractor / remodeling",
} as const;

export type Plan = keyof typeof PRODUCT.prices;

export function formatPrice(plan: Plan): string {
  const amount = PRODUCT.prices[plan];
  return plan === "monthly" ? `$${amount}/mo` : `$${amount}/yr`;
}
