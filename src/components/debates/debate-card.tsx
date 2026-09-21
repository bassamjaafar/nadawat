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

/** Card used on the homepage and in "related debates". */
export function DebateCard({
  debate,
  priority,
}: {
  debate: DebateSummary;
  priority?: boolean;
}) {
  const href = `/events/${debate.slug}`;
  return (
    <article className="group flex flex-col gap-4">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <DebateThumb debate={debate} priority={priority} />
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-meta text-muted">
          <time dateTime={debate.starts_at ?? undefined}>
            {debate.starts_at ? formatDateShort(debate.starts_at, debate.timezone) : ""}
          </time>
        </p>
        <h3 className="text-h3 text-ink">
          <Link
            href={href}
            className="transition-colors hover:text-olive focus-visible:text-olive"
          >
            {debate.title_ar}
          </Link>
        </h3>
        {debate.speakers.length ? (
          <p className="text-meta text-muted">{speakerNames(debate)}</p>
        ) : null}
        <div className="mt-1">
          <ArrowLink href={href}>{pastEventCtaLabel(debate)}</ArrowLink>
        </div>
      </div>
    </article>
  );
}
