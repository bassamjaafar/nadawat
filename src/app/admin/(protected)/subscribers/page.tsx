import type { Metadata } from "next";
import { adminListSubscribers } from "@/lib/admin/subscribers";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "المشتركون",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكَّد",
  unsubscribed: "ألغى الاشتراك",
};

export default async function AdminSubscribersPage() {
  const subscribers = await adminListSubscribers();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h2 text-ink">المشتركون</h1>
        <a
          href="/admin/subscribers/export"
          className="text-[0.9rem] text-olive underline underline-offset-4 hover:no-underline"
        >
          تنزيل CSV
        </a>
      </div>

      {subscribers.length === 0 ? (
        <p className="mt-8 text-[0.95rem] text-muted">لا يوجد مشتركون بعد.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-start text-muted">
                <th className="py-2 pe-4 text-start font-medium">الاسم</th>
                <th className="py-2 pe-4 text-start font-medium">البريد الإلكتروني</th>
                <th className="py-2 pe-4 text-start font-medium">البلد</th>
                <th className="py-2 pe-4 text-start font-medium">الحالة</th>
                <th className="py-2 pe-4 text-start font-medium">تاريخ الاشتراك</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-line/60">
                  <td className="py-3 pe-4 text-ink">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="py-3 pe-4 text-muted" dir="ltr">
                    {s.email}
                  </td>
                  <td className="py-3 pe-4 text-muted">{s.country}</td>
                  <td className="py-3 pe-4 text-muted">
                    {STATUS_LABEL[s.status] ?? s.status}
                  </td>
                  <td className="py-3 pe-4 text-muted">
                    {formatDateShort(s.created_at)}
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
