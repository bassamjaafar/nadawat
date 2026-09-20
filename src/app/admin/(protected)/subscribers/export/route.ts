import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/admin/auth";
import { adminListSubscribers } from "@/lib/admin/subscribers";
import { toCsv } from "@/lib/csv";

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكَّد",
  unsubscribed: "ألغى الاشتراك",
};

export async function GET() {
  const admin = await requireAdminClient();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await adminListSubscribers();
  const csv = toCsv(
    rows.map((s) => ({
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      country: s.country,
      status: STATUS_LABEL[s.status] ?? s.status,
      created_at: s.created_at,
    })),
    [
      { key: "first_name", label: "الاسم الأول" },
      { key: "last_name", label: "اسم العائلة" },
      { key: "email", label: "البريد الإلكتروني" },
      { key: "country", label: "البلد" },
      { key: "status", label: "الحالة" },
      { key: "created_at", label: "تاريخ الاشتراك" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscribers.csv"',
    },
  });
}
