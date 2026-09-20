"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setPending(false);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9rem] font-medium text-ink">
          البريد الإلكتروني
        </span>
        <input
          type="email"
          dir="ltr"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[var(--radius)] border border-line px-3.5 py-2.5 text-[0.95rem] text-ink outline-none focus:border-olive"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9rem] font-medium text-ink">كلمة المرور</span>
        <input
          type="password"
          dir="ltr"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[var(--radius)] border border-line px-3.5 py-2.5 text-[0.95rem] text-ink outline-none focus:border-olive"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-[var(--radius)] bg-olive px-5 py-2.5 text-[0.95rem] font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "جارٍ الدخول…" : "تسجيل الدخول"}
      </button>
    </form>
  );
}
