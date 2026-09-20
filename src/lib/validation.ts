import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";

const name = z
  .string()
  .trim()
  .min(1, "هذا الحقل مطلوب")
  .max(80, "الاسم طويل جدًا");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "البريد الإلكتروني مطلوب")
  .email("يرجى إدخال بريد إلكتروني صحيح")
  .max(160);

const country = z
  .string()
  .trim()
  .min(1, "يرجى اختيار بلد الإقامة")
  .refine((v) => COUNTRIES.includes(v), "يرجى اختيار بلد من القائمة");

/** Exact wording shown next to the subscription consent checkbox. Stored with each record. */
export const SUBSCRIBE_CONSENT_TEXT =
  "أوافق على تلقّي إشعارات من ندوات حول الندوات القادمة، وأفهم أنّ بإمكاني إلغاء الاشتراك في أي وقت.";

export const REGISTER_CONSENT_TEXT =
  "أرغب أيضًا بتلقّي إشعارات عن الندوات القادمة من ندوات (اختياري).";

const checkboxTrue = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

export const subscribeSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  country,
  consent: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.literal(true, { message: "يلزم الموافقة لإتمام الاشتراك" }),
  ),
  // Honeypot — must stay empty.
  company: z.string().max(0).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const registerSchema = z.object({
  debateId: z.string().min(1),
  debateSlug: z.string().min(1),
  firstName: name,
  lastName: name,
  email,
  country,
  notifyFutureEvents: checkboxTrue,
  company: z.string().max(0).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Turns a ZodError into a { field: message } map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
