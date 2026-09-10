import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Text link with a directional arrow. In RTL "forward" points left (←);
 * the arrow nudges toward the reading direction on hover.
 */
export function ArrowLink({
  href,
  children,
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-medium text-olive",
        "underline decoration-line-strong decoration-1 underline-offset-4",
        "transition-colors hover:decoration-olive",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1"
        fill="none"
      >
        <path
          d="M10 3 5 8l5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
