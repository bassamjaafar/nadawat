import { ArrowLink } from "@/components/ui/arrow-link";
import { Reveal } from "@/components/ui/reveal";

export function AboutPreview() {
  return (
    <section aria-labelledby="about-preview-title" className="container-page section-y">
      <Reveal className="grid gap-x-14 gap-y-6 md:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="text-kicker font-medium uppercase text-muted">
            عن ندوات
          </span>
          <h2 id="about-preview-title" className="mt-2 text-h2 text-ink">
            لماذا ندوات
          </h2>
        </div>
        <div className="max-w-[40rem]">
          <p className="text-body-lg leading-9 text-ink">
            المساهمة في بناء ثقافة سورية ترى في الاختلاف فرصة للفهم والتفكير، لا
            سبباً للخصومة؛ وتشجّع على النقاش الجاد، والتفكير النقدي، والانفتاح
            على الآراء المختلفة.
          </p>
          <p className="mt-4 text-[1rem] leading-8 text-muted">
            لا تتبنّى ندوات موقفًا مسبقًا من القضايا التي تطرحها، ويُمنح كلّ ضيفٍ
            مجالًا عادلًا لعرض أفكاره ومناقشتها.
          </p>
          <div className="mt-6">
            <ArrowLink href="/about">تعرّف على ندوات</ArrowLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
