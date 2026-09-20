"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Supabase client for Client Components (the admin login/password forms).
 * Session writes go through the browser's cookie jar in the same format the
 * server client reads, so a sign-in here is immediately visible server-side.
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
