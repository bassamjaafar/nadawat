import { EventHero } from "@/components/home/event-hero";
import { InstitutionalHero } from "@/components/home/institutional-hero";
import { BrandStatement } from "@/components/home/brand-statement";
import { RecentDebates } from "@/components/home/recent-debates";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { AboutPreview } from "@/components/home/about-preview";
import {
  getDebateBySlug,
  getFeaturedDebate,
  getRecentDebates,
  getUpcomingDebate,
} from "@/lib/data/debates";
import { isUpcoming } from "@/lib/types";
import type { DebateDetail, DebateSummary } from "@/lib/types";

// Homepage reflects live scheduling — revalidate frequently.
export const revalidate = 120;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const forceInstitutional =
    process.env.NODE_ENV !== "production" && params.preview === "institutional";

  // A debate manually pinned via site_content (see getFeaturedDebate) always
  // wins over the automatic "soonest upcoming, else latest" selection below —
  // that's the "convenient way to control the homepage" without an admin UI yet.
  const featured = forceInstitutional ? null : await getFeaturedDebate();

  const [autoUpcoming, recent] = await Promise.all([
    featured || forceInstitutional ? Promise.resolve(null) : getUpcomingDebate(),
    getRecentDebates(4),
  ]);

  const upcoming = featured && isUpcoming(featured) ? featured : autoUpcoming;

  // The homepage always keeps exactly one event in the prominent hero slot:
  // the soonest upcoming one if any is scheduled, otherwise the most
  // recently completed one — never a generic "no event" hero as long as
  // *something* has been published. That "otherwise" branch needs the full
  // DebateDetail (for the speaker lineup), not just the lighter summary
  // getRecentDebates returns, so it's fetched by slug below.
  let hero: DebateDetail | null = upcoming;
  let rest: DebateSummary[] = upcoming ? recent.slice(0, 3) : [];

  if (!hero && !forceInstitutional) {
    if (featured) {
      hero = featured;
      rest = recent.filter((d) => d.id !== featured.id).slice(0, 3);
    } else if (recent.length) {
      hero = await getDebateBySlug(recent[0].slug);
      rest = recent.slice(1, 4);
    }
  }

  if (hero) {
    return (
      <>
        <EventHero debate={hero} />
        <BrandStatement />
        <RecentDebates debates={rest} />
        <SubscribeSection />
        <AboutPreview />
      </>
    );
  }

  // Nothing published yet at all — the only time the generic hero shows.
  return (
    <>
      <InstitutionalHero />
      <BrandStatement />
      <AboutPreview />
      <SubscribeSection />
    </>
  );
}
