import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cookie-less anon client for reading public, published content. Safe to use in
 * `generateStaticParams`, `sitemap.ts` and cached Server Components — it carries
 * no auth context, so RLS treats every request as `anon`. Only call when
 * `hasSupabase` is true.
 */
export function getSupabasePublicClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
