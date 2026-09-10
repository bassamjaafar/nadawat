import { UpcomingHero } from "@/components/home/upcoming-hero";
import { InstitutionalHero } from "@/components/home/institutional-hero";
import { BrandStatement } from "@/components/home/brand-statement";
import { RecentDebates } from "@/components/home/recent-debates";
import { SubscribeSection } from "@/components/home/subscribe-section";
import { AboutPreview } from "@/components/home/about-preview";
import { getRecentDebates, getUpcomingDebate } from "@/lib/data/debates";

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

  const [upcoming, recent] = await Promise.all([
    forceInstitutional ? Promise.resolve(null) : getUpcomingDebate(),
    getRecentDebates(3),
  ]);

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

  return (
    <>
      <InstitutionalHero />
      <BrandStatement />
      {recent.length ? (
        <RecentDebates debates={recent} variant="feature" />
      ) : null}
      <AboutPreview />
      <SubscribeSection />
    </>
  );
}
