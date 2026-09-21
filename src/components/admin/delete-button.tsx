"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE } from "@/lib/forms";
import type { FormState } from "@/lib/forms";

export function DeleteForm({
  action,
  hiddenFields,
  confirmMessage,
  buttonLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields: Record<string, string>;
  confirmMessage: string;
  buttonLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mb-3 rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "جارٍ الحذف…" : buttonLabel}
      </Button>
    </form>
  );
}
