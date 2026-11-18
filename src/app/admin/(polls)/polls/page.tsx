import type { Metadata } from "next";
import Link from "next/link";
import { adminListPolls, effectiveStatus } from "@/lib/admin/polls";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, when } from "@/components/admin/polls/status-badge";

export const metadata: Metadata = {
  title: "سؤال ندوات",
  robots: { index: false, follow: false },
};

export default async function AdminPollsPage() {
  const polls = await adminListPolls();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 text-ink">سؤال ندوات</h1>
          <p className="mt-2 text-[0.92rem] text-muted">
            استطلاعات الجمهور خلال الندوات. سؤال واحد فقط يمكن أن يكون مجدولًا أو مفتوحًا في أيّ وقت.
          </p>
        </div>
        <ButtonLink href="/admin/polls/new" size="sm">
          + سؤال جديد
        </ButtonLink>
      </div>

      {polls.length === 0 ? (
        <p className="mt-8 text-[0.95rem] text-muted">لا توجد أسئلة بعد.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pe-4 text-start font-medium">السؤال</th>
                <th className="py-2 pe-4 text-start font-medium">الندوة</th>
                <th className="py-2 pe-4 text-start font-medium">الحالة</th>
                <th className="py-2 pe-4 text-start font-medium">الفتح</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((p) => (
                <tr key={p.id} className="border-b border-line/60 align-top">
                  <td className="py-3 pe-4">
                    <Link href={`/admin/polls/${p.id}`} className="text-ink transition-colors hover:text-olive">
                      {p.question_ar}
                    </Link>
                  </td>
                  <td className="py-3 pe-4 text-muted">{p.debate?.title_ar ?? "—"}</td>
                  <td className="py-3 pe-4">
                    <StatusBadge status={effectiveStatus(p)} />
                  </td>
                  <td className="py-3 pe-4 text-muted">{when(p.opened_at ?? p.opens_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
