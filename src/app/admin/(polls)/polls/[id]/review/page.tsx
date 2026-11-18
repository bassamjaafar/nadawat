import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adminGetPoll,
  adminListExclusions,
  adminReviewNetwork,
  effectiveStatus,
  getAdminRole,
} from "@/lib/admin/polls";
import { CHECK_LABEL } from "@/lib/admin/poll-labels";
import { EVIDENCE, type EvidenceKey } from "@/lib/admin/poll-validation";
import { toDamascusInputValue } from "@/lib/admin/datetime";
import { ExclusionForm, RevertExclusionButton } from "@/components/admin/polls/exclusion-form";
import { clock, when } from "@/components/admin/polls/status-badge";
import { excludeVotesAction, revertExclusionAction } from "../../actions";

export const metadata: Metadata = {
  title: "مراجعة شبكة",
  robots: { index: false, follow: false },
};

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="grid gap-1 border-b border-line/60 py-2.5 sm:grid-cols-[16rem_1fr] sm:gap-4">
      <dt className="text-[0.88rem] text-muted">
        {label}
        {hint ? <span className="block text-[0.78rem]">{hint}</span> : null}
      </dt>
      <dd className="ltr-nums text-[0.92rem] tabular-nums text-ink">{children}</dd>
    </div>
  );
}

/**
 * Technical indicators for one network code, and the exclusion form.
 * Full administrators only (enforced again in poll_review_network() and
 * exclude_votes()). Deliberately shows no answers and no totals: the
 * decision must rest on technical evidence, not on which way votes went.
 */
