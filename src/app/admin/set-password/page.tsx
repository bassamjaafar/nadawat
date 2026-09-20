import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/admin/set-password-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "تعيين كلمة المرور",
  robots: { index: false, follow: false },
};

export default function SetPasswordPage() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-[1.3rem] font-medium text-olive">
          {SITE_NAME}
        </p>
        <h1 className="mt-2 text-center text-h3 text-ink">تعيين كلمة المرور</h1>
        <p className="mt-2 text-center text-[0.9rem] text-muted">
          اختر كلمة مرور لحسابك في لوحة التحكم.
        </p>
        <div className="mt-8">
          <SetPasswordForm />
        </div>
      </div>
    </div>
  );
}
