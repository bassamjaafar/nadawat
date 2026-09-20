import { ImageResponse } from "next/og";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/ui/logo-mark-data";
import { loadOgFonts } from "@/lib/og-fonts";
import { getDebateBySlug } from "@/lib/data/debates";
import { SITE_NAME } from "@/lib/site";
import { wrapByChars } from "@/lib/wrap-text";

// Only rendered as a fallback: pages with a real photo (YouTube thumbnail or
// cover image) set openGraph.images explicitly in generateMetadata, which
// takes precedence over this file. This covers upcoming debates with no
// photo yet, so no debate page ever shares with a blank card.
//
// Text is centred rather than right-aligned throughout: satori (next/og's
// renderer) does not support Unicode bidi layout, and neither textAlign nor
// justifyContent reliably right-align Arabic text — every attempt collapses
// to a centred result regardless of the flex properties used, confirmed
// against vercel/satori's own documented RTL limitation. Centred title/kicker
// sidesteps the bug entirely and reads perfectly well on a social card.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OLIVE = "#46543D";
const CREAM = "#F5F0E6";
const CLAY = "#C97A5A";
const CONTENT_WIDTH = 1040;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const debate = await getDebateBySlug(slug);
  const fonts = await loadOgFonts();

  const [, , vbW, vbH] = LOGO_VIEWBOX.split(" ").map(Number);
  const markWidth = 170;
  const markHeight = (vbH / vbW) * markWidth;

  const kicker = debate
    ? debate.status === "upcoming"
      ? "ندوة قادمة"
      : "من أرشيف ندوات"
    : SITE_NAME;
  const title = debate?.title_ar ?? SITE_NAME;
  const titleLines = wrapByChars(title, 30, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: CREAM,
          paddingTop: 64,
          paddingBottom: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: CONTENT_WIDTH,
            fontFamily: "IBM Plex Sans Arabic",
            fontWeight: 700,
            fontSize: 26,
            color: CLAY,
            direction: "rtl",
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: CONTENT_WIDTH,
            gap: 10,
          }}
        >
          {titleLines.map((line) => (
            <div
              key={line}
              style={{
                display: "flex",
                justifyContent: "center",
                width: CONTENT_WIDTH,
                fontFamily: "IBM Plex Sans Arabic",
                fontWeight: 700,
                fontSize: 54,
                lineHeight: 1.5,
                color: OLIVE,
                direction: "rtl",
                textAlign: "center",
              }}
            >
              {line}
            </div>
          ))}
        </div>

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
      </div>
    ),
    { ...size, fonts },
  );
}
