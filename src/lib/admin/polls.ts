import "server-only";
import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PollResults, PollStatus } from "@/lib/polls/types";
import type { PollInput } from "@/lib/admin/poll-validation";
import { fromDamascusInputValue } from "@/lib/admin/datetime";

/**
 * «سؤال ندوات» admin data. Every call uses the signed-in person's own
 * session (RLS-bound client), so the database decides what they may do:
 * can_manage_polls() for producers and admins, is_admin() for protection
 * settings, network review and exclusions. Nothing here uses the
 * service-role key.
 */

export type AdminRole = "admin" | "polls_only";

/** The signed-in person's admin role, or null. Cached per request. */
export const getAdminRole = cache(async (): Promise<AdminRole | null> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: isAdmin }, { data: canManage }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("can_manage_polls"),
  ]);
  if (isAdmin) return "admin";
  if (canManage) return "polls_only";
  return null;
});

export type AdminPoll = {
  id: string;
  slug: string;
  debate_id: string | null;
  question_ar: string;
  note_ar: string | null;
  status: PollStatus;
  opens_at: string | null;
  closes_at: string | null;
  opened_at: string | null;
  closed_at: string | null;
  published_at: string | null;
  require_turnstile: boolean;
  warn_per_10min: number;
  alert_per_10min: number;
  created_at: string;
  debate: { id: string; slug: string; title_ar: string; starts_at: string | null } | null;
  options: { id: string; label_ar: string; sort_order: number }[];
};

const POLL_SELECT = `
  id, slug, debate_id, question_ar, note_ar, status, opens_at, closes_at,
  opened_at, closed_at, published_at, require_turnstile, warn_per_10min,
  alert_per_10min, created_at,
  debate:debates ( id, slug, title_ar, starts_at ),
  options:poll_options ( id, label_ar, sort_order )
`;

/**
 * Same rule as poll_effective_status() in 0005: a scheduled poll past
 * opens_at counts as open, an open poll past closes_at as closed. The
 * database applies it to every vote; this only keeps the admin view in step.
 */
export function effectiveStatus(
  p: Pick<AdminPoll, "status" | "opens_at" | "closes_at">,
  now = Date.now(),
): PollStatus {
  const opensPassed = p.opens_at ? new Date(p.opens_at).getTime() <= now : false;
  const closesPassed = p.closes_at ? new Date(p.closes_at).getTime() <= now : false;
  if ((p.status === "open" || (p.status === "scheduled" && opensPassed)) && closesPassed) {
    return "closed";
  }
  if (p.status === "scheduled" && opensPassed) return "open";
  return p.status;
}

