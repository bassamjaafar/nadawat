import { ImageResponse } from "next/og";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/ui/logo-mark-data";
import { loadOgFonts } from "@/lib/og-fonts";
import { SITE_TAGLINE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ندوات — نختلف باحترام";

const OLIVE = "#46543D";
const CREAM = "#F5F0E6";
const GOLD = "#D3A24C";

export default async function Image() {
  const fonts = await loadOgFonts();
  const [, , vbW, vbH] = LOGO_VIEWBOX.split(" ").map(Number);
  const markWidth = 420;
  const markHeight = (vbH / vbW) * markWidth;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
        }}
      >
        <svg
          width={markWidth}
          height={markHeight}
          viewBox={LOGO_VIEWBOX}
          fill={OLIVE}
          fillRule="evenodd"
        >
          {LOGO_PATHS.map((d) => (
            <path key={d.slice(0, 24)} d={d} />
          ))}
        </svg>
        <div
          style={{
            marginTop: 46,
            display: "flex",
            alignItems: "center",
            gap: 22,
            direction: "rtl",
          }}
        >
          <div style={{ width: 44, height: 2, background: GOLD, display: "flex" }} />
          <div
            style={{
              fontFamily: "IBM Plex Sans Arabic",
              fontWeight: 700,
              fontSize: 38,
              color: OLIVE,
              display: "flex",
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div style={{ width: 44, height: 2, background: GOLD, display: "flex" }} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
