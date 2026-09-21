/**
 * Global site configuration. Plain constants — safe to import anywhere.
 */

export const SITE_NAME = "ندوات";
export const SITE_NAME_LATIN = "Nadawat";
export const SITE_TAGLINE = "نختلف باحترام";
/** Formal institutional name, set beside the logo mark in the header/footer. */
export const ORG_NAME = "المنتدى السوري للحوار";
export const SITE_DESCRIPTION =
  "ندوات منصة سورية مستقلة وغير ربحية للحوار العام حول القضايا السياسية والاقتصادية والاجتماعية التي تهم السوريين.";

export const CONTACT_EMAIL = "events@nadawat.org";

/**
 * Canonical origin. Overridden in every environment via NEXT_PUBLIC_SITE_URL.
 * `||` (not `??`) deliberately — an env var set to an empty string in a
 * dashboard is common and must fall back too, not just a fully unset one.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://nadawat.org"
).replace(/\/$/, "");

export type NavItem = { href: string; label: string };

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "الفعاليات" },
  { href: "/about", label: "عن ندوات" },
  { href: "/subscribe", label: "اشترك بالتحديثات" },
  { href: "/contact", label: "تواصل معنا" },
];

export const FOOTER_NAV: NavItem[] = [
  { href: "/events", label: "الفعاليات" },
  { href: "/about", label: "عن ندوات" },
  { href: "/subscribe", label: "اشترك بالتحديثات" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/privacy", label: "الخصوصية" },
];
