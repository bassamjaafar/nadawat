import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { SITE_NAME } from "@/lib/site";
import { SignOutButton } from "@/components/admin/sign-out-button";

const ADMIN_NAV = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/events", label: "الفعاليات" },
  { href: "/admin/registrations", label: "التسجيلات" },
  { href: "/admin/subscribers", label: "المشتركون" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!hasSupabase) {
    redirect("/admin/login");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Authoritative authorization check — the middleware only verified this is
  // a real, logged-in Supabase user, not that they're an admin. This RPC
  // calls the is_admin() Postgres function under the signed-in user's own
  // RLS context, so it can't be spoofed from the client.
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-cream px-6">
        <p className="max-w-sm text-center text-[0.95rem] leading-7 text-muted">
          حسابك مسجَّل الدخول لكنّه غير مخوَّل بالوصول إلى لوحة التحكم.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-cream">
      <header className="border-b border-line bg-[#fffdf7]">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-[1.05rem] font-medium text-olive">
              {SITE_NAME} · لوحة التحكم
            </span>
            <nav className="flex items-center gap-4">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[0.9rem] text-ink/80 transition-colors hover:text-olive"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="container-page py-10">{children}</main>
    </div>
  );
}
