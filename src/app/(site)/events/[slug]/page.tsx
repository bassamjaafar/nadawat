import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { YouTubeEmbed } from "@/components/debates/youtube-embed";
import { ParticipantProfiles } from "@/components/debates/speakers";
import { DebateCard } from "@/components/debates/debate-card";
import { WatchButtons, hasWatchLinks } from "@/components/debates/watch-buttons";
import { ParticipateForm } from "@/components/forms/participate-form";
import { ArrowLink } from "@/components/ui/arrow-link";
import {
  getDebateBySlug,
  getPublishedDebateSlugs,
  getRelatedDebates,
} from "@/lib/data/debates";
import { formatDate, formatTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/url";
import { youtubeShareImage } from "@/lib/youtube";
import { eventPhase } from "@/lib/types";
import { SITE_NAME } from "@/lib/site";
import { PollEventPanel, promoState } from "@/components/polls/poll-promo";
import { getPollForDebate, getPublishedResults } from "@/lib/data/polls";
import { env } from "@/lib/env";

// Short, so the page turns live (and back) within about a minute.
export const revalidate = 60;

// The page's share image and video cover are the same file: looked up once.
const eventImage = cache(youtubeShareImage);

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedDebateSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const debate = await getDebateBySlug(slug);
  if (!debate) return { title: "ندوة غير موجودة" };

  const description =
    debate.summary_ar ?? debate.description_ar?.slice(0, 160) ?? undefined;
  // Share image: full-resolution YouTube thumbnail when available (falls
  // back to hqdefault), else the cover image. None → opengraph-image.tsx.
  const image = debate.youtube_video_id
    ? {
        ...(await eventImage(debate.youtube_video_id, debate.updated_at)),
        alt: debate.title_ar,
      }
    : debate.cover_image_url
      ? { url: debate.cover_image_url, alt: debate.title_ar }
      : undefined;

  return {
    title: debate.title_ar,
    description,
    alternates: { canonical: `/events/${debate.slug}` },
    // A page-level openGraph replaces the root layout's, so siteName and
    // locale must be repeated here.
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "ar_SY",
      title: `${debate.title_ar} — ${SITE_NAME}`,
      description,
      url: absoluteUrl(`/events/${debate.slug}`),
      // Keep `images: undefined` when there's no image: omitting the key
      // would let Next.js apply opengraph-image.tsx, whose Arabic currently
      // renders in reversed word order (satori has no bidi support).
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${debate.title_ar} — ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function DebatePage({ params }: Params) {
  const { slug } = await params;
  const debate = await getDebateBySlug(slug);
  if (!debate) notFound();

  const [related, poll] = await Promise.all([
    getRelatedDebates(debate.id, 2),
    getPollForDebate(debate),
  ]);
  // «سؤال ندوات»: the ballot while open, «بانتظار النتائج» once closed, and
  // the published results permanently. Figures are only fetched (and only
  // returned by the database) once results are published.
  const pollState = promoState(poll, "event");
  const results =
    poll && pollState === "published" ? await getPublishedResults(poll.id) : null;
  const pollPanel =
    poll && pollState ? (
      <PollEventPanel
        poll={poll}
        state={pollState}
        results={results}
        turnstileSiteKey={
          poll.require_turnstile ? (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null) : null
        }
        className="max-w-[44rem]"
      />
    ) : null;
  const phase = eventPhase(debate);
  const live = phase === "live";
  const upcoming = phase !== "past"; // upcoming or live
  // The recording — or the livestream itself while the event is live.
  const video =
    phase !== "upcoming" && debate.youtube_video_id
      ? {
          id: debate.youtube_video_id,
          cover: (await eventImage(debate.youtube_video_id, debate.updated_at)).url,
        }
      : null;
  const when = debate.starts_at
    ? `${formatDate(debate.starts_at, debate.timezone)} · ${formatTime(debate.starts_at, debate.timezone)} بتوقيت دمشق`
    : null;

  return (
    <article className="pb-24">
      <div className="container-page pt-12 sm:pt-16">
        <Link
          href="/events"
          className="text-meta text-muted transition-colors hover:text-olive"
        >
          → جميع الفعاليات
        </Link>

        <p className="mt-6 text-kicker font-medium uppercase text-clay">
          {live ? "مباشر الآن" : upcoming ? "ندوة قادمة" : "من الأرشيف"}
        </p>
        <h1 className="mt-3 max-w-[46rem] text-h1 text-ink">{debate.title_ar}</h1>
        {when ? <p className="mt-4 text-meta text-muted">{when}</p> : null}
        {debate.location_ar ? (
          <p className="mt-1 text-meta text-muted">{debate.location_ar}</p>
        ) : null}
        {/* Upcoming or live event: the question comes straight after the title and date. */}
        {upcoming && pollPanel ? <div className="mt-8">{pollPanel}</div> : null}
      </div>

      <div className="container-page mt-10">
        {video ? (
          <YouTubeEmbed videoId={video.id} title={debate.title_ar} cover={video.cover} />
        ) : debate.cover_image_url ? (
          <div className="relative aspect-[16/8] overflow-hidden rounded-[var(--radius-lg)] bg-cream-deep">
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
      </div>

      {phase === "upcoming" || (live && hasWatchLinks(debate)) ? (
        <section
          aria-label="المشاهدة والمشاركة"
          className="container-page mt-10"
        >
          <div
            className={
              debate.registration_open
                ? "grid gap-4 md:grid-cols-2"
                : "grid gap-4 md:max-w-xl"
            }
          >
            <div className="flex flex-col rounded-[var(--radius-md)] border border-line bg-[#fffdf7] p-6">
              <p className="text-kicker font-medium uppercase text-clay">
                للمشاهدة
              </p>
              <p className="mt-2 text-h3 text-ink">لا يحتاج إلى تسجيل</p>
              <p className="mt-2 text-[0.95rem] leading-7 text-muted">
                {live
                  ? "البثّ المباشر متاح الآن على يوتيوب وفيسبوك."
                  : hasWatchLinks(debate)
                    ? "البثّ المباشر متاح على يوتيوب وفيسبوك في موعد الندوة."
                    : "ستُضاف روابط البثّ المباشر على يوتيوب وفيسبوك هنا قبل موعد الندوة."}
              </p>
              {hasWatchLinks(debate) ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <WatchButtons debate={debate} />
                </div>
              ) : null}
            </div>

            {debate.registration_open ? (
              <div className="flex flex-col rounded-[var(--radius-md)] border border-line p-6">
                <p className="text-kicker font-medium uppercase text-clay">
                  للمشاركة في الحوار
                </p>
                <p className="mt-2 text-h3 text-ink">
                  عبر نموذج «المشاركة في الحوار»
                </p>
                <p className="mt-2 text-[0.95rem] leading-7 text-muted">
                  إرسال سؤال أو مداخلة، أو طلب المشاركة مباشرةً بالصوت والصورة خلال فقرة مشاركة الجمهور.
                </p>
                <div className="mt-5">
                  <ArrowLink href="#participate">إلى النموذج</ArrowLink>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="container-page mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="min-w-0">
          {/* Past event: the results lead the main column, after the recording. */}
          {!upcoming && pollPanel ? <div className="mb-12">{pollPanel}</div> : null}
          {debate.description_ar ? (
            <div className="prose-ar">
              {debate.description_ar.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-14 border-t border-line pt-10">
            <h2 className="text-h2 text-ink">الضيوف/ات</h2>
            <div className="mt-8">
              <ParticipantProfiles
                participants={debate.participants}
                moderator={debate.moderator}
              />
            </div>
          </div>

          {upcoming && debate.registration_open ? (
            <section
              id="participate"
              className="mt-14 scroll-mt-[7rem] border-t border-line pt-10"
            >
              <h2 className="text-h2 text-ink">المشاركة في الحوار</h2>
              <p className="mt-3 max-w-[40rem] text-[1rem] leading-8 text-muted">
                هذا النموذج مخصّص للمشاركة في فقرة مشاركة الجمهور فقط — أما
                المشاهدة فمفتوحة للجميع ولا تحتاج إلى تسجيل.
              </p>
              <div className="mt-8 max-w-xl">
                <ParticipateForm
                  debateId={debate.id}
                  debateSlug={debate.slug}
                  debateTitle={debate.title_ar}
                />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[var(--radius-md)] border border-line p-5">
            <p className="text-kicker font-medium uppercase text-muted">
              {upcoming ? "الموعد" : "نُشرت"}
            </p>
            {when ? (
              <p className="mt-2 text-[0.95rem] leading-7 text-ink">{when}</p>
            ) : null}
            {upcoming && debate.registration_open ? (
              <div className="mt-4">
                <ArrowLink href="#participate">المشاركة في الحوار</ArrowLink>
              </div>
            ) : null}
            {debate.youtube_url ? (
              <div className="mt-4">
                <ArrowLink href={debate.youtube_url}>
                  فتح على يوتيوب
                </ArrowLink>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="container-page mt-20 border-t border-line pt-12">
          <h2 className="text-h2 text-ink">فعاليات ذات صلة</h2>
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {related.map((d) => (
              <DebateCard key={d.id} debate={d} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
