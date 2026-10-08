import { PRODUCT } from "@/config/product";
import { login } from "./actions";

export const metadata = { title: `Admin login · ${PRODUCT.name}`, robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center bg-stone-100 px-4">
      <form action={login} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">{PRODUCT.name} admin</h1>
        {error && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input mt-1"
          />
        </label>
        <button className="btn-primary w-full">Log in</button>
      </form>
    </main>
  );
}
