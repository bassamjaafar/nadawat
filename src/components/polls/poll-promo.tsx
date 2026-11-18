import Link from "next/link";
import { PollLockup } from "@/components/polls/poll-mark";
import { ArrowLink } from "@/components/ui/arrow-link";
import { POLL_PROMO_TEXT, POLL_TEXT } from "@/lib/polls/text";
import type { PublicPoll } from "@/lib/polls/types";
import { cn } from "@/lib/cn";

/** Days the homepage keeps «عرض النتائج» after publication. */
const HOMEPAGE_RESULTS_DAYS = 14;

type PromoState = "open" | "closed" | "published";

/** Open polls are always the current one; results link to their own poll. */
function voteHref(poll: PublicPoll, state: PromoState) {
  return state === "published" ? `/vote?poll=${poll.slug}` : "/vote";
}

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

function Chip({ state }: { state: PromoState }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-[3px] border px-2 py-0.5 text-[0.78rem] font-semibold",
        state === "closed" ? "border-line-strong text-muted" : "border-olive/45 text-olive",
      )}
    >
      {state === "open" ? POLL_PROMO_TEXT.open : state === "closed" ? POLL_PROMO_TEXT.closed : POLL_PROMO_TEXT.published}
    </span>
  );
}

/** Homepage strip, directly under the event hero. */
export function PollHomeStrip({ poll, state }: { poll: PublicPoll; state: PromoState }) {
  return (
    <section aria-label={POLL_TEXT.name} className="border-y border-line bg-cream">
      <div className="container-page flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
        <PollLockup tagline={false} size="sm" />
        <Chip state={state} />
        {state === "closed" ? (
          <p className="min-w-0 flex-[1_1_16rem] text-[0.95rem] text-muted">{POLL_TEXT.resultsPending}</p>
        ) : (
          <>
            <Link
              href={voteHref(poll, state)}
              className="min-w-0 flex-[1_1_16rem] font-display text-[1rem] font-semibold leading-7 text-ink transition-colors hover:text-olive"
            >
              {poll.question_ar}
            </Link>
            <ArrowLink href={voteHref(poll, state)} className="whitespace-nowrap text-[0.95rem]">
              {state === "open" ? POLL_PROMO_TEXT.openLink : POLL_PROMO_TEXT.publishedLink}
            </ArrowLink>
          </>
        )}
      </div>
    </section>
  );
}

/** Event page box, under «الموعد» in the side column. */
export function PollEventBox({
  poll,
  state,
  className,
}: {
  poll: PublicPoll;
  state: PromoState;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-[var(--radius-md)] border border-line p-5", className)}>
      <PollLockup size="sm" />
      <div>
        <Chip state={state} />
      </div>
      <p className="font-display text-[0.98rem] font-semibold leading-7 text-ink">{poll.question_ar}</p>
      {state === "closed" ? (
        <p className="text-[0.9rem] text-muted">{POLL_TEXT.resultsPending}</p>
      ) : (
        <div>
          <ArrowLink href={voteHref(poll, state)}>
            {state === "open" ? POLL_PROMO_TEXT.openLink : POLL_PROMO_TEXT.publishedLink}
          </ArrowLink>
        </div>
      )}
    </div>
  );
}
