import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "للتواصل مع ندوات: اقتراح موضوع، أو ترشيح ضيف، أو استفسار عام.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pb-24">
      <PageHeader
        kicker="تواصل معنا"
        title="نحبّ أن نسمع منك"
        lede="نقرأ كلّ رسالة تصلنا: اقتراح موضوع لندوة، ترشيح ضيف أو محاور، ملاحظة على عملنا، طلب تطوّع أو دعم، أو استفسار من وسائل الإعلام."
      />

      <div className="container-page section-y">
        <div className="max-w-[40rem]">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
