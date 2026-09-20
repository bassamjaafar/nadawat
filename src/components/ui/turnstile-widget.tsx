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
 */
export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;

    function tryRender() {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        setTimeout(tryRender, 100);
        return;
      }
      window.turnstile.render(containerRef.current, {
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
