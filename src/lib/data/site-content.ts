import "server-only";
import { hasSupabase } from "@/lib/env";
import { getSupabasePublicClient } from "@/lib/supabase/public";

/**
 * Reads one row from the `site_content` table — a small, generic key/value
 * store editable by admins (see supabase migrations). Public, read-only here.
 * Falls back to `null` in demo mode or when the key isn't set, so callers
 * should always define a sensible default behaviour for "unset".
 */
export async function getSiteContentValue(key: string): Promise<unknown> {
  if (!hasSupabase) return null;

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("getSiteContentValue", key, error.message);
    return null;
  }
  return data?.value ?? null;
}
