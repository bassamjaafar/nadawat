"use client";

import { useState, type FormEvent } from "react";
import { voteAction } from "@/app/(site)/vote/actions";
import { Button } from "@/components/ui/button";
import { Honeypot } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { POLL_TEXT } from "@/lib/polls/text";
import { cn } from "@/lib/cn";

type Done = "voted" | "already_voted" | "closed";

/**
 * The «سؤال ندوات» ballot. Calls the server action directly (not through
 * useActionState) so a dropped connection becomes a retry message instead of
 * an error page, and the chosen answer stays selected. Retrying is safe: the
 * browser keeps the same voter cookie, so a vote whose response was lost
 * comes back as "already voted", never as a second vote.
 *
 * `turnstileSiteKey` is decided on the server (poll setting + site key) and
 * passed in, never derived from env here — see the hydration note in
 * subscribe-form.tsx.
 */
export function VoteForm({
  pollId,
  options,
  turnstileSiteKey,
}: {
  pollId: string;
  options: { id: string; label_ar: string }[];
  turnstileSiteKey: string | null;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (!choice) {
      setError(POLL_TEXT.errorNoChoice);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await voteAction(new FormData(e.currentTarget));
      if (res.outcome === "error") {
        setError(res.message);
        setResetSignal((n) => n + 1);
      } else {
        setDone(res.outcome);
      }
    } catch {
      setError(POLL_TEXT.errorConnection);
      setResetSignal((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <VoteNotice state={done} />;
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="poll_id" value={pollId} />

      <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? "vote-error" : undefined}>
        <legend className="mb-1.5 text-[0.92rem] text-muted">{POLL_TEXT.choosePrompt}</legend>
        {options.map((o) => {
          const selected = choice === o.id;
          return (
            <label
              key={o.id}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius)] border bg-[#fffdf7] px-4 text-[1.04rem] text-ink transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-olive",
                selected
                  ? "border-olive shadow-[inset_0_0_0_1px_var(--color-olive)]"
                  : "border-line-strong hover:border-olive/60",
              )}
            >
              <input
                type="radio"
                name="option_id"
                value={o.id}
                checked={selected}
                onChange={() => {
                  setChoice(o.id);
                  setError(null);
                }}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                  selected ? "border-olive" : "border-line-strong",
                )}
              >
                {selected ? <span className="size-2.5 rounded-full bg-olive" /> : null}
              </span>
              {o.label_ar}
            </label>
          );
        })}
      </fieldset>

      <Honeypot />

      {turnstileSiteKey ? (
        <TurnstileWidget siteKey={turnstileSiteKey} resetSignal={resetSignal} />
      ) : null}

      {error ? (
        <p
          id="vote-error"
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        aria-disabled={!choice}
        className={cn("min-h-[3.25rem] w-full text-[1.08rem]", !choice && "opacity-60")}
      >
        {pending ? POLL_TEXT.submitting : POLL_TEXT.submit}
      </Button>

      <p className="text-[0.85rem] leading-7 text-muted">{POLL_TEXT.footnote}</p>
    </form>
  );
}

/** Thanks / already voted / closed, in one calm style. */
export function VoteNotice({ state }: { state: Done }) {
  const [first, second] =
    state === "voted"
      ? [POLL_TEXT.thanks, POLL_TEXT.resultsAnnounced]
      : state === "already_voted"
        ? [POLL_TEXT.alreadyVoted, POLL_TEXT.resultsAnnounced]
        : [POLL_TEXT.closed, POLL_TEXT.resultsPending];

  return (
    <div role="status" className="flex flex-col gap-2 border-y border-line py-5">
      <p className="font-display text-[1.15rem] font-semibold leading-8 text-olive">{first}</p>
      <p className="text-[1rem] leading-8 text-ink">{second}</p>
    </div>
  );
}
