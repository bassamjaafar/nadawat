import { z } from "zod";

/**
 * Environment access. Every external service is optional so the site builds
 * and runs (in a degraded, read-only "demo" mode) before credentials exist.
 * Use the `has*` flags to branch, never assume a value is present.
 */

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  // Supabase renamed "service_role key" to "secret key" in newer dashboards —
  // accept either env var name so a project set up under the new naming
  // doesn't need a var renamed in Vercel to match older docs/code.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("ندوات <events@nadawat.org>"),
  EMAIL_REPLY_TO: z.string().email().default("events@nadawat.org"),

  /** Salt for hashing IP addresses stored alongside consent records. */
  CONSENT_IP_SALT: z.string().min(1).default("nadawat-dev-salt"),

  // Cloudflare Turnstile (bot protection on the subscribe form). NEXT_PUBLIC_
  // site key must NOT be marked "Sensitive" in Vercel — see the
  // NEXT_PUBLIC_SUPABASE_* incident for exactly why that silently breaks.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
});

// A dashboard-added env var left blank arrives as "" (not unset) — treat that
// the same as unset, or every `.optional()`/`.default()` below would still
// try to validate an empty string and fail the whole parse.
const orUnset = (v: string | undefined) =>
  v && v.trim() !== "" ? v : undefined;

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: orUnset(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_SUPABASE_URL: orUnset(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: orUnset(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  SUPABASE_SERVICE_ROLE_KEY: orUnset(process.env.SUPABASE_SERVICE_ROLE_KEY),
  SUPABASE_SECRET_KEY: orUnset(process.env.SUPABASE_SECRET_KEY),
  RESEND_API_KEY: orUnset(process.env.RESEND_API_KEY),
  EMAIL_FROM: orUnset(process.env.EMAIL_FROM),
  EMAIL_REPLY_TO: orUnset(process.env.EMAIL_REPLY_TO),
  CONSENT_IP_SALT: orUnset(process.env.CONSENT_IP_SALT),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: orUnset(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  ),
  TURNSTILE_SECRET_KEY: orUnset(process.env.TURNSTILE_SECRET_KEY),
});

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

/** The privileged Supabase key, whichever name it was set under. */
export const SUPABASE_ADMIN_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;

export const hasSupabase = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const hasSupabaseAdmin = Boolean(hasSupabase && SUPABASE_ADMIN_KEY);

export const hasResend = Boolean(env.RESEND_API_KEY);

export const hasTurnstile = Boolean(
  env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY,
);
