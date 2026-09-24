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

// The select's placeholder option is disabled, so an untouched select sends
// no value at all — the type-level message covers that case too.
const country = z
  .string({ message: "يرجى اختيار بلد الإقامة" })
  .trim()
  .min(1, "يرجى اختيار بلد الإقامة")
  .refine((v) => COUNTRIES.includes(v), "يرجى اختيار بلد من القائمة");

/** Exact wording shown next to the subscription consent checkbox. Stored with each record. */
export const SUBSCRIBE_CONSENT_TEXT =
  "أوافق على تلقّي إشعارات من ندوات حول الندوات القادمة، وأفهم أنّ بإمكاني إلغاء الاشتراك في أي وقت.";

/** Optional, unchecked-by-default opt-in on the participation form. */
export const PARTICIPATE_NOTIFY_CONSENT_TEXT =
  "أرغب أيضًا بتلقّي تحديثات ندوات حول الندوات القادمة (اختياري).";

// --- "شارك في الحوار" ------------------------------------------------------
// Exact wording is shown on the form and stored with each submission.

export const PARTICIPATION_TYPES = {
  written: "إرسال سؤال أو مداخلة",
  live: "أرغب بالمشاركة مباشرةً بالصوت والصورة خلال فقرة مشاركة الجمهور",
} as const;

export type ParticipationType = keyof typeof PARTICIPATION_TYPES;

export const LIVE_ACK_LIMITED_TEXT =
  "أفهم أنّ المشاركة المباشرة محدودة، وأنّ تقديم الطلب لا يضمن اختياري للمشاركة.";
export const LIVE_ACK_TIME_TEXT =
  "أفهم أنّ مداخلتي المباشرة محدودة بنحو 90–120 ثانية.";
export const LIVE_RECORDING_CONSENT_TEXT =
  "أوافق على الظهور بالصوت والصورة في البثّ المباشر وفي تسجيل الندوة، وعلى إمكانية ظهور مداخلتي في النسخة الكاملة أو في مقاطع مختارة ومقاطع قصيرة (Reels).";
export const WRITTEN_SUBMISSION_NOTICE =
  "قد تُقرأ الأسئلة والمداخلات المرسلة أو تُعرض خلال البثّ المباشر، وقد تبقى في النسخة المسجّلة. إرسال سؤال لا يضمن طرحه خلال الندوة.";

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
  hp_field: z.string().max(0).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

const LIVE_REQUIRED = "يلزم تأكيد هذا البند للمشاركة المباشرة";

export const participateSchema = z
  .object({
    debateId: z.string().min(1),
    debateSlug: z.string().min(1),
    fullName: z
      .string()
      .trim()
      .min(1, "هذا الحقل مطلوب")
      .max(120, "الاسم طويل جدًا"),
    email,
    country,
    participationType: z.enum(["written", "live"], {
      message: "يرجى اختيار طريقة المشاركة",
    }),
    question: z
      .string()
      .trim()
      .min(1, "يرجى كتابة سؤالك أو فكرتك")
      .max(1000, "النص طويل جدًا — يرجى الاختصار"),
    phone: z.string().trim().max(40, "الرقم طويل جدًا").optional(),
    ackLimited: checkboxTrue,
    ackTime: checkboxTrue,
    consentRecording: checkboxTrue,
    notifyFutureEvents: checkboxTrue,
    // Honeypot — must stay empty.
    hp_field: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    // Phone and the three acknowledgments only apply to live participation;
    // for a written question they're neither shown nor required.
    if (v.participationType !== "live") return;
    const digits = (v.phone ?? "").replace(/\D/g, "");
    if (digits.length < 7) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "يرجى إدخال رقم واتساب أو هاتف صحيح مع رمز الدولة",
      });
    }
    if (!v.ackLimited) {
      ctx.addIssue({ code: "custom", path: ["ackLimited"], message: LIVE_REQUIRED });
    }
    if (!v.ackTime) {
      ctx.addIssue({ code: "custom", path: ["ackTime"], message: LIVE_REQUIRED });
    }
    if (!v.consentRecording) {
      ctx.addIssue({
        code: "custom",
        path: ["consentRecording"],
        message: LIVE_REQUIRED,
      });
    }
  });

export type ParticipateInput = z.infer<typeof participateSchema>;

export const CONTACT_CATEGORIES = [
  "ملاحظة",
  "سؤال",
  "تطوّع أو دعم",
  "ترشيح ضيف أو موضوع",
  "استفسار إعلامي",
  "أخرى",
] as const;

export const contactSchema = z.object({
  name,
  email,
  category: z.enum(CONTACT_CATEGORIES, {
    message: "يرجى اختيار نوع الرسالة",
  }),
  message: z
    .string()
    .trim()
    .min(10, "يرجى كتابة رسالة أوضح قليلًا")
    .max(4000, "الرسالة طويلة جدًا"),
  // Honeypot — must stay empty.
  hp_field: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Turns a ZodError into a { field: message } map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
