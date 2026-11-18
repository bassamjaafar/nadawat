"use client";

import { useActionState } from "react";
import { SelectField, TextField, TextareaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import { MAX_ANSWERS } from "@/lib/admin/poll-validation";
import { toDamascusInputValue } from "@/lib/admin/datetime";
import { FormMessage } from "./form-message";
import { submitKeepingValues } from "./keep-values";

export type PollFormValues = {
  question_ar: string;
  note_ar: string | null;
  slug: string;
  debate_id: string | null;
  opens_at: string | null;
  closes_at: string | null;
  answers: string[];
};

export function PollForm({
  poll,
  events,
  action,
  submitLabel,
}: {
  poll?: PollFormValues;
  events: { id: string; title_ar: string }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  const answers = poll?.answers ?? [];

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="flex flex-col gap-6">
      <FormMessage state={state} />

      <SelectField
        id="debate_id"
        label="الندوة"
        hint="يظهر عنوانها فوق السؤال، ويُربط السؤال بصفحتها."
        placeholder="بلا ندوة"
        options={events.map((e) => ({ value: e.id, label: e.title_ar }))}
        defaultValue={poll?.debate_id ?? ""}
        error={state.errors?.debate_id}
      />

      <TextareaField
        id="question_ar"
        label="السؤال"
        className="[&_textarea]:min-h-[5rem]"
        defaultValue={poll?.question_ar}
        required
        maxLength={300}
        error={state.errors?.question_ar}
      />

      <TextareaField
        id="note_ar"
        label="ملاحظة قصيرة تحت السؤال"
        optional
        className="[&_textarea]:min-h-[4rem]"
        defaultValue={poll?.note_ar ?? ""}
        maxLength={300}
        error={state.errors?.note_ar}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-meta font-medium text-ink">الإجابات</legend>
        <p className="text-[0.85rem] text-muted">
          إجابتان إلى {MAX_ANSWERS} إجابات، بالترتيب الذي ستظهر به. تُترك الحقول الزائدة فارغة.
          لا يمكن تعديل الإجابات بعد فتح التصويت.
        </p>
        {Array.from({ length: MAX_ANSWERS }, (_, i) => (
          <TextField
            key={i}
            id={`answer_${i + 1}`}
            label={`الإجابة ${i + 1}`}
            optional={i >= 2}
            defaultValue={answers[i] ?? ""}
            maxLength={120}
          />
        ))}
        {state.errors?.answers ? (
          <p className="text-[0.85rem] text-[#a8402a]">{state.errors.answers}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="opens_at"
          type="datetime-local"
          label="موعد فتح التصويت (بتوقيت دمشق)"
          optional
          hint="لازم للجدولة. يمكن أيضًا الفتح يدويًا في أي وقت."
          defaultValue={toDamascusInputValue(poll?.opens_at ?? null)}
          error={state.errors?.opens_at}
        />
        <TextField
          id="closes_at"
          type="datetime-local"
          label="إغلاق تلقائي (بتوقيت دمشق)"
          optional
          hint="احتياطي فقط؛ الإغلاق اليدوي متاح دائمًا."
          defaultValue={toDamascusInputValue(poll?.closes_at ?? null)}
          error={state.errors?.closes_at}
        />
      </div>

      <TextField
        id="slug"
        label="المعرّف (slug)"
        dir="ltr"
        hint="أحرف لاتينية صغيرة وأرقام وشرطات، مثل: economy-2026-11. لا يظهر للجمهور."
        defaultValue={poll?.slug}
        required
        error={state.errors?.slug}
      />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
