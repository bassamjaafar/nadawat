import type { Metadata } from "next";
import { NoticePage } from "@/components/ui/notice-page";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <NoticePage
      title="لم نجد هذه الصفحة"
      action={{ href: "/", label: "العودة إلى الرئيسية" }}
    >
      <p>ربّما تغيّر الرابط أو حُذفت الصفحة. يمكنك تصفّح الفعاليات من الرئيسية.</p>
    </NoticePage>
  );
}
