"use server";

import { requestFingerprint } from "@/lib/security";
import { submitParticipation } from "@/lib/data/registrations";
import { fieldErrors, participateSchema } from "@/lib/validation";
import type { FormState } from "@/lib/forms";

export async function participateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const parsed = participateSchema.safeParse(raw);

  // Echoed back on any error so a long typed question isn't lost.
  const values = Object.fromEntries(
    Object.entries(raw)
      .filter(([k, v]) => typeof v === "string" && k !== "hp_field")
      .map(([k, v]) => [k, v as string]),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
      values,
    };
  }

  if (parsed.data.hp_field) {
    return { status: "success" };
  }

  const fp = await requestFingerprint();
  const result = await submitParticipation(parsed.data, fp);

  if (result.status === "error") {
    return { status: "error", message: result.message, values };
  }

  return {
    status: "success",
    message:
      parsed.data.participationType === "live"
        ? "تمّ استلام طلب مشاركتك المباشرة. إذا تمّ اختيارك، سيتواصل معك فريق ندوات عبر واتساب أو البريد الإلكتروني قبل فقرة مشاركة الجمهور. أرسلنا تأكيدًا إلى بريدك."
        : "تمّ استلام سؤالك أو مداخلتك، وأرسلنا تأكيدًا إلى بريدك. إرسال سؤال لا يضمن طرحه خلال الندوة.",
  };
}
