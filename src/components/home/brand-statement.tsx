import { Reveal } from "@/components/ui/reveal";
import { SITE_TAGLINE } from "@/lib/site";

/** Quiet typographic transition — the brand line, set once, without animation flourish. */
export function BrandStatement() {
  return (
    <section aria-label="مبدأ ندوات" className="bg-olive text-cream">
      <div className="container-page section-y">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="block h-px w-10 bg-gold" aria-hidden="true" />
          <p className="font-display text-display font-semibold leading-tight">
            {SITE_TAGLINE}
          </p>
          <p className="max-w-md text-[1.02rem] leading-8 text-cream/75">
            نلتقي حول القضية نفسها بمواقف مختلفة، ونُصغي قبل أن نردّ. الاختلاف عندنا
            ممارسة، لا خصومة.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
