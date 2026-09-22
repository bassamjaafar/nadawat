import { ArrowLink } from "@/components/ui/arrow-link";
import { DebateCard } from "@/components/debates/debate-card";
import { Reveal } from "@/components/ui/reveal";
import type { DebateSummary } from "@/lib/types";

/** The rest of the archive, below whichever event is in the homepage's hero slot. */
export function RecentDebates({ debates }: { debates: DebateSummary[] }) {
  if (!debates.length) return null;

  return (
    <section aria-labelledby="recent-title" className="container-page section-y">
      <div className="flex items-end justify-between gap-6 border-b border-line pb-5">
        <div className="flex flex-col gap-1">
          <span className="text-kicker font-medium uppercase text-muted">
            الأرشيف
          </span>
          <h2 id="recent-title" className="text-h2 text-ink">
            الفعاليات السابقة
          </h2>
        </div>
        <div className="hidden shrink-0 sm:block">
          <ArrowLink href="/events">عرض جميع الفعاليات</ArrowLink>
        </div>
      </div>

      <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {debates.slice(0, 3).map((d, i) => (
          <Reveal key={d.id} delay={i * 80}>
            <DebateCard debate={d} />
          </Reveal>
        ))}
      </div>

      <div className="mt-10 sm:hidden">
        <ArrowLink href="/events">عرض جميع الفعاليات</ArrowLink>
      </div>
    </section>
  );
}
