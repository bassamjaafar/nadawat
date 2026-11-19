import "server-only";
import { z } from "zod";
import { castVote, getPollProtection, notePollRefusal, noteVoteAttempt } from "@/lib/data/polls";
import { networkKey, readVoter, requestIp, voterKey } from "@/lib/polls/keys";
import { POLL_TEXT } from "@/lib/polls/text";
import type { VoteOutcome } from "@/lib/polls/types";
import { verifyTurnstileDetailed } from "@/lib/turnstile";
import { env } from "@/lib/env";

const voteSchema = z.object({
  poll_id: z.string().uuid(),
  option_id: z.string().uuid().optional(),
  hp_field: z.string().max(0).optional(),
});

/**
 * Records one «سؤال ندوات» vote — the single path every ballot goes through,
 * whether it was sent from /vote (server action) or from an event page
 * (POST /vote/ballot). Every check here is server-side; the database repeats
 * the critical ones (poll open, answer belongs to poll, one vote per browser,
 * Turnstile required) inside cast_vote().
 */
export async function recordVote(formData: FormData): Promise<VoteOutcome> {
  const parsed = voteSchema.safeParse({
    poll_id: formData.get("poll_id") ?? undefined,
    option_id: formData.get("option_id") || undefined,
    hp_field: formData.get("hp_field") ?? undefined,
  });
  if (!parsed.success) {
    return { outcome: "error", message: POLL_TEXT.errorUnexpected };
  }
  const { poll_id: pollId, option_id: optionId, hp_field } = parsed.data;

  // Honeypot: a bot filled the hidden field — answer as if it worked.
  if (hp_field) return { outcome: "voted" };

  if (!optionId) {
    return { outcome: "error", message: POLL_TEXT.errorNoChoice, field: "option" };
  }

  // A signed cookie issued by this server when /vote was opened. Missing or
  // forged → the request didn't come from a normal visit to the page.
  const me = await readVoter();
  if (!me) {
    return { outcome: "error", message: POLL_TEXT.errorReload };
  }
  const { voter, secret } = me;
  const vKey = voterKey(secret, pollId, voter);

  try {
    const poll = await getPollProtection(pollId);
    if (!poll) return { outcome: "closed" };

    // Per-browser limit, checked before the (external) Turnstile call.
    if (!(await noteVoteAttempt(pollId, vKey))) {
      await notePollRefusal(pollId, "rate_limited");
      return { outcome: "error", message: POLL_TEXT.errorTooManyAttempts };
    }

    let checkStatus: "passed" | "disabled" | "unavailable" = "disabled";
    if (poll.require_turnstile) {
      // Tokens must come from this deployment's own hostname
      // (nadawat.org in production, the branch address on staging).
      const { status, refusal } = await verifyTurnstileDetailed(
        (formData.get("cf-turnstile-response") as string | null) || null,
        new URL(env.NEXT_PUBLIC_SITE_URL).hostname,
      );
      // A failed or forged check is never accepted, however often it's retried.
      // The reason is counted (no visitor data) for the admin monitoring page.
      if (status === "failed") {
        await notePollRefusal(pollId, refusal ?? "other");
        return { outcome: "error", message: POLL_TEXT.errorVerification };
      }
      checkStatus = status;
    }

    const result = await castVote({
      pollId,
      optionId,
      voterKey: vKey,
      networkKey: networkKey(secret, pollId, await requestIp()),
      checkStatus,
      secsFromFirstVisit: Math.max(0, Math.floor(Date.now() / 1000) - voter.issuedAt),
    });

    switch (result) {
      case "ok":
        return { outcome: "voted" };
      case "already_voted":
        return { outcome: "already_voted" };
      case "not_open":
        return { outcome: "closed" };
      case "invalid_option":
        return { outcome: "error", message: POLL_TEXT.errorNoChoice, field: "option" };
    }
  } catch (e) {
    console.error("vote failed:", e instanceof Error ? e.message : e);
  }
  return { outcome: "error", message: POLL_TEXT.errorUnexpected };
}
