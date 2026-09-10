import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * We store a salted hash of the requester's IP alongside consent records —
 * enough to detect abuse and support an audit, without retaining the raw IP.
 */
export async function requestFingerprint(): Promise<{
  ipHash: string | null;
  userAgent: string | null;
}> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");

  return {
    ipHash: ip
      ? createHash("sha256").update(`${env.CONSENT_IP_SALT}:${ip}`).digest("hex")
      : null,
    userAgent: userAgent ? userAgent.slice(0, 400) : null,
  };
}
