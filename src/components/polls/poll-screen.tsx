import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/logo-mark";
import { PollMark } from "@/components/polls/poll-mark";
import { VoteQr, voteQrFor } from "@/components/polls/vote-qr";
import { POLL_PROMO_TEXT, POLL_TEXT, opensAtText } from "@/lib/polls/text";
import { percentages, type PollResults, type PublicPoll } from "@/lib/polls/types";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The livestream screen, laid out as one 16:9 frame (designed at 1920×1080)
 * that scales to any window: every size is in container-width units, so
 * 1cqw = 19.2px at 1080p and nothing is smaller than ~26px there. No
 * buttons, links or private data — the whole window can be shared.
 *
 *   scheduled/open → invitation with the QR code
 *   closed         → «انتهى التصويت…»
 *   published      → results (bars grow once; instant with reduced motion)
 */
export function PollScreen({
  poll,
  results,
  siteUrl,
  fit = "viewport",
  preview = false,
}: {
  poll: PublicPoll | null;
  results: PollResults | null;
  siteUrl: string;
  /** "viewport": the live screen; "container": inside an admin page. */
  fit?: "viewport" | "container";
  preview?: boolean;
}) {
  const frame = (
    <div
      dir="rtl"
      className={cn(
        "relative flex aspect-video flex-col overflow-hidden bg-cream text-ink [container-type:inline-size]",
        fit === "viewport" ? "w-[min(100vw,calc(100dvh*16/9))]" : "w-full rounded-[4px] border border-line-strong",
      )}
    >
      <TopBar />
      {!poll ? (
        <Center>
          <p className="font-display text-[3cqw] font-semibold text-muted">{POLL_TEXT.noPoll}</p>
        </Center>
      ) : poll.status === "published" && results ? (
        <ResultsBody poll={poll} results={results} />
      ) : poll.status === "closed" || poll.status === "published" ? (
        <Center>
          <QuestionBlock poll={poll} />
          <p className="mt-[2.4cqw] text-[2cqw] font-medium text-olive">{POLL_TEXT.closed}</p>
          <p className="mt-[0.8cqw] text-[1.6cqw] text-muted">{POLL_TEXT.resultsAnnounced}</p>
        </Center>
      ) : (
        <InvitationBody poll={poll} siteUrl={siteUrl} />
      )}
      <div className="h-[0.5cqw] shrink-0 bg-olive" />
      {preview ? (
        <div className="absolute inset-x-0 bottom-0 bg-clay py-[0.6cqw] text-center text-[1.5cqw] font-semibold text-white">
          {POLL_PROMO_TEXT.screenPreview}
        </div>
      ) : null}
    </div>
  );

  if (fit === "container") return frame;
  return <div className="fixed inset-0 grid place-items-center bg-cream">{frame}</div>;
}

function TopBar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-[4cqw] pt-[2.6cqw]">
      <div className="flex items-center gap-[1.1cqw]">
        <PollMark className="size-[4.6cqw] shrink-0" />
        <div className="flex flex-col leading-[1.25]">
          <span className="font-display text-[2.3cqw] font-bold text-olive">{POLL_TEXT.name}</span>
          <span className="text-[1.4cqw] text-muted">{POLL_TEXT.tagline}</span>
        </div>
      </div>
      <LogoMark className="h-[7cqw] w-auto text-olive" />
    </div>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col justify-center px-[4cqw] pb-[3cqw]">{children}</div>;
}

function EventLine({ poll }: { poll: PublicPoll }) {
  const d = poll.debate;
  if (!d) return null;
  return (
    <p className="mb-[1.2cqw] text-[1.45cqw] text-muted">
      {d.title_ar}
      {d.starts_at ? ` · ${formatDate(d.starts_at, d.timezone)}` : ""}
    </p>
  );
}

function QuestionBlock({ poll, small = false }: { poll: PublicPoll; small?: boolean }) {
  return (
    <>
      <EventLine poll={poll} />
      <h1
        className={cn(
          "font-display font-bold leading-[1.5] text-ink [text-wrap:balance]",
          small ? "text-[2.7cqw]" : "text-[3.5cqw]",
        )}
      >
        {poll.question_ar}
      </h1>
    </>
  );
}

function InvitationBody({ poll, siteUrl }: { poll: PublicPoll; siteUrl: string }) {
  const qr = voteQrFor(siteUrl);
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_27cqw] items-center gap-[4cqw] px-[4cqw] pt-[2.4cqw] pb-[3.4cqw]">
      <div className="min-w-0">
        <QuestionBlock poll={poll} />
        <p className="mt-[2.2cqw] text-[1.8cqw] font-medium text-olive">
          {poll.status === "scheduled" && poll.opens_at
            ? opensAtText(formatDate(poll.opens_at), formatTime(poll.opens_at))
            : POLL_PROMO_TEXT.screenInvitation}
        </p>
      </div>
      <div className="flex flex-col items-center gap-[1.2cqw] rounded-[0.6cqw] border border-line bg-white p-[1.8cqw]">
        <VoteQr size={qr.size} d={qr.d} className="aspect-square w-full" />
        <span dir="ltr" className="font-display text-[2.1cqw] font-bold text-olive [overflow-wrap:anywhere] text-center leading-tight">
          {qr.label}
        </span>
        <span className="text-center text-[1.4cqw] text-muted">{POLL_PROMO_TEXT.screenUnderQr}</span>
      </div>
    </div>
  );
}

function ResultsBody({ poll, results }: { poll: PublicPoll; results: PollResults }) {
  const pct = percentages(results.options.map((o) => o.votes));
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[2cqw] px-[4cqw] pt-[1.6cqw] pb-[2.4cqw]">
      <div>
        <p className="mb-[0.6cqw] text-[1.45cqw] font-medium text-muted">{POLL_TEXT.resultsHeading}</p>
        <h1 className="font-display text-[2.7cqw] font-bold leading-[1.5] text-ink [text-wrap:balance]">
          {poll.question_ar}
        </h1>
      </div>
      <ul className="flex flex-col gap-[1.6cqw]" aria-label={POLL_TEXT.resultsHeading}>
        {results.options.map((o, i) => (
          <li key={o.id} className="grid grid-cols-[22cqw_1fr_9cqw] items-center gap-[2cqw]">
            <span className="text-[2.05cqw] font-medium">{o.label_ar}</span>
            <span aria-hidden="true" className="block h-[3.4cqw] overflow-hidden rounded-[0.3cqw] bg-cream-deep">
              <span className="poll-bar block h-full rounded-[0.3cqw] bg-olive" style={{ width: `${pct[i]}%` }} />
            </span>
            <span dir="ltr" className="text-start font-display text-[3.2cqw] font-bold tabular-nums text-olive">
              {pct[i]}%
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-[3cqw]">
        <p className="max-w-[60cqw] text-[1.35cqw] leading-[1.7] text-muted">{POLL_TEXT.disclaimer}</p>
        <div className="flex flex-col items-end gap-[0.4cqw] whitespace-nowrap">
          <p className="text-[1.8cqw] text-ink">
            {POLL_TEXT.totalLabel}{" "}
            <b className="font-display tabular-nums">{results.total.toLocaleString("en-US")}</b>
          </p>
          {results.excluded > 0 ? (
            <p className="text-[1.35cqw] text-muted">
              {POLL_TEXT.excludedLabel} <span className="tabular-nums">{results.excluded.toLocaleString("en-US")}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
