import type { NextConfig } from "next";

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
  console.log(
    `[nadawat] deployment=${vercelEnv ?? "unknown"} branch=${gitBranch ?? "unknown"} supabase-project=${supabaseRef ?? "none"}`,
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
