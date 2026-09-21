"use server";

import { contactSchema, fieldErrors } from "@/lib/validation";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail } from "@/lib/email/send";
import { contactMessageEmail } from "@/lib/email/templates";
import { CONTACT_EMAIL } from "@/lib/site";
import { env } from "@/lib/env";
import type { FormState } from "@/lib/forms";

export async function contactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  // Honeypot: a bot filled the hidden field — respond as if successful.
  if (parsed.data.hp_field) {
    return { status: "success" };
  }

  const turnstileOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
  );
  if (!turnstileOk) {
    return {
      status: "error",
      message: "تعذّر التحقّق من أنّك لست روبوتًا. أعد المحاولة.",
    };
  }

  const result = await sendEmail({
    to: env.CONTACT_FORM_RECIPIENT ?? CONTACT_EMAIL,
    replyTo: parsed.data.email,
    ...contactMessageEmail(parsed.data),
  });

  if (!result.ok) {
    return {
      status: "error",
      message: "تعذّر إرسال رسالتك الآن. يرجى المحاولة لاحقًا.",
    };
  }

  return { status: "success" };
}
