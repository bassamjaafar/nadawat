import type { Metadata } from "next";
import { AboutHeader, AboutPageBody } from "@/components/about/about-page-body";
import { getAboutSections, getPublicTeam } from "@/lib/data/about";

export const metadata: Metadata = {
  title: "عن ندوات",
  description:
    "ندوات منصة سورية مستقلة وغير ربحية للحوار العام: من نحن، وكيف نعمل، وسياستنا التحريرية، والفريق، والتمويل. مبدأنا: نختلف باحترام.",
  alternates: { canonical: "/about" },
};

// Admin saves refresh this page straight away; this is only the fallback.
export const revalidate = 300;

export default async function AboutPage() {
  const [sections, groups] = await Promise.all([getAboutSections(), getPublicTeam()]);

  return (
    <>
      <AboutHeader />
      <AboutPageBody sections={sections} groups={groups} />
    </>
  );
}
