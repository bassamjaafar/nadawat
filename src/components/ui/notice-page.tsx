import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";

export function NoticePage({
  kicker,
  title,
  children,
  action,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col justify-center py-20">
      <div className="mx-auto max-w-lg text-center">
        {kicker ? (
          <p className="text-kicker font-medium uppercase text-muted">
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-3 text-h1 text-ink">{title}</h1>
        {children ? (
          <div className="mt-4 text-[1.02rem] leading-8 text-muted">
            {children}
          </div>
        ) : null}
        {action ? (
          <div className="mt-8 flex justify-center">
            <ButtonLink href={action.href}>{action.label}</ButtonLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}
