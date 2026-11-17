import "server-only";
import { hasSupabaseAdmin } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PollResults, PollStatus, PublicPoll } from "@/lib/polls/types";

/**
 * «سؤال ندوات» public data. Everything goes through the service-role client
 * and the database functions in 0005_polls.sql: anon has no access to any
 * poll table, and poll_results() returns nothing until results are published.
 *
 * Without Supabase (local demo mode, like the rest of the site) a fixture
 * poll with in-memory votes stands in. DEMO_POLL_STATUS picks its state.
 */

type CastResult = "ok" | "already_voted" | "not_open" | "invalid_option";

// ---------------------------------------------------------------------------
// Demo mode
// ---------------------------------------------------------------------------
const DEMO_STATUS = ((): PollStatus => {
  const s = process.env.DEMO_POLL_STATUS;
  return s === "scheduled" || s === "closed" || s === "published" ? s : "open";
})();

const DEMO_POLL: PublicPoll = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "demo",
  question_ar: "هل تحسّن الوضع المعيشي في سوريا منذ سقوط نظام الأسد؟",
  note_ar: null,
  status: DEMO_STATUS,
  opens_at: "2026-11-24T08:00:00Z",
  closes_at: null,
  published_at: DEMO_STATUS === "published" ? "2026-11-29T19:30:00Z" : null,
  require_turnstile: true,
  debate: {
    slug: "syrian-economic-policies-transition",
    title_ar: "سوريا في المرحلة الانتقالية: إلى أين تقود السياسات الاقتصادية؟",
    starts_at: "2026-11-29T17:00:00Z",
    timezone: "Asia/Damascus",
    is_published: false,
  },
  options: [
    { id: "00000000-0000-4000-8000-0000000000a1", label_ar: "تحسّن" },
    { id: "00000000-0000-4000-8000-0000000000a2", label_ar: "لم يتغيّر بشكل ملحوظ" },
    { id: "00000000-0000-4000-8000-0000000000a3", label_ar: "تراجع" },
  ],
};

// Survives hot reloads in dev; process-local, demo only.
const demoVoters: Set<string> = ((globalThis as Record<string, unknown>).__nadawatDemoVoters ??=
  new Set<string>()) as Set<string>;

// ---------------------------------------------------------------------------

export async function getCurrentPoll(): Promise<PublicPoll | null> {
  if (!hasSupabaseAdmin) return DEMO_POLL;
  const { data, error } = await getSupabaseAdminClient().rpc("public_poll_state");
  if (error) {
    console.error("public_poll_state failed:", error.message);
    return null;
  }
  return (data as PublicPoll | null) ?? null;
}

export async function getPollProtection(
  pollId: string,
): Promise<{ require_turnstile: boolean } | null> {
  if (!hasSupabaseAdmin) return pollId === DEMO_POLL.id ? { require_turnstile: true } : null;
  const { data, error } = await getSupabaseAdminClient()
    .from("polls")
    .select("require_turnstile")
    .eq("id", pollId)
    .neq("status", "draft")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function hasVoted(pollId: string, voterKey: string): Promise<boolean> {
  if (!hasSupabaseAdmin) return demoVoters.has(voterKey);
  const { data, error } = await getSupabaseAdminClient().rpc("has_voted", {
    p_poll: pollId,
    p_voter_key: voterKey,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

/** Published results only; null while unpublished (enforced in the database). */
export async function getPublishedResults(pollId: string): Promise<PollResults | null> {
  if (!hasSupabaseAdmin) {
    return DEMO_STATUS === "published"
      ? {
          options: DEMO_POLL.options.map((o, i) => ({ ...o, votes: [398, 539, 347][i] })),
          total: 1284,
          excluded: 0,
        }
      : null;
  }
  const { data, error } = await getSupabaseAdminClient().rpc("poll_results", { p_poll: pollId });
  if (error) {
    console.error("poll_results failed:", error.message);
    return null;
  }
  return (data as PollResults | null) ?? null;
}

/** Per-browser rate limit (10 submissions / 10 minutes). Never per network. */
export async function noteVoteAttempt(pollId: string, voterKey: string): Promise<boolean> {
  if (!hasSupabaseAdmin) return true;
  const { data, error } = await getSupabaseAdminClient().rpc("note_vote_attempt", {
    p_poll: pollId,
    p_voter_key: voterKey,
    p_limit: 10,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function castVote(args: {
  pollId: string;
  optionId: string;
  voterKey: string;
  networkKey: string | null;
  checkStatus: "passed" | "disabled" | "unavailable";
  secsFromFirstVisit: number;
}): Promise<CastResult> {
  if (!hasSupabaseAdmin) {
    if (DEMO_STATUS !== "open") return "not_open";
    if (!DEMO_POLL.options.some((o) => o.id === args.optionId)) return "invalid_option";
    if (demoVoters.has(args.voterKey)) return "already_voted";
    demoVoters.add(args.voterKey);
    return "ok";
  }
  const { data, error } = await getSupabaseAdminClient().rpc("cast_vote", {
    p_poll: args.pollId,
    p_option: args.optionId,
    p_voter_key: args.voterKey,
    p_ip_key: args.networkKey,
    p_check_status: args.checkStatus,
    p_secs_from_first_visit: args.secsFromFirstVisit,
  });
  if (error) throw new Error(error.message);
  return data as CastResult;
}
