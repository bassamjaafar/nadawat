"use server";

import { recordVote } from "@/lib/polls/record-vote";
import type { VoteOutcome } from "@/lib/polls/types";

/**
 * The /vote page's ballot. Called directly from the vote form (not via
 * useActionState) so the form can catch a dropped connection and keep the
 * chosen answer. Event pages send the same ballot to POST /vote/ballot;
 * both end in recordVote().
 */
export async function voteAction(formData: FormData): Promise<VoteOutcome> {
  return recordVote(formData);
}
