import type { Metadata } from "next";
import { adminListRegistrations } from "@/lib/admin/registrations";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "التسجيلات",
  robots: { index: false, follow: false },
};

export default async function AdminRegistrationsPage() {
  const registrations = await adminListRegistrations();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h2 text-ink">التسجيلات</h1>
        <a
          href="/admin/registrations/export"
          className="text-[0.9rem] text-olive underline underline-offset-4 hover:no-underline"
        >
          تنزيل CSV
        </a>
      </div>

      {registrations.length === 0 ? (
        <p className="mt-8 text-[0.95rem] text-muted">لا توجد تسجيلات بعد.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[50rem] border-collapse text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-start text-muted">
                <th className="py-2 pe-4 text-start font-medium">الاسم</th>
                <th className="py-2 pe-4 text-start font-medium">البريد الإلكتروني</th>
                <th className="py-2 pe-4 text-start font-medium">البلد</th>
                <th className="py-2 pe-4 text-start font-medium">الندوة</th>
                <th className="py-2 pe-4 text-start font-medium">إشعارات مستقبلية</th>
                <th className="py-2 pe-4 text-start font-medium">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-3 pe-4 text-ink">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="py-3 pe-4 text-muted" dir="ltr">
                    {r.email}
                  </td>
                  <td className="py-3 pe-4 text-muted">{r.country}</td>
                  <td className="py-3 pe-4 text-muted">
                    {r.debate?.title_ar ?? "—"}
                  </td>
                  <td className="py-3 pe-4 text-muted">
                    {r.notify_future_events ? "نعم" : "لا"}
                  </td>
                  <td className="py-3 pe-4 text-muted">
                    {formatDateShort(r.created_at)}
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
