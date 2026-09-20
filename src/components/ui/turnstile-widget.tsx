"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile, implicit-render mode: the script scans the DOM for
 * `.cf-turnstile` and renders the widget itself, then injects a hidden
 * `cf-turnstile-response` input into the enclosing <form> on completion —
 * no imperative JS API needed on our side.
 */
export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        async
        defer
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
    </>
  );
}
