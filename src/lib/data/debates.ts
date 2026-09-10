import "server-only";
import { hasSupabase } from "@/lib/env";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import type {
  DebateDetail,
  DebateParticipant,
  DebateSummary,
  Person,
} from "@/lib/types";
import { FIXTURE_DEBATES } from "@/lib/data/fixtures";

const PERSON_COLUMNS = "id, name_ar, title_ar, bio_ar, image_url, slug";

const DEBATE_SELECT = `
  id, slug, title_ar, summary_ar, description_ar, status, starts_at, timezone,
  location_ar, registration_open, broadcast_url, youtube_url, youtube_video_id,
  cover_image_url,
  moderator:people!debates_moderator_id_fkey ( ${PERSON_COLUMNS} ),
  participants:debate_participants (
    role, position_label_ar, sort_order,
    person:people ( ${PERSON_COLUMNS} )
  )
`;

const ARCHIVE_STATUSES = ["completed", "archived"] as const;
const PUBLIC_STATUSES = ["upcoming", "completed", "archived"] as const;

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
    broadcast_url: (row.broadcast_url as string | null) ?? null,
    youtube_url: (row.youtube_url as string | null) ?? null,
    youtube_video_id: (row.youtube_video_id as string | null) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    speakers: participants
      .filter((p) => p.role === "speaker")
      .map((p) => p.person),
    moderator: (row.moderator as Person | null) ?? null,
    participants,
  };
}

function toSummary(d: DebateDetail): DebateSummary {
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

export async function getUpcomingDebate(): Promise<DebateDetail | null> {
  if (!hasSupabase) {
    return FIXTURE_DEBATES.find((d) => d.status === "upcoming") ?? null;
  }
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .eq("status", "upcoming")
    .order("starts_at", { ascending: true })
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
      .filter((d) => (ARCHIVE_STATUSES as readonly string[]).includes(d.status))
      .slice(0, limit)
      .map(toSummary);
  }
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .in("status", ARCHIVE_STATUSES as unknown as string[])
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getRecentDebates", error.message);
    return [];
  }
  return (data as Row[]).map((r) => toSummary(mapDetail(r)));
}

export async function getArchiveDebates(): Promise<DebateSummary[]> {
  if (!hasSupabase) {
    return fixturesByDate
      .filter((d) => (ARCHIVE_STATUSES as readonly string[]).includes(d.status))
      .map(toSummary);
  }
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("debates")
    .select(DEBATE_SELECT)
    .eq("is_published", true)
    .in("status", ARCHIVE_STATUSES as unknown as string[])
    .order("starts_at", { ascending: false });
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
    .in("status", PUBLIC_STATUSES as unknown as string[])
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getDebateBySlug", error.message);
    return null;
  }
  return data ? mapDetail(data as Row) : null;
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
    .in("status", PUBLIC_STATUSES as unknown as string[]);
  if (error || !data) return [];
  return data.map((d) => ({
    slug: d.slug as string,
    updatedAt: (d.updated_at as string) ?? new Date().toISOString(),
  }));
}
