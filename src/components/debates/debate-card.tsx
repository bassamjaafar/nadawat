import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/arrow-link";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { youtubeThumbnailUrl } from "@/lib/youtube";
import { pastEventCtaLabel, type DebateSummary } from "@/lib/types";

function speakerNames(d: DebateSummary): string {
  return d.speakers.map((s) => s.name_ar).join("  و  ");
}

export function DebateThumb({
  debate,
  className,
  priority,
}: {
  debate: DebateSummary;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-olive",
        className,
      )}
    >
      {debate.youtube_video_id ? (
        <Image
          src={youtubeThumbnailUrl(debate.youtube_video_id, debate.updated_at)}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : debate.cover_image_url ? (
        <Image
          src={debate.cover_image_url}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-end p-5">
          <span className="font-display text-[0.95rem] leading-6 text-cream/80">
            ندوات
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Card used on the homepage and in "related debates".
 *
 * With `subgrid`, the card spans five rows of its parent grid (thumbnail,
 * date, title, speakers, link) so that every card in a row shares those
 * rows: titles, speaker lines and the link all line up across cards. The
 * parent must place the card on a grid with `row-span-5 grid-rows-subgrid`.
 * Spacing uses padding rather than gap/margins so it stays identical in
 * both modes.
 */
export function DebateCard({
  debate,
  priority,
  subgrid = false,
}: {
  debate: DebateSummary;
  priority?: boolean;
  subgrid?: boolean;
}) {
  const href = `/events/${debate.slug}`;
  return (
    <article
      className={cn(
        "group",
        subgrid ? "row-span-5 grid grid-rows-subgrid" : "flex flex-col",
      )}
    >
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <DebateThumb debate={debate} priority={priority} />
      </Link>
      <p className="pt-4 text-meta text-muted">
        <time dateTime={debate.starts_at ?? undefined}>
          {debate.starts_at ? formatDateShort(debate.starts_at, debate.timezone) : ""}
        </time>
      </p>
      <h3 className="pt-2 text-h3 text-ink">
        <Link
          href={href}
          className="transition-colors hover:text-olive focus-visible:text-olive"
        >
          {debate.title_ar}
        </Link>
      </h3>
      {debate.speakers.length ? (
        <p className="pt-2 text-meta text-muted">{speakerNames(debate)}</p>
      ) : subgrid ? (
        // Keeps the five-row structure when an event has no speakers.
        <span aria-hidden="true" />
      ) : null}
      <div className="pt-3">
        <ArrowLink href={href}>{pastEventCtaLabel(debate)}</ArrowLink>
      </div>
    </article>
  );
}
