import type { Metadata } from "next";
import { PersonForm } from "@/components/admin/person-form";
import { createPersonFormAction } from "../actions";

export const metadata: Metadata = {
  title: "شخص جديد",
  robots: { index: false, follow: false },
};

export default function NewPersonPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-h2 text-ink">شخص جديد</h1>
      <p className="mt-2 text-[0.9rem] text-muted">
        بعد الإنشاء يمكنك رفع صورته من صفحة التعديل.
      </p>
      <div className="mt-8">
        <PersonForm action={createPersonFormAction} submitLabel="إنشاء" />
      </div>
    </div>
  );
}
