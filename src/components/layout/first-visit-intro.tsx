"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "nadawat_intro_seen_v1";
const MIN_WIDTH = 1200;
const CREAM = "#F5F0E6";

/** If playback never actually starts (autoplay blocked, slow network), don't trap anyone. */
const START_TIMEOUT_MS = 4000;
/** In case `ended` never fires for some reason. */
const MAX_RUNTIME_MS = 15000;

type Phase = "idle" | "playing" | "fading" | "done";

/**
 * Silent, one-time, desktop-only branding intro shown before the first
 * paint of content a visitor's browser has never seen it in. The decision
 * to show it is made entirely client-side (see below for why, versus a
 * server-readable cookie) — both the server and the first client render
 * return null, so there's no hydration mismatch; the effect below only
 * ever *adds* the overlay after that, and the page underneath is the same
 * cream (`bg-cream`) as this overlay, so that one-tick gap is invisible.
 *
 * A cookie read in the root layout (which every route shares) would force
 * Next to render *every* page dynamically — killing static generation for
 * /about, /events, /privacy, etc. — just to skip a one-time animation for
 * returning visitors. localStorage avoids that entirely, at the cost of
 * only being able to decide after hydration, which is fine here because
 * the "before" state (nothing rendered) and "after, ineligible" state
 * (also nothing rendered) are identical — only the eligible case renders
 * anything, so returning visitors and mobile visitors never even mount
 * this component's overlay, let alone request the video.
 */
export function FirstVisitIntro() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [videoReady, setVideoReady] = useState(false);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Deferred a tick (state update inside the callback, not the effect
    // body itself) so this reads as reacting to an external system —
    // localStorage and the viewport — rather than a synchronous
    // render-time state update.
    Promise.resolve().then(() => {
      if (cancelled) return;

      let alreadySeen = false;
      try {
        alreadySeen = localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        // Storage unavailable (e.g. locked-down private mode) — treat as
        // unseen; it just won't persist across sessions for that visitor.
      }
      if (alreadySeen) return;

      const isDesktop = window.matchMedia(
        `(min-width: ${MIN_WIDTH}px)`,
      ).matches;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!isDesktop || reducedMotion) return;

      setPhase("playing");
      startTimerRef.current = setTimeout(finish, START_TIMEOUT_MS);
    });

    return () => {
      cancelled = true;
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (runtimeTimerRef.current) clearTimeout(runtimeTimerRef.current);
    };
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to do if storage isn't available.
    }
  }

  function handlePlaying() {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    markSeen();
    runtimeTimerRef.current = setTimeout(finish, MAX_RUNTIME_MS);
  }

  function finish() {
    setPhase((p) => (p === "playing" ? "fading" : p));
  }

  function handleError() {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    if (runtimeTimerRef.current) clearTimeout(runtimeTimerRef.current);
    // Never became meaningfully visible — drop it without a fade.
    setPhase("done");
  }

  function handleTransitionEnd() {
    if (phase === "fading") setPhase("done");
  }

  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={handleTransitionEnd}
      style={{ backgroundColor: CREAM }}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ease-out",
        phase === "fading" ? "opacity-0" : "opacity-100",
      )}
    >
      <video
        src="/brand/nadawat-intro-v1.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        onPlaying={handlePlaying}
        onEnded={finish}
        onError={handleError}
        className={cn(
          "h-full w-full object-contain transition-opacity duration-200",
          videoReady ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
