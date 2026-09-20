"use server";

import { requestFingerprint } from "@/lib/security";
import { requestSubscription } from "@/lib/data/subscribers";
import { subscribeSchema, fieldErrors } from "@/lib/validation";
import { verifyTurnstile } from "@/lib/turnstile";
import type { FormState } from "@/lib/forms";

export async function subscribeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = subscribeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  // Honeypot: a bot filled the hidden field — respond as if successful.
  if (parsed.data.company) {
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

  const fp = await requestFingerprint();
  const result = await requestSubscription(parsed.data, fp);

  if (result.status === "error") {
    return {
      status: "error",
      message: "تعذّر إتمام الاشتراك الآن. يرجى المحاولة لاحقًا.",
    };
  }

  // "sent" and "already_confirmed" return the same message so membership
  // status is never disclosed.
  return {
    status: "success",
    devConfirmUrl:
      result.status === "sent" ? result.devConfirmUrl : undefined,
  };
}
