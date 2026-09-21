import { NextResponse } from "next/server";
import { hasResend, env } from "@/lib/env";

/** TEMPORARY — never logs the key value, only presence/length. */
export async function GET() {
  const key = env.RESEND_API_KEY;
  let apiReachable: boolean | string = "not tested";

  if (key) {
    try {
      // A cheap authenticated call that doesn't send anything — proves the
      // key is real and Resend accepts it, without needing the "read" scope
      // that the domains/emails endpoints require.
      const res = await fetch("https://api.resend.com/api-keys", {
        headers: { Authorization: `Bearer ${key}` },
      });
      apiReachable = `${res.status}`;
    } catch (e) {
      apiReachable = `fetch error: ${(e as Error).message}`;
    }
  }

  return NextResponse.json({
    hasResend,
    keyLength: key?.length ?? 0,
    keyPrefix: key ? key.slice(0, 3) : null,
    apiReachable,
    // Which deployment/project is actually serving this request — to rule
    // out the domain pointing somewhere other than expected.
    vercelEnv: process.env.VERCEL_ENV,
    vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    vercelGitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG,
    vercelUrl: process.env.VERCEL_URL,
  });
}
