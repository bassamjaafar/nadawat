import type { Metadata } from "next";
import Link from "next/link";
import { adminListGroups } from "@/lib/admin/about";
import { ButtonLink } from "@/components/ui/button";
import { Pill } from "@/components/admin/about/pill";
import { GROUP_STATUS_LABEL, type GroupStatus } from "@/lib/about/team";

export const metadata: Metadata = {
  title: "مجموعات فريق ندوات",
  robots: { index: false, follow: false },
};

const TONE: Record<GroupStatus, "good" | "muted"> = {
  published: "good",
  hidden: "muted",
  archived: "muted",
};

export default async function GroupsPage() {
  const groups = await adminListGroups();
  const active = groups.filter((g) => g.status !== "archived");
  const archived = groups.filter((g) => g.status === "archived");

  const list = (items: typeof groups) => (
    <ul className="flex flex-col">
      {items.map((g) => (
        <li key={g.id} className="border-t border-line first:border-t-0">
          <Link
            href={`/admin/about/groups/${g.id}`}
            className="flex flex-col gap-1.5 py-4 transition-colors hover:text-olive sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <span className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-[0.85rem] text-muted tabular-nums">{g.sort_order}</span>
              <span className="font-medium text-ink">{g.name_ar}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2 ps-[3.25rem] sm:ps-0">
              <span className="text-[0.85rem] text-muted tabular-nums">
                {g.published} منشور · {g.total} إجمالًا
              </span>
              <Pill tone={TONE[g.status]}>{GROUP_STATUS_LABEL[g.status]}</Pill>
              {g.status === "published" && g.published === 0 ? (
                <Pill tone="warn">لا أعضاء منشورون — لا تظهر</Pill>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[36rem] text-[0.95rem] leading-7 text-muted">
          تظهر المجموعات حسب «ترتيب العرض» (الرقم الأصغر أوّلًا)، ولا تظهر المجموعة الفارغة أو المخفية أو المؤرشفة.
        </p>
        <ButtonLink href="/admin/about/groups/new" size="sm">
          + مجموعة جديدة
        </ButtonLink>
      </div>
      <div className="mt-6">
        {active.length ? list(active) : <p className="text-muted">لا مجموعات بعد.</p>}
      </div>
      {archived.length ? (
        <details className="mt-10">
          <summary className="cursor-pointer text-[0.95rem] text-muted">
            المجموعات المؤرشفة ({archived.length})
          </summary>
          <div className="mt-4">{list(archived)}</div>
        </details>
      ) : null}
    </div>
  );
}
