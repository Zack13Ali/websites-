import Link from "next/link";
import { PRODUCT } from "@/config/product";
import { requireAdminPage } from "@/lib/auth";
import { logout } from "../login/actions";

export const metadata = { title: `Admin · ${PRODUCT.name}`, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            {PRODUCT.name}
          </Link>
          <nav className="flex gap-4 text-sm text-stone-600">
            <Link href="/admin" className="hover:text-stone-900">
              Businesses
            </Link>
            <Link href="/admin/new" className="hover:text-stone-900">
              Add one
            </Link>
            <Link href="/admin/import" className="hover:text-stone-900">
              Import CSV
            </Link>
            <Link href="/admin/templates" className="hover:text-stone-900">
              Templates
            </Link>
          </nav>
          <form action={logout} className="ml-auto flex items-center gap-3 text-sm text-stone-500">
            <span className="hidden sm:inline">{user.email}</span>
            <button className="btn">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
