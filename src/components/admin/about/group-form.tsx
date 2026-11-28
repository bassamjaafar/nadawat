"use client";

import { useActionState } from "react";
import { SelectField, TextField, TextareaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/admin/polls/form-message";
import { submitKeepingValues } from "@/components/admin/polls/keep-values";
import { FORMAT_HINT } from "@/components/admin/about/section-form";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import type { TeamGroup } from "@/lib/about/team";

const STATUS_OPTIONS = [
  { value: "published", label: "ظاهرة في الصفحة" },
  { value: "hidden", label: "مخفية" },
  { value: "archived", label: "مؤرشفة" },
];

export function GroupForm({
  group,
  nextOrder,
  action,
  submitLabel,
}: {
  group?: TeamGroup;
  nextOrder?: number;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="flex flex-col gap-5">
      <FormMessage state={state} />

      <TextField
        id="name_ar"
        label="اسم المجموعة"
        defaultValue={group?.name_ar}
        required
        maxLength={120}
        error={state.errors?.name_ar}
      />

      <TextareaField
        id="description_ar"
        label="وصف المجموعة"
        optional
        hint={FORMAT_HINT}
        defaultValue={group?.description_ar ?? ""}
        className="[&_textarea]:min-h-[10rem]"
        error={state.errors?.description_ar}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="sort_order"
          label="ترتيب العرض"
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          hint="الرقم الأصغر يظهر أوّلًا."
          defaultValue={group?.sort_order ?? nextOrder ?? 10}
          required
          error={state.errors?.sort_order}
        />
        <SelectField
          id="status"
          label="حالة النشر"
          options={STATUS_OPTIONS}
          defaultValue={group?.status ?? "hidden"}
          hint="لا تظهر المجموعة للزوار ما لم يكن فيها عضو منشور واحد على الأقل."
          error={state.errors?.status}
        />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
