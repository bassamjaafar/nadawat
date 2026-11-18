"use client";

import { useActionState, useState } from "react";
import { CheckboxField, TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import { FormMessage } from "./form-message";
import { submitKeepingValues } from "./keep-values";

export function ProtectionForm({
  requireTurnstile,
  warn,
  alert,
  action,
}: {
  requireTurnstile: boolean;
  warn: number;
  alert: number;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  const [turnstile, setTurnstile] = useState(requireTurnstile);

  return (
    <form
      onSubmit={submitKeepingValues(formAction, () =>
        requireTurnstile && !turnstile
          ? "إيقاف تحقّق Cloudflare لهذا السؤال؟ تبقى الحماية الأخرى قائمة (الرمز الموقّع في المتصفّح، وحدّ المحاولات لكل متصفّح، وحماية Vercel). يُسجَّل التغيير في السجلّ."
          : null,
      )}
      className="flex flex-col gap-5"
    >
      <FormMessage state={state} />
      <CheckboxField
        id="require_turnstile"
        checked={turnstile}
        onChange={(e) => setTurnstile(e.target.checked)}
      >
        طلب تحقّق Cloudflare (Turnstile) قبل قبول الصوت
        <span className="block text-[0.85rem] text-muted">
          مفعّل افتراضيًا. إيقافه لا يُوقف الحمايات الأخرى، ولا يعيد أيّ حدّ تفعيله تلقائيًا.
          التحقّق الفاشل أو المزوّر لا يُقبل أبدًا ما دام مفعّلًا.
        </span>
      </CheckboxField>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="warn_per_10min"
          type="number"
          min={1}
          inputMode="numeric"
          label="تحذير مراقبة: أصوات من شبكة واحدة خلال 10 دقائق"
          defaultValue={warn}
          dir="ltr"
        />
        <TextField
          id="alert_per_10min"
          type="number"
          min={2}
          inputMode="numeric"
          label="تنبيه عاجل: أصوات من شبكة واحدة خلال 10 دقائق"
          defaultValue={alert}
          dir="ltr"
        />
      </div>
      <p className="text-[0.85rem] text-muted">
        الحدّان للمراقبة فقط: لا يرفضان أيّ صوت ولا يؤخّرانه ولا يُبطلانه.
      </p>
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : "حفظ إعدادات الحماية"}
        </Button>
      </div>
    </form>
  );
}
