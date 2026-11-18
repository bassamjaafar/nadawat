"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import { toDamascusInputValue } from "@/lib/admin/datetime";
import { FormMessage } from "./form-message";
import { submitKeepingValues } from "./keep-values";

export function ClosesAtForm({
  closesAt,
  action,
}: {
  closesAt: string | null;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  return (
    <form onSubmit={submitKeepingValues(formAction)} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          id="closes_at"
          type="datetime-local"
          label="إغلاق تلقائي (بتوقيت دمشق)"
          hint="احتياطي فقط. اتركه فارغًا لإلغاء الإغلاق التلقائي."
          defaultValue={toDamascusInputValue(closesAt)}
          className="min-w-[15rem]"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
