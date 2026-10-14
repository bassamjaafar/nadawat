import { SubscribeForm } from "@/components/forms/subscribe-form";
import { Reveal } from "@/components/ui/reveal";

export function SubscribeSection() {
  return (
    <section id="subscribe" aria-labelledby="subscribe-title" className="bg-cream-deep">
      {/* Phone/tablet padding matches .section-y; ~22% less from 1024px up. */}
      <div className="container-page py-[clamp(3.5rem,8vw,7rem)] lg:py-[clamp(2.75rem,6.25vw,5.5rem)]">
        <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:pt-2">
            <span className="text-kicker font-medium uppercase text-muted">
              الاشتراك
            </span>
            <h2 id="subscribe-title" className="mt-2 text-h2 text-ink">
              اعرف بموعد كل ندوة جديدة
            </h2>
            <p className="mt-4 max-w-md text-[1rem] leading-8 text-muted">
              اشترك ليصلك موعد كل ندوة جديدة، وأبرز أخبار ندوات وتحديثاتها.
              رسائل قليلة، ويمكنك إلغاء الاشتراك في أي وقت.
            </p>
          </div>
          <Reveal className="lg:max-w-xl">
            <SubscribeForm tight />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
