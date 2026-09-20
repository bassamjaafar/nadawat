"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="text-[0.9rem] text-muted transition-colors hover:text-olive"
    >
      تسجيل الخروج
    </button>
  );
}