function mapPoll(row: Record<string, unknown>): AdminPoll {
  const p = row as unknown as AdminPoll;
  return {
    ...p,
    options: [...(p.options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function adminListPolls(): Promise<AdminPoll[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPoll);
}

export async function adminGetPoll(id: string): Promise<AdminPoll | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("polls")
    .select(POLL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPoll(data) : null;
}

/** Events a poll can belong to (producers may read them, not edit them). */
export async function adminListPollEvents(): Promise<
  { id: string; title_ar: string; starts_at: string | null }[]
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("debates")
    .select("id, title_ar, starts_at")
    .order("starts_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function pollRow(input: PollInput) {
  return {
    slug: input.slug,
    debate_id: input.debate_id ?? null,
    question_ar: input.question_ar,
    note_ar: input.note_ar ?? null,
    opens_at: fromDamascusInputValue(input.opens_at ?? ""),
    closes_at: fromDamascusInputValue(input.closes_at ?? ""),
  };
}

async function replaceOptions(pollId: string, answers: string[]) {
  const supabase = await getSupabaseServerClient();
  const { error: delError } = await supabase.from("poll_options").delete().eq("poll_id", pollId);
  if (delError) throw new Error(delError.message);
  const { error } = await supabase
    .from("poll_options")
    .insert(answers.map((label_ar, i) => ({ poll_id: pollId, label_ar, sort_order: i + 1 })));
  if (error) throw new Error(error.message);
}

export async function adminCreatePoll(input: PollInput): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("polls").insert(pollRow(input)).select("id").single();
  if (error) throw new Error(error.message);
  const id = data.id as string;
  try {
    await replaceOptions(id, input.answers);
  } catch (e) {
    // Don't leave a question without answers behind.
    await supabase.from("polls").delete().eq("id", id);
    throw e;
  }
  return id;
}

/** Draft or scheduled polls only — the database refuses anything later. */
export async function adminUpdatePoll(id: string, input: PollInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("polls").update(pollRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  await replaceOptions(id, input.answers);
}

/** The automatic closing time stays editable while voting is open. */
export async function adminSetClosesAt(id: string, closesAt: string | null): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("polls").update({ closes_at: closesAt }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminSetProtection(
  id: string,
  settings: { require_turnstile: boolean; warn_per_10min: number; alert_per_10min: number },
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("polls").update(settings).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeletePoll(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("polls").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("لم يُحذف السؤال.");
}

export async function adminSetStatus(
  id: string,
  expected: PollStatus,
  to: PollStatus,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("set_poll_status", {
    p_poll: id,
    p_expected: expected,
    p_to: to,
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Monitoring — security data only
// ---------------------------------------------------------------------------
export type NetworkRow = {
  label: string;
  votes: number;
  peak_10min: number;
  first_at: string;
  last_at: string;
  level: "normal" | "warning" | "alert";
};

export type PollMonitor = {
  accepted: number;
  last_10_min: number;
  checks: Partial<Record<"passed" | "disabled" | "unavailable", number>>;
  warn_per_10min: number;
  alert_per_10min: number;
  networks: NetworkRow[];
};

export type RefusalSummary = {
  total: number;
  recent: number;
  by_reason: Partial<Record<string, number>>;
};

export async function adminPollMonitor(id: string): Promise<PollMonitor | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("poll_monitor", { p_poll: id });
  if (error) throw new Error(error.message);
  return (data as PollMonitor | null) ?? null;
}

export async function adminRefusalSummary(id: string): Promise<RefusalSummary | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("poll_refusal_summary", { p_poll: id });
  if (error) {
    // 0006 not applied yet in this environment: show nothing rather than fail.
    console.error("poll_refusal_summary failed:", error.message);
    return null;
  }
  return (data as RefusalSummary | null) ?? null;
}

/** Unpublished totals — poll managers only (enforced in poll_results()). */
export async function adminPollResults(id: string): Promise<PollResults | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("poll_results", { p_poll: id });
  if (error) throw new Error(error.message);
  return (data as PollResults | null) ?? null;
}

export type AuditEntry = {
  at: string;
  action: string;
  detail: Record<string, unknown>;
  actor_name: string | null;
};

export async function adminAuditLog(id: string): Promise<AuditEntry[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("poll_audit_entries", { p_poll: id, p_limit: 200 });
  if (!error) return (data as AuditEntry[]) ?? [];
  // 0006 not applied yet: fall back to the raw log (no names).
  const raw = await supabase
    .from("poll_audit_log")
    .select("at, action, detail")
    .eq("poll_id", id)
    .order("at", { ascending: false })
    .limit(200);
  if (raw.error) throw new Error(raw.error.message);
  return (raw.data ?? []).map((r) => ({ ...r, actor_name: null }) as AuditEntry);
}

// ---------------------------------------------------------------------------
// Review & exclusions — full administrators only (enforced in the database)
// ---------------------------------------------------------------------------
export type NetworkReview = {
  label: string;
  ambiguous: boolean;
  votes: number;
  first_at: string;
  last_at: string;
  checks: Partial<Record<"passed" | "disabled" | "unavailable", number>> | null;
  instant_after_visit: number;
  gap_mean_secs: number | null;
  gap_cv: number | null;
  per_minute: { minute: string; votes: number }[] | null;
  already_excluded: number;
};

export async function adminReviewNetwork(id: string, label: string): Promise<NetworkReview | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("poll_review_network", { p_poll: id, p_label: label });
  if (error) throw new Error(error.message);
  return (data as NetworkReview | null) ?? null;
}

export type Exclusion = {
  id: string;
  network_label: string;
  from_at: string;
  to_at: string;
  evidence: string[];
  reason: string;
  votes_affected: number;
  created_at: string;
  reverted_at: string | null;
};

export async function adminListExclusions(id: string): Promise<Exclusion[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("poll_exclusions")
    .select("id, network_label, from_at, to_at, evidence, reason, votes_affected, created_at, reverted_at")
    .eq("poll_id", id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Exclusion[]) ?? [];
}

export async function adminExcludeVotes(args: {
  pollId: string;
  label: string;
  from: string;
  to: string;
  evidence: string[];
  reason: string;
}): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("exclude_votes", {
    p_poll: args.pollId,
    p_label: args.label,
    p_from: args.from,
    p_to: args.to,
    p_evidence: args.evidence,
    p_reason: args.reason,
  });
  if (error) throw new Error(error.message);
  return (data as { votes: number }).votes;
}

export async function adminRevertExclusion(exclusionId: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("revert_exclusion", { p_exclusion: exclusionId });
  if (error) throw new Error(error.message);
  return data as number;
}
