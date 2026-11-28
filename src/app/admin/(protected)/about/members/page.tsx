import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminListGroups, adminListMembers } from "@/lib/admin/about";
import { ButtonLink } from "@/components/ui/button";
import { Pill } from "@/components/admin/about/pill";
import {
  damascusToday,
  MEMBER_STATUS_LABEL,
  renewalState,
  RENEWAL_LABEL,
  RENEWAL_WARNING_DAYS,
  worstRenewal,
  type TeamMember,
} from "@/lib/about/team";

export const metadata: Metadata = {
  title: "أعضاء فريق ندوات",
  robots: { index: false, follow: false },
};

export default async function MembersPage() {
  const [members, groups] = await Promise.all([adminListMembers(), adminListGroups()]);
  const groupName = new Map(groups.map((g) => [g.id, g.name_ar]));
  const today = damascusToday();

  const row = (m: TeamMember) => {
    const renewal = worstRenewal(m.memberships.map((ms) => renewalState(ms.end_date, today)));
    const names = m.memberships.map((ms) => groupName.get(ms.group_id)).filter(Boolean);
    return (
      <li key={m.id} className="border-t border-line first:border-t-0">
        <Link
          href={`/admin/about/members/${m.id}`}
          className="flex items-center gap-3 py-3 transition-colors hover:text-olive"
        >
          <span className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius)] bg-cream-deep">
            {m.image_url ? (
              <Image src={m.image_url} alt="" fill sizes="48px" className="object-cover" />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink">{m.full_name_ar}</span>
            <span className="block truncate text-[0.85rem] text-muted">
              {names.length ? names.join("، ") : "بلا مجموعة"}
            </span>
          </span>
          <span className="flex shrink-0 flex-wrap justify-end gap-2">
            {m.status !== "archived" && renewal !== "none" ? (
              <Pill tone={renewal === "overdue" ? "bad" : "warn"}>{RENEWAL_LABEL[renewal]}</Pill>
            ) : null}
            <Pill tone={m.status === "published" ? "good" : "muted"}>{MEMBER_STATUS_LABEL[m.status]}</Pill>
          </span>
        </Link>
      </li>
    );
  };

  const published = members.filter((m) => m.status === "published");
  const drafts = members.filter((m) => m.status === "draft");
  const archived = members.filter((m) => m.status === "archived");

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[36rem] text-[0.95rem] leading-7 text-muted">
          «التجديد قريب» تعني أنّ إحدى العضويات تنتهي خلال {RENEWAL_WARNING_DAYS} يومًا، و«انتهت العضوية» أنّ تاريخ انتهائها قد مضى. لا يُلغى نشر أيّ ملف تلقائيًّا.
        </p>
        <ButtonLink href="/admin/about/members/new" size="sm">
          + عضو/ة جديد/ة
        </ButtonLink>
      </div>

      {members.length === 0 ? (
        <p className="mt-8 text-muted">لا أعضاء بعد.</p>
      ) : null}

      {published.length ? (
        <section className="mt-8">
          <h2 className="text-meta font-medium text-muted">منشور ({published.length})</h2>
          <ul className="mt-2">{published.map(row)}</ul>
        </section>
      ) : null}
      {drafts.length ? (
        <section className="mt-8">
          <h2 className="text-meta font-medium text-muted">مسودة ({drafts.length})</h2>
          <ul className="mt-2">{drafts.map(row)}</ul>
        </section>
      ) : null}
      {archived.length ? (
        <details className="mt-10">
          <summary className="cursor-pointer text-[0.95rem] text-muted">مؤرشف ({archived.length})</summary>
          <ul className="mt-2">{archived.map(row)}</ul>
        </details>
      ) : null}
    </div>
  );
}
