import type { Metadata } from "next";
import { adminListPollEvents } from "@/lib/admin/polls";
import { PollForm } from "@/components/admin/polls/poll-form";
import { createPollAction } from "../actions";

export const metadata: Metadata = {
  title: "سؤال جديد",
  robots: { index: false, follow: false },
};

export default async function NewPollPage() {
  const events = await adminListPollEvents();
  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-ink">سؤال جديد</h1>
      <p className="mt-2 text-[0.92rem] text-muted">
        يُحفظ السؤال مسودّة. الفتح والجدولة من صفحة السؤال بعد الحفظ.
      </p>
      <div className="mt-8">
        <PollForm events={events} action={createPollAction} submitLabel="حفظ المسودّة" />
      </div>
    </div>
  );
}
