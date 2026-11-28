import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { SignOutButton } from "@/components/admin/sign-out-button";
import type { AdminRole } from "@/lib/admin/polls";

const FULL_NAV = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/events", label: "الفعاليات" },
  { href: "/admin/people", label: "الأشخاص" },
  { href: "/admin/about", label: "صفحة عن ندوات" },
  { href: "/admin/registrations", label: "طلبات المشاركة" },
  { href: "/admin/subscribers", label: "المشتركون/ات" },
  { href: "/admin/polls", label: "سؤال ندوات" },
];

// A «سؤال ندوات» producer sees only the polls section.
const POLLS_NAV = [{ href: "/admin/polls", label: "سؤال ندوات" }];

export function AdminShell({ role, children }: { role: AdminRole; children: ReactNode }) {
  const nav = role === "admin" ? FULL_NAV : POLLS_NAV;
  return (
    <div dir="rtl" className="min-h-screen bg-cream">
      <header className="border-b border-line bg-[#fffdf7]">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-display text-[1.05rem] font-medium text-olive">
              {SITE_NAME} · لوحة التحكم
            </span>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {nav.map((item) => (
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
          <div className="flex items-center gap-4">
            {role === "polls_only" ? (
              <span className="text-[0.8rem] text-muted">حساب إنتاج «سؤال ندوات»</span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="container-page py-10">{children}</main>
    </div>
  );
}

export function NotAuthorized() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-cream px-6">
      <p className="max-w-sm text-center text-[0.95rem] leading-7 text-muted">
        حسابك مسجَّل الدخول لكنّه غير مخوَّل بالوصول إلى لوحة التحكم.
      </p>
    </div>
  );
}
