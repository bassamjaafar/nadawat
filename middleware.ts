import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  createVoterCookie,
  pollSecret,
  verifyVoterCookie,
  VOTER_COOKIE,
  VOTER_COOKIE_MAX_AGE,
} from "@/lib/polls/voter-cookie";

/**
 * /vote and /vote/ballot (the event pages' ballot): make sure the browser has
 * a signed «سؤال ندوات» voter cookie before it can vote. Only on GET/HEAD —
 * the vote itself (a POST) must arrive with a cookie issued earlier, or a
 * script could get a fresh identity with every submission.
 */
async function ensureVoterCookie(request: NextRequest) {
  const secret = pollSecret();
  const isRead = request.method === "GET" || request.method === "HEAD";
  if (
    !secret ||
    !isRead ||
    (await verifyVoterCookie(request.cookies.get(VOTER_COOKIE)?.value, secret))
  ) {
    return NextResponse.next();
  }

  const value = await createVoterCookie(secret);
  // Also set it on the request, so this same page render already sees it.
  request.cookies.set(VOTER_COOKIE, value);
  const response = NextResponse.next({ request });
  response.cookies.set(VOTER_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/vote",
    maxAge: VOTER_COOKIE_MAX_AGE,
  });
  return response;
}

/**
 * Guards /admin/*. This only checks *authentication* (is there a valid
 * session?) — it deliberately does not check the is_admin() role, since that
 * needs a Postgres round trip and middleware runs on every matched request.
 * The admin layout does the authoritative is_admin() check server-side as a
 * second layer, so a logged-in-but-not-admin user still can't see anything.
 *
 * Reads process.env directly rather than the shared `env` module: an earlier
 * version routed through `@/lib/env`'s `hasSupabase` flag and, in Vercel's
 * Edge Middleware runtime specifically, that flag came back false even
 * though the exact same env vars were clearly working everywhere else on
 * the site — redirecting every /admin/* request straight to "/". Reading
 * the two vars directly here sidesteps whatever that was.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/vote" || pathname === "/vote/ballot") {
    return ensureVoterCookie(request);
  }

  const isLoginPage = pathname === "/admin/login";
  // Recovery links land here with the session only in a URL fragment, which
  // this server-side check can never see — the page itself establishes the
  // session client-side, so it has to be reachable either way.
  const isSetPasswordPage = pathname === "/admin/set-password";

  if (isSetPasswordPage) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase genuinely isn't configured in this environment — nothing
    // under /admin can work, so send visitors to the login page rather than
    // silently bouncing them to "/", which just looks like a broken link.
    return isLoginPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

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
  matcher: ["/admin/:path*", "/vote", "/vote/ballot"],
};
