"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminUpdateRegistration } from "@/lib/admin/registrations";
import { REGISTRATION_STATUSES } from "@/lib/admin/registration-status";
import type { FormState } from "@/lib/forms";

const updateSchema = z.object({
  status: z.enum(
    Object.keys(REGISTRATION_STATUSES) as [keyof typeof REGISTRATION_STATUSES],
  ),
  admin_note: z.string().trim().max(1000),
});

export async function updateRegistrationAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "قيمة غير صالحة." };
  }

  try {
    await adminUpdateRegistration(id, {
      status: parsed.data.status,
      admin_note: parsed.data.admin_note || null,
    });
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر الحفظ.",
    };
  }

  revalidatePath("/admin/registrations");
  return { status: "success", message: "تمّ الحفظ." };
}
