import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetPoll, adminPollResults, effectiveStatus } from "@/lib/admin/polls";
import { PollScreen } from "@/components/polls/poll-screen";
import { env } from "@/lib/env";
import type { PublicPoll } from "@/lib/polls/types";

export const metadata: Metadata = {
  title: "معاينة شاشة البث",
  robots: { index: false, follow: false },
};

/**
 * Private preview of the livestream screen for this poll — including the
 * results screen before publication, so the producer can check it. Uses
 * the signed-in manager's own session; poll_results() returns unpublished
 * totals only to poll managers.
 */
export default async function ScreenPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poll = await adminGetPoll(id);
  if (!poll) notFound();
  const results = await adminPollResults(id);
  const status = effectiveStatus(poll);

  const asPublic = (s: PublicPoll["status"]): PublicPoll => ({
    id: poll.id,
    slug: poll.slug,
    question_ar: poll.question_ar,
    note_ar: poll.note_ar,
    status: s,
    opens_at: poll.opens_at,
    closes_at: poll.closes_at,
    published_at: poll.published_at,
    require_turnstile: poll.require_turnstile,
    debate: poll.debate
      ? { slug: poll.debate.slug, title_ar: poll.debate.title_ar, starts_at: poll.debate.starts_at, timezone: "Asia/Damascus", is_published: true }
      : null,
    options: poll.options.map((o) => ({ id: o.id, label_ar: o.label_ar })),
  });

  // The invitation as it looks while voting is open (or before a scheduled opening).
  const invitationStatus = status === "scheduled" ? "scheduled" : "open";

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div>
        <Link href={`/admin/polls/${poll.id}`} className="text-[0.88rem] text-muted hover:text-olive">
          → صفحة السؤال
        </Link>
        <h1 className="mt-4 text-h2 text-ink">معاينة شاشة البث</h1>
        <p className="mt-2 max-w-2xl text-[0.92rem] leading-7 text-muted">
          هكذا تظهر الشاشة في البث. الشاشة الحقيقية على{" "}
          <Link href="/vote/screen" target="_blank" className="text-olive underline underline-offset-4">/vote/screen</Link>{" "}
          تعرض الدعوة والرمز أثناء التصويت، وتنتقل إلى النتائج وحدها خلال نحو 5 ثوانٍ من «نشر النتائج».
          لا تُعرض هذه المعاينة على البث.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-ink">الدعوة إلى التصويت</h2>
        <PollScreen poll={asPublic(invitationStatus)} results={null} siteUrl={env.NEXT_PUBLIC_SITE_URL} fit="container" preview />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-ink">النتائج</h2>
        {results && results.total > 0 ? (
          <PollScreen poll={asPublic("published")} results={results} siteUrl={env.NEXT_PUBLIC_SITE_URL} fit="container" preview />
        ) : (
          <p className="text-[0.92rem] text-muted">لا أصوات بعد، فلا توجد نتائج للمعاينة.</p>
        )}
      </section>
    </div>
  );
}
