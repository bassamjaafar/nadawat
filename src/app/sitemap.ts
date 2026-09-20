import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPublishedDebateSlugs } from "@/lib/data/debates";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/events", "/about", "/subscribe", "/contact", "/privacy"];

  const now = new Date();
  const base: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/events" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const debates = await getPublishedDebateSlugs();
  const debateRoutes: MetadataRoute.Sitemap = debates.map((d) => ({
    url: `${SITE_URL}/events/${d.slug}`,
    lastModified: new Date(d.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...base, ...debateRoutes];
}
