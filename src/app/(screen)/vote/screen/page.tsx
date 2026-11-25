import type { Metadata } from "next";
import { connection } from "next/server";
import { PollScreen } from "@/components/polls/poll-screen";
import { AutoRefresh } from "@/components/polls/auto-refresh";
import { getPublishedResults, lookupCurrentPoll } from "@/lib/data/polls";
import { env } from "@/lib/env";
import { POLL_TEXT } from "@/lib/polls/text";

export const metadata: Metadata = {
  title: `${POLL_TEXT.name} — شاشة البث`,
  robots: { index: false, follow: false },
};

/**
 * /vote/screen — shared into the livestream (StreamYard → Share screen →
 * this Chrome window). Shows the current poll's invitation and QR code, and
 * switches to the results by itself within ~5 seconds of «نشر النتائج».
 * Public, read-only, never cached: results appear here only once published.
 */
export default async function VoteScreenPage() {
  await connection();
  const { status, poll } = await lookupCurrentPoll();
  const results = poll?.status === "published" ? await getPublishedResults(poll.id) : null;
  return (
    <>
      <AutoRefresh seconds={5} always />
      <PollScreen
        poll={poll}
        results={results}
        siteUrl={env.NEXT_PUBLIC_SITE_URL}
        unavailable={status === "unavailable"}
      />
    </>
  );
}
