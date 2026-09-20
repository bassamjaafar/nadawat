import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { YouTubeEmbed } from "@/components/debates/youtube-embed";
import { ParticipantProfiles } from "@/components/debates/speakers";
import { DebateCard } from "@/components/debates/debate-card";
import { RegisterForm } from "@/components/forms/register-form";
import { ArrowLink } from "@/components/ui/arrow-link";
import {
  getDebateBySlug,
  getPublishedDebateSlugs,
  getRelatedDebates,
} from "@/lib/data/debates";
import { formatDate, formatTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/url";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 300;

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
  const image = debate.youtube_video_id
    ? `https://i.ytimg.com/vi/${debate.youtube_video_id}/hqdefault.jpg`
    : (debate.cover_image_url ?? undefined);

  return {
    title: debate.title_ar,
    description,
    alternates: { canonical: `/events/${debate.slug}` },
    openGraph: {
      type: "article",
      title: `${debate.title_ar} — ${SITE_NAME}`,
      description,
      url: absoluteUrl(`/events/${debate.slug}`),
      images: image ? [{ url: image }] : undefined,
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

  const related = await getRelatedDebates(debate.id, 2);
  const isUpcoming = debate.status === "upcoming";
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
          {isUpcoming ? "ندوة قادمة" : "من الأرشيف"}
        </p>
        <h1 className="mt-3 max-w-[46rem] text-h1 text-ink">{debate.title_ar}</h1>
        {when ? <p className="mt-4 text-meta text-muted">{when}</p> : null}
        {debate.location_ar ? (
          <p className="mt-1 text-meta text-muted">{debate.location_ar}</p>
        ) : null}
      </div>

      <div className="container-page mt-10">
        {!isUpcoming && debate.youtube_video_id ? (
          <YouTubeEmbed
            videoId={debate.youtube_video_id}
            title={debate.title_ar}
          />
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

      <div className="container-page mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="min-w-0">
          {debate.description_ar ? (
            <div className="prose-ar">
              {debate.description_ar.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-14 border-t border-line pt-10">
            <h2 className="text-h2 text-ink">الضيوف</h2>
            <div className="mt-8">
              <ParticipantProfiles
                participants={debate.participants}
                moderator={debate.moderator}
              />
            </div>
          </div>

          {isUpcoming && debate.registration_open ? (
            <section
              id="register"
              className="mt-14 scroll-mt-[7rem] border-t border-line pt-10"
            >
              <h2 className="text-h2 text-ink">سجّل حضورك</h2>
              <p className="mt-3 max-w-[40rem] text-[1rem] leading-8 text-muted">
                التسجيل مجاني ويتمّ على موقع ندوات مباشرةً. نرسل تفاصيل الحضور
                ورابط البثّ إلى بريدك قبل الموعد.
              </p>
              <div className="mt-8 max-w-xl">
                <RegisterForm
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
              {isUpcoming ? "الموعد" : "نُشرت"}
            </p>
            {when ? (
              <p className="mt-2 text-[0.95rem] leading-7 text-ink">{when}</p>
            ) : null}
            {isUpcoming && debate.registration_open ? (
              <div className="mt-4">
                <ArrowLink href="#register">إلى نموذج التسجيل</ArrowLink>
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
