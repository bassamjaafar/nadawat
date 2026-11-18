import type { PollStatus } from "@/lib/polls/types";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/admin/poll-labels";
import { cn } from "@/lib/cn";

export function StatusBadge({ status }: { status: PollStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.8rem] font-medium whitespace-nowrap",
        STATUS_TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** "29 تشرين الثاني 2026، 8:00 م" in Damascus time. */
export function when(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("ar-SY", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Damascus", numberingSystem: "latn",
  }).format(d);
  const time = new Intl.DateTimeFormat("ar-SY", {
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Asia/Damascus", numberingSystem: "latn",
  }).format(d);
  return `${date}، ${time}`;
}

/** "21:14:05" Damascus — for monitoring tables. */
export function clock(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    timeZone: "Asia/Damascus",
  }).format(new Date(iso));
}
