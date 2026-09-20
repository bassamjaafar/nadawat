"use client";

import { useActionState } from "react";
import {
  CheckboxField,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE } from "@/lib/forms";
import type { FormState } from "@/lib/forms";
import type { AdminEventDetail } from "@/lib/admin/events";
import { toDamascusInputValue } from "@/lib/admin/datetime";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "مسودّة" },
  { value: "upcoming", label: "قادمة" },
  { value: "completed", label: "منتهية" },
  { value: "archived", label: "مؤرشفة" },
];

export function EventForm({
  event,
  action,
  submitLabel,
}: {
  event?: AdminEventDetail;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p
          role="status"
          className="rounded-[var(--radius)] border border-line bg-[#eef2ea] px-4 py-3 text-[0.9rem] text-olive"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="title_ar"
          label="عنوان الندوة"
          defaultValue={event?.title_ar}
          required
          error={state.errors?.title_ar}
        />
        <TextField
          id="slug"
          label="الرابط المختصر (slug)"
          dir="ltr"
          hint="أحرف لاتينية صغيرة وأرقام وشرطات، مثل: al-mawdou-al-jadid"
          defaultValue={event?.slug}
          required
          error={state.errors?.slug}
        />
      </div>

      <TextareaField
        id="summary_ar"
        label="الملخّص"
        optional
        hint="سطر قصير يظهر في البطاقات والصفحة الرئيسية"
        defaultValue={event?.summary_ar ?? ""}
        error={state.errors?.summary_ar}
      />

      <TextareaField
        id="description_ar"
        label="الوصف الكامل"
        optional
        hint="النصّ الطويل الذي يظهر في صفحة الندوة"
        defaultValue={event?.description_ar ?? ""}
        className="[&_textarea]:min-h-[12rem]"
        error={state.errors?.description_ar}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="status"
          label="الحالة"
          options={STATUS_OPTIONS}
          defaultValue={event?.status ?? "draft"}
          error={state.errors?.status}
        />
        <TextField
          id="starts_at"
          label="الموعد (بتوقيت دمشق)"
          type="datetime-local"
          defaultValue={toDamascusInputValue(event?.starts_at ?? null)}
          error={state.errors?.starts_at}
        />
      </div>

      <TextField
        id="location_ar"
        label="المكان"
        optional
        hint="مثال: بثّ مباشر عبر الإنترنت"
        defaultValue={event?.location_ar ?? ""}
        error={state.errors?.location_ar}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="broadcast_url"
          label="رابط البثّ المباشر"
          dir="ltr"
          optional
          defaultValue={event?.broadcast_url ?? ""}
          error={state.errors?.broadcast_url}
        />
        <TextField
          id="youtube_url"
          label="رابط يوتيوب (بعد انتهاء البثّ)"
          dir="ltr"
          optional
          defaultValue={event?.youtube_url ?? ""}
          error={state.errors?.youtube_url}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="youtube_video_id"
          label="معرّف فيديو يوتيوب"
          dir="ltr"
          optional
          hint="الأحرف الـ11 من رابط يوتيوب"
          defaultValue={event?.youtube_video_id ?? ""}
          error={state.errors?.youtube_video_id}
        />
        <TextField
          id="cover_image_url"
          label="رابط صورة الغلاف"
          dir="ltr"
          optional
          defaultValue={event?.cover_image_url ?? ""}
          error={state.errors?.cover_image_url}
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-line pt-6">
        <CheckboxField id="is_published" defaultChecked={event?.is_published}>
          منشورة (تظهر على الموقع للجمهور)
        </CheckboxField>
        <CheckboxField
          id="registration_open"
          defaultChecked={event?.registration_open}
        >
          التسجيل مفتوح لهذه الندوة
        </CheckboxField>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
