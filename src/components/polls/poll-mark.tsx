import type { SVGProps } from "react";
import { POLL_TEXT } from "@/lib/polls/text";
import { cn } from "@/lib/cn";

const BUBBLE =
  "M10 5h28a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-3.5l3.2 8.2L28 35H10a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6Z";
// «؟» from IBM Plex Sans Arabic Bold, as a path so the mark never depends on
// a web font having loaded.
const QUESTION_MARK =
  "M25.98 23.03L22.70 23.03L22.70 21.21Q21.71 21.10 20.83 20.71Q19.94 20.32 19.27 19.67Q18.59 19.02 18.19 18.17Q17.79 17.31 17.79 16.29L17.79 16.29Q17.79 14.99 18.22 13.94Q18.64 12.89 19.45 12.15Q20.26 11.41 21.36 11.02Q22.47 10.63 23.84 10.63L23.84 10.63Q25.17 10.63 26.20 10.98Q27.22 11.33 27.99 11.90Q28.76 12.47 29.30 13.19Q29.85 13.90 30.21 14.63L30.21 14.63L26.65 16.48Q26.52 16.16 26.28 15.85Q26.03 15.54 25.64 15.29Q25.25 15.05 24.73 14.88Q24.21 14.71 23.53 14.71L23.53 14.71Q22.52 14.71 21.79 15.16Q21.06 15.62 21.06 16.53L21.06 16.53Q21.06 17.13 21.32 17.58Q21.58 18.04 22.17 18.35Q22.75 18.66 23.69 18.84Q24.62 19.02 25.98 19.05L25.98 19.05L25.98 23.03ZM24.36 29.37L24.36 29.37Q23.19 29.37 22.64 28.79Q22.08 28.20 22.08 27.29L22.08 27.29L22.08 26.77Q22.08 25.86 22.64 25.28Q23.19 24.69 24.36 24.69L24.36 24.69Q25.53 24.69 26.09 25.28Q26.65 25.86 26.65 26.77L26.65 26.77L26.65 27.29Q26.65 28.20 26.09 28.79Q25.53 29.37 24.36 29.37Z";

/** The «سؤال ندوات» mark: an olive speech bubble carrying «؟». */
export function PollMark({
  inverse = false,
  ...props
}: SVGProps<SVGSVGElement> & { inverse?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path d={BUBBLE} className={inverse ? "fill-cream" : "fill-olive"} />
      <path d={QUESTION_MARK} className={inverse ? "fill-olive" : "fill-cream"} />
    </svg>
  );
}

/** Mark + name, optionally with the tagline underneath. */
export function PollLockup({
  tagline = true,
  size = "md",
  className,
}: {
  tagline?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PollMark className={size === "sm" ? "size-7 shrink-0" : "size-9 shrink-0"} />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display font-bold text-olive",
            size === "sm" ? "text-[0.98rem]" : "text-[1.08rem]",
          )}
        >
          {POLL_TEXT.name}
        </span>
        {tagline ? (
          <span className="text-[0.8rem] text-muted">{POLL_TEXT.tagline}</span>
        ) : null}
      </div>
    </div>
  );
}
