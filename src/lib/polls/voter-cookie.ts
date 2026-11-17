/**
 * «سؤال ندوات» anonymous voter cookie.
 *
 * A random browser ID plus the time it was issued, signed with POLL_SECRET,
 * so the server only accepts IDs it issued itself: a script can't invent
 * fresh identities, it has to load /vote for each one. Issued by middleware
 * on a plain GET of /vote — before any vote — so a retry after a lost
 * response on a weak connection carries the same ID and can't count twice.
 *
 * Web Crypto only (no node:crypto), because middleware runs this too. Reads
 * process.env directly for the same reason as middleware.ts (see there).
 */

export const VOTER_COOKIE = "nv_voter";
export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const DEV_SECRET = "nadawat-dev-poll-secret-not-for-production";

/** null in production when POLL_SECRET is missing — voting then fails closed. */
export function pollSecret(): string | null {
  const s = process.env.POLL_SECRET?.trim();
  if (s) return s;
  return process.env.NODE_ENV === "production" ? null : DEV_SECRET;
}

export type Voter = { id: string; issuedAt: number };

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(message));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createVoterCookie(secret: string): Promise<string> {
  const id = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${id}.${issuedAt}`;
  const sig = base64url(await hmac(secret, `nv1.${payload}`));
  return `${payload}.${sig}`;
}

/** The voter, or null for a missing, malformed, forged or future-dated cookie. */
export async function verifyVoterCookie(
  value: string | undefined,
  secret: string,
): Promise<Voter | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [id, iat, sig] = parts;
  if (!/^[A-Za-z0-9_-]{22}$/.test(id) || !/^\d{10}$/.test(iat)) return null;
  const expected = base64url(await hmac(secret, `nv1.${id}.${iat}`));
  if (!timingSafeEqual(sig, expected)) return null;
  const issuedAt = Number(iat);
  if (issuedAt > Math.floor(Date.now() / 1000) + 60) return null;
  return { id, issuedAt };
}
