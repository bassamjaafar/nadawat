import "server-only";
import { hasSupabase } from "@/lib/env";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import {
  isUpcoming,
  type DebateDetail,
  type DebateParticipant,
  type DebateSummary,
  type Person,
} from "@/lib/types";
import { FIXTURE_DEBATES } from "@/lib/data/fixtures";
import { getSiteContentValue } from "@/lib/data/site-content";

/** site_content key that manually pins a debate to the homepage. See getFeaturedDebate(). */
export const FEATURED_DEBATE_KEY = "home.featured_debate_slug";

const PERSON_COLUMNS = "id, name_ar, title_ar, bio_ar, image_url, slug";

const DEBATE_SELECT = `
  id, slug, title_ar, summary_ar, description_ar, status, starts_at, timezone,
  location_ar, registration_open, youtube_live_url, facebook_live_url,
  youtube_url, youtube_video_id,
  cover_image_url, updated_at,
  moderator:people!debates_moderator_id_fkey ( ${PERSON_COLUMNS} ),
  participants:debate_participants (
    role, position_label_ar, sort_order,
    person:people ( ${PERSON_COLUMNS} )
  )
`;

type Row = Record<string, unknown>;

function mapDetail(row: Row): DebateDetail {
  const participantsRaw = (row.participants as Row[] | null) ?? [];
  const participants: DebateParticipant[] = participantsRaw
    .map((p) => ({
      person: p.person as Person,
      role: (p.role as "speaker" | "moderator") ?? "speaker",
      position_label_ar: (p.position_label_ar as string | null) ?? null,
      sort_order: (p.sort_order as number | null) ?? 0,
    }))
    .filter((p) => p.person)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id as string,
    slug: row.slug as string,
    title_ar: row.title_ar as string,
    summary_ar: (row.summary_ar as string | null) ?? null,
    description_ar: (row.description_ar as string | null) ?? null,
    status: row.status as DebateDetail["status"],
    starts_at: (row.starts_at as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? "Asia/Damascus",
    location_ar: (row.location_ar as string | null) ?? null,
    registration_open: Boolean(row.registration_open),
    youtube_live_url: (row.youtube_live_url as string | null) ?? null,
    facebook_live_url: (row.facebook_live_url as string | null) ?? null,
    youtube_url: (row.youtube_url as string | null) ?? null,
    youtube_video_id: (row.youtube_video_id as string | null) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    updated_at: (row.updated_at as string | undefined) ?? undefined,
    speakers: participants
      .filter((p) => p.role === "speaker")
      .map((p) => p.person),
    moderator: (row.moderator as Person | null) ?? null,
    participants,
  };
}

export function toSummary(d: DebateDetail): DebateSummary {
  return {
    id: d.id,
    slug: d.slug,
    title_ar: d.title_ar,
    summary_ar: d.summary_ar,
    status: d.status,
    starts_at: d.starts_at,
    timezone: d.timezone,
    location_ar: d.location_ar,
    registration_open: d.registration_open,
    youtube_video_id: d.youtube_video_id,
    cover_image_url: d.cover_image_url,
    updated_at: d.updated_at,
    speakers: d.speakers,
    moderator: d.moderator,
  };
}

// --- Fixture helpers -------------------------------------------------------

const fixturesByDate = [...FIXTURE_DEBATES].sort(
  (a, b) =>
    new Date(b.starts_at ?? 0).getTime() - new Date(a.starts_at ?? 0).getTime(),
);

// --- Public API ----------------------------------------------------------
//
// "Upcoming" vs "archived" is derived purely from starts_at vs now() below —
// never from the (legacy) status column — so an event lives in exactly one
// row and never needs to be manually flipped or duplicated once it happens.
// `status` is only still checked for "draft", which stays an explicit,
// independent editorial gate (not ready to publish at all).

export async function getUpcomingDebate(): Promise<DebateDetail | null> {
  if (!hasSupabase) {
    return FIXTURE_DEBATES.find((d) => isUpcoming(d)) ?? null;
  }
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .neq("status", "draft")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getUpcomingDebate", error.message);
    return null;
  }
  return data ? mapDetail(data as Row) : null;
}

export async function getRecentDebates(limit = 3): Promise<DebateSummary[]> {
  if (!hasSupabase) {
    return fixturesByDate
      .filter((d) => !isUpcoming(d))
      .slice(0, limit)
      .map(toSummary);
  }
  const supabase = getSupabasePublicClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .neq("status", "draft")
    .or(`starts_at.lte.${nowIso},starts_at.is.null`)
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("getRecentDebates", error.message);
    return [];
  }
  return (data as Row[]).map((r) => toSummary(mapDetail(r)));
}

export async function getArchiveDebates(): Promise<DebateSummary[]> {
  if (!hasSupabase) {
    return fixturesByDate.filter((d) => !isUpcoming(d)).map(toSummary);
  }
  const supabase = getSupabasePublicClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .neq("status", "draft")
    .or(`starts_at.lte.${nowIso},starts_at.is.null`)
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true });
  if (error) {
    console.error("getArchiveDebates", error.message);
    return [];
  }
  return (data as Row[]).map((r) => toSummary(mapDetail(r)));
}

export async function getDebateBySlug(
  slug: string,
): Promise<DebateDetail | null> {
  if (!hasSupabase) {
    return FIXTURE_DEBATES.find((d) => d.slug === slug) ?? null;
  }
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .neq("status", "draft")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getDebateBySlug", error.message);
    return null;
  }
  return data ? mapDetail(data as Row) : null;
}

/**
 * Manual homepage override. By default the homepage picks the soonest
 * upcoming debate, or falls back to the latest past one — fully automatic.
 * To pin a specific debate instead (e.g. several are "upcoming" at once, or
 * you want a particular past debate spotlighted), set a row in site_content:
 *
 *   key   = 'home.featured_debate_slug'
 *   value = "the-debate-slug"   (a JSON string; quotes included)
 *
 * Clear the row (or set it to null) to return to the automatic behaviour.
 */
export async function getFeaturedDebate(): Promise<DebateDetail | null> {
  const value = await getSiteContentValue(FEATURED_DEBATE_KEY);
  if (typeof value !== "string" || !value.trim()) return null;
  return getDebateBySlug(value.trim());
}

export async function getRelatedDebates(
  currentId: string,
  limit = 2,
): Promise<DebateSummary[]> {
  const all = await getArchiveDebates();
  return all.filter((d) => d.id !== currentId).slice(0, limit);
}

export async function getPublishedDebateSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!hasSupabase) {
    return FIXTURE_DEBATES.map((d) => ({
      slug: d.slug,
      updatedAt: d.starts_at ?? new Date().toISOString(),
    }));
  }
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("debates")
    .select("slug, updated_at")
    .eq("is_published", true)
    .neq("status", "draft");
  if (error || !data) return [];
  return data.map((d) => ({
    slug: d.slug as string,
    updatedAt: (d.updated_at as string) ?? new Date().toISOString(),
  }));
}
