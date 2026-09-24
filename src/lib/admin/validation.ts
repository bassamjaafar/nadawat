import { z } from "zod";

const requiredText = (max: number, message = "هذا الحقل مطلوب") =>
  z.string().trim().min(1, message).max(max);

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const optionalUrl = (max = 500) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).url("رابط غير صالح").optional(),
  );

const checkboxTrue = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

/** Latin slug only — matches the existing hand-written slugs in the DB. */
const slug = z
  .string()
  .trim()
  .min(1, "الرابط المختصر مطلوب")
  .max(120)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "أحرف لاتينية صغيرة وأرقام وشرطات فقط، مثل: al-mawdou-al-jadid",
  );

export const eventSchema = z.object({
  slug,
  title_ar: requiredText(200, "عنوان الندوة مطلوب"),
  summary_ar: optionalText(300),
  description_ar: optionalText(5000),
  status: z.enum(["draft", "upcoming", "completed", "archived"]),
  is_published: checkboxTrue,
  starts_at: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().optional(),
  ),
  location_ar: optionalText(200),
  registration_open: checkboxTrue,
  youtube_live_url: optionalUrl(),
  facebook_live_url: optionalUrl(),
  youtube_url: optionalUrl(),
  youtube_video_id: optionalText(20),
  cover_image_url: optionalUrl(),
});

export type EventInput = z.infer<typeof eventSchema>;

export const personSchema = z.object({
  name_ar: requiredText(150, "اسم الشخص مطلوب"),
  title_ar: optionalText(200),
  bio_ar: optionalText(2000),
});

export type PersonInput = z.infer<typeof personSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
