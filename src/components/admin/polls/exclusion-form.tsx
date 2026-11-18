"use client";

import { useActionState } from "react";
import { CheckboxField, TextField, TextareaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import { EVIDENCE } from "@/lib/admin/poll-validation";
import { FormMessage } from "./form-message";
import { submitKeepingValues } from "./keep-values";

export function ExclusionForm({
  label,
  defaultFrom,
  defaultTo,
  defaultEvidence = [],
  defaultReason = "",
  filledFromReverted = false,
  action,
}: {
  label: string;
  defaultFrom: string;
  defaultTo: string;
  defaultEvidence?: string[];
  defaultReason?: string;
  filledFromReverted?: boolean;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  return (
    <form
      onSubmit={submitKeepingValues(
        formAction,
        `استبعاد أصوات الشبكة ${label} في الفترة المحدّدة؟ تُعلَّم الأصوات ولا تُحذف، ويمكن التراجع قبل النشر.`,
      )}
      className="flex flex-col gap-5"
    >
      <FormMessage state={state} />
      <input type="hidden" name="label" value={label} />
      <p className="text-[0.85rem] text-muted">
        {filledFromReverted
          ? "الحقول معبّأة من آخر استبعاد تمّ التراجع عنه لهذه الشبكة، ويمكن تعديلها."
          : "الفترة معبّأة من أول صوت إلى آخر صوت من هذه الشبكة، ويمكن تعديلها."}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="from" type="datetime-local" label="من (بتوقيت دمشق)" defaultValue={defaultFrom}
          error={state.errors?.from} required />
        <TextField id="to" type="datetime-local" label="إلى (بتوقيت دمشق، تشمل الدقيقة)" defaultValue={defaultTo}
          error={state.errors?.to} required />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-meta font-medium text-ink">الأدلّة التقنية</legend>
        <p className="text-[0.85rem] text-muted">
          عدد الأصوات أو مشاركة الشبكة وحدهما ليسا دليلًا. والصوت غير المتحقَّق منه ليس مشبوهًا إذا كان التحقّق مُوقَفًا عمدًا.
        </p>
        {Object.entries(EVIDENCE).map(([key, text]) => (
          <CheckboxField
            key={key}
            id={`evidence_${key}`}
            name="evidence"
            value={key}
            defaultChecked={defaultEvidence.includes(key)}
          >
            {text}
          </CheckboxField>
        ))}
        {state.errors?.evidence ? (
          <p className="text-[0.85rem] text-[#a8402a]">{state.errors.evidence}</p>
        ) : null}
      </fieldset>
      <TextareaField
        id="reason"
        label="السبب المكتوب"
        hint="يُحفظ في السجلّ مع اسمك. 20 حرفًا على الأقل."
        defaultValue={defaultReason}
        error={state.errors?.reason}
        required
      />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الاستبعاد…" : "استبعاد هذه الأصوات"}
        </Button>
      </div>
    </form>
  );
}

export function RevertExclusionButton({
  pollId,
  exclusionId,
  action,
}: {
  pollId: string;
  exclusionId: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("التراجع عن هذا الاستبعاد وإعادة احتساب الأصوات؟")) e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="poll_id" value={pollId} />
      <input type="hidden" name="exclusion_id" value={exclusionId} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "جارٍ التراجع…" : "التراجع عن الاستبعاد"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
