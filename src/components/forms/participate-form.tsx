"use client";

import { useActionState, useId, useState } from "react";
import { participateAction } from "@/app/(site)/events/[slug]/actions";
import { Button } from "@/components/ui/button";
import {
  CheckboxField,
  Honeypot,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { COUNTRIES } from "@/lib/countries";
import { IDLE_FORM_STATE } from "@/lib/forms";
import {
  LIVE_ACK_LIMITED_TEXT,
  LIVE_ACK_TIME_TEXT,
  LIVE_RECORDING_CONSENT_TEXT,
  PARTICIPATE_NOTIFY_CONSENT_TEXT,
  PARTICIPATION_TYPES,
  WRITTEN_SUBMISSION_NOTICE,
  type ParticipationType,
} from "@/lib/validation";

export function ParticipateForm({
  debateId,
  debateSlug,
  debateTitle,
}: {
  debateId: string;
  debateSlug: string;
  debateTitle: string;
}) {
  const [state, formAction, pending] = useActionState(
    participateAction,
    IDLE_FORM_STATE,
  );
  // Controlled, so it survives React's post-action form reset and drives
  // which extra fields (phone + live acknowledgments) are shown.
  const [type, setType] = useState<ParticipationType | null>(null);
  const headingId = useId();
  const v = state.values ?? {};
  const live = type === "live";

  if (state.status === "success") {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-line bg-[#fffdf7] p-6"
        role="status"
      >
        <h3 className="text-h3 text-olive">تمّ استلام طلب مشاركتك</h3>
        <p className="mt-2 text-[0.98rem] leading-8 text-muted">
          {state.message}
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
        نموذج المشاركة في الحوار — {debateTitle}
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

      <TextField
        id="fullName"
        label="الاسم الكامل"
        autoComplete="name"
        required
        defaultValue={v.fullName}
        error={state.errors?.fullName}
      />

      <TextField
        id="email"
        label="البريد الإلكتروني"
        type="email"
        inputMode="email"
        dir="ltr"
        autoComplete="email"
        required
        defaultValue={v.email}
        error={state.errors?.email}
      />

      <SelectField
        id="country"
        label="بلد الإقامة"
        options={COUNTRIES}
        placeholder="اختر بلد الإقامة"
        defaultValue={v.country ?? ""}
        error={state.errors?.country}
      />

      <fieldset
        className="flex flex-col gap-3"
        aria-describedby={
          state.errors?.participationType ? "participationType-error" : undefined
        }
      >
        <legend className="mb-1 text-meta font-medium text-ink">
          كيف ترغب بالمشاركة؟
        </legend>
        {(Object.keys(PARTICIPATION_TYPES) as ParticipationType[]).map((key) => (
          <label
            key={key}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border bg-[#fffdf7] px-4 py-3 transition-colors",
              type === key ? "border-olive" : "border-line-strong hover:border-olive/60",
            )}
          >
            <input
              type="radio"
              name="participationType"
              value={key}
              checked={type === key}
              onChange={() => setType(key)}
              className="mt-1.5 size-[1.05rem] shrink-0 accent-olive"
            />
            <span className="text-[0.98rem] leading-7 text-ink">
              {PARTICIPATION_TYPES[key]}
            </span>
          </label>
        ))}
        {state.errors?.participationType ? (
          <p id="participationType-error" className="text-[0.85rem] text-[#a8402a]">
            {state.errors.participationType}
          </p>
        ) : null}
      </fieldset>

      <TextareaField
        id="question"
        label="السؤال أو الفكرة التي ترغب بطرحها"
        hint="باختصار ووضوح."
        required
        maxLength={1000}
        defaultValue={v.question}
        className="[&_textarea]:min-h-[6rem]"
        error={state.errors?.question}
      />

      {live ? (
        <div className="flex flex-col gap-5 rounded-[var(--radius-md)] border border-line p-5">
          <TextField
            id="phone"
            label="رقم واتساب / الهاتف"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            hint="مع رمز الدولة، مثال: ‎+963 9xx xxx xxx — نستخدمه فقط للتنسيق إذا تمّ اختيارك."
            required
            defaultValue={v.phone}
            error={state.errors?.phone}
          />
          <CheckboxField
            id="ackLimited"
            defaultChecked={v.ackLimited === "on"}
            error={state.errors?.ackLimited}
          >
            {LIVE_ACK_LIMITED_TEXT}
          </CheckboxField>
          <CheckboxField
            id="ackTime"
            defaultChecked={v.ackTime === "on"}
            error={state.errors?.ackTime}
          >
            {LIVE_ACK_TIME_TEXT}
          </CheckboxField>
          <CheckboxField
            id="consentRecording"
            defaultChecked={v.consentRecording === "on"}
            error={state.errors?.consentRecording}
          >
            {LIVE_RECORDING_CONSENT_TEXT}
          </CheckboxField>
        </div>
      ) : null}

      <CheckboxField
        id="notifyFutureEvents"
        defaultChecked={v.notifyFutureEvents === "on"}
      >
        {PARTICIPATE_NOTIFY_CONSENT_TEXT}
      </CheckboxField>

      <Honeypot />

      <div className="flex flex-col gap-3">
        {type === "written" ? (
          <p className="text-[0.85rem] leading-6 text-muted">
            {WRITTEN_SUBMISSION_NOTICE}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="sm:self-start">
          {pending ? "جارٍ الإرسال…" : "أرسل طلب المشاركة"}
        </Button>
      </div>
    </form>
  );
}
