import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|stock/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  return adminGate(req);
}

// Refreshes the Supabase session cookie and keeps everyone but ADMIN_EMAIL out
// of /admin. Pages and actions check again on the server.
async function adminGate(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) req.cookies.set(name, value);
          res = NextResponse.next({ request: req });
          for (const { name, value, options } of toSet) res.cookies.set(name, value, options);
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  const isAdmin = !!email && email === process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isLogin = req.nextUrl.pathname === "/admin/login";

  if (!isAdmin && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (isAdmin && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return res;
}
