export type DebateStatus = "draft" | "upcoming" | "completed" | "archived";

export type SubscriberStatus = "pending" | "confirmed" | "unsubscribed";

export type Person = {
  id: string;
  name_ar: string;
  title_ar: string | null;
  bio_ar: string | null;
  image_url: string | null;
  slug: string | null;
};

export type DebateParticipant = {
  person: Person;
  role: "speaker" | "moderator";
  position_label_ar: string | null;
  sort_order: number;
};

export type DebateSummary = {
  id: string;
  slug: string;
  title_ar: string;
  summary_ar: string | null;
  status: DebateStatus;
  starts_at: string | null;
  timezone: string;
  location_ar: string | null;
  youtube_video_id: string | null;
  cover_image_url: string | null;
  registration_open: boolean;
  speakers: Person[];
  moderator: Person | null;
  /**
   * Used to cache-bust the YouTube/cover thumbnail URL so editing a video's
   * thumbnail on YouTube (same video ID, new image) shows up right away
   * instead of waiting out the image optimizer's multi-hour edge cache.
   * Optional because fixture data doesn't carry a real timestamp.
   */
  updated_at?: string;
};

export type DebateDetail = DebateSummary & {
  description_ar: string | null;
  /** Public watch-live links. Studio links (Zoom/StreamYard) never go here. */
  youtube_live_url: string | null;
  facebook_live_url: string | null;
  youtube_url: string | null;
  participants: DebateParticipant[];
};

/** How long an event counts as live after its start time. */
export const LIVE_HOURS = 3;

/** Statuses that end the live period early, once the event has started. */
export const ENDED_STATUSES: DebateStatus[] = ["completed", "archived"];

export type EventPhase = "upcoming" | "live" | "past";

/**
 * Where an event stands — derived from its date, so it never needs to be
 * moved by hand: upcoming until its start time, live for LIVE_HOURS, then
 * archived, in exactly one row the whole time. The (legacy) `status` field
 * does one thing here: «منتهية» or «مؤرشفة» ends the live period early.
 * Before the start time it changes nothing.
 */
export function eventPhase(
  d: Pick<DebateSummary, "starts_at" | "status">,
  now: number = Date.now(),
): EventPhase {
  if (!d.starts_at) return "past";
  const start = new Date(d.starts_at).getTime();
  if (start > now) return "upcoming";
  if (start > now - LIVE_HOURS * 3_600_000 && !ENDED_STATUSES.includes(d.status)) return "live";
  return "past";
}

/** Upcoming or live: not in the archive yet. */
export function isCurrent(d: Pick<DebateSummary, "starts_at" | "status">): boolean {
  return eventPhase(d) !== "past";
}

/** "مشاهدة الندوة" only makes sense once a recording actually exists. */
export function pastEventCtaLabel(
  d: Pick<DebateSummary, "youtube_video_id">,
): string {
  return d.youtube_video_id ? "مشاهدة الندوة" : "تفاصيل الندوة";
}
