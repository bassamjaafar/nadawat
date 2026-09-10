import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { SpeakerLineup } from "@/components/debates/speakers";
import { formatDate, formatTime } from "@/lib/format";
import type { DebateDetail } from "@/lib/types";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
      <dt className="text-kicker font-medium uppercase text-muted">{label}</dt>
      <dd className="text-[1rem] text-ink">{value}</dd>
    </div>
  );
}

export function UpcomingHero({ debate }: { debate: DebateDetail }) {
  const href = `/debates/${debate.slug}`;

  return (
    <section aria-labelledby="upcoming-title" className="container-page pt-10 pb-4 sm:pt-16">
      <p className="text-kicker font-medium uppercase tracking-wide text-clay">
        المناظرة القادمة
      </p>

      {debate.cover_image_url ? (
        <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-[var(--radius-lg)] bg-cream-deep">
          <Image
            src={debate.cover_image_url}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col">
          <h1
            id="upcoming-title"
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
            {debate.starts_at ? (
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
            ) : null}
            {debate.location_ar ? (
              <MetaRow label="المكان" value={debate.location_ar} />
            ) : null}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {debate.registration_open ? (
              <ButtonLink href={`${href}#register`}>سجّل حضورك</ButtonLink>
            ) : (
              <ButtonLink href={href}>تفاصيل المناظرة</ButtonLink>
            )}
            {debate.broadcast_url ? (
              <ButtonLink href={debate.broadcast_url} variant="outline">
                رابط البثّ
              </ButtonLink>
            ) : null}
          </div>
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
