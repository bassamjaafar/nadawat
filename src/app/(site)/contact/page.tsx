import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "التواصل",
  description: "للتواصل مع ندوات: اقتراح موضوع، أو ترشيح ضيف/ة، أو استفسار عام.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pb-24">
      <PageHeader
        kicker="التواصل"
        title="نحبّ أن نسمع منك"
        lede="نقرأ كلّ رسالة تصلنا: اقتراح موضوع لندوة، ترشيح ضيف/ة أو محاور/ة، ملاحظة على عملنا، طلب تطوّع أو دعم، أو استفسار من وسائل الإعلام."
      />

      <div className="container-page section-y">
        <div className="max-w-[40rem]">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
