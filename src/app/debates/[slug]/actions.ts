"use server";

import { requestFingerprint } from "@/lib/security";
import { registerForDebate } from "@/lib/data/registrations";
import { fieldErrors, registerSchema } from "@/lib/validation";
import type { FormState } from "@/lib/forms";

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  if (parsed.data.company) {
    return { status: "success" };
  }

  const fp = await requestFingerprint();
  const result = await registerForDebate(parsed.data, fp);

  if (result.status === "error") {
    return { status: "error", message: result.message };
  }

  return {
    status: "success",
    message:
      result.status === "already"
        ? "أنت مسجَّل بالفعل في هذه المناظرة. أرسلنا إليك رسالة تذكيريّة."
        : undefined,
  };
}
