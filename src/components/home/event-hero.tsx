import { ButtonLink } from "@/components/ui/button";
import { SpeakerLineup } from "@/components/debates/speakers";
import { WatchButtons, hasWatchLinks } from "@/components/debates/watch-buttons";
import { formatDate, formatTime } from "@/lib/format";
import { isUpcoming, pastEventCtaLabel, type DebateDetail } from "@/lib/types";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
      <dt className="text-kicker font-medium uppercase text-muted">{label}</dt>
      <dd className="text-[1rem] text-ink">{value}</dd>
    </div>
  );
}

/**
 * The homepage's single, always-present prominent event slot: the soonest
 * upcoming event if one is scheduled, otherwise the most recently completed
 * one. Same hero-level treatment either way — the only differences are the
 * kicker label, the meta row (date/time/location vs. just a publish date),
 * and the actions (watch live / take part vs. watch the recording).
 */
export function EventHero({ debate }: { debate: DebateDetail }) {
  const href = `/events/${debate.slug}`;
  const upcoming = isUpcoming(debate);
  const watching = hasWatchLinks(debate);

  return (
    <section aria-labelledby="event-hero-title" className="container-page pt-10 pb-4 sm:pt-16">
      <p className="text-kicker font-medium uppercase tracking-wide text-clay">
        {upcoming ? "الندوة القادمة" : "آخر ندوة"}
      </p>

      <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col">
          <h1
            id="event-hero-title"
            className="text-display font-semibold text-ink [text-wrap:balance]"
          >
            {debate.title_ar}
          </h1>

          {debate.summary_ar ? (
            <p className="mt-5 max-w-[40rem] text-body-lg leading-9 text-muted">
              {debate.summary_ar}
            </p>
          ) : null}

          <dl className="mt-8 max-w-md divide-y divide-line border-y border-line">
            {upcoming && debate.starts_at ? (
              <>
                <MetaRow
                  label="التاريخ"
                  value={formatDate(debate.starts_at, debate.timezone)}
                />
                <MetaRow
                  label="الوقت"
                  value={`${formatTime(debate.starts_at, debate.timezone)} بتوقيت دمشق`}
                />
              </>
            ) : debate.starts_at ? (
              <MetaRow
                label="نُشرت"
                value={formatDate(debate.starts_at, debate.timezone)}
              />
            ) : null}
            {upcoming && debate.location_ar ? (
              <MetaRow label="المكان" value={debate.location_ar} />
            ) : null}
          </dl>

          {upcoming ? (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                <WatchButtons debate={debate} />
                {debate.registration_open ? (
                  <ButtonLink
                    href={`${href}#participate`}
                    variant={watching ? "outline" : "primary"}
                  >
                    شارك في الحوار
                  </ButtonLink>
                ) : null}
                {!watching && !debate.registration_open ? (
                  <ButtonLink href={href}>تفاصيل الندوة</ButtonLink>
                ) : null}
              </div>
              <p className="mt-4 text-[0.9rem] leading-7 text-muted">
                المشاهدة مفتوحة للجميع ولا تحتاج إلى تسجيل.
              </p>
            </>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={href}>{pastEventCtaLabel(debate)}</ButtonLink>
            </div>
          )}
        </div>

        <div className="lg:ps-8 lg:border-s lg:border-line">
          <SpeakerLineup
            participants={debate.participants}
            moderator={debate.moderator}
          />
        </div>
      </div>
    </section>
  );
}
