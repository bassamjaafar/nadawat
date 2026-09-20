import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SubscribeForm } from "@/components/forms/subscribe-form";

export const metadata: Metadata = {
  title: "اشترك بالتحديثات",
  description:
    "اشترك لتصلك إشعارات ندوات عند تحديد موعد كلّ ندوة جديدة. تأكيدٌ بالبريد، ولا رسائل متكرّرة.",
  alternates: { canonical: "/subscribe" },
};

export default function SubscribePage() {
  return (
    <div className="pb-24">
      <PageHeader
        kicker="الاشتراك"
        title="اعرف بموعد كلّ ندوة"
        lede="نرسل إشعارًا واحدًا موجزًا عند تحديد موعد كلّ ندوة جديدة. لا نشرات دورية، ولا رسائل تسويقية."
      />

      <div className="container-page section-y">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="max-w-sm">
            <h2 className="text-h3 text-ink">ماذا يعني الاشتراك</h2>
            <ul className="mt-4 flex flex-col gap-3 text-[0.98rem] leading-8 text-muted">
              <li>— إشعارٌ بالبريد عند جدولة كلّ ندوة، مع الموضوع والموعد.</li>
              <li>— تأكيدٌ مزدوج: لا يبدأ اشتراكك قبل الضغط على رابط التأكيد.</li>
              <li>— إلغاءٌ فوريّ من رابطٍ في كلّ رسالة.</li>
              <li>— لا مشاركة لبريدك مع أيّ جهة.</li>
            </ul>
          </div>

          <div className="lg:max-w-xl">
            <SubscribeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
