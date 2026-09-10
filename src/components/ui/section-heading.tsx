import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Quiet section header: a short kicker over a display heading, separated
 * from the content above by a hairline rather than a coloured block.
 */
export function SectionHeading({
  kicker,
  title,
  children,
  align = "start",
  className,
}: {
  kicker?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {kicker ? (
        <span className="text-kicker font-medium uppercase text-muted">
          {kicker}
        </span>
      ) : null}
      <h2 className="text-h2 text-ink">{title}</h2>
      {children ? (
        <div className="max-w-[42rem] text-muted [text-wrap:pretty]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
