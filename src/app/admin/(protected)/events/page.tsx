import type { Metadata } from "next";
import Link from "next/link";
import { adminListEvents } from "@/lib/admin/events";
import { ButtonLink } from "@/components/ui/button";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "الفعاليات",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: "مسودّة",
  upcoming: "قادمة",
  completed: "منتهية",
  archived: "مؤرشفة",
};

export default async function AdminEventsPage() {
  const events = await adminListEvents();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h2 text-ink">الفعاليات</h1>
        <ButtonLink href="/admin/events/new" size="sm">
          + ندوة جديدة
        </ButtonLink>
      </div>

      {events.length === 0 ? (
        <p className="mt-8 text-[0.95rem] text-muted">لا توجد ندوات بعد.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-start text-muted">
                <th className="py-2 pe-4 text-start font-medium">العنوان</th>
                <th className="py-2 pe-4 text-start font-medium">الحالة</th>
                <th className="py-2 pe-4 text-start font-medium">النشر</th>
                <th className="py-2 pe-4 text-start font-medium">الموعد</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-line/60">
                  <td className="py-3 pe-4">
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="text-ink transition-colors hover:text-olive"
                    >
                      {e.title_ar}
                    </Link>
                  </td>
                  <td className="py-3 pe-4 text-muted">
                    {STATUS_LABEL[e.status] ?? e.status}
                  </td>
                  <td className="py-3 pe-4 text-muted">
                    {e.is_published ? "منشورة" : "غير منشورة"}
                  </td>
                  <td className="py-3 pe-4 text-muted">
                    {e.starts_at ? formatDateShort(e.starts_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
