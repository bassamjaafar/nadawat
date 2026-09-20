import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic route — reports only booleans/lengths, never values,
 * to figure out why NEXT_PUBLIC_SUPABASE_* isn't reaching the running app in
 * production despite being correctly named and scoped in Vercel. Delete this
 * file once that's resolved; it has no place in a shipped app.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return NextResponse.json({
    hasSupabaseUrl: Boolean(url),
    supabaseUrlLength: url?.length ?? 0,
    hasAnonKey: Boolean(anon),
    anonKeyLength: anon?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
  });
}
