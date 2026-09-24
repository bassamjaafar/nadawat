import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/admin/auth";
import {
  adminListRegistrations,
  registrantName,
} from "@/lib/admin/registrations";
import {
  PARTICIPATION_TYPE_LABELS,
  REGISTRATION_STATUSES,
} from "@/lib/admin/registration-status";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const admin = await requireAdminClient();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await adminListRegistrations();
  const csv = toCsv(
    rows.map((r) => ({
      debate: r.debate?.title_ar ?? "",
      full_name: registrantName(r),
      email: r.email,
      phone: r.phone,
      country: r.country,
      participation_type: r.participation_type
        ? PARTICIPATION_TYPE_LABELS[r.participation_type]
        : "تسجيل حضور (قديم)",
      question: r.question,
      live_consents:
        r.participation_type === "live"
          ? r.ack_limited_selection && r.ack_time_limit && r.consent_recording_at
            ? "نعم"
            : "ناقصة"
          : "",
      status: REGISTRATION_STATUSES[r.status],
      admin_note: r.admin_note,
      notify_future_events: r.notify_future_events ? "نعم" : "لا",
      created_at: r.created_at,
    })),
    [
      { key: "debate", label: "الندوة" },
      { key: "full_name", label: "الاسم الكامل" },
      { key: "email", label: "البريد الإلكتروني" },
      { key: "phone", label: "واتساب / الهاتف" },
      { key: "country", label: "البلد" },
      { key: "participation_type", label: "طريقة المشاركة" },
      { key: "question", label: "السؤال أو الفكرة" },
      { key: "live_consents", label: "موافقات المشاركة المباشرة" },
      { key: "status", label: "الحالة" },
      { key: "admin_note", label: "ملاحظة داخلية" },
      { key: "notify_future_events", label: "تحديثات ندوات" },
      { key: "created_at", label: "تاريخ الإرسال" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="participation-requests.csv"',
    },
  });
}
