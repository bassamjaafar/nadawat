import { ButtonLink } from "@/components/ui/button";
import type { DebateDetail } from "@/lib/types";

type WatchLinks = Pick<DebateDetail, "youtube_live_url" | "facebook_live_url">;

function links(debate: WatchLinks) {
  return [
    { href: debate.youtube_live_url, label: "شاهد على يوتيوب" },
    { href: debate.facebook_live_url, label: "شاهد على فيسبوك" },
  ].filter((l): l is { href: string; label: string } => !!l.href);
}

export function hasWatchLinks(debate: WatchLinks): boolean {
  return links(debate).length > 0;
}

/**
 * Public watch-live buttons — only the platforms that actually have a link.
 * The first one is the primary action unless `allOutline` is set.
 */
export function WatchButtons({
  debate,
  allOutline,
}: {
  debate: WatchLinks;
  allOutline?: boolean;
}) {
  return links(debate).map((l, i) => (
    <ButtonLink
      key={l.href}
      href={l.href}
      target="_blank"
      rel="noopener noreferrer"
      variant={i === 0 && !allOutline ? "primary" : "outline"}
    >
      {l.label}
    </ButtonLink>
  ));
}
