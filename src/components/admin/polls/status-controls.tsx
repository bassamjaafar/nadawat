"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import type { PollStatus } from "@/lib/polls/types";
import { FormMessage } from "./form-message";

type Move = {
  to: PollStatus;
  label: string;
  variant: "primary" | "outline";
  confirm?: string;
};

function movesFor(status: PollStatus, canSchedule: boolean, everPublished: boolean): Move[] {
  switch (status) {
    case "draft":
      return [
        ...(canSchedule
          ? [{ to: "scheduled" as const, label: "جدولة الفتح", variant: "primary" as const,
               confirm: "جدولة فتح التصويت في الموعد المحدّد؟ لا يمكن تعديل الإجابات بعد الفتح." }]
          : []),
        { to: "open", label: "فتح التصويت الآن", variant: canSchedule ? "outline" : "primary",
          confirm: "فتح التصويت الآن؟ لا يمكن تعديل السؤال والإجابات بعد الفتح." },
      ];
    case "scheduled":
      return [
        { to: "open", label: "فتح التصويت الآن", variant: "primary",
          confirm: "فتح التصويت الآن بدل الموعد المجدول؟" },
        { to: "draft", label: "إلغاء الجدولة", variant: "outline" },
      ];
    case "open":
      return [
        { to: "closed", label: "إغلاق التصويت", variant: "primary",
          confirm: "إغلاق التصويت الآن؟ لن تُقبل أصوات جديدة. النشر خطوة منفصلة." },
      ];
    case "closed":
      return [
        { to: "published", label: "نشر النتائج", variant: "primary",
          confirm:
            "نشر النتائج للجمهور؟\n\nعند النشر تُمحى رموز المتصفّحات والشبكات نهائيًا، فلا يعود ممكنًا استبعاد أصوات أو التراجع عن استبعاد." },
        ...(!everPublished
          ? [{ to: "open" as const, label: "إعادة فتح التصويت", variant: "outline" as const,
               confirm: "إعادة فتح التصويت؟" }]
          : []),
      ];
    case "published":
      return [
        { to: "closed", label: "إخفاء النتائج", variant: "outline",
          confirm: "إخفاء النتائج عن الجمهور؟ يمكن نشرها مجدّدًا لاحقًا." },
      ];
  }
}

export function StatusControls({
  pollId,
  status,
  canSchedule,
  everPublished,
  action,
}: {
  pollId: string;
  status: PollStatus;
  canSchedule: boolean;
  everPublished: boolean;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  const moves = movesFor(status, canSchedule, everPublished);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {moves.map((m) => (
          <form
            key={m.to}
            action={formAction}
            onSubmit={(e) => {
              if (m.confirm && !confirm(m.confirm)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={pollId} />
            <input type="hidden" name="expected" value={status} />
            <input type="hidden" name="to" value={m.to} />
            <Button type="submit" variant={m.variant} size="sm" disabled={pending}>
              {m.label}
            </Button>
          </form>
        ))}
      </div>
      <FormMessage state={state} />
    </div>
  );
}
