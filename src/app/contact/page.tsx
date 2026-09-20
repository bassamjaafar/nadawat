import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CONTACT_EMAIL } from "@/lib/site";

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
        lede="نقرأ كلّ رسالة تصلنا: اقتراح موضوع لندوة، ترشيح ضيف أو محاور، ملاحظة على عملنا، أو استفسار من وسائل الإعلام."
      />

      <div className="container-page section-y">
        <div className="max-w-[40rem]">
          <p className="text-kicker font-medium uppercase text-muted">
            البريد الإلكتروني
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            dir="ltr"
            className="mt-2 inline-block font-display text-h2 text-olive underline decoration-line-strong underline-offset-8 transition-colors hover:decoration-olive"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-6 text-[1rem] leading-8 text-muted">
            هذا صندوقٌ مُتابَع، والردود قد تتحوّل إلى أفكارٍ لندوات قادمة. إن
            كنت ترغب بالمشاركة كضيف، أخبرنا بالموضوع الذي يهمّك وموقفك منه
            باختصار.
          </p>
        </div>
      </div>
    </div>
  );
}
