import { POLL_TEXT } from "@/lib/polls/text";
import { percentages, type PollResults } from "@/lib/polls/types";

/**
 * Published results. Answers stay in their configured order and every bar
 * is the same olive — no answer is highlighted as the "winner".
 */
export function PollResultsView({ results }: { results: PollResults }) {
  const pct = percentages(results.options.map((o) => o.votes));

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-4" aria-label={POLL_TEXT.resultsHeading}>
        {results.options.map((o, i) => (
          <li key={o.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1.5">
            <span className="text-[1.02rem] text-ink">{o.label_ar}</span>
            <span
              dir="ltr"
              className="font-display text-[1.25rem] font-bold tabular-nums text-olive"
            >
              {pct[i]}%
            </span>
            <span
              aria-hidden="true"
              className="col-span-2 h-2.5 overflow-hidden rounded-[2px] bg-cream-deep"
            >
              <span
                className="poll-bar block h-full rounded-[2px] bg-olive"
                style={{ width: `${pct[i]}%` }}
              />
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-line pt-3 text-[0.95rem] text-ink">
        {POLL_TEXT.totalLabel}{" "}
        <span className="ltr-nums font-semibold tabular-nums">
          {results.total.toLocaleString("en-US")}
        </span>
      </p>

      {results.excluded > 0 ? (
        <p className="text-[0.88rem] text-muted">
          {POLL_TEXT.excludedLabel}{" "}
          <span className="ltr-nums tabular-nums">{results.excluded.toLocaleString("en-US")}</span>
        </p>
      ) : null}

      <p className="rounded-[var(--radius)] bg-cream-deep px-4 py-3 text-[0.85rem] leading-7 text-muted">
        {POLL_TEXT.disclaimer}
      </p>
    </div>
  );
}
