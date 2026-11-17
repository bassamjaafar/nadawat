export type PollStatus = "draft" | "scheduled" | "open" | "closed" | "published";

/** What the public may know about a poll — never any counts. */
export type PublicPoll = {
  id: string;
  slug: string;
  question_ar: string;
  note_ar: string | null;
  /** Effective status: the schedule already applied. */
  status: PollStatus;
  opens_at: string | null;
  closes_at: string | null;
  published_at: string | null;
  require_turnstile: boolean;
  debate: {
    slug: string;
    title_ar: string;
    starts_at: string | null;
    timezone: string;
    is_published: boolean;
  } | null;
  options: { id: string; label_ar: string }[];
};

export type PollResults = {
  options: { id: string; label_ar: string; votes: number }[];
  /** Eligible votes only. */
  total: number;
  /** Votes excluded after administrative review — a single number, never per answer. */
  excluded: number;
};

export type VoteOutcome =
  | { outcome: "voted" }
  | { outcome: "already_voted" }
  | { outcome: "closed" }
  | { outcome: "error"; message: string; field?: "option" };

/**
 * Whole-number percentages that always add up to 100 (largest remainder),
 * so a published chart never shows 99% or 101%.
 */
export function percentages(votes: number[]): number[] {
  const total = votes.reduce((a, b) => a + b, 0);
  if (total === 0) return votes.map(() => 0);
  const exact = votes.map((v) => (v * 100) / total);
  const floors = exact.map(Math.floor);
  let remaining = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remaining <= 0) break;
    floors[i] += 1;
    remaining -= 1;
  }
  return floors;
}
