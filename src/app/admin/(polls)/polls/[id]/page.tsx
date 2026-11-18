import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adminAuditLog,
  adminGetPoll,
  adminListExclusions,
  adminListPollEvents,
  adminPollMonitor,
  adminPollResults,
  adminRefusalSummary,
  effectiveStatus,
  getAdminRole,
} from "@/lib/admin/polls";
import { auditDetail, auditLabel, CHECK_LABEL, REFUSAL_LABEL } from "@/lib/admin/poll-labels";
import { PollForm } from "@/components/admin/polls/poll-form";
import { StatusControls } from "@/components/admin/polls/status-controls";
import { ClosesAtForm } from "@/components/admin/polls/closes-at-form";
import { ProtectionForm } from "@/components/admin/polls/protection-form";
import { AutoRefresh } from "@/components/polls/auto-refresh";
import { StatusBadge, clock, when } from "@/components/admin/polls/status-badge";
import { DeleteForm } from "@/components/admin/delete-button";
import { PollResultsView } from "@/components/polls/poll-results";
import { cn } from "@/lib/cn";
import { isFuture } from "@/lib/format";
import {
  deletePollAction,
  setClosesAtAction,
  setProtectionAction,
  setStatusAction,
  updatePollAction,
} from "../actions";

export const metadata: Metadata = {
  title: "سؤال ندوات",
  robots: { index: false, follow: false },
};

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-h3 text-ink">{title}</h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" | "alert" }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-[var(--radius)] border bg-[#fffdf7] px-4 py-3",
        tone === "alert" ? "border-[#b4553a]" : tone === "warn" ? "border-[#c9a04a]" : "border-line",
      )}
    >
      <span className="text-[0.8rem] text-muted">{label}</span>
      <span className="ltr-nums font-display text-[1.5rem] font-bold tabular-nums text-ink">{value}</span>
    </div>
  );
}

const LEVEL: Record<string, { label: string; className: string }> = {
  normal: { label: "عادي", className: "text-muted" },
  warning: { label: "تحذير مراقبة", className: "text-[#7a5d1c] font-medium" },
  alert: { label: "تنبيه عاجل", className: "text-[#8f3520] font-semibold" },
};

