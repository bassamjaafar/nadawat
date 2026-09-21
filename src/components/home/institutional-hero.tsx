import { ButtonLink } from "@/components/ui/button";

export function InstitutionalHero() {
  return (
    <section className="container-page pt-16 pb-6 sm:pt-24">
      <div className="max-w-3xl">
        <h1 className="text-display font-semibold text-ink [text-wrap:balance]">
          نختلف باحترام
        </h1>
        <p className="mt-6 max-w-[42rem] text-body-lg leading-9 text-muted">
          ندوات منصة سورية مستقلة للحوار العام، تستضيف أصواتاً ووجهات نظر
          مختلفة لمناقشة القضايا السياسية والاقتصادية والاجتماعية التي تهم
          السوريين.
        </p>
        <p className="mt-3 max-w-[42rem] text-body-lg leading-9 text-muted">
          نسعى إلى خلق مساحة لحوار جاد ومنظم، تُعرض فيها الآراء بوضوح، وتُناقش
          الأفكار باحترام.
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
