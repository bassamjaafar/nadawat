import Image from "next/image";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/lib/site";

/**
 * Header/footer logo slot.
 *
 * The official logo is an Arabic calligraphic treatment of «ندوات» and will
 * be supplied as an asset. Drop it in `public/brand/` and set
 * `NEXT_PUBLIC_LOGO_URL=/brand/<file>.svg` (SVG or high-quality transparent
 * PNG). Until then a plain wordmark stands in — it is deliberately not a
 * recreation of the calligraphy.
 */
export function Logo({
  className,
  tone = "olive",
}: {
  className?: string;
  tone?: "olive" | "cream";
}) {
  const src = process.env.NEXT_PUBLIC_LOGO_URL;

  if (src) {
    return (
      <Image
        src={src}
        alt={SITE_NAME}
        width={132}
        height={44}
        priority
        className={cn("h-10 w-auto", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "font-display text-[1.6rem] font-semibold leading-none tracking-normal",
        tone === "cream" ? "text-cream" : "text-olive",
        className,
      )}
    >
      {SITE_NAME}
    </span>
  );
}
