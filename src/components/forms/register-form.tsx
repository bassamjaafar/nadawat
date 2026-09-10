"use client";

import { useActionState, useId } from "react";
import { registerAction } from "@/app/debates/[slug]/actions";
import { Button } from "@/components/ui/button";
import {
  CheckboxField,
  Honeypot,
  SelectField,
  TextField,
} from "@/components/ui/field";
import { COUNTRIES } from "@/lib/countries";
import { IDLE_FORM_STATE } from "@/lib/forms";
import { REGISTER_CONSENT_TEXT } from "@/lib/validation";

export function RegisterForm({
  debateId,
  debateSlug,
  debateTitle,
}: {
  debateId: string;
  debateSlug: string;
  debateTitle: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    IDLE_FORM_STATE,
  );
  const headingId = useId();

  if (state.status === "success") {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-line bg-[#fffdf7] p-6"
        role="status"
      >
        <h3 className="text-h3 text-olive">تمّ تسجيل حضورك</h3>
        <p className="mt-2 text-[0.98rem] leading-8 text-muted">
          {state.message ??
            "أرسلنا رسالة تأكيد إلى بريدك. سنوافيك بتفاصيل الحضور ورابط البثّ قبل الموعد."}
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      aria-labelledby={headingId}
      noValidate
      className="flex flex-col gap-5"
    >
      <span id={headingId} className="sr-only">
        نموذج التسجيل في مناظرة {debateTitle}
      </span>
      <input type="hidden" name="debateId" value={debateId} />
      <input type="hidden" name="debateSlug" value={debateSlug} />

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="الاسم الأول"
          autoComplete="given-name"
          required
          error={state.errors?.firstName}
        />
        <TextField
          id="lastName"
          label="اسم العائلة"
          autoComplete="family-name"
          required
          error={state.errors?.lastName}
        />
      </div>

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

      <SelectField
        id="country"
        label="بلد الإقامة"
        options={COUNTRIES}
        placeholder="اختر بلد الإقامة"
        error={state.errors?.country}
      />

      <CheckboxField id="notifyFutureEvents">
        {REGISTER_CONSENT_TEXT}
      </CheckboxField>

      <Honeypot />

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="sm:self-start">
          {pending ? "جارٍ التسجيل…" : "سجّل حضوري"}
        </Button>
        <p className="text-[0.85rem] leading-6 text-muted">
          التسجيل لهذه المناظرة فقط. لن يُضاف بريدك إلى قائمة الإشعارات إلا إذا
          اخترت ذلك أعلاه.
        </p>
      </div>
    </form>
  );
}
