import { PRODUCT, formatPrice } from "@/config/product";
import { telHref } from "@/lib/phone";

export type CheckoutOption =
  | { kind: "checkout"; monthlyHref: string; yearlyHref: string }
  | { kind: "contact"; phone: string };

// Sticky top banner on preview pages. Rendered above the template so the
// "go live" button is always one tap away during the sales call.
export function PreviewBanner({ businessName, checkout }: { businessName: string; checkout: CheckoutOption }) {
  const monthly = formatPrice("monthly");
  return (
    <div className="sticky top-0 z-50 border-b border-black/10 bg-[#fff8e6] text-ink shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm leading-snug sm:text-base">
          This site was built for <strong>{businessName}</strong>. Go live for {monthly}
          <span className="hidden text-muted sm:inline">
            {" "}
            (or {formatPrice("yearly")}). Powered by {PRODUCT.name}.
          </span>
        </p>
        {checkout.kind === "checkout" ? (
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={checkout.monthlyHref}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 sm:flex-none"
            >
              Go live for {monthly}
            </a>
            <a href={checkout.yearlyHref} className="text-sm font-medium whitespace-nowrap underline underline-offset-2">
              {formatPrice("yearly")}
            </a>
          </div>
        ) : (
          <p className="shrink-0 text-sm font-semibold">
            Reply to the text to activate
            {checkout.phone && (
              <>
                {" "}
                or call{" "}
                <a href={telHref(checkout.phone) ?? undefined} className="underline underline-offset-2">
                  {checkout.phone}
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
