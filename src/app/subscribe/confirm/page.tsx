import type { Metadata } from "next";
import { NoticePage } from "@/components/ui/notice-page";
import { confirmSubscription } from "@/lib/data/subscribers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تأكيد الاشتراك",
  robots: { index: false, follow: false },
};

export default async function ConfirmSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <NoticePage
        kicker="الاشتراك"
        title="رابط غير مكتمل"
        action={{ href: "/subscribe", label: "العودة إلى صفحة الاشتراك" }}
      >
        <p>لم نجد رمز التأكيد في الرابط. تأكّد من نسخه كاملًا من الرسالة.</p>
      </NoticePage>
    );
  }

  const result = await confirmSubscription(token);

  if (result.status === "confirmed") {
    return (
      <NoticePage
        kicker="الاشتراك"
        title="تمّ تأكيد اشتراكك"
        action={{ href: "/debates", label: "تصفّح الفعاليات" }}
      >
        <p>
          شكرًا {result.firstName}. سنرسل إليك إشعارًا موجزًا عند تحديد موعد كلّ
          ندوة جديدة.
        </p>
      </NoticePage>
    );
  }

  if (result.status === "already") {
    return (
      <NoticePage
        kicker="الاشتراك"
        title="اشتراكك مؤكَّد مسبقًا"
        action={{ href: "/debates", label: "تصفّح الفعاليات" }}
      >
        <p>لا حاجة لأيّ إجراءٍ إضافي.</p>
      </NoticePage>
    );
  }

  return (
    <NoticePage
      kicker="الاشتراك"
      title="رابط غير صالح أو منتهٍ"
      action={{ href: "/subscribe", label: "إعادة الاشتراك" }}
    >
      <p>
        قد يكون هذا الرابط استُخدم من قبل أو انتهت صلاحيته. يمكنك إعادة التسجيل
        وسنرسل رابطًا جديدًا.
      </p>
    </NoticePage>
  );
}
