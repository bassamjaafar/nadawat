import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Fonts for next/og ImageResponse (satori). Vendored locally rather than
 * fetched at request time. Note: Reem Kufi's OpenType substitution table
 * (contextual GSUB) is NOT supported by satori and throws at render time —
 * IBM Plex Sans Arabic shapes and orders Arabic text correctly, so social
 * cards use it instead of the site's display face.
 */
export async function loadOgFonts() {
  const dir = join(process.cwd(), "src/app/opengraph-image-fonts");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "IBMPlexSansArabic-Regular.ttf")),
    readFile(join(dir, "IBMPlexSansArabic-Bold.ttf")),
  ]);
  return [
    {
      name: "IBM Plex Sans Arabic",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "IBM Plex Sans Arabic",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}
