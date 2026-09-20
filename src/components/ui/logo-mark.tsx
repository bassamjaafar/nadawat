import type { SVGProps } from "react";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/ui/logo-mark-data";

/**
 * The official «ندوات» calligraphic mark, as real vector paths. Inlined
 * (not an <img>) so `fill="currentColor"` picks up the CSS `color` of
 * whatever className is applied — one asset serves both the olive header
 * and the cream footer. See public/brand/nadawat-logo.svg for a static copy.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      fillRule="evenodd"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ندوات"
      {...props}
    >
      {LOGO_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}
