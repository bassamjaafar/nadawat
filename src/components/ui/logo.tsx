import Image from "next/image";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/ui/logo-mark";
import { SITE_NAME } from "@/lib/site";

/**
 * Header/footer logo slot — the official calligraphic «ندوات» mark.
 *
 * Renders the real vector paths (LogoMark) with `fill="currentColor"`, so a
 * single asset serves both the olive header and the cream footer via the
 * `tone` prop / a `text-*` className — no separate light/dark files needed.
 * NEXT_PUBLIC_LOGO_URL / _CREAM can still override with an external image
 * (e.g. a raster) if the mark is ever swapped for a different asset.
 */
const INTRINSIC_WIDTH = 275;
const INTRINSIC_HEIGHT = 126;

export function Logo({
  className,
  tone = "olive",
}: {
  className?: string;
  tone?: "olive" | "cream";
}) {
  const overrideSrc =
    tone === "cream"
      ? process.env.NEXT_PUBLIC_LOGO_URL_CREAM
      : process.env.NEXT_PUBLIC_LOGO_URL;

  if (overrideSrc) {
    return (
      <Image
        src={overrideSrc}
        alt={SITE_NAME}
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        priority
        className={cn("h-[4.5rem] w-auto", className)}
      />
    );
  }

  return (
    <LogoMark
      className={cn(
        "h-[4.5rem] w-auto",
        tone === "cream" ? "text-cream" : "text-olive",
        className,
      )}
    />
  );
}
