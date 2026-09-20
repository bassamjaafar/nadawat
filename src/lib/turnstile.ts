import "server-only";
import { headers } from "next/headers";
import { env, hasTurnstile } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token server-side. Returns true when
 * Turnstile isn't configured at all — bot protection is a defense-in-depth
 * layer on top of the honeypot field, not a hard requirement, matching this
 * project's "every external service is optional" architecture.
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!hasTurnstile) return true;
  if (!token) return false;

  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    // Cloudflare unreachable — fail open rather than blocking every
    // subscription because a third party is briefly down.
    return true;
  }
}
