"use client";

import { Button } from "@/components/ui/button";
import { POLL_TEXT } from "@/lib/polls/text";

/** The database couldn't be reached, even after retrying. */
export function PollUnavailable() {
  return (
    <div role="alert" className="flex flex-col items-start gap-5 border-y border-line py-5">
      <p className="text-[1rem] leading-8 text-ink">{POLL_TEXT.loadFailed}</p>
      <Button type="button" onClick={() => window.location.reload()} className="w-full sm:w-auto">
        {POLL_TEXT.reload}
      </Button>
    </div>
  );
}
