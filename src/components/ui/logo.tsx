import Image from "next/image";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/lib/site";

/**
 * Header/footer logo slot — the official calligraphic «ندوات» mark.
 *
 * Shipped as two flat-colour PNGs sharing one alpha mask (public/brand/):
 * olive ink for light backgrounds (header) and cream ink for dark
 * backgrounds (footer, brand band). Override either via
 * NEXT_PUBLIC_LOGO_URL / NEXT_PUBLIC_LOGO_URL_CREAM if the asset changes —
 * e.g. once a true vector (path-based) export exists.
 */
const DEFAULT_LOGO_OLIVE = "/brand/nadawat-logo.png";
const DEFAULT_LOGO_CREAM = "/brand/nadawat-logo-cream.png";

// Intrinsic aspect ratio of the source artwork (2200×1008) — keeps layout
// stable regardless of the rendered size set via className.
const INTRINSIC_WIDTH = 275;
const INTRINSIC_HEIGHT = 126;

export function Logo({
  className,
  tone = "olive",
}: {
  className?: string;
  tone?: "olive" | "cream";
}) {
  const src =
    tone === "cream"
      ? (process.env.NEXT_PUBLIC_LOGO_URL_CREAM ?? DEFAULT_LOGO_CREAM)
      : (process.env.NEXT_PUBLIC_LOGO_URL ?? DEFAULT_LOGO_OLIVE);

  return (
    <Image
      src={src}
      alt={SITE_NAME}
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      priority
      className={cn("h-9 w-auto", className)}
    />
  );
}
