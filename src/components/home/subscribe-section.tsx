import { SubscribeForm } from "@/components/forms/subscribe-form";
import { Reveal } from "@/components/ui/reveal";

export function SubscribeSection() {
  return (
    <section id="subscribe" aria-labelledby="subscribe-title" className="bg-cream-deep">
      <div className="container-page section-y">
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:pt-2">
            <span className="text-kicker font-medium uppercase text-muted">
              الاشتراك
            </span>
            <h2 id="subscribe-title" className="mt-2 text-h2 text-ink">
              اعرف بموعد كل مناظرة جديدة
            </h2>
            <p className="mt-4 max-w-md text-[1rem] leading-8 text-muted">
              نرسل إشعارًا موجزًا عند تحديد موعد كل مناظرة، دون رسائل متكرّرة.
              نطلب تأكيدًا بالبريد بعد التسجيل، ويمكنك إلغاء الاشتراك متى شئت.
            </p>
          </div>
          <Reveal className="lg:max-w-xl">
            <SubscribeForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
