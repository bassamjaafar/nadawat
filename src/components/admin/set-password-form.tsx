"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Stage = "checking-link" | "ready" | "invalid-link";

/**
 * Recovery links generated via the Admin API (`auth.admin.generateLink`)
 * deliver the session as `#access_token=...&refresh_token=...` in the URL
 * fragment — never a `?code=` — because the PKCE flow needs a code_verifier
 * only the *original requesting client* holds, which doesn't exist when an
 * admin generates the link for someone else. A fragment never reaches the
 * server (browsers strip it before sending the request), so this has to run
 * entirely client-side: read the hash, hand it to Supabase, then render.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking-link");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Deferred a tick (and kept the state updates inside this callback,
    // rather than the effect body itself) so this reads as reacting to an
    // external system rather than a synchronous render-time state update.
    Promise.resolve().then(async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setStage("invalid-link");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      // Clean the sensitive tokens out of the visible URL either way.
      window.history.replaceState(null, "", window.location.pathname);
      setStage(error ? "invalid-link" : "ready");
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setPending(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setError("تعذّر حفظ كلمة المرور. حاول مجدّدًا.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (stage === "checking-link") {
    return <p className="text-[0.9rem] text-muted">جارٍ التحقق من الرابط…</p>;
  }

  if (stage === "invalid-link") {
    return (
      <p
        role="alert"
        className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
      >
        هذا الرابط غير صالح أو منتهي الصلاحية. اطلب رابطًا جديدًا.
      </p>
    );
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
          كلمة المرور الجديدة
        </span>
        <input
          type="password"
          dir="ltr"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[var(--radius)] border border-line px-3.5 py-2.5 text-[0.95rem] text-ink outline-none focus:border-olive"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.9rem] font-medium text-ink">
          تأكيد كلمة المرور
        </span>
        <input
          type="password"
          dir="ltr"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="rounded-[var(--radius)] border border-line px-3.5 py-2.5 text-[0.95rem] text-ink outline-none focus:border-olive"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-[var(--radius)] bg-olive px-5 py-2.5 text-[0.95rem] font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
      </button>
    </form>
  );
}
