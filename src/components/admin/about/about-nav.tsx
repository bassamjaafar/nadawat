"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/about", label: "محتوى الصفحة", match: (p: string) => p === "/admin/about" || p.startsWith("/admin/about/sections") },
  { href: "/admin/about/groups", label: "المجموعات", match: (p: string) => p.startsWith("/admin/about/groups") },
  { href: "/admin/about/members", label: "الأعضاء", match: (p: string) => p.startsWith("/admin/about/members") },
  { href: "/admin/about/preview", label: "معاينة", match: (p: string) => p.startsWith("/admin/about/preview") },
];

export function AboutNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام إدارة صفحة عن ندوات" className="flex flex-wrap gap-x-1 gap-y-2 border-b border-line">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[0.95rem] transition-colors",
              active
                ? "border-olive font-medium text-olive"
                : "border-transparent text-ink/75 hover:text-olive",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
