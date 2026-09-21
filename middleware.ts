import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Without keys the app runs in demo mode; pages render the setup banner instead.
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/signin";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!(profile as { is_admin: boolean } | null)?.is_admin) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/";
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}

export const config = {
  matcher: ["/upload/:path*", "/history/:path*", "/subscriptions/:path*", "/admin/:path*"],
};
