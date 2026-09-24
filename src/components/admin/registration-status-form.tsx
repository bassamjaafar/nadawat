"use client";

import { useActionState } from "react";
import { updateRegistrationAction } from "@/app/admin/(protected)/registrations/actions";
import { Button } from "@/components/ui/button";
import {
  REGISTRATION_STATUSES,
  type RegistrationStatus,
} from "@/lib/admin/registration-status";
import { IDLE_FORM_STATE } from "@/lib/forms";

export function RegistrationStatusForm({
  id,
  status,
  note,
}: {
  id: string;
  status: RegistrationStatus;
  note: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateRegistrationAction.bind(null, id),
    IDLE_FORM_STATE,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8rem] text-muted">الحالة</span>
        <select
          name="status"
          defaultValue={status}
          className="rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3 py-2 text-[0.9rem] text-ink"
        >
          {(Object.keys(REGISTRATION_STATUSES) as RegistrationStatus[]).map(
            (key) => (
              <option key={key} value={key}>
                {REGISTRATION_STATUSES[key]}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[0.8rem] text-muted">ملاحظة داخلية (اختياري)</span>
        <input
          name="admin_note"
          defaultValue={note ?? ""}
          maxLength={1000}
          className="w-full rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3 py-2 text-[0.9rem] text-ink"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </Button>
        {state.message ? (
          <span
            role="status"
            className={
              state.status === "error"
                ? "text-[0.85rem] text-[#a8402a]"
                : "text-[0.85rem] text-olive"
            }
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
