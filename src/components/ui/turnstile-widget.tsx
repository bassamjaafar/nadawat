"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile, explicit-render mode. The implicit mode (a plain
 * `.cf-turnstile` div the script auto-scans and mutates) races against React
 * hydration — the script can inject its widget before React finishes
 * hydrating that subtree, so React sees a mismatch and discards it,
 * silently dropping the whole widget (confirmed via a React error #418 in
 * production). Rendering it ourselves in an effect, which only ever runs
 * after hydration completes, avoids that race by construction.
 *
 * `resetSignal`: changing it asks Cloudflare for a fresh token — a token is
 * single-use, so a form that lets the visitor retry after a failed
 * submission (the «سؤال ندوات» vote form) bumps it after each attempt.
 */
export function TurnstileWidget({
  siteKey,
  resetSignal = 0,
}: {
  siteKey: string;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (resetSignal === 0 || !widgetIdRef.current || !window.turnstile) return;
    setToken("");
    window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  useEffect(() => {
    let cancelled = false;

    function tryRender() {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        setTimeout(tryRender, 100);
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (t) => setToken(t),
        "expired-callback": () => setToken(""),
      });
    }

    tryRender();
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </>
  );
}
