import "server-only";
import { hasSupabase } from "@/lib/env";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import {
  ABOUT_SECTION_KEYS,
  DEFAULT_SECTIONS,
  type AboutSection,
} from "@/lib/about/content";
import { compareArabicNames, type PublicGroup } from "@/lib/about/team";

const SECTION_COLUMNS = "key, title_ar, body_ar, link_label_ar, link_url, is_published";

// PostgREST codes for "that table / function doesn't exist" — i.e. the 0007
// migration hasn't been run on this database yet.
const MISSING = new Set(["PGRST205", "PGRST202", "42P01", "42883"]);

// While Vercel builds the site, a database hiccup must not fail the whole
// deployment: the page is built from the fallback and refreshed from the
// database on the first visits afterwards. At any other time an error is
// thrown, so the cached page stays as it was instead of showing something an
// admin may have hidden.
const BUILDING = process.env.NEXT_PHASE === "phase-production-build";

function shouldFallBack(where: string, error: { code: string; message: string }): boolean {
  if (MISSING.has(error.code) || BUILDING) {
    console.error(where, "using fallback:", error.message);
    return true;
  }
  return false;
}

/** Puts sections into the fixed page order. */
export function orderSections(rows: AboutSection[]): AboutSection[] {
  return [...rows].sort(
    (a, b) => ABOUT_SECTION_KEYS.indexOf(a.key) - ABOUT_SECTION_KEYS.indexOf(b.key),
  );
}

/**
 * Shown sections, in page order. Falls back to the built-in starting text
 * when there's no database or the migration hasn't been run, so the page is
 * never blank.
 */
export async function getAboutSections(): Promise<AboutSection[]> {
  const fallback = DEFAULT_SECTIONS.filter((s) => s.is_published);
  if (!hasSupabase) return fallback;

  const { data, error } = await getSupabasePublicClient()
    .from("about_sections")
    .select(SECTION_COLUMNS)
    .eq("is_published", true);

  if (error) {
    if (shouldFallBack("getAboutSections", error)) return fallback;
    throw new Error(`getAboutSections: ${error.message}`);
  }
  return orderSections(data as AboutSection[]);
}

/** Members within each group, in Arabic alphabetical order. */
export function sortMembers<T extends { members: { full_name_ar: string }[] }>(groups: T[]): T[] {
  return groups.map((g) => ({
    ...g,
    members: [...g.members].sort((a, b) => compareArabicNames(a.full_name_ar, b.full_name_ar)),
  }));
}

/**
 * Shown groups that have at least one published member, in display order,
 * with public fields only (see public_about_team() in 0007_about.sql).
 */
export async function getPublicTeam(): Promise<PublicGroup[]> {
  if (!hasSupabase) return [];

  const { data, error } = await getSupabasePublicClient().rpc("public_about_team");
  if (error) {
    if (shouldFallBack("getPublicTeam", error)) return [];
    throw new Error(`getPublicTeam: ${error.message}`);
  }
  return sortMembers((data as PublicGroup[] | null) ?? []);
}
