#!/usr/bin/env node
/**
 * Provisions (or re-provisions) an admin login for the nadawat admin CMS.
 *
 * Usage:
 *   node scripts/create-admin.mjs someone@example.com "الاسم الظاهر"
 *
 * Creates a Supabase Auth user (no password set), inserts the matching
 * admin_users row, then prints a one-time link that lets that person set
 * their own password — the password itself never passes through this
 * script, this chat, or any log.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const [, , email, displayName] = process.argv;
if (!email) {
  console.error('Usage: node scripts/create-admin.mjs someone@example.com "الاسم"');
  process.exit(1);
}

const env = loadEnvLocal();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

if (!supabaseUrl || !adminKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, adminKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Look for an existing user with this email first — createUser errors on
  // a duplicate, and re-running this script to reset access should work.
  const { data: existingPage, error: listError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  let userId = existingPage.users.find((u) => u.email === email)?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user ${email} (${userId})`);
  } else {
    console.log(`Auth user already exists: ${email} (${userId})`);
  }

  const { error: upsertError } = await supabase.from("admin_users").upsert({
    user_id: userId,
    role: "admin",
    display_name: displayName ?? null,
  });
  if (upsertError) throw upsertError;
  console.log("admin_users row ready.");

  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/admin/set-password` },
    });
  if (linkError) throw linkError;

  console.log("\nOne-time link to set the password (open it in a browser):\n");
  console.log(linkData.properties.action_link);
  console.log("\nThis link works once and expires — re-run this script for a new one.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
