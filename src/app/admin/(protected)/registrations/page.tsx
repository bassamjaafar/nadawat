import type { Metadata } from "next";
import {
  adminListRegistrations,
  registrantName,
  type AdminRegistrationRow,
} from "@/lib/admin/registrations";
import {
  PARTICIPATION_TYPE_LABELS,
  REGISTRATION_STATUSES,
} from "@/lib/admin/registration-status";
import { RegistrationStatusForm } from "@/components/admin/registration-status-form";
import { cn } from "@/lib/cn";
import { formatDateShort, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "طلبات المشاركة",
  robots: { index: false, follow: false },
};

function groupByEvent(rows: AdminRegistrationRow[]) {
  const groups = new Map<string, { title: string; rows: AdminRegistrationRow[] }>();
  for (const r of rows) {
    const key = r.debate?.slug ?? "—";
    const g = groups.get(key) ?? { title: r.debate?.title_ar ?? "—", rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  return [...groups.values()];
}

function Submission({ r }: { r: AdminRegistrationRow }) {
  const live = r.participation_type === "live";
  const waDigits = r.phone?.replace(/\D/g, "");

  return (
    <li className="rounded-[var(--radius-md)] border border-line bg-[#fffdf7] p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-medium text-ink">{registrantName(r)}</p>
        {r.participation_type ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[0.78rem]",
              live ? "bg-olive text-cream" : "bg-cream-deep text-ink",
            )}
          >
            {PARTICIPATION_TYPE_LABELS[r.participation_type]}
          </span>
        ) : (
          <span className="rounded-full bg-cream-deep px-2.5 py-0.5 text-[0.78rem] text-muted">
            تسجيل حضور (قديم)
          </span>
        )}
        <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[0.78rem] text-muted">
          {REGISTRATION_STATUSES[r.status]}
        </span>
        <span className="ms-auto text-[0.8rem] text-muted">
          {formatDateShort(r.created_at)} · {formatTime(r.created_at)}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[0.88rem] sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">البريد</dt>
        <dd dir="ltr" className="text-end text-ink">
          <a href={`mailto:${r.email}`} className="hover:text-olive">
            {r.email}
          </a>
        </dd>
        {r.phone ? (
          <>
            <dt className="text-muted">واتساب / الهاتف</dt>
            <dd dir="ltr" className="text-end text-ink">
              {waDigits ? (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-olive"
                >
                  {r.phone}
                </a>
              ) : (
                r.phone
              )}
            </dd>
          </>
        ) : null}
        <dt className="text-muted">البلد</dt>
        <dd className="text-ink">{r.country}</dd>
        {live ? (
          <>
            <dt className="text-muted">الموافقات</dt>
            <dd className="text-ink">
              {r.ack_limited_selection && r.ack_time_limit && r.consent_recording_at
                ? "✓ محدودية الاختيار · ✓ 90–120 ثانية · ✓ الظهور في التسجيل"
                : "ناقصة"}
            </dd>
          </>
        ) : null}
        <dt className="text-muted">تحديثات ندوات</dt>
        <dd className="text-ink">{r.notify_future_events ? "نعم" : "لا"}</dd>
      </dl>

      {r.question ? (
        <p className="mt-4 whitespace-pre-line border-s-2 border-line-strong ps-4 text-[0.95rem] leading-7 text-ink">
          {r.question}
        </p>
      ) : null}

      <div className="mt-5 border-t border-line pt-4">
        <RegistrationStatusForm id={r.id} status={r.status} note={r.admin_note} />
      </div>
    </li>
  );
}

export default async function AdminRegistrationsPage() {
  const registrations = await adminListRegistrations();
  const groups = groupByEvent(registrations);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h2 text-ink">طلبات المشاركة</h1>
        <a
          href="/admin/registrations/export"
          className="text-[0.9rem] text-olive underline underline-offset-4 hover:no-underline"
        >
          تنزيل CSV
        </a>
      </div>
      <p className="mt-2 text-[0.9rem] text-muted">
        طلبات «شارك في الحوار» — أسئلة مكتوبة وطلبات مشاركة مباشرة. المشاهدة لا
        تحتاج إلى تسجيل، فلا تظهر هنا.
      </p>

      {registrations.length === 0 ? (
        <p className="mt-8 text-[0.95rem] text-muted">لا توجد طلبات بعد.</p>
      ) : (
        groups.map((g) => {
          const liveCount = g.rows.filter((r) => r.participation_type === "live").length;
          return (
            <section key={g.title} className="mt-10">
              <h2 className="text-h3 text-ink">{g.title}</h2>
              <p className="mt-1 text-[0.85rem] text-muted">
                عدد الطلبات: {g.rows.length} · طلبات المشاركة المباشرة: {liveCount}
              </p>
              <ul className="mt-4 flex flex-col gap-4">
                {g.rows.map((r) => (
                  <Submission key={r.id} r={r} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
