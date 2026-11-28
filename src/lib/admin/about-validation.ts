import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max, `النصّ أطول من ${max} حرفًا.`).optional(),
  );

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const sectionSchema = z
  .object({
    title_ar: z.string().trim().min(1, "العنوان مطلوب").max(120),
    body_ar: optionalText(8000),
    link_label_ar: optionalText(80),
    link_url: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z
        .string()
        .trim()
        .max(500)
        .regex(/^(https:\/\/|\/)/, "يجب أن يبدأ الرابط بـ https:// أو /")
        .optional(),
    ),
    is_published: checkbox,
  })
  .refine((v) => Boolean(v.link_label_ar) === Boolean(v.link_url), {
    message: "يُرجى إدخال نصّ الزرّ ورابطه معًا، أو تركهما فارغين.",
    path: ["link_url"],
  });

export type SectionInput = z.infer<typeof sectionSchema>;

export const groupSchema = z.object({
  name_ar: z.string().trim().min(1, "اسم المجموعة مطلوب").max(120),
  description_ar: optionalText(3000),
  sort_order: z.coerce.number({ message: "رقم غير صالح" }).int("رقم صحيح فقط").min(0).max(9999),
  status: z.enum(["published", "hidden", "archived"]),
});

export type GroupInput = z.infer<typeof groupSchema>;

const date = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صالح").nullable(),
);

const membership = z
  .object({ group_id: z.string().uuid(), start_date: date, end_date: date })
  .refine((m) => !m.start_date || !m.end_date || m.end_date >= m.start_date, {
    message: "تاريخ الانتهاء يسبق تاريخ البدء.",
  });

export const memberSchema = z.object({
  full_name_ar: z.string().trim().min(1, "الاسم الكامل مطلوب").max(150),
  title_ar: optionalText(200),
  bio_ar: optionalText(2000),
  consent_given: checkbox,
  status: z.enum(["draft", "published", "archived"]),
  memberships: z.preprocess(
    (v) => {
      try {
        return typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        return null;
      }
    },
    z
      .array(membership)
      .refine((list) => new Set(list.map((m) => m.group_id)).size === list.length, {
        message: "المجموعة مكرّرة.",
      }),
  ),
});

export type MemberInput = z.infer<typeof memberSchema>;
