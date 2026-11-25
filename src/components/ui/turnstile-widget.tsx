"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

/** No token, and nothing to click, after this long: the check is stuck. */
const STUCK_AFTER_MS = 20_000;

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
          "error-callback"?: (code: string) => boolean;
          "unsupported-callback"?: () => void;
          "before-interactive-callback"?: () => void;
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
 *
 * `onToken` / `onLoadFailed` (optional): tell the form when the check is
 * complete (a token) or incomplete (""), and whether it currently can't be
 * loaded — blocked, offline, stuck, or an unsupported browser. A late
 * success clears the failure. A check interrupted by a dropped connection
 * doesn't resume by itself, so it is asked for again once back online.
 */
export function TurnstileWidget({
  siteKey,
  resetSignal = 0,
  onToken,
  onLoadFailed,
}: {
  siteKey: string;
  resetSignal?: number;
  onToken?: (token: string) => void;
  onLoadFailed?: (failed: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");

  // The widget is rendered once; its callbacks always reach the latest props.
  const notify = useRef({ onToken, onLoadFailed });
  useEffect(() => {
    notify.current = { onToken, onLoadFailed };
  });

  const tokenRef = useRef("");
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const watch = useCallback(() => {
    clearTimeout(stuckTimer.current);
    stuckTimer.current = setTimeout(() => {
      if (!tokenRef.current) notify.current.onLoadFailed?.(true);
    }, STUCK_AFTER_MS);
  }, []);
  const update = useCallback((t: string) => {
    tokenRef.current = t;
    setToken(t);
    notify.current.onToken?.(t);
    if (t) {
      clearTimeout(stuckTimer.current);
      notify.current.onLoadFailed?.(false);
    }
  }, []);
  const askAgain = useCallback(() => {
    if (!widgetIdRef.current || !window.turnstile) return;
    update("");
    window.turnstile.reset(widgetIdRef.current);
    watch();
  }, [update, watch]);

  useEffect(() => {
    const online = () => {
      if (!tokenRef.current) askAgain();
    };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [askAgain]);

  useEffect(() => {
    if (resetSignal === 0) return;
    askAgain();
  }, [resetSignal, askAgain]);

  useEffect(() => {
    let cancelled = false;

    function fail() {
      update("");
      notify.current.onLoadFailed?.(true);
    }
    watch();

    function tryRender() {
      if (cancelled || !containerRef.current) return;
      if (!window.turnstile) {
        setTimeout(tryRender, 100);
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: update,
        "expired-callback": () => {
          update("");
          watch();
        },
        // Cloudflare retries by itself; `true` means the error is handled.
        "error-callback": () => {
          fail();
          return true;
        },
        "unsupported-callback": fail,
        // A checkbox is now waiting for the visitor: nothing is stuck.
        "before-interactive-callback": () => {
          clearTimeout(stuckTimer.current);
          notify.current.onLoadFailed?.(false);
        },
      });
      watch();
    }

    tryRender();
    return () => {
      cancelled = true;
      clearTimeout(stuckTimer.current);
    };
  }, [siteKey, update, watch]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onError={() => notify.current.onLoadFailed?.(true)}
      />
      <div ref={containerRef} />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </>
  );
}
