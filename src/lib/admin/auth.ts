import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * For Route Handlers, which — unlike pages — aren't wrapped by the
 * (protected) layout's own auth check. Returns the authenticated,
 * RLS-bound client only when the caller is a real admin; null otherwise.
 */
export async function requireAdminClient() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? supabase : null;
}
