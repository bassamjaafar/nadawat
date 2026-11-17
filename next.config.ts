import type { NextConfig } from "next";
import { createHash } from "node:crypto";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Production isolation. Every database request goes to the host in
// NEXT_PUBLIC_SUPABASE_URL, so that URL alone decides which project a
// deployment touches (a production key paired with the staging URL is simply
// rejected by staging). The production project ref is not a secret — it is in
// every page's public JavaScript. Previews, and the `polls` branch in any
// case, refuse to build against it.
const PRODUCTION_SUPABASE_REF = "fhiiqezvromuiwdtywgo";
const supabaseRef = supabaseHost?.split(".")[0];
const vercelEnv = process.env.VERCEL_ENV;
const gitBranch = process.env.VERCEL_GIT_COMMIT_REF;
if (process.env.VERCEL) {
  // Shown in the Vercel build log: confirms the target without any secret.
  // The server key is identified only by the variable that supplied it, its
  // kind and an 8-character one-way fingerprint — enough to tell keys apart.
  const keyVar = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ? "SUPABASE_SERVICE_ROLE_KEY"
    : process.env.SUPABASE_SECRET_KEY?.trim()
      ? "SUPABASE_SECRET_KEY"
      : null;
  const key = keyVar ? process.env[keyVar]!.trim() : "";
  const keyKind = !keyVar
    ? "none"
    : key.startsWith("sb_secret_")
      ? "sb_secret"
      : key.startsWith("eyJ")
        ? "legacy-jwt"
        : "not-a-key";
  const keyFingerprint = keyVar ? createHash("sha256").update(key).digest("hex").slice(0, 8) : "-";
  // Other secrets: only whether they look like what they should be.
  const shape = (name: string, ok: RegExp) => {
    const v = process.env[name]?.trim();
    return !v ? "none" : ok.test(v) ? "ok" : "wrong-format";
  };
  console.log(
    `[nadawat] deployment=${vercelEnv ?? "unknown"} branch=${gitBranch ?? "unknown"} supabase-project=${supabaseRef ?? "none"} ` +
      `server-key=${keyVar ?? "none"}:${keyKind}:${keyFingerprint} ` +
      `turnstile-secret=${shape("TURNSTILE_SECRET_KEY", /^0x4[A-Za-z0-9_-]{20,}$/)} ` +
      `poll-secret=${shape("POLL_SECRET", /^[A-Za-z0-9+/=_-]{32,}$/)} ` +
      `consent-salt=${shape("CONSENT_IP_SALT", /^[A-Za-z0-9+/=_-]{32,}$/)}`,
  );
}
if (
  supabaseRef === PRODUCTION_SUPABASE_REF &&
  (vercelEnv === "preview" || vercelEnv === "development" || gitBranch === "polls")
) {
  throw new Error(
    "Refusing to build a non-production deployment against the production Supabase project. " +
      "Set branch-specific Preview environment variables that point to nadawat-staging.",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
  },
  async redirects() {
    return [
      { source: "/debates", destination: "/events", permanent: true },
      { source: "/debates/:slug", destination: "/events/:slug", permanent: true },
      // www.nadawat.org -> nadawat.org, path preserved. nadawat.org is the
      // canonical public domain everywhere else (metadata, sitemap, OG URLs).
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nadawat.org" }],
        destination: "https://nadawat.org/:path*",
        permanent: true,
      },
    ];
  },
  // Default 1MB is too small for a person's photo upload in the admin.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
