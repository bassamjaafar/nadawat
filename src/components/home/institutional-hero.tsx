import { ButtonLink } from "@/components/ui/button";

export function InstitutionalHero() {
  return (
    <section className="container-page pt-16 pb-6 sm:pt-24">
      <div className="max-w-3xl">
        <h1 className="text-display font-semibold text-ink [text-wrap:balance]">
          منصّةٌ للحوار العام المنظَّم حول الشأن السوري
        </h1>
        <p className="mt-6 max-w-[42rem] text-body-lg leading-9 text-muted">
          ندوات تنظّم ندواتٍ دوريّة بين أصحاب مواقف مختلفة حول قضايا سياسية
          واقتصادية واجتماعية ومدنية تخصّ سوريا، وفق قواعد واضحة وإدارة محايدة،
          وتحفظها أرشيفًا عامًّا مفتوحًا.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/subscribe">اشترك لتصلك الندوات القادمة</ButtonLink>
          <ButtonLink href="/about" variant="outline">
            تعرّف على ندوات
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
