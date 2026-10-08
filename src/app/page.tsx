import Link from "next/link";
import { PRODUCT, formatPrice } from "@/config/product";

// Root of the app domain. Not a marketing site (out of scope); just a stub.
export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center bg-cream px-4 text-center">
      <div className="space-y-3">
        <h1 className="font-serif text-4xl">{PRODUCT.name}</h1>
        <p className="text-muted">
          Websites for local businesses. {formatPrice("monthly")} or {formatPrice("yearly")}.
        </p>
        <Link href="/admin" className="text-sm underline">
          Admin
        </Link>
      </div>
    </main>
  );
}
