import "server-only";
import { headers } from "next/headers";
import { env, hasTurnstile } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * - passed:      Cloudflare confirmed the token.
 * - failed:      no token, Cloudflare rejected it (forged, expired, reused),
 *                or it was issued on a hostname other than `expectedHostname`.
 * - unavailable: Turnstile isn't configured here, or Cloudflare couldn't be
 *                reached from the server.
 */
export type TurnstileStatus = "passed" | "failed" | "unavailable";

/**
 * Why a check failed, in the words stored by poll_refusals (0006). Only
 * Cloudflare's reason category — never the token, the secret or the visitor.
 */
export type TurnstileRefusal =
  | "no_token"
  | "invalid_token"
  | "expired_or_reused"
  | "hostname_mismatch"
  | "server_config"
  | "other";

function refusalFromCodes(codes: string[]): TurnstileRefusal {
  if (codes.includes("missing-input-secret") || codes.includes("invalid-input-secret")) {
    return "server_config";
  }
  if (codes.includes("timeout-or-duplicate")) return "expired_or_reused";
  if (codes.includes("missing-input-response")) return "no_token";
  if (codes.includes("invalid-input-response")) return "invalid_token";
  return "other";
}

export async function verifyTurnstileDetailed(
  token: string | null,
  expectedHostname?: string,
): Promise<{ status: TurnstileStatus; refusal?: TurnstileRefusal }> {
  if (!hasTurnstile) return { status: "unavailable" };
  if (!token) return { status: "failed", refusal: "no_token" };

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
    const data = (await res.json()) as {
      success: boolean;
      hostname?: string;
      "error-codes"?: string[];
    };
    // Logged for diagnosis: Cloudflare's reason codes and hostnames only,
    // never the token or the secret.
    if (data.success !== true) {
      const codes = data["error-codes"] ?? [];
      console.warn("turnstile failed:", codes.join(",") || "no-code", "hostname:", data.hostname ?? "-");
      return { status: "failed", refusal: refusalFromCodes(codes) };
    }
    // A token solved on another site that uses the same key isn't ours.
    if (expectedHostname && data.hostname !== expectedHostname) {
      console.warn("turnstile hostname mismatch:", data.hostname ?? "-", "expected:", expectedHostname);
      return { status: "failed", refusal: "hostname_mismatch" };
    }
    return { status: "passed" };
  } catch {
    return { status: "unavailable" };
  }
}

export async function verifyTurnstileStatus(
  token: string | null,
  expectedHostname?: string,
): Promise<TurnstileStatus> {
  return (await verifyTurnstileDetailed(token, expectedHostname)).status;
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
