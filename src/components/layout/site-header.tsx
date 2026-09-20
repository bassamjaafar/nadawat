"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { ORG_NAME, PRIMARY_NAV } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled || open
          ? "border-line bg-cream/85 backdrop-blur-md"
          : "border-transparent bg-cream",
      )}
    >
      <div className="container-page flex h-[7rem] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 py-2 pe-2">
          <Logo />
          <span
            aria-hidden="true"
            className="hidden h-8 w-px bg-line-strong sm:block"
          />
          <span className="hidden text-[0.95rem] font-medium leading-tight text-olive sm:block">
            {ORG_NAME}
          </span>
        </Link>

        <nav aria-label="التنقّل الرئيسي" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href);
              const isSubscribe = item.href === "/subscribe";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center rounded-[var(--radius)] px-3 py-2 text-[0.98rem] transition-colors",
                      isSubscribe
                        ? "ms-2 border border-line-strong text-olive hover:border-olive hover:bg-olive/[0.05]"
                        : "text-ink/80 hover:text-olive",
                      active && !isSubscribe && "text-olive",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="relative z-50 -me-2 inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-olive md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "إغلاق القائمة" : "فتح القائمة"}</span>
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            {open ? (
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 top-[7rem] z-40 bg-cream md:hidden"
      >
        <nav aria-label="التنقّل الرئيسي" className="container-page py-6">
          <ul className="flex flex-col divide-y divide-line">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-4 font-display text-2xl",
                    isActive(item.href) ? "text-olive" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
