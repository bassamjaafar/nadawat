import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/admin/auth";
import { adminListRegistrations } from "@/lib/admin/registrations";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const admin = await requireAdminClient();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await adminListRegistrations();
  const csv = toCsv(
    rows.map((r) => ({
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email,
      country: r.country,
      debate: r.debate?.title_ar ?? "",
      notify_future_events: r.notify_future_events ? "نعم" : "لا",
      created_at: r.created_at,
    })),
    [
      { key: "first_name", label: "الاسم الأول" },
      { key: "last_name", label: "اسم العائلة" },
      { key: "email", label: "البريد الإلكتروني" },
      { key: "country", label: "البلد" },
      { key: "debate", label: "الندوة" },
      { key: "notify_future_events", label: "إشعارات مستقبلية" },
      { key: "created_at", label: "تاريخ التسجيل" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations.csv"',
    },
  });
}
