"use client";

import { useActionState } from "react";
import { CheckboxField, TextField, TextareaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/admin/polls/form-message";
import { submitKeepingValues } from "@/components/admin/polls/keep-values";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import type { AboutSection } from "@/lib/about/content";

export const FORMAT_HINT =
  "سطر فارغ يبدأ فقرة جديدة. السطر الذي يبدأ بـ «-» يصبح نقطة في قائمة، وتظهر الكلمات التي تسبق النقطتين «:» في أوّل النقطة بخطّ عريض.";

export function SectionForm({
  section,
  action,
}: {
  section: AboutSection;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  const isJoin = section.key === "join";
  const isTeam = section.key === "team";

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="flex flex-col gap-5">
      <FormMessage state={state} />

      <TextField
        id="title_ar"
        label="عنوان القسم"
        defaultValue={section.title_ar}
        required
        maxLength={120}
        error={state.errors?.title_ar}
      />

      <TextareaField
        id="body_ar"
        label={isTeam ? "نصّ تمهيدي" : "نصّ القسم"}
        optional={isTeam || isJoin}
        hint={FORMAT_HINT}
        defaultValue={section.body_ar}
        className="[&_textarea]:min-h-[16rem]"
        error={state.errors?.body_ar}
      />

      {isJoin ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="link_label_ar"
            label="نصّ الزرّ"
            optional
            defaultValue={section.link_label_ar ?? ""}
            maxLength={80}
            error={state.errors?.link_label_ar}
          />
          <TextField
            id="link_url"
            label="رابط الزرّ"
            optional
            dir="ltr"
            hint="رابط كامل يبدأ بـ https:// أو صفحة من الموقع مثل /subscribe"
            defaultValue={section.link_url ?? ""}
            error={state.errors?.link_url}
          />
        </div>
      ) : null}

      <CheckboxField id="is_published" defaultChecked={section.is_published}>
        إظهار القسم في الصفحة
      </CheckboxField>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ القسم"}
        </Button>
      </div>
    </form>
  );
}
