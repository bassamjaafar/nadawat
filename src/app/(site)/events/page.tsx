import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLink } from "@/components/ui/arrow-link";
import { DebateThumb } from "@/components/debates/debate-card";
import { Reveal } from "@/components/ui/reveal";
import {
  getArchiveDebates,
  getUpcomingDebate,
} from "@/lib/data/debates";
import { formatDateShort, formatYear } from "@/lib/format";
import { pastEventCtaLabel, type DebateSummary } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "الفعاليات",
  description:
    "أرشيف فعاليات ندوات: نقاشات منظّمة حول قضايا سياسية واقتصادية واجتماعية ومدنية تخصّ سوريا.",
  alternates: { canonical: "/events" },
};

function groupByYear(debates: DebateSummary[]) {
  const groups: { year: string; items: DebateSummary[] }[] = [];
  for (const d of debates) {
    const year = d.starts_at ? formatYear(d.starts_at, d.timezone) : "—";
    const last = groups.at(-1);
    if (last && last.year === year) last.items.push(d);
    else groups.push({ year, items: [d] });
  }
  return groups;
}

export default async function DebatesPage() {
  const [archive, upcoming] = await Promise.all([
    getArchiveDebates(),
    getUpcomingDebate(),
  ]);
  const groups = groupByYear(archive);

  return (
    <div className="pb-24">
      <PageHeader
        title="الفعاليات"
        lede="سجلٌّ دائم لفعاليات ندوات. كلّ ندوة صفحةٌ ثابتة تحفظ موضوعها والضيوف والتسجيل الكامل."
      />

      {upcoming ? (
        <section className="container-page section-y-sm border-b border-line">
          <p className="text-kicker font-medium uppercase text-clay">
            الندوة القادمة
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
            <Link
              href={`/events/${upcoming.slug}`}
              aria-hidden="true"
              tabIndex={-1}
              className="group block sm:max-w-sm"
            >
              <DebateThumb debate={upcoming} />
            </Link>
            <div>
              <h2 className="text-h2 text-ink">
                <Link
                  href={`/events/${upcoming.slug}`}
                  className="transition-colors hover:text-olive"
                >
                  {upcoming.title_ar}
                </Link>
              </h2>
              {upcoming.starts_at ? (
                <p className="mt-2 text-meta text-muted">
                  {formatDateShort(upcoming.starts_at, upcoming.timezone)}
                </p>
              ) : null}
              <div className="mt-4">
                <ArrowLink href={`/events/${upcoming.slug}`}>
                  المشاهدة والمشاركة
                </ArrowLink>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {groups.length === 0 ? (
        <p className="container-page section-y text-muted">
          لا توجد ندوات منشورة بعد.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.year} className="container-page">
            <h2 className="ltr-nums mt-14 mb-2 font-display text-[0.95rem] font-medium text-muted">
              {group.year}
            </h2>
            <ul className="divide-y divide-line border-t border-line">
              {group.items.map((d) => (
                <li key={d.id}>
                  <Reveal>
                    <ArchiveRow debate={d} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function ArchiveRow({ debate }: { debate: DebateSummary }) {
  const href = `/events/${debate.slug}`;
  return (
    <article className="group grid gap-5 py-8 sm:grid-cols-[13rem_1fr] sm:gap-7">
      <Link href={href} aria-hidden="true" tabIndex={-1} className="block">
        <DebateThumb debate={debate} />
      </Link>
      <div className="flex flex-col">
        <p className="text-meta text-muted">
          {debate.starts_at
            ? formatDateShort(debate.starts_at, debate.timezone)
            : ""}
        </p>
        <h3 className="mt-1.5 text-h3 text-ink">
          <Link href={href} className="transition-colors hover:text-olive">
            {debate.title_ar}
          </Link>
        </h3>
        {debate.speakers.length ? (
          <p className="mt-1.5 text-meta text-muted">
            {debate.speakers.map((s) => s.name_ar).join("  و  ")}
          </p>
        ) : null}
        {debate.summary_ar ? (
          <p className="mt-3 max-w-[42rem] text-[0.95rem] leading-7 text-muted">
            {debate.summary_ar}
          </p>
        ) : null}
        <div className="mt-4">
          <ArrowLink href={href}>{pastEventCtaLabel(debate)}</ArrowLink>
        </div>
      </div>
    </article>
  );
}
