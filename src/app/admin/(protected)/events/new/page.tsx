import type { Metadata } from "next";
import { EventForm } from "@/components/admin/event-form";
import { createEventAction } from "../actions";

export const metadata: Metadata = {
  title: "ندوة جديدة",
  robots: { index: false, follow: false },
};

export default function NewEventPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-h2 text-ink">ندوة جديدة</h1>
      <p className="mt-2 text-[0.9rem] text-muted">
        بعد إنشاء الندوة يمكنك إضافة الضيوف والمحاور من صفحة التعديل.
      </p>
      <div className="mt-8">
        <EventForm action={createEventAction} submitLabel="إنشاء الندوة" />
      </div>
    </div>
  );
}
