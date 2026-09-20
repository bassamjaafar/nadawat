import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, SUPABASE_ADMIN_KEY } from "@/lib/env";

/**
 * Privileged Supabase client (service role / secret key). Bypasses RLS —
 * never import this into anything that runs in the browser. Used for writes
 * to `registrations` and `subscribers`, and for token look-ups during
 * double opt-in.
 */
export function getSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
    throw new Error(
      "Supabase admin client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ADMIN_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
