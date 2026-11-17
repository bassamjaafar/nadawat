#!/usr/bin/env node
/**
 * Provisions (or re-provisions) an admin login for the nadawat admin CMS.
 *
 * Usage:
 *   node scripts/create-admin.mjs someone@example.com "الاسم الظاهر" --project <ref>
 *       [--role admin|polls_only] [--env staging]
 *
 *   --project   the Supabase project ref this must run against (the part
 *               before .supabase.co). Required, so an admin is never created
 *               in the wrong project by accident. The script prints the ref
 *               it would use if it doesn't match.
 *   --role      admin (default, full access) or polls_only («سؤال ندوات»
 *               producer: polls only).
 *   --env       staging → read .env.staging.local instead of .env.local, and
 *               build the link from its NEXT_PUBLIC_SITE_URL (the preview).
 *
 * Creates a Supabase Auth user (no password set), inserts the matching
 * admin_users row, then prints a one-time link that lets that person set
 * their own password — the password itself never passes through this
 * script, this chat, or any log.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
}
const expectedRef = flag("project");
const role = flag("role") ?? "admin";
const target = flag("env") ?? "production";

function loadEnvFile(name) {
  let text;
  try {
    text = readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
  } catch {
    console.error(`${name} not found in the project folder.`);
    process.exit(1);
  }
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

const [email, displayName] = args;
if (!email) {
  console.error(
    'Usage: node scripts/create-admin.mjs someone@example.com "الاسم" --project <ref> [--role admin|polls_only] [--env staging]',
  );
  process.exit(1);
}
if (role !== "admin" && role !== "polls_only") {
  console.error(`Unknown role "${role}". Use admin or polls_only.`);
  process.exit(1);
}
if (target !== "production" && target !== "staging") {
  console.error(`Unknown --env "${target}". Use staging, or leave it out for production.`);
  process.exit(1);
}
// Guard against running the usage example verbatim (example.com can't
// receive email, so the account would be unusable).
if (/@example\.(com|org|net)$/i.test(email)) {
  console.error(`"${email}" is a placeholder address — use the person's real email.`);
  process.exit(1);
}

const envFile = target === "staging" ? ".env.staging.local" : ".env.local";
const env = loadEnvFile(envFile);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
// The link is opened on the new admin's own device, so it must point at the
// live site — NOT .env.local's NEXT_PUBLIC_SITE_URL, which is localhost for
// development (that sent a coordinator to "Safari can't connect"). On
// staging it's the preview address from .env.staging.local.
// Set ADMIN_LINK_BASE_URL=http://localhost:3000 only to test locally.
const siteUrl =
  process.env.ADMIN_LINK_BASE_URL ||
  (target === "staging" ? env.NEXT_PUBLIC_SITE_URL : "https://nadawat.org");

if (!supabaseUrl || !adminKey || !siteUrl) {
  console.error(
    `Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY` +
      (target === "staging" ? " or NEXT_PUBLIC_SITE_URL" : "") +
      ` in ${envFile}`,
  );
  process.exit(1);
}

const actualRef = new URL(supabaseUrl).hostname.split(".")[0];
if (expectedRef !== actualRef) {
  console.error(
    `${envFile} points at Supabase project "${actualRef}"` +
      (expectedRef ? `, not "${expectedRef}"` : "") +
      `. Re-run with --project ${actualRef} if that is the intended project.`,
  );
  process.exit(1);
}
console.log(`Target: ${target} · Supabase project ${actualRef} · role ${role}`);

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
    role,
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

  // Point straight at our own page with the hashed token, instead of
  // Supabase's verify URL (action_link): opening ours does NOT use the token —
  // the person presses «متابعة» first — so link previews (e.g. pasting into
  // WhatsApp) and email scanners can no longer burn it.
  const link = `${siteUrl}/admin/set-password?token_hash=${encodeURIComponent(
    linkData.properties.hashed_token,
  )}&type=recovery`;

  console.log("\nOne-time link to set the password (open it in a browser):\n");
  console.log(link);
  console.log(
    "\nIt's used when the person presses «متابعة» on that page; then it expires.\n" +
      "Running this script again issues a new link and replaces the old one.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
