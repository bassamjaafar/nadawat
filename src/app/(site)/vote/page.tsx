import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLink } from "@/components/ui/arrow-link";
import { PollLockup } from "@/components/polls/poll-mark";
import { PollResultsView } from "@/components/polls/poll-results";
import { VoteForm, VoteNotice } from "@/components/polls/vote-form";
import { getCurrentPoll, getPublishedResults, hasVoted } from "@/lib/data/polls";
import { env } from "@/lib/env";
import { formatDate, formatDateShort, formatTime } from "@/lib/format";
import { readVoter, voterKey } from "@/lib/polls/keys";
import { opensAtText, POLL_TEXT } from "@/lib/polls/text";

// Always rendered per request, never prerendered or cached: vote state,
// "already voted" and results can't end up in a shared copy.
type Props = { searchParams: Promise<{ poll?: string | string[] }> };

/** ?poll=<slug>: a specific poll (the event page links to its own results). */
async function requestedSlug(searchParams: Props["searchParams"]): Promise<string | undefined> {
  const v = (await searchParams).poll;
  const slug = Array.isArray(v) ? v[0] : v;
  return slug && /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug) ? slug : undefined;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await connection();
  const poll = await getCurrentPoll(await requestedSlug(searchParams));
  const title = poll ? `${POLL_TEXT.name}: ${poll.question_ar}` : POLL_TEXT.name;
  return {
    title: POLL_TEXT.name,
    description: POLL_TEXT.shareDescription,
    alternates: { canonical: "/vote" },
    openGraph: { title, description: POLL_TEXT.shareDescription, url: "/vote" },
    twitter: { card: "summary", title, description: POLL_TEXT.shareDescription },
  };
}

export default async function VotePage({ searchParams }: Props) {
  await connection();
  const poll = await getCurrentPoll(await requestedSlug(searchParams));

  if (!poll) {
    return (
      <Shell>
        <PollLockup />
        <p className="mt-8 text-body-lg leading-9 text-ink">{POLL_TEXT.noPoll}</p>
        <div className="mt-5">
          <ArrowLink href="/events">{POLL_TEXT.browseEvents}</ArrowLink>
        </div>
      </Shell>
    );
  }

  const me = poll.status === "open" ? await readVoter() : null;
  const alreadyVoted = me ? await hasVoted(poll.id, voterKey(me.secret, poll.id, me.voter)) : false;
  const results = poll.status === "published" ? await getPublishedResults(poll.id) : null;
  const debate = poll.debate;
  const eventHref = debate?.is_published ? `/events/${debate.slug}` : null;

  return (
    <Shell>
      <PollLockup />

      {debate ? (
        <p className="mt-6 text-meta text-muted">
          {eventHref ? (
            <Link href={eventHref} className="font-medium text-ink transition-colors hover:text-olive">
              {debate.title_ar}
            </Link>
          ) : (
            <span className="font-medium text-ink">{debate.title_ar}</span>
          )}
          {debate.starts_at ? (
            <>
              <br />
              {poll.status === "published"
                ? formatDateShort(debate.starts_at, debate.timezone)
                : formatDate(debate.starts_at, debate.timezone)}
            </>
          ) : null}
        </p>
      ) : null}

      {poll.status === "published" ? (
        <p className="mt-6 text-kicker font-medium text-muted">{POLL_TEXT.resultsHeading}</p>
      ) : null}
      <h1
        className={
          poll.status === "published"
            ? "mt-2 text-h3 leading-9 text-ink"
            : "mt-4 text-h2 leading-[1.6] text-ink"
        }
      >
        {poll.question_ar}
      </h1>
      {poll.note_ar ? <p className="mt-3 text-[1rem] leading-8 text-muted">{poll.note_ar}</p> : null}

      <div className="mt-8">
        {poll.status === "open" && !alreadyVoted ? (
          <VoteForm
            pollId={poll.id}
            options={poll.options}
            turnstileSiteKey={
              poll.require_turnstile ? (env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null) : null
            }
          />
        ) : poll.status === "open" ? (
          <VoteNotice state="already_voted" />
        ) : poll.status === "scheduled" && poll.opens_at ? (
          <div className="border-y border-line py-5 text-[1rem] leading-8 text-ink">
            {opensAtText(formatDate(poll.opens_at), formatTime(poll.opens_at))}
          </div>
        ) : poll.status === "published" && results ? (
          <PollResultsView results={results} />
        ) : (
          <VoteNotice state="closed" />
        )}
      </div>

      {eventHref && poll.status !== "published" ? (
        <div className="mt-8">
          <ArrowLink href={eventHref}>{POLL_TEXT.eventLink}</ArrowLink>
        </div>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="container-page pt-10 pb-20 sm:pt-14">
      <div className="mx-auto max-w-[36rem]">{children}</div>
    </div>
  );
}