export default async function ReviewNetworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ network?: string }>;
}) {
  const [{ id }, { network }] = await Promise.all([params, searchParams]);
  const role = await getAdminRole();
  const back = (
    <Link href={`/admin/polls/${id}`} className="text-[0.88rem] text-muted hover:text-olive">
      → صفحة السؤال
    </Link>
  );

  if (role !== "admin") {
    return (
      <div className="max-w-2xl">
        {back}
        <p className="mt-6 text-[0.95rem] text-muted">المراجعة والاستبعاد متاحان لحسابات الإدارة الكاملة فقط.</p>
      </div>
    );
  }

  const label = (network ?? "").toUpperCase();
  if (!/^[0-9A-F]{6}$/.test(label)) notFound();

  const [poll, review, exclusions] = await Promise.all([
    adminGetPoll(id),
    adminReviewNetwork(id, label),
    adminListExclusions(id),
  ]);
  if (!poll) notFound();
  const status = effectiveStatus(poll);
  const published = status === "published";
  const mine = exclusions.filter((e) => e.network_label === label);

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <div>
        {back}
        <h1 className="mt-4 text-h2 text-ink">
          مراجعة الشبكة <span dir="ltr" className="font-mono">{label}</span>
        </h1>
        <p className="mt-2 text-[0.9rem] text-muted">{poll.question_ar}</p>
        <p className="mt-4 rounded-[var(--radius)] bg-cream-deep px-4 py-3 text-[0.86rem] leading-7 text-muted">
          تعرض هذه الصفحة مؤشّرات تقنية فقط، دون الإجابات ودون المجاميع. كثرة الأصوات أو مشاركة الشبكة وحدهما
          ليستا دليلًا (جامعة، مقهى، مزوّد إنترنت مشترك). والصوت غير المتحقَّق منه ليس مشبوهًا إذا كان التحقّق مُوقَفًا عمدًا.
        </p>
      </div>

      {!review ? (
        <p className="text-[0.95rem] text-muted">
          {published ? "مُحيت رموز الشبكات عند نشر النتائج." : "لا توجد أصوات بهذا الرمز لهذا السؤال."}
        </p>
      ) : (
        <section>
          <h2 className="text-h3 text-ink">المؤشّرات</h2>
          {review.ambiguous ? (
            <p role="alert" className="mt-3 rounded-[var(--radius)] border border-[#c9a04a] bg-[#f7efd9] px-4 py-3 text-[0.88rem] text-[#6a4f14]">
              هذا الرمز القصير يطابق أكثر من شبكة، لذلك لا يمكن الاستبعاد به.
            </p>
          ) : null}
          <dl className="mt-4">
            <Row label="أصوات مقبولة من هذه الشبكة">{review.votes}</Row>
            <Row label="أول صوت – آخر صوت (دمشق)">
              <bdi dir="ltr" className="tabular-nums">{clock(review.first_at)} – {clock(review.last_at)}</bdi>
            </Row>
            <Row label="حسب التحقّق">
              {review.checks
                ? Object.entries(review.checks).map(([k, n]) => (
                    <span key={k} className="me-4 inline-block">{CHECK_LABEL[k] ?? k}: {n}</span>
                  ))
                : "—"}
            </Row>
            <Row label="تصويت فوري بعد فتح الصفحة" hint="5 ثوانٍ أو أقل بين أول زيارة والتصويت">
              {review.instant_after_visit}
            </Row>
            <Row label="متوسّط الفاصل بين صوتين">
              {review.gap_mean_secs === null ? "—" : `${review.gap_mean_secs} ث`}
            </Row>
            <Row label="انتظام الفواصل (معامل التباين)" hint="قريب من 0 = توقيت آلي منتظم؛ البشر عادةً فوق 0.5">
              {review.gap_cv ?? "—"}
            </Row>
            <Row label="مستبعدة سابقًا">{review.already_excluded}</Row>
          </dl>

          {review.per_minute?.length ? (
            <div className="mt-6">
              <h3 className="text-[0.95rem] font-medium text-ink">الأصوات في كل دقيقة</h3>
              <div className="mt-3 max-h-72 overflow-auto rounded-[var(--radius)] border border-line">
                <table className="w-full border-collapse text-[0.85rem]">
                  <tbody>
                    {review.per_minute.map((m) => (
                      <tr key={m.minute} className="border-b border-line/60">
                        <td className="px-3 py-1.5 text-muted"><span dir="ltr" className="ltr-nums tabular-nums">{clock(m.minute).slice(0, 5)}</span></td>
                        <td className="w-full px-3 py-1.5">
                          <span className="ltr-nums me-2 inline-block w-8 tabular-nums text-ink">{m.votes}</span>
                          <span aria-hidden="true" className="inline-block h-2 rounded-[2px] bg-olive/70 align-middle"
                            style={{ width: `${Math.min(100, (m.votes / Math.max(...review.per_minute!.map((x) => x.votes))) * 100)}%`, maxWidth: "70%" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {mine.length ? (
        <section>
          <h2 className="text-h3 text-ink">استبعادات هذه الشبكة</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {mine.map((e) => (
              <li key={e.id} className="rounded-[var(--radius)] border border-line bg-[#fffdf7] px-4 py-3 text-[0.88rem]">
                <p className="text-ink">
                  {e.votes_affected} صوت/أصوات · من {when(e.from_at)} إلى {when(e.to_at)}
                  {e.reverted_at ? <span className="ms-2 text-muted">(تمّ التراجع عنه {when(e.reverted_at)})</span> : null}
                </p>
                <p className="mt-1 text-muted">
                  الأدلّة: {e.evidence.map((k) => EVIDENCE[k as EvidenceKey] ?? k).join("، ")}
                </p>
                <p className="mt-1 text-muted">السبب: {e.reason}</p>
                {!e.reverted_at && !published ? (
                  <div className="mt-3">
                    <RevertExclusionButton pollId={poll.id} exclusionId={e.id} action={revertExclusionAction} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {review && !review.ambiguous && !published ? (
        <section className="border-t border-line pt-8">
          <h2 className="text-h3 text-ink">استبعاد أصوات بعد المراجعة</h2>
          <p className="mt-2 text-[0.88rem] text-muted">
            تُعلَّم الأصوات مستبعدة ولا تُحذف، ويمكن التراجع قبل النشر. يُسجَّل كل استبعاد مع اسمك وأدلّته وسببه.
            يظهر للجمهور عدد المستبعَد فقط، إن كان أكبر من صفر.
          </p>
          <div className="mt-6">
            <ExclusionForm
              label={label}
              defaultFrom={toDamascusInputValue(review.first_at)}
              defaultTo={toDamascusInputValue(review.last_at)}
              action={excludeVotesAction.bind(null, poll.id)}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
