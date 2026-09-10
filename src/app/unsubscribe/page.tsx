import type { Metadata } from "next";
import { NoticePage } from "@/components/ui/notice-page";
import { unsubscribe } from "@/lib/data/subscribers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إلغاء الاشتراك",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <NoticePage kicker="الاشتراك" title="رابط غير مكتمل">
        <p>لم نجد رمز الإلغاء في الرابط. استخدم الرابط الوارد في الرسالة كاملًا.</p>
      </NoticePage>
    );
  }

  const result = await unsubscribe(token);

  if (result.status === "done") {
    return (
      <NoticePage
        kicker="الاشتراك"
        title="تمّ إلغاء اشتراكك"
        action={{ href: "/", label: "العودة إلى الرئيسية" }}
      >
        <p>
          لن تصلك إشعاراتٌ بعد الآن. يمكنك الاشتراك مجدّدًا في أيّ وقت إن غيّرت
          رأيك.
        </p>
      </NoticePage>
    );
  }

  return (
    <NoticePage kicker="الاشتراك" title="رابط غير صالح">
      <p>قد يكون الاشتراك أُلغي سابقًا. إن استمرّت الإشعارات راسلنا وسنعالج الأمر.</p>
    </NoticePage>
  );
}
