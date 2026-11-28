import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PillTone = "good" | "muted" | "warn" | "bad";

const TONE: Record<PillTone, string> = {
  good: "border-[#c9d5bf] bg-[#eef2ea] text-olive",
  muted: "border-line bg-cream-deep text-muted",
  warn: "border-[#e3cf9f] bg-[#f8eed6] text-[#7a5a14]",
  bad: "border-[#d8b9ad] bg-[#f3e4de] text-[#8f3520]",
};

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.8rem] font-medium whitespace-nowrap",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}
