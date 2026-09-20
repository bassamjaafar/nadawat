import Link from "next/link";
import { ArrowLink } from "@/components/ui/arrow-link";
import { DebateCard, DebateThumb } from "@/components/debates/debate-card";
import { Reveal } from "@/components/ui/reveal";
import { formatDateShort } from "@/lib/format";
import type { DebateSummary } from "@/lib/types";

export function RecentDebates({
  debates,
  variant = "grid",
}: {
  debates: DebateSummary[];
  variant?: "grid" | "feature";
}) {
  if (!debates.length) return null;

  return (
    <section aria-labelledby="recent-title" className="container-page section-y">
      <div className="flex items-end justify-between gap-6 border-b border-line pb-5">
        <div className="flex flex-col gap-1">
          <span className="text-kicker font-medium uppercase text-muted">
            الأرشيف
          </span>
          <h2 id="recent-title" className="text-h2 text-ink">
            {variant === "feature" ? "أحدث ندوة" : "الفعاليات السابقة"}
          </h2>
        </div>
        <div className="hidden shrink-0 sm:block">
          <ArrowLink href="/events">عرض جميع الفعاليات</ArrowLink>
        </div>
      </div>

      {variant === "feature" ? (
        <FeatureDebate debate={debates[0]} />
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {debates.slice(0, 3).map((d, i) => (
            <Reveal key={d.id} delay={i * 80}>
              <DebateCard debate={d} />
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-10 sm:hidden">
        <ArrowLink href="/events">عرض جميع الفعاليات</ArrowLink>
      </div>
    </section>
  );
}

function FeatureDebate({ debate }: { debate: DebateSummary }) {
  const href = `/events/${debate.slug}`;
  return (
    <article className="group mt-10 grid gap-8 md:grid-cols-2 md:items-center">
      <Link href={href} aria-hidden="true" tabIndex={-1}>
        <DebateThumb debate={debate} priority />
      </Link>
      <div>
        <p className="text-meta text-muted">
          {debate.starts_at
            ? formatDateShort(debate.starts_at, debate.timezone)
            : ""}
        </p>
        <h3 className="mt-2 text-h2 text-ink">
          <Link href={href} className="transition-colors hover:text-olive">
            {debate.title_ar}
          </Link>
        </h3>
        {debate.summary_ar ? (
          <p className="mt-3 text-[1rem] leading-8 text-muted">
            {debate.summary_ar}
          </p>
        ) : null}
        <div className="mt-5">
          <ArrowLink href={href}>شاهد الندوة</ArrowLink>
        </div>
      </div>
    </article>
  );
}
