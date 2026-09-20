import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-h2 text-ink">أهلًا بك</h1>
      <p className="mt-3 max-w-[36rem] text-[0.95rem] leading-7 text-muted">
        هذه بداية لوحة التحكم. تسجيل الدخول وصلاحية الوصول جاهزان — إدارة
        الفعاليات والضيوف ومحتوى الموقع ستُضاف هنا تباعًا.
      </p>
    </div>
  );
}
