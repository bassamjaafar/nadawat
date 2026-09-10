/**
 * Global site configuration. Plain constants — safe to import anywhere.
 */

export const SITE_NAME = "ندوات";
export const SITE_NAME_LATIN = "Nadawat";
export const SITE_TAGLINE = "نختلف باحترام";
export const SITE_DESCRIPTION =
  "منصّة عربية للمناظرات المنظّمة والحوار العام الرصين حول القضايا السياسية والاقتصادية والاجتماعية والمدنية في سوريا.";

export const CONTACT_EMAIL = "events@nadawat.org";

/** Canonical origin. Overridden in every environment via NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nadawat.org"
).replace(/\/$/, "");

export type NavItem = { href: string; label: string };

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/debates", label: "المناظرات" },
  { href: "/about", label: "عن ندوات" },
  { href: "/subscribe", label: "اشترك" },
  { href: "/contact", label: "تواصل معنا" },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/debates", label: "المناظرات" },
  { href: "/about", label: "عن ندوات" },
  { href: "/subscribe", label: "اشترك" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/privacy", label: "الخصوصية" },
];
