import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getAdminRole } from "@/lib/admin/polls";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminShell, NotAuthorized } from "@/components/admin/admin-shell";

/** «سؤال ندوات» admin: full administrators and polls_only producers. */
export default async function PollsAdminLayout({ children }: { children: ReactNode }) {
  if (!hasSupabase) redirect("/admin/login");

  const role = await getAdminRole();
  if (role === null) {
    const {
      data: { user },
    } = await (await getSupabaseServerClient()).auth.getUser();
    if (!user) redirect("/admin/login");
    return <NotAuthorized />;
  }
  return <AdminShell role={role}>{children}</AdminShell>;
}