export default async function PollControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [poll, role] = await Promise.all([adminGetPoll(id), getAdminRole()]);
  if (!poll || !role) notFound();

  const status = effectiveStatus(poll);
  const editable = status === "draft" || status === "scheduled";
  const isAdmin = role === "admin";
  const hasVoting = !editable;

  const [monitor, refusals, results, audit, exclusions, events] = await Promise.all([
    hasVoting ? adminPollMonitor(id) : Promise.resolve(null),
    hasVoting ? adminRefusalSummary(id) : Promise.resolve(null),
    hasVoting ? adminPollResults(id) : Promise.resolve(null),
    adminAuditLog(id),
    isAdmin && hasVoting ? adminListExclusions(id) : Promise.resolve([]),
    editable ? adminListPollEvents() : Promise.resolve([]),
  ]);

  const alerts = monitor?.networks.filter((n) => n.level === "alert") ?? [];
  const warnings = monitor?.networks.filter((n) => n.level === "warning") ?? [];
  const serverConfigRefusals = refusals?.by_reason.server_config ?? 0;
  const activeExclusions = exclusions.filter((e) => !e.reverted_at);
  const canSchedule = !!poll.opens_at && isFuture(poll.opens_at);

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      {status === "open" ? <AutoRefresh seconds={30} /> : null}

      <div>
        <Link href="/admin/polls" className="text-[0.88rem] text-muted hover:text-olive">
          → كل الأسئلة
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          {poll.debate ? <span className="text-[0.9rem] text-muted">{poll.debate.title_ar}</span> : null}
        </div>
        <h1 className="mt-3 text-h2 text-ink">{poll.question_ar}</h1>
        <dl className="mt-4 grid gap-x-8 gap-y-1 text-[0.88rem] text-muted sm:grid-cols-2">
          <div><dt className="inline">موعد الفتح: </dt><dd className="inline">{when(poll.opened_at ?? poll.opens_at)}</dd></div>
          <div><dt className="inline">الإغلاق التلقائي: </dt><dd className="inline">{poll.closes_at ? when(poll.closes_at) : "غير محدّد"}</dd></div>
          {poll.closed_at ? <div><dt className="inline">أُغلق: </dt><dd className="inline">{when(poll.closed_at)}</dd></div> : null}
          {poll.published_at ? <div><dt className="inline">نُشرت النتائج: </dt><dd className="inline">{when(poll.published_at)}</dd></div> : null}
        </dl>
      </div>

      {serverConfigRefusals > 0 || alerts.length || warnings.length ? (
        <div className="flex flex-col gap-3">
          {serverConfigRefusals > 0 ? (
            <p role="alert" className="rounded-[var(--radius)] border border-[#b4553a] bg-[#f3e4de] px-4 py-3 text-[0.92rem] text-[#8f3520]">
              <strong>تنبيه عاجل:</strong> رُفض {serverConfigRefusals} صوت/أصوات بسبب خطأ في إعداد مفتاح Cloudflare على الخادم.
              هذا يصيب كل الزوّار، ويلزم إصلاح الإعداد فورًا.
            </p>
          ) : null}
          {alerts.length ? (
            <p role="alert" className="rounded-[var(--radius)] border border-[#b4553a] bg-[#f3e4de] px-4 py-3 text-[0.92rem] text-[#8f3520]">
              <strong>تنبيه عاجل:</strong> {alerts.length === 1 ? "شبكة واحدة بلغت" : `${alerts.length} شبكات بلغت`} {monitor!.alert_per_10min} صوتًا خلال 10 دقائق
              ({alerts.map((n) => n.label).join("، ")}). للمراقبة فقط: لم يُرفض أيّ صوت.
            </p>
          ) : null}
          {warnings.length ? (
            <p className="rounded-[var(--radius)] border border-[#c9a04a] bg-[#f7efd9] px-4 py-3 text-[0.92rem] text-[#6a4f14]">
              <strong>تحذير مراقبة:</strong> {warnings.length === 1 ? "شبكة واحدة بلغت" : `${warnings.length} شبكات بلغت`} {monitor!.warn_per_10min} صوتًا خلال 10 دقائق
              ({warnings.map((n) => n.label).join("، ")}). قد تكون شبكة مشتركة (جامعة، مقهى، مزوّد إنترنت)؛ العدد وحده ليس دليلًا.
            </p>
          ) : null}
        </div>
      ) : null}

      <Section
        title="التحكّم بالتصويت"
        aside={
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.88rem]">
            {status !== "draft" ? (
              <>
                <Link href="/vote" target="_blank" className="text-olive underline underline-offset-4">
                  فتح الصفحة العامة /vote
                </Link>
                <Link href="/vote/screen" target="_blank" className="text-olive underline underline-offset-4">
                  فتح شاشة البث
                </Link>
              </>
            ) : null}
            <Link href={`/admin/polls/${poll.id}/screen`} className="text-olive underline underline-offset-4">
              معاينة شاشة البث
            </Link>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <StatusControls
            pollId={poll.id}
            status={status}
            canSchedule={canSchedule}
            everPublished={!!poll.published_at}
            action={setStatusAction}
          />
          {status === "draft" && !canSchedule ? (
            <p className="text-[0.85rem] text-muted">للجدولة: حدّد موعد فتح في المستقبل في نموذج التعديل أدناه.</p>
          ) : null}
          {status === "open" ? (
            <ClosesAtForm closesAt={poll.closes_at} action={setClosesAtAction.bind(null, poll.id)} />
          ) : null}
        </div>
      </Section>

      {hasVoting && monitor ? (
        <Section
          title="المراقبة"
          aside={status === "open" ? <span className="text-[0.8rem] text-muted">تُحدَّث كل 30 ثانية</span> : null}
        >
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="أصوات مقبولة" value={monitor.accepted.toLocaleString("en-US")} />
              <Stat label="خلال آخر 10 دقائق" value={monitor.last_10_min.toLocaleString("en-US")} />
              <Stat
                label="محاولات مرفوضة"
                value={(refusals?.total ?? 0).toLocaleString("en-US")}
                tone={serverConfigRefusals > 0 ? "alert" : undefined}
              />
              <Stat label="مستبعدة بعد مراجعة" value={(results?.excluded ?? 0).toLocaleString("en-US")} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-[0.95rem] font-medium text-ink">الأصوات المقبولة حسب التحقّق</h3>
                <ul className="mt-2 flex flex-col gap-1 text-[0.88rem] text-muted">
                  {Object.entries(monitor.checks).length === 0 ? <li>لا أصوات بعد.</li> : null}
                  {Object.entries(monitor.checks).map(([k, n]) => (
                    <li key={k} className="flex justify-between gap-4">
                      <span>{CHECK_LABEL[k] ?? k}</span>
                      <span className="ltr-nums tabular-nums text-ink">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[0.95rem] font-medium text-ink">
                  المحاولات المرفوضة حسب السبب
                  {refusals?.recent ? (
                    <span className="ms-2 text-[0.8rem] font-normal text-muted">({refusals.recent} في آخر 20 دقيقة تقريبًا)</span>
                  ) : null}
                </h3>
                <ul className="mt-2 flex flex-col gap-1 text-[0.88rem] text-muted">
                  {!refusals ? <li>غير متاح في هذه البيئة بعد.</li> : null}
                  {refusals && Object.keys(refusals.by_reason).length === 0 ? <li>لا محاولات مرفوضة.</li> : null}
                  {refusals
                    ? Object.entries(refusals.by_reason).map(([k, n]) => (
                        <li key={k} className={cn("flex justify-between gap-4", k === "server_config" && "text-[#8f3520]")}>
                          <span>{REFUSAL_LABEL[k] ?? k}</span>
                          <span className="ltr-nums tabular-nums text-ink">{n}</span>
                        </li>
                      ))
                    : null}
                </ul>
                <p className="mt-2 text-[0.8rem] text-muted">يُحفظ السبب والعدد فقط، دون أيّ رمز أو بيانات عن الزائر.</p>
              </div>
            </div>

            <div>
              <h3 className="text-[0.95rem] font-medium text-ink">الشبكات الأكثر نشاطًا</h3>
              {status === "published" ? (
                <p className="mt-2 text-[0.88rem] text-muted">مُحيت رموز الشبكات عند نشر النتائج.</p>
              ) : monitor.networks.length === 0 ? (
                <p className="mt-2 text-[0.88rem] text-muted">لا أصوات بعد.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-[0.86rem]">
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th className="py-2 pe-4 text-start font-medium">رمز الشبكة</th>
                        <th className="py-2 pe-4 text-start font-medium">أصوات</th>
                        <th className="py-2 pe-4 text-start font-medium">الذروة / 10 د</th>
                        <th className="py-2 pe-4 text-start font-medium">من – إلى</th>
                        <th className="py-2 pe-4 text-start font-medium">المستوى</th>
                        {isAdmin ? <th className="py-2 text-start font-medium"><span className="sr-only">مراجعة</span></th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {monitor.networks.map((n) => (
                        <tr key={n.label} className="border-b border-line/60">
                          <td className="py-2 pe-4"><span dir="ltr" className="font-mono">{n.label}</span></td>
                          <td className="py-2 pe-4 ltr-nums tabular-nums">{n.votes}</td>
                          <td className="py-2 pe-4 ltr-nums tabular-nums">{n.peak_10min}</td>
                          <td className="py-2 pe-4 text-muted">
                            <span dir="ltr" className="ltr-nums tabular-nums">
                              {clock(n.first_at)} – {clock(n.last_at)}
                            </span>
                          </td>
                          <td className={cn("py-2 pe-4", LEVEL[n.level]?.className)}>{LEVEL[n.level]?.label ?? n.level}</td>
                          {isAdmin ? (
                            <td className="py-2">
                              <Link
                                href={`/admin/polls/${poll.id}/review?network=${n.label}`}
                                className="text-olive underline underline-offset-4"
                              >
                                مراجعة
                              </Link>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[0.8rem] text-muted">
                رموز الشبكات مشتقّة لكل سؤال بمفتاح سرّي، ولا تكشف عنوان IP. تُعرض أنشط 20 شبكة.
                {isAdmin ? "" : " المراجعة والاستبعاد متاحان لحسابات الإدارة الكاملة فقط."}
              </p>
            </div>

            {isAdmin && exclusions.length ? (
              <div>
                <h3 className="text-[0.95rem] font-medium text-ink">الاستبعادات</h3>
                <ul className="mt-2 flex flex-col gap-1 text-[0.88rem] text-muted">
                  {exclusions.map((e) => (
                    <li key={e.id}>
                      <Link href={`/admin/polls/${poll.id}/review?network=${e.network_label}`} className="text-olive underline underline-offset-4">
                        <span dir="ltr" className="font-mono">{e.network_label}</span>
                      </Link>{" "}
                      · {e.votes_affected} صوت/أصوات · {e.reverted_at ? "تمّ التراجع عنه" : "سارٍ"}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[0.8rem] text-muted">سارية: {activeExclusions.length}</p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {results ? (
        <Section title={status === "published" ? "النتائج المنشورة" : "النتائج الأولية — غير منشورة"}>
          {status === "published" ? (
            <PollResultsView results={results} />
          ) : (
            <details className="rounded-[var(--radius)] border border-line bg-[#fffdf7] px-4 py-3">
              <summary className="cursor-pointer text-[0.92rem] text-olive">
                عرض النتائج الأولية (لا يراها الجمهور قبل النشر)
              </summary>
              <div className="mt-5">
                <PollResultsView results={results} />
              </div>
            </details>
          )}
        </Section>
      ) : null}

      <Section title="المعاينة كما ستظهر للجمهور">
        <div className="max-w-md rounded-[var(--radius)] border border-line bg-[#fffdf7] p-5">
          {poll.debate ? <p className="text-meta text-muted">{poll.debate.title_ar}</p> : null}
          <p className="mt-2 font-display text-[1.3rem] font-bold leading-9 text-ink">{poll.question_ar}</p>
          {poll.note_ar ? <p className="mt-2 text-[0.92rem] text-muted">{poll.note_ar}</p> : null}
          <ul className="mt-4 flex flex-col gap-2">
            {poll.options.map((o) => (
              <li key={o.id} className="rounded-[var(--radius)] border border-line-strong px-4 py-3 text-[1rem] text-ink">
                {o.label_ar}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {editable ? (
        <Section title="تعديل السؤال">
          <div className="max-w-2xl">
            <PollForm
              poll={{
                question_ar: poll.question_ar,
                note_ar: poll.note_ar,
                slug: poll.slug,
                debate_id: poll.debate_id,
                opens_at: poll.opens_at,
                closes_at: poll.closes_at,
                answers: poll.options.map((o) => o.label_ar),
              }}
              events={events}
              action={updatePollAction.bind(null, poll.id)}
              submitLabel="حفظ التعديلات"
            />
          </div>
        </Section>
      ) : null}

      <Section title="إعدادات الحماية">
        {isAdmin ? (
          <div className="max-w-2xl">
            <ProtectionForm
              requireTurnstile={poll.require_turnstile}
              warn={poll.warn_per_10min}
              alert={poll.alert_per_10min}
              action={setProtectionAction.bind(null, poll.id)}
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-1 text-[0.9rem] text-muted">
            <li>تحقّق Cloudflare: {poll.require_turnstile ? "مفعّل" : "مُوقَف"}</li>
            <li>تحذير مراقبة عند {poll.warn_per_10min} صوتًا من شبكة واحدة خلال 10 دقائق</li>
            <li>تنبيه عاجل عند {poll.alert_per_10min} صوتًا من شبكة واحدة خلال 10 دقائق</li>
            <li className="text-[0.82rem]">تغيير هذه الإعدادات متاح لحسابات الإدارة الكاملة فقط.</li>
          </ul>
        )}
      </Section>

      <Section title="السجلّ">
        {audit.length === 0 ? (
          <p className="text-[0.9rem] text-muted">لا شيء بعد.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line/60 text-[0.88rem]">
            {audit.map((a, i) => {
              const detail = auditDetail(a.action, a.detail ?? {});
              return (
                <li key={`${a.at}-${i}`} className="flex flex-col gap-0.5 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="text-ink">{auditLabel(a.action)}</span>
                    <span className="text-[0.82rem] text-muted">
                      {when(a.at)}
                      {a.actor_name ? ` · ${a.actor_name}` : ""}
                    </span>
                  </div>
                  {detail ? <span className="text-[0.82rem] text-muted">{detail}</span> : null}
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      {editable ? (
        <section className="border-t border-line pt-8">
          <p className="mb-3 text-[0.85rem] text-muted">حذف السؤال ممكن قبل فتح التصويت فقط.</p>
          <DeleteForm
            action={deletePollAction}
            hiddenFields={{ id: poll.id }}
            confirmMessage={`حذف السؤال "${poll.question_ar}" نهائيًا؟`}
            buttonLabel="حذف السؤال"
          />
        </section>
      ) : null}
    </div>
  );
}
