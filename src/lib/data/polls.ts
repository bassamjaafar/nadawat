import "server-only";
import { cache } from "react";
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
    // DEMO_POLL_EVENT attaches the fixture poll to another demo event.
    slug: process.env.DEMO_POLL_EVENT || "syrian-economic-policies-transition",
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

const READ_TIMEOUT_MS = 3000;
const RETRY_DELAYS_MS = [250, 750];

/**
 * A read of public poll data, tried up to three times: a dropped connection
 * or a brief database outage must not look like "there is no poll". The
 * database client doesn't retry function calls itself. Reads only — votes
 * are never resent from here.
 */
async function readWithRetry<T>(
  label: string,
  read: (signal: AbortSignal) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<{ ok: true; data: T | null } | { ok: false }> {
  for (let attempt = 0; ; attempt++) {
    let reason: string;
    try {
      const { data, error } = await read(AbortSignal.timeout(READ_TIMEOUT_MS));
      if (!error) return { ok: true, data: (data as T | null) ?? null };
      reason = error.message;
    } catch (e) {
      reason = e instanceof Error ? e.message : String(e);
    }
    console.error(`${label} failed (attempt ${attempt + 1}):`, reason);
    if (attempt >= RETRY_DELAYS_MS.length) return { ok: false };
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
  }
}

/** `unavailable`: the database couldn't be reached — not the same as no poll. */
export type PollLookup =
  | { status: "ok"; poll: PublicPoll | null }
  | { status: "unavailable"; poll: null };

/**
 * The poll /vote shows: open, else scheduled, else the latest closed or
 * published one. With a slug (/vote?poll=…, used by the event page's
 * permanent results link), that poll instead — never a draft. Shared by the
 * page and its metadata within one request.
 */
export const lookupCurrentPoll = cache(async (slug?: string): Promise<PollLookup> => {
  if (!hasSupabaseAdmin) return { status: "ok", poll: DEMO_POLL };
  const admin = getSupabaseAdminClient();
  const res = await readWithRetry<PublicPoll>("public_poll_state", (signal) =>
    admin.rpc("public_poll_state", slug ? { p_slug: slug } : {}).abortSignal(signal),
  );
  return res.ok ? { status: "ok", poll: res.data } : { status: "unavailable", poll: null };
});

/** For surfaces that only promote the poll: nothing to show either way. */
export async function getCurrentPoll(slug?: string): Promise<PublicPoll | null> {
  return (await lookupCurrentPoll(slug)).poll;
}

/**
 * The poll attached to an event (newest non-draft one), public fields only —
 * for the event page's «سؤال ندوات» box. Demo mode: the fixture poll when the
 * event's slug matches DEMO_POLL_EVENT (default: the fixture poll's event).
 */
export async function getPollForDebate(debate: { id: string; slug: string }): Promise<PublicPoll | null> {
  if (!hasSupabaseAdmin) {
    const demoEvent = process.env.DEMO_POLL_EVENT || DEMO_POLL.debate?.slug;
    return debate.slug === demoEvent ? DEMO_POLL : null;
  }
  const admin = getSupabaseAdminClient();
  const found = await readWithRetry<{ slug: string }>("poll for event", (signal) =>
    admin
      .from("polls")
      .select("slug")
      .eq("debate_id", debate.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .abortSignal(signal)
      .maybeSingle(),
  );
  if (!found.ok || !found.data) return null;
  return getCurrentPoll(found.data.slug);
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
  const admin = getSupabaseAdminClient();
  const res = await readWithRetry<PollResults>("poll_results", (signal) =>
    admin.rpc("poll_results", { p_poll: pollId }).abortSignal(signal),
  );
  return res.ok ? res.data : null;
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

/**
 * Counts one refused submission by reason (0006 poll_refusals) — no browser
 * or network code is stored. Best effort: a failure here is logged and never
 * changes what the visitor sees.
 */
export async function notePollRefusal(pollId: string, reason: string): Promise<void> {
  if (!hasSupabaseAdmin) return;
  const { error } = await getSupabaseAdminClient().rpc("note_poll_refusal", {
    p_poll: pollId,
    p_reason: reason,
  });
  if (error) console.error("note_poll_refusal failed:", error.message);
}
