import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getAdminRole } from "@/lib/admin/polls";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell, NotAuthorized } from "@/components/admin/admin-shell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!hasSupabase) {
    redirect("/admin/login");
  }

  // Authoritative authorization check — the middleware only verified this is
  // a real, logged-in Supabase user, not that they're an admin. is_admin()
  // and can_manage_polls() run under the signed-in user's own RLS context,
  // so they can't be spoofed from the client.
  const role = await getAdminRole();
  if (role === null) {
    // Either not signed in (middleware normally catches this) or no admin row.
    const {
      data: { user },
    } = await (await getSupabaseServerClient()).auth.getUser();
    if (!user) redirect("/admin/login");
    return <NotAuthorized />;
  }

  // Everything under (protected) is for full administrators. A «سؤال ندوات»
  // producer is sent to the polls section — the only one they may open (the
  // database refuses them everything else in any case).
  if (role === "polls_only") {
    redirect("/admin/polls");
  }

  return <AdminShell role={role}>{children}</AdminShell>;
}
