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

/**
 * Whether an event is still ahead of us — derived purely from its date, not
 * the (legacy) `status` field. An event is never manually moved from
 * "upcoming" to "archived": the moment its start time passes, it's archived
 * automatically, and there's exactly one row for it the whole time.
 */
export function isUpcoming(d: Pick<DebateSummary, "starts_at">): boolean {
  return !!d.starts_at && new Date(d.starts_at).getTime() > Date.now();
}

/** "شاهد الندوة" only makes sense once a recording actually exists. */
export function pastEventCtaLabel(
  d: Pick<DebateSummary, "youtube_video_id">,
): string {
  return d.youtube_video_id ? "شاهد الندوة" : "تفاصيل الندوة";
}
