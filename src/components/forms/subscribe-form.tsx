"use client";

import { useActionState, useId } from "react";
import { subscribeAction } from "@/app/(site)/subscribe/actions";
import { Button } from "@/components/ui/button";
import { CheckboxField, Honeypot, TextField } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { IDLE_FORM_STATE } from "@/lib/forms";
import { SUBSCRIBE_CONSENT_TEXT } from "@/lib/validation";
import { env } from "@/lib/env";

/**
 * `compact` stacks the name fields in one column. `tight` uses 16px instead
 * of 20px between form rows (homepage section only; /subscribe keeps 20px).
 */
export function SubscribeForm({
  compact = false,
  tight = false,
}: {
  compact?: boolean;
  tight?: boolean;
}) {
  const rowGap = tight ? "gap-4" : "gap-5";
  const [state, formAction, pending] = useActionState(
    subscribeAction,
    IDLE_FORM_STATE,
  );
  const headingId = useId();

  if (state.status === "success") {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-line bg-[#fffdf7] p-6"
        role="status"
      >
        <h3 className="text-h3 text-olive">يُرجى تفقّد البريد الإلكتروني</h3>
        <p className="mt-2 text-[0.98rem] leading-8 text-muted">
          أرسلنا رسالة تحتوي رابط تأكيد، ويكتمل الاشتراك بالضغط عليه. إن لم تصل الرسالة خلال دقائق، يُرجى التحقّق من مجلّد الرسائل غير المرغوبة.
        </p>
        {state.devConfirmUrl ? (
          <p className="mt-4 text-[0.85rem] text-muted">
            وضع التطوير المحلي (لا يوجد إرسال بريد):{" "}
            <a
              href={state.devConfirmUrl}
              className="text-olive underline underline-offset-4"
            >
              رابط التأكيد
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      aria-labelledby={headingId}
      noValidate
      className={`flex flex-col ${rowGap}`}
    >
      <span id={headingId} className="sr-only">
        نموذج الاشتراك في رسائل ندوات
      </span>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {state.message}
        </p>
      ) : null}

      {/* Email-only signup: optional first name beside the required email
          (side by side from sm:, stacked on phones or when compact). */}
      <div
        className={
          compact
            ? `flex flex-col ${rowGap}`
            : `grid gap-x-5 sm:grid-cols-2 ${tight ? "gap-y-4" : "gap-y-5"}`
        }
      >
        <TextField
          id="firstName"
          label="الاسم الأول"
          autoComplete="given-name"
          optional
          error={state.errors?.firstName}
        />
        <TextField
          id="email"
          label="البريد الإلكتروني"
          type="email"
          inputMode="email"
          dir="ltr"
          autoComplete="email"
          required
          error={state.errors?.email}
        />
      </div>

      <CheckboxField id="consent" error={state.errors?.consent}>
        {SUBSCRIBE_CONSENT_TEXT}
      </CheckboxField>

      <Honeypot />

      {/* Gate on the site key alone, never `hasTurnstile` — that flag also
          checks TURNSTILE_SECRET_KEY, a non-public var Next.js never inlines
          into client code. Server sees it as true, client always sees it as
          false, and that server/client disagreement is exactly what caused
          the hydration mismatch that silently dropped this widget before. */}
      {env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <TurnstileWidget siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الإرسال…" : "الاشتراك"}
        </Button>
        <p className="text-[0.85rem] leading-6 text-muted">
          نستخدم البريد لرسائل ندوات فقط. التفاصيل في{" "}
          <a href="/privacy" className="underline underline-offset-4">
            سياسة الخصوصية
          </a>
          .
        </p>
      </div>
    </form>
  );
}
