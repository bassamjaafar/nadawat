import { z } from "zod";
import { hasVoted } from "@/lib/data/polls";
import { readVoter, voterKey } from "@/lib/polls/keys";
import { recordVote } from "@/lib/polls/record-vote";
import { POLL_TEXT } from "@/lib/polls/text";
import type { VoteOutcome } from "@/lib/polls/types";

/**
 * The «سؤال ندوات» ballot for event pages. It lives under /vote on purpose:
 * the signed voter cookie is scoped to /vote, so an event page's ballot
 * carries exactly the same browser identity as /vote itself — one vote per
 * browser across both, with no change to the cookie.
 *
 * GET  ?poll=<id>  → middleware issues the voter cookie (if missing), then
 *                    this says whether this browser has already voted.
 * POST (form data) → the same recordVote() the /vote server action uses.
 */

const NO_STORE = { "Cache-Control": "private, no-store" };

export type BallotState = "can_vote" | "already_voted";

export async function GET(request: Request) {
  const pollId = z.string().uuid().safeParse(new URL(request.url).searchParams.get("poll"));
  if (!pollId.success) {
    return Response.json({ error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  let state: BallotState = "can_vote";
  try {
    const me = await readVoter();
    if (me && (await hasVoted(pollId.data, voterKey(me.secret, pollId.data, me.voter)))) {
      state = "already_voted";
    }
  } catch (e) {
    // The form still works; recordVote() repeats the check when voting.
    console.error("ballot state failed:", e instanceof Error ? e.message : e);
  }
  return Response.json({ state }, { headers: NO_STORE });
}

/** Same-origin only, like Next.js server actions. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    const bad: VoteOutcome = { outcome: "error", message: POLL_TEXT.errorUnexpected };
    return Response.json(bad, { status: 400, headers: NO_STORE });
  }
  const outcome: VoteOutcome = await recordVote(form);
  return Response.json(outcome, { headers: NO_STORE });
}
