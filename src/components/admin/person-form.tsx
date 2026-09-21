"use client";

import { useActionState } from "react";
import { TextField, TextareaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE } from "@/lib/forms";
import type { FormState } from "@/lib/forms";
import type { Person } from "@/lib/types";

export function PersonForm({
  person,
  action,
  submitLabel,
}: {
  person?: Person;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p
          role="status"
          className="rounded-[var(--radius)] border border-line bg-[#eef2ea] px-4 py-3 text-[0.9rem] text-olive"
        >
          {state.message}
        </p>
      ) : null}

      <TextField
        id="name_ar"
        label="الاسم"
        defaultValue={person?.name_ar}
        required
        error={state.errors?.name_ar}
      />

      <TextField
        id="title_ar"
        label="الصفة"
        optional
        hint="مثال: أستاذة اقتصاد سياسي"
        defaultValue={person?.title_ar ?? ""}
        error={state.errors?.title_ar}
      />

      <TextareaField
        id="bio_ar"
        label="نبذة"
        optional
        defaultValue={person?.bio_ar ?? ""}
        error={state.errors?.bio_ar}
      />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
