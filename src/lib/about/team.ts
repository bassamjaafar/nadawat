// Types and small helpers for «فريق ندوات», shared by the public page and
// the admin pages.

export type GroupStatus = "published" | "hidden" | "archived";
export type MemberStatus = "draft" | "published" | "archived";

export const GROUP_STATUS_LABEL: Record<GroupStatus, string> = {
  published: "ظاهرة",
  hidden: "مخفية",
  archived: "مؤرشفة",
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

/** Public fields only — the shape the public page receives. */
export type PublicMember = {
  id: string;
  full_name_ar: string;
  title_ar: string;
  bio_ar: string;
  image_url: string | null;
};

export type PublicGroup = {
  id: string;
  name_ar: string;
  description_ar: string;
  members: PublicMember[];
};

/** Admin view of a group. */
export type TeamGroup = {
  id: string;
  name_ar: string;
  description_ar: string;
  sort_order: number;
  status: GroupStatus;
};

export type Membership = {
  group_id: string;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
};

/** Admin view of a member, including internal fields. */
export type TeamMember = PublicMember & {
  status: MemberStatus;
  consent_given: boolean;
  consent_recorded_at: string | null;
  memberships: Membership[];
};

// --- sorting ---------------------------------------------------------------

const arabicCollator = new Intl.Collator("ar", { sensitivity: "base", ignorePunctuation: true });

// Honorifics don't count for alphabetical order: «د. سامر» sorts under س.
function sortKey(name: string): string {
  return name.replace(/^\s*(د\.|أ\.|م\.)\s*/u, "").trim();
}

export function compareArabicNames(a: string, b: string): number {
  return arabicCollator.compare(sortKey(a), sortKey(b));
}

// --- bio length ------------------------------------------------------------

export const BIO_WORDS_MIN = 40;
export const BIO_WORDS_MAX = 60;

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/u).length : 0;
}

// --- renewal ---------------------------------------------------------------

export const RENEWAL_WARNING_DAYS = 30;

export type RenewalState = "none" | "soon" | "overdue";

export const RENEWAL_LABEL: Record<Exclude<RenewalState, "none">, string> = {
  soon: "التجديد قريب",
  overdue: "انتهت العضوية",
};

/** Today's date in Damascus, as YYYY-MM-DD. */
export function damascusToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Damascus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const ms = Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * A membership is «overdue» once its end date has passed, and «soon» when
 * it ends within RENEWAL_WARNING_DAYS (today included). Nothing is ever
 * unpublished automatically — this only drives the admin labels.
 */
export function renewalState(endDate: string | null, today = damascusToday()): RenewalState {
  if (!endDate) return "none";
  const days = daysBetween(today, endDate);
  if (days < 0) return "overdue";
  if (days <= RENEWAL_WARNING_DAYS) return "soon";
  return "none";
}

/** The most urgent state across several memberships. */
export function worstRenewal(states: RenewalState[]): RenewalState {
  if (states.includes("overdue")) return "overdue";
  if (states.includes("soon")) return "soon";
  return "none";
}

/** What's still missing before a member can be published. Empty = ready. */
export function missingForPublication(m: {
  full_name_ar: string;
  title_ar: string;
  bio_ar: string;
  image_url: string | null;
  consent_given: boolean;
}): string[] {
  const missing: string[] = [];
  if (!m.full_name_ar.trim()) missing.push("الاسم الكامل");
  if (!m.image_url) missing.push("الصورة الشخصية");
  if (!m.title_ar.trim()) missing.push("الصفة المهنية");
  if (!m.bio_ar.trim()) missing.push("النبذة التعريفية");
  if (!m.consent_given) missing.push("الموافقة على النشر");
  return missing;
}
