import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { FOOTER_NAV, ORG_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { formatYear } from "@/lib/format";

export function SiteFooter() {
  const year = formatYear(new Date());

  return (
    <footer className="mt-auto bg-olive text-cream/85">
      <div className="container-page section-y-sm">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Logo tone="cream" />
              <span
                aria-hidden="true"
                className="h-7 w-px bg-cream/25"
              />
              <span className="text-[0.9rem] font-medium leading-tight text-cream/85">
                {ORG_NAME}
              </span>
            </div>
            <p className="mt-4 text-[0.95rem] leading-7 text-cream/70">
              {SITE_NAME} منصّة للندوات المنظّمة والحوار العام حول الشأن
              السوري. {SITE_TAGLINE}.
            </p>
          </div>

          <nav aria-label="روابط أساسية">
            <ul className="flex flex-col gap-3 text-[0.95rem]">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-cream/75 transition-colors hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-[0.95rem]">
            <p className="text-cream/60">للتواصل والملاحظات</p>
            <Link
              href="/contact"
              className="mt-1 inline-block text-cream underline decoration-cream/30 underline-offset-4 hover:decoration-cream"
            >
              راسلنا من هنا
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-cream/15 pt-6 text-[0.85rem] text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <span className="ltr-nums">{year}</span> {SITE_NAME}. جميع الحقوق
            محفوظة.
          </p>
          <Link href="/privacy" className="hover:text-cream/80">
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </footer>
  );
}
