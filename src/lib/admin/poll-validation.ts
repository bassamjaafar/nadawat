import { z } from "zod";

export const MAX_ANSWERS = 6;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const optionalDateTime = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/, "صيغة التاريخ غير صالحة.")
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const pollSchema = z
  .object({
    question_ar: z
      .string()
      .trim()
      .min(5, "يُرجى كتابة السؤال (5 أحرف على الأقل).")
      .max(300, "السؤال أطول من 300 حرف."),
    note_ar: optionalText(300, "الملاحظة أطول من 300 حرف."),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]*$/, "أحرف لاتينية صغيرة وأرقام وشرطات فقط."),
    debate_id: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : v))
      .pipe(z.string().uuid().optional())
      .optional(),
    opens_at: optionalDateTime,
    closes_at: optionalDateTime,
    answers: z
      .array(z.string().trim().max(120, "الإجابة أطول من 120 حرفًا."))
      .transform((a) => a.filter((x) => x !== ""))
      .pipe(
        z
          .array(z.string())
          .min(2, "يحتاج السؤال إلى إجابتين على الأقل.")
          .max(MAX_ANSWERS, `${MAX_ANSWERS} إجابات على الأكثر.`),
      ),
  })
  .refine((v) => !v.opens_at || !v.closes_at || v.closes_at > v.opens_at, {
    path: ["closes_at"],
    message: "يجب أن يكون موعد الإغلاق بعد موعد الفتح.",
  })
  .refine((v) => new Set(v.answers).size === v.answers.length, {
    path: ["answers"],
    message: "الإجابات مكرّرة.",
  });

export type PollInput = z.infer<typeof pollSchema>;

export function pollFormValues(formData: FormData) {
  const answers: string[] = [];
  for (let i = 1; i <= MAX_ANSWERS; i++) answers.push(String(formData.get(`answer_${i}`) ?? ""));
  return {
    question_ar: String(formData.get("question_ar") ?? ""),
    note_ar: String(formData.get("note_ar") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    debate_id: String(formData.get("debate_id") ?? ""),
    opens_at: String(formData.get("opens_at") ?? ""),
    closes_at: String(formData.get("closes_at") ?? ""),
    answers,
  };
}

export const EVIDENCE = {
  machine_timing: "توقيت آلي منتظم بين الأصوات",
  instant_after_visit: "تصويت فوري بعد فتح الصفحة (5 ثوانٍ أو أقل)",
  check_unavailable: "أصوات بلا تحقّق ناجح من Cloudflare رغم تفعيله",
  other: "مؤشّر تقني آخر (يُشرح في السبب)",
} as const;

export type EvidenceKey = keyof typeof EVIDENCE;

export const exclusionSchema = z
  .object({
    label: z.string().trim().regex(/^[0-9A-Fa-f]{6}$/, "رمز الشبكة غير صالح."),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "يُرجى تحديد بداية الفترة."),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "يُرجى تحديد نهاية الفترة."),
    evidence: z
      .array(z.enum(Object.keys(EVIDENCE) as [EvidenceKey, ...EvidenceKey[]]))
      .min(1, "يُرجى اختيار دليل تقني واحد على الأقل."),
    reason: z.string().trim().min(20, "يُرجى كتابة سبب واضح (20 حرفًا على الأقل)."),
  })
  .refine((v) => v.to > v.from, { path: ["to"], message: "يجب أن تكون النهاية بعد البداية." });

/**
 * The database raises its refusals in English (0005/0006). Admin pages show
 * them in Arabic; anything unrecognised is shown as-is.
 */
const DB_MESSAGES: [RegExp, string][] = [
  [/question can no longer be edited/i, "لا يمكن تعديل السؤال بعد فتح التصويت."],
  [/Answers can no longer be changed/i, "لا يمكن تعديل الإجابات بعد فتح التصويت."],
  [/Only full administrators can change protection/i, "يقتصر تغيير إعدادات الحماية على حسابات الإدارة الكاملة."],
  [/status has changed in the meantime/i, "تغيّرت حالة السؤال في هذه الأثناء. يُرجى إعادة تحميل الصفحة."],
  [/Status change .* is not allowed/i, "هذا التغيير في الحالة غير مسموح."],
  [/at least two answers/i, "يحتاج السؤال إلى إجابتين على الأقل."],
  [/future opening time/i, "يُرجى تحديد موعد فتح في المستقبل أولًا."],
  [/Only draft or scheduled polls without votes/i, "لا يمكن حذف سؤال بعد فتح التصويت عليه."],
  [/polls_one_active_idx|duplicate key value.*one_active/i, "يوجد سؤال آخر مجدول أو مفتوح. يُرجى إغلاقه أو إلغاء جدولته أولًا."],
  [/polls_slug_key|duplicate key value.*slug/i, "هذا الرابط المختصر مستخدم لسؤال آخر."],
  [/polls_close_after_open/i, "يجب أن يكون موعد الإغلاق بعد موعد الفتح."],
  [/only possible before results are published/i, "لا يمكن الاستبعاد بعد نشر النتائج."],
  [/no longer be reversed after publication/i, "لا يمكن التراجع عن الاستبعاد بعد نشر النتائج."],
  [/technical evidence is required/i, "يُرجى اختيار دليل تقني واحد على الأقل."],
  [/written reason of at least 20/i, "يُرجى كتابة سبب واضح (20 حرفًا على الأقل)."],
  [/Invalid time range/i, "الفترة الزمنية غير صالحة."],
  [/Unknown network code/i, "رمز الشبكة غير معروف لهذا السؤال."],
  [/matches more than one network/i, "هذا الرمز القصير يطابق أكثر من شبكة، لذلك رُفض الاستبعاد."],
  [/No eligible votes from this network/i, "لا توجد أصوات غير مستبعدة من هذه الشبكة في الفترة المحدّدة."],
  [/not found or already reversed/i, "الاستبعاد غير موجود أو تمّ التراجع عنه سابقًا."],
  [/not authorized|permission denied|row-level security/i, "هذا الإجراء غير متاح لحسابك."],
];

export function dbMessage(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  for (const [re, ar] of DB_MESSAGES) if (re.test(msg)) return ar;
  return msg || fallback;
}
