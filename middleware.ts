import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase, env } from "@/lib/env";

/**
 * Guards /admin/*. This only checks *authentication* (is there a valid
 * session?) — it deliberately does not check the is_admin() role, since that
 * needs a Postgres round trip and middleware runs on every matched request.
 * The admin layout does the authoritative is_admin() check server-side as a
 * second layer, so a logged-in-but-not-admin user still can't see anything.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  // Recovery links land here with the session only in a URL fragment, which
  // this server-side check can never see — the page itself establishes the
  // session client-side, so it has to be reachable either way.
  const isSetPasswordPage = pathname === "/admin/set-password";

  if (!hasSupabase) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isSetPasswordPage) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Talks to Supabase Auth to validate the session token — unlike reading the
  // cookie's contents directly, this can't be spoofed by a tampered cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
