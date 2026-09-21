import { UpcomingHero } from "@/components/home/upcoming-hero";
import { InstitutionalHero } from "@/components/home/institutional-hero";
import { BrandStatement } from "@/components/home/brand-statement";
import { RecentDebates } from "@/components/home/recent-debates";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { AboutPreview } from "@/components/home/about-preview";
import {
  getFeaturedDebate,
  getRecentDebates,
  getUpcomingDebate,
  toSummary,
} from "@/lib/data/debates";
import { isUpcoming } from "@/lib/types";

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
    getRecentDebates(3),
  ]);

  const upcoming = featured && isUpcoming(featured) ? featured : autoUpcoming;

  if (upcoming) {
    return (
      <>
        <UpcomingHero debate={upcoming} />
        <BrandStatement />
        <RecentDebates debates={recent} />
        <SubscribeSection />
        <AboutPreview />
      </>
    );
  }

  // A pinned, non-upcoming debate takes the "latest debate" spot instead of
  // whatever is chronologically newest.
  const recentForDisplay =
    featured && !isUpcoming(featured)
      ? [toSummary(featured), ...recent.filter((d) => d.id !== featured.id)]
      : recent;

  return (
    <>
      <InstitutionalHero />
      <BrandStatement />
      {recentForDisplay.length ? (
        <RecentDebates debates={recentForDisplay} variant="feature" />
      ) : null}
      <AboutPreview />
      <SubscribeSection />
    </>
  );
}
