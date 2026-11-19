import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EventBallot } from "@/components/polls/event-ballot";
import { PollLockup } from "@/components/polls/poll-mark";
import { PollResultsView } from "@/components/polls/poll-results";
import { VoteNotice } from "@/components/polls/vote-form";
import { POLL_PROMO_TEXT, POLL_TEXT } from "@/lib/polls/text";
import type { PollResults, PublicPoll } from "@/lib/polls/types";
import { cn } from "@/lib/cn";

/** Days the homepage keeps «عرض النتائج» after publication. */
const HOMEPAGE_RESULTS_DAYS = 14;

export type PromoState = "open" | "closed" | "published";

/**
 * What a promotion surface may show for this poll: the poll's status only,
 * never any figures. Draft and scheduled polls aren't promoted. On the
 * homepage, published results stay for 14 days after publication; the
 * event page keeps them permanently.
 */
export function promoState(
  poll: PublicPoll | null,
  where: "home" | "event",
  now: number = Date.now(),
): PromoState | null {
  if (!poll) return null;
  if (poll.status === "open" || poll.status === "closed") return poll.status;
  if (poll.status === "published") {
    if (where === "event") return "published";
    const at = poll.published_at ? new Date(poll.published_at).getTime() : 0;
    return now - at <= HOMEPAGE_RESULTS_DAYS * 86_400_000 ? "published" : null;
  }
  return null;
}

function StatusChip({ state }: { state: PromoState }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[3px] border px-2 py-0.5 text-[0.8rem] font-semibold",
        state === "closed" ? "border-line-strong text-muted" : "border-olive/45 text-olive",
      )}
    >
      {state === "open" ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-olive" />
      ) : null}
      {POLL_PROMO_TEXT[state]}
    </span>
  );
}

/**
 * The one «سؤال ندوات» frame used on the homepage and on event pages: the
 * identity and status on one line, then the question. Slightly lighter than
 * the cream page, with an olive hairline, so it reads as its own object
 * without competing with the event title.
 */
function PollFrame({
  state,
  question,
  questionAs: Question = "p",
  questionId,
  children,
}: {
  state: PromoState;
  question: string;
  questionAs?: "p" | "h2";
  questionId?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-olive/25 bg-[#fffdf7] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <PollLockup tagline={false} size="sm" />
        <StatusChip state={state} />
      </div>
      <Question
        id={questionId}
        className="mt-4 font-display text-[1.2rem] font-semibold leading-[1.75] text-ink [text-wrap:balance] sm:text-[1.3rem]"
      >
        {question}
      </Question>
      {children}
    </div>
  );
}

/** Homepage: inside the event hero, between the summary and the date. */
export function PollHomeCard({
  poll,
  state,
  className,
}: {
  poll: PublicPoll;
  state: PromoState;
  className?: string;
}) {
  return (
    <section aria-label={POLL_TEXT.name} className={className}>
      <PollFrame state={state} question={poll.question_ar}>
        {state === "open" ? (
          <>
            <p className="mt-2 text-[0.95rem] leading-7 text-muted">{POLL_PROMO_TEXT.homeInvitation}</p>
            <ButtonLink href="/vote" className="mt-5 w-full sm:w-auto">
              {POLL_PROMO_TEXT.homeCta}
            </ButtonLink>
          </>
        ) : state === "published" ? (
          <ButtonLink
            href={`/vote?poll=${poll.slug}`}
            variant="outline"
            className="mt-4 w-full sm:w-auto"
          >
            {POLL_PROMO_TEXT.publishedLink}
          </ButtonLink>
        ) : null}
      </PollFrame>
    </section>
  );
}

/**
 * Event page: the full ballot while the poll is open (same form, same
 * checks as /vote), «بانتظار النتائج» once closed, and the published
 * results permanently after that. `results` is only ever fetched for a
 * published poll, and the database returns nothing before publication.
 */
export function PollEventPanel({
  poll,
  state,
  results,
  turnstileSiteKey,
  className,
}: {
  poll: PublicPoll;
  state: PromoState;
  results: PollResults | null;
  turnstileSiteKey: string | null;
  className?: string;
}) {
  return (
    <section aria-labelledby="event-poll-question" className={className}>
      <PollFrame
        state={state}
        question={poll.question_ar}
        questionAs="h2"
        questionId="event-poll-question"
      >
        {poll.note_ar ? (
          <p className="mt-2 text-[0.95rem] leading-7 text-muted">{poll.note_ar}</p>
        ) : null}
        <div className="mt-5">
          {state === "open" ? (
            <EventBallot
              pollId={poll.id}
              options={poll.options}
              turnstileSiteKey={turnstileSiteKey}
            />
          ) : state === "published" && results ? (
            <PollResultsView results={results} />
          ) : (
            <VoteNotice state="closed" />
          )}
        </div>
      </PollFrame>
    </section>
  );
}
