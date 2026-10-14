import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SocialLinks } from "@/components/ui/social-icons";
import { FOOTER_NAV, ORG_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { formatYear } from "@/lib/format";

/**
 * Centred, single-column footer. Hierarchy, top to bottom:
 * brand identity → slogan → description → social links, then the
 * secondary nav and the copyright line.
 */
export function SiteFooter() {
  const year = formatYear(new Date());

  return (
    <footer className="mt-auto bg-olive text-cream/85">
      <div className="container-page pt-12 pb-6 sm:pt-14">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <Logo tone="cream" />
            <span aria-hidden="true" className="h-7 w-px bg-cream/25" />
            <span className="text-[0.9rem] font-medium leading-tight text-cream/85">
              {ORG_NAME}
            </span>
          </div>

          <p className="mt-[18px] font-display text-[1.3rem] font-medium leading-snug text-cream">
            {SITE_TAGLINE}
          </p>

          <p className="mt-[30px] max-w-[600px] text-[1.125rem] leading-8 text-cream/[0.78] [text-wrap:balance]">
            منصة للندوات المنظّمة والحوار العام حول الشأن السوري.
          </p>

          <SocialLinks className="mt-8 justify-center text-cream/70" />

          <nav aria-label="روابط أساسية" className="mt-10">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.95rem]">
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
        </div>

        <div className="mt-8 border-t border-cream/15 pt-5 text-center text-[0.85rem] text-cream/55">
          <p>
            © <span className="ltr-nums">{year}</span> {SITE_NAME}. جميع الحقوق
            محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
