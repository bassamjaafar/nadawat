"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Stage = "checking-link" | "confirm" | "ready" | "invalid-link";

/**
 * Two link formats land here:
 *
 * 1. `?token_hash=…&type=recovery` (what scripts/create-admin.mjs prints now).
 *    Loading the page does NOT use the one-time token — the person must press
 *    «متابعة», which calls verifyOtp(). Link previews (WhatsApp, Slack…),
 *    email scanners and accidental double-opens only fetch the page, so they
 *    can no longer burn the link before the real person uses it.
 *
 * 2. Legacy Supabase verify links, which redirect here with the session as
 *    `#access_token=...&refresh_token=...` in the URL fragment (the token was
 *    already consumed by the redirect). A fragment never reaches the server,
 *    so this runs client-side: read the hash, hand it to Supabase, render.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking-link");
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Deferred a tick (and kept the state updates inside this callback,
    // rather than the effect body itself) so this reads as reacting to an
    // external system rather than a synchronous render-time state update.
    Promise.resolve().then(async () => {
      const query = new URLSearchParams(window.location.search);
      const hashedToken = query.get("token_hash");
      if (hashedToken && query.get("type") === "recovery") {
        setTokenHash(hashedToken);
        setStage("confirm");
        return;
      }

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

  // Uses the one-time token only now, on an explicit click.
  async function onContinue() {
    if (!tokenHash) return;
    setPending(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    setPending(false);
    // Clean the token out of the visible URL either way.
    window.history.replaceState(null, "", window.location.pathname);
    setStage(error ? "invalid-link" : "ready");
  }

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
      setError("تعذّر حفظ كلمة المرور. يُرجى المحاولة مجدّدًا.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (stage === "checking-link") {
    return <p className="text-[0.9rem] text-muted">جارٍ التحقق من الرابط…</p>;
  }

  if (stage === "confirm") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-[0.9rem] leading-7 text-muted">
          يُرجى الضغط على «متابعة» لتعيين كلمة مرور الحساب.
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-[var(--radius)] bg-olive px-5 py-2.5 text-[0.95rem] font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "جارٍ التحقق…" : "متابعة"}
        </button>
      </div>
    );
  }

  if (stage === "invalid-link") {
    return (
      <p
        role="alert"
        className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
      >
        هذا الرابط غير صالح أو منتهي الصلاحية. يُرجى طلب رابط جديد.
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
