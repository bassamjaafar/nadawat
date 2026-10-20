import { ArrowLink } from "@/components/ui/arrow-link";
import { DebateCard } from "@/components/debates/debate-card";
import { Reveal } from "@/components/ui/reveal";
import type { DebateSummary } from "@/lib/types";

/** The rest of the archive, below whichever event is in the homepage's hero slot. */
export function RecentDebates({ debates }: { debates: DebateSummary[] }) {
  if (!debates.length) return null;

  return (
    // Same top padding as .section-y; the bottom is tighter on larger screens
    // (56px on phones, up to 64px on desktop instead of 112px) so the cards
    // lead into «لماذا ندوات» below without a large empty band.
    <section
      aria-labelledby="recent-title"
      className="container-page pt-[clamp(3.5rem,8vw,7rem)] pb-[clamp(3.5rem,5vw,4rem)]"
    >
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

      {/* Cards share the grid's rows (subgrid) so dates, titles, speaker
          lines and the «مشاهدة الندوة» links line up across each row. Row
          spacing between stacked cards is padding, not gap-y, because a
          row gap would also open up inside each card. */}
      <div className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {debates.slice(0, 3).map((d, i) => (
          <Reveal
            key={d.id}
            delay={i * 80}
            className="row-span-5 grid grid-rows-subgrid pb-12 last:pb-0 lg:pb-0"
          >
            <DebateCard debate={d} subgrid />
          </Reveal>
        ))}
      </div>

      <div className="mt-10 sm:hidden">
        <ArrowLink href="/events">عرض جميع الفعاليات</ArrowLink>
      </div>
    </section>
  );
}
