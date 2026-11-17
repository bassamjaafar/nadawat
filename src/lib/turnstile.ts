import "server-only";
import { headers } from "next/headers";
import { env, hasTurnstile } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * - passed:      Cloudflare confirmed the token.
 * - failed:      no token, or Cloudflare rejected it (forged, expired, reused).
 * - unavailable: Turnstile isn't configured here, or Cloudflare couldn't be
 *                reached from the server.
 */
export type TurnstileStatus = "passed" | "failed" | "unavailable";

export async function verifyTurnstileStatus(token: string | null): Promise<TurnstileStatus> {
  if (!hasTurnstile) return "unavailable";
  if (!token) return "failed";

  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true ? "passed" : "failed";
  } catch {
    return "unavailable";
  }
}

/**
 * Verifies a Cloudflare Turnstile token server-side. Returns true when
 * Turnstile isn't configured at all — bot protection is a defense-in-depth
 * layer on top of the honeypot field, not a hard requirement, matching this
 * project's "every external service is optional" architecture. Cloudflare
 * being unreachable also passes: fail open rather than blocking every
 * subscription because a third party is briefly down.
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  return (await verifyTurnstileStatus(token)) !== "failed";
}
