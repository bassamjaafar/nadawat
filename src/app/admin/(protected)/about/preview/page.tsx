import type { Metadata } from "next";
import { adminPreviewData } from "@/lib/admin/about";
import { AboutHeader, AboutPageBody } from "@/components/about/about-page-body";

export const metadata: Metadata = {
  title: "معاينة صفحة عن ندوات",
  robots: { index: false, follow: false },
};

// Always fresh: the preview must show what was just saved.
export const dynamic = "force-dynamic";

export default async function AboutPreviewPage() {
  const { sections, groups } = await adminPreviewData();
  return (
    <div>
      <p className="max-w-[44rem] text-[0.95rem] leading-7 text-muted">
        هكذا تبدو الصفحة مع كلّ المحتوى غير المؤرشف. ما لا يظهر للزوار عليه علامة توضّح السبب. المحتوى الظاهر يُنشر فور حفظه.
      </p>
      <div className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-line-strong bg-cream">
        <AboutHeader />
        <AboutPageBody sections={sections} groups={groups} preview />
      </div>
    </div>
  );
}
