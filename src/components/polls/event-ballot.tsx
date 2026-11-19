"use client";

import { useEffect, useRef, useState } from "react";
import { VoteForm, VoteNotice } from "@/components/polls/vote-form";
import type { VoteOutcome } from "@/lib/polls/types";

type BallotState = "can_vote" | "already_voted";

/**
 * The /vote ballot, embedded in an event page. Event pages are cached and
 * shared by everyone, so this browser's own state is asked for after load:
 * GET /vote/ballot issues the voter cookie (scoped to /vote, exactly as on
 * /vote itself) and says whether this browser has already voted. The ballot
 * then goes to POST /vote/ballot, which runs the same recordVote() as the
 * /vote page — one poll, one vote per browser, whichever page it came from.
 */
export function EventBallot({
  pollId,
  options,
  turnstileSiteKey,
}: {
  pollId: string;
  options: { id: string; label_ar: string }[];
  turnstileSiteKey: string | null;
}) {
  const [state, setState] = useState<BallotState | null>(null);
  const ready = useRef<Promise<BallotState> | null>(null);

  function check(): Promise<BallotState> {
    ready.current ??= fetch(`/vote/ballot?poll=${encodeURIComponent(pollId)}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { state?: string } | null) =>
        j?.state === "already_voted" ? "already_voted" : ("can_vote" as const),
      )
      .catch(() => "can_vote" as const);
    return ready.current;
  }

  useEffect(() => {
    let live = true;
    check().then((s) => {
      if (live) setState(s);
    });
    return () => {
      live = false;
    };
    // check() is stable for a given poll; it only memoises one request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);

  async function send(formData: FormData): Promise<VoteOutcome> {
    // The voter cookie must exist before the ballot is sent.
    await check();
    const res = await fetch("/vote/ballot", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const body = (await res.json().catch(() => null)) as VoteOutcome | null;
    if (body && "outcome" in body) return body;
    throw new Error(`ballot ${res.status}`);
  }

  if (state === "already_voted") return <VoteNotice state="already_voted" />;
  return (
    <VoteForm pollId={pollId} options={options} turnstileSiteKey={turnstileSiteKey} send={send} />
  );
}
