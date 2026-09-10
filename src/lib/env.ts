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
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("ندوات <events@nadawat.org>"),
  EMAIL_REPLY_TO: z.string().email().default("events@nadawat.org"),

  /** Salt for hashing IP addresses stored alongside consent records. */
  CONSENT_IP_SALT: z.string().min(1).default("nadawat-dev-salt"),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  CONSENT_IP_SALT: process.env.CONSENT_IP_SALT,
});

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const hasSupabase = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const hasSupabaseAdmin = Boolean(
  hasSupabase && env.SUPABASE_SERVICE_ROLE_KEY,
);

export const hasResend = Boolean(env.RESEND_API_KEY);
