"use client";

import { useActionState, useId } from "react";
import { contactAction } from "@/app/(site)/contact/actions";
import { Button } from "@/components/ui/button";
import {
  Honeypot,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/ui/field";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";
import { IDLE_FORM_STATE } from "@/lib/forms";
import { CONTACT_CATEGORIES } from "@/lib/validation";
import { env } from "@/lib/env";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    contactAction,
    IDLE_FORM_STATE,
  );
  const headingId = useId();

  if (state.status === "success") {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-line bg-[#fffdf7] p-6"
        role="status"
      >
        <h3 className="text-h3 text-olive">وصلتنا رسالتك</h3>
        <p className="mt-2 text-[0.98rem] leading-8 text-muted">
          شكرًا لتواصلك معنا. نقرأ كلّ رسالة، وسنعاود التواصل إن استدعى الأمر
          ردًّا.
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
        نموذج التواصل مع ندوات
      </span>

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
          id="name"
          label="الاسم"
          autoComplete="name"
          required
          error={state.errors?.name}
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

      <SelectField
        id="category"
        label="نوع الرسالة"
        options={[...CONTACT_CATEGORIES]}
        placeholder="اختر نوع الرسالة"
        required
        error={state.errors?.category}
      />

      <TextareaField
        id="message"
        label="الرسالة"
        required
        className="[&_textarea]:min-h-[10rem]"
        error={state.errors?.message}
      />

      <Honeypot />

      {env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <TurnstileWidget siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الإرسال…" : "إرسال"}
        </Button>
      </div>
    </form>
  );
}
