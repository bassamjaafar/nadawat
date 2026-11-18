"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the page from the server every `seconds` while it's visible.
 * `always`: also when the browser reports it hidden — a window shared into
 * StreamYard can count as hidden when another window covers it.
 */
export function AutoRefresh({ seconds, always = false }: { seconds: number; always?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (always || document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds, always]);
  return null;
}
