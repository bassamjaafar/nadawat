import "server-only";
import { createHmac } from "node:crypto";
import { cookies, headers } from "next/headers";
import { pollSecret, verifyVoterCookie, VOTER_COOKIE, type Voter } from "@/lib/polls/voter-cookie";

/**
 * The codes stored with a vote. Both are keyed per poll, so a browser or a
 * network can't be followed from one poll to the next, and neither can be
 * linked to subscriber or participation records (which use a different salt).
 * The raw cookie and raw IP are never stored.
 */
export function voterKey(secret: string, pollId: string, voter: Voter): string {
  return createHmac("sha256", secret).update(`voter|${pollId}|${voter.id}`).digest("hex");
}

export function networkKey(secret: string, pollId: string, ip: string | null): string | null {
  return ip ? createHmac("sha256", secret).update(`ip|${pollId}|${ip}`).digest("hex") : null;
}

export async function readVoter(): Promise<{ voter: Voter; secret: string } | null> {
  const secret = pollSecret();
  if (!secret) return null;
  const jar = await cookies();
  const voter = await verifyVoterCookie(jar.get(VOTER_COOKIE)?.value, secret);
  return voter ? { voter, secret } : null;
}

export async function requestIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}
