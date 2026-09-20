import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DebateDetail, DebateStatus } from "@/lib/types";
import type { EventInput } from "@/lib/admin/validation";
import { fromDamascusInputValue } from "@/lib/admin/datetime";

const PERSON_COLUMNS = "id, name_ar, title_ar, bio_ar, image_url, slug";

const EVENT_SELECT = `
  id, slug, title_ar, summary_ar, description_ar, status, is_published,
  starts_at, timezone, location_ar, registration_open, broadcast_url,
  youtube_url, youtube_video_id, cover_image_url,
  moderator:people!debates_moderator_id_fkey ( ${PERSON_COLUMNS} ),
  participants:debate_participants (
    role, position_label_ar, sort_order,
    person:people ( ${PERSON_COLUMNS} )
  )
`;

export type AdminEventRow = {
  id: string;
  slug: string;
  title_ar: string;
  status: DebateStatus;
  is_published: boolean;
  starts_at: string | null;
};

/** All events regardless of status/publish state — for the admin list. */
export async function adminListEvents(): Promise<AdminEventRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("debates")
    .select("id, slug, title_ar, status, is_published, starts_at")
    .order("starts_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data;
}

type Row = Record<string, unknown>;

/** DebateDetail plus the admin-only field needed for the publish toggle. */
export type AdminEventDetail = DebateDetail & { is_published: boolean };

function mapDetail(row: Row): AdminEventDetail {
  const participantsRaw = (row.participants as Row[] | null) ?? [];
  const participants = participantsRaw
    .map((p) => ({
      person: p.person as DebateDetail["participants"][number]["person"],
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
    status: row.status as DebateStatus,
    is_published: Boolean(row.is_published),
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
    moderator: (row.moderator as DebateDetail["moderator"]) ?? null,
    participants,
  };
}

export async function adminGetEvent(
  id: string,
): Promise<AdminEventDetail | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("debates")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDetail(data as Row) : null;
}

export async function adminCreateEvent(input: EventInput): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("debates")
    .insert({
      slug: input.slug,
      title_ar: input.title_ar,
      summary_ar: input.summary_ar ?? null,
      description_ar: input.description_ar ?? null,
      status: input.status,
      is_published: input.is_published,
      starts_at: fromDamascusInputValue(input.starts_at ?? ""),
      location_ar: input.location_ar ?? null,
      registration_open: input.registration_open,
      broadcast_url: input.broadcast_url ?? null,
      youtube_url: input.youtube_url ?? null,
      youtube_video_id: input.youtube_video_id ?? null,
      cover_image_url: input.cover_image_url ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function adminUpdateEvent(
  id: string,
  input: EventInput,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("debates")
    .update({
      slug: input.slug,
      title_ar: input.title_ar,
      summary_ar: input.summary_ar ?? null,
      description_ar: input.description_ar ?? null,
      status: input.status,
      is_published: input.is_published,
      starts_at: fromDamascusInputValue(input.starts_at ?? ""),
      location_ar: input.location_ar ?? null,
      registration_open: input.registration_open,
      broadcast_url: input.broadcast_url ?? null,
      youtube_url: input.youtube_url ?? null,
      youtube_video_id: input.youtube_video_id ?? null,
      cover_image_url: input.cover_image_url ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteEvent(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("debates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Full replace of a debate's moderator + speaker roster in one go. */
export async function adminSetParticipants(
  debateId: string,
  input: {
    moderatorId: string | null;
    speakers: { personId: string; positionLabel: string | null }[];
  },
): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { error: moderatorError } = await supabase
    .from("debates")
    .update({ moderator_id: input.moderatorId })
    .eq("id", debateId);
  if (moderatorError) throw new Error(moderatorError.message);

  const { error: deleteError } = await supabase
    .from("debate_participants")
    .delete()
    .eq("debate_id", debateId)
    .eq("role", "speaker");
  if (deleteError) throw new Error(deleteError.message);

  if (input.speakers.length) {
    const { error: insertError } = await supabase
      .from("debate_participants")
      .insert(
        input.speakers.map((s, i) => ({
          debate_id: debateId,
          person_id: s.personId,
          role: "speaker" as const,
          position_label_ar: s.positionLabel,
          sort_order: i,
        })),
      );
    if (insertError) throw new Error(insertError.message);
  }
}
