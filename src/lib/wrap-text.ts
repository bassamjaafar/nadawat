/**
 * Manual greedy line-wrapping for social-card titles rendered with next/og
 * (satori). Satori does not correctly right-align wrapped multi-line RTL
 * text (each wrapped line ends up left-aligned regardless of `textAlign`),
 * so titles are pre-split into single-line chunks here and each line is
 * rendered as its own flex row — `justifyContent: "flex-end"` reliably
 * right-aligns a single line.
 */
export function wrapByChars(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const truncated = lines.slice(0, maxLines);
  const last = truncated[maxLines - 1];
  truncated[maxLines - 1] =
    last.length > 1 ? `${last.replace(/[،.:؟!\s]+$/u, "")}…` : last;
  return truncated;
}
