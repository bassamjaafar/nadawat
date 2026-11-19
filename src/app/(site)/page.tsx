import { EventHero } from "@/components/home/event-hero";
import { InstitutionalHero } from "@/components/home/institutional-hero";
import { BrandStatement } from "@/components/home/brand-statement";
import { RecentDebates } from "@/components/home/recent-debates";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { AboutPreview } from "@/components/home/about-preview";
import { PollHomeCard, promoState } from "@/components/polls/poll-promo";
import { getCurrentPoll } from "@/lib/data/polls";
import {
  getDebateBySlug,
  getFeaturedDebate,
  getRecentDebates,
  getUpcomingDebate,
} from "@/lib/data/debates";
import type { ReactNode } from "react";
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

  const [autoUpcoming, recent, poll] = await Promise.all([
    featured || forceInstitutional ? Promise.resolve(null) : getUpcomingDebate(),
    getRecentDebates(4),
    getCurrentPoll(),
  ]);

  // «سؤال ندوات» card: status only, never figures. Results stay 14 days.
  const pollState = promoState(poll, "home");
  const pollCard = poll && pollState ? <PollHomeCard poll={poll} state={pollState} /> : null;

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
    // Inside the hero when the poll belongs to the featured event; otherwise
    // (a poll for another event) on its own right under the hero.
    const inHero = pollCard && poll?.debate?.slug === hero.slug;
    return (
      <>
        <EventHero debate={hero} poll={inHero ? pollCard : undefined} />
        {pollCard && !inHero ? <StandalonePoll>{pollCard}</StandalonePoll> : null}
        <BrandStatement />
        <RecentDebates debates={rest} />
        <AboutPreview />
        <SubscribeSection />
      </>
    );
  }

  // Nothing published yet at all — the only time the generic hero shows.
  return (
    <>
      <InstitutionalHero />
      {pollCard ? <StandalonePoll>{pollCard}</StandalonePoll> : null}
      <BrandStatement />
      <AboutPreview />
      <SubscribeSection />
    </>
  );
}

function StandalonePoll({ children }: { children: ReactNode }) {
  return (
    <div className="container-page pt-4 pb-6">
      <div className="max-w-[40rem]">{children}</div>
    </div>
  );
}
