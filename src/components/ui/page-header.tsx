import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: ReactNode;
}) {
  return (
    <header className="container-page border-b border-line pt-14 pb-8 sm:pt-20">
      {kicker ? (
        <p className="text-kicker font-medium uppercase text-muted">{kicker}</p>
      ) : null}
      <h1 className="mt-2 text-h1 text-ink">{title}</h1>
      {lede ? (
        <p className="mt-4 max-w-[44rem] text-body-lg leading-9 text-muted">
          {lede}
        </p>
      ) : null}
    </header>
  );
}
