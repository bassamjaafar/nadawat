import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { hasSupabase } from "@/lib/env";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  if (!hasSupabase) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-cream px-6">
        <p className="max-w-sm text-center text-[0.95rem] leading-7 text-muted">
          لوحة التحكم تتطلّب إعداد Supabase أولًا.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-[1.3rem] font-medium text-olive">
          {SITE_NAME}
        </p>
        <h1 className="mt-2 text-center text-h3 text-ink">لوحة التحكم</h1>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
