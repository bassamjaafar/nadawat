// Nadawat backup: every table (and the guest photos) into one encrypted file.
// Read-only: it never writes to the database. Run it on this Mac:
//
//   node scripts/export-backup.mjs --check   counts only, opens no records
//   node scripts/export-backup.mjs           the backup (asks for a password)
//
// Output: ~/nadawat-backups/nadawat-<date>-<time>.dmg (AES-256). Opening it
// asks for the password; inside, one JSON file per table. The password is
// asked for in a macOS window before any data is read. The unencrypted copy
// exists only in a private temporary folder, deleted at the end or if stopped.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const TABLES = {
  // table: order (primary key), so paging never skips or repeats a row
  admin_users: ["user_id"],
  consent_events: ["id"],
  debate_participants: ["debate_id", "person_id", "role"],
  debates: ["id"],
  people: ["id"],
  poll_attempts: ["poll_id", "voter_key", "window_start"],
  poll_audit_log: ["id"],
  poll_exclusions: ["id"],
  poll_options: ["id"],
  poll_refusals: ["poll_id", "window_start", "reason"],
  poll_vote_checks: ["vote_id"],
  poll_votes: ["id"],
  polls: ["id"],
  registrations: ["id"],
  site_content: ["key"],
  subscribers: ["id"],
};
const PHOTO_BUCKET = "people-photos";
const PAGE = 500;

const checkOnly = process.argv.includes("--check");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.env.NADAWAT_BACKUP_DIR || path.join(os.homedir(), "nadawat-backups");

function die(message) {
  console.error(`\n✗ ${message}\nNo backup was saved.`);
  process.exit(1);
}

const env = { ...process.env };
if (!process.env.NADAWAT_BACKUP_TEST) {
  for (const line of fs.readFileSync(path.join(repo, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
if (!url || !key) die("The database address or key is missing from .env.local.");
const ref = new URL(url).hostname.split(".")[0];
console.log(`Database: ${ref === "fhiiqezvromuiwdtywgo" ? "PRODUCTION" : `not production (${ref})`}`);
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function count(table) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error || count === null) die(`${table}: ${error?.message || "could not be counted"}`);
  return count;
}

async function readAll(table) {
  const rows = [];
  for (;;) {
    let q = db.from(table).select("*");
    for (const c of TABLES[table]) q = q.order(c, { ascending: true });
    const { data, error } = await q.range(rows.length, rows.length + PAGE - 1);
    if (error) die(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

async function listPhotos(prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(PHOTO_BUCKET).list(prefix, { limit: 100, offset });
    if (error) die(`photos: ${error.message}`);
    for (const f of data) {
      const p = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.id) files.push(p);
      else files.push(...(await listPhotos(p)));
    }
    if (data.length < 100) return files;
  }
}

const test = process.env.NADAWAT_BACKUP_TEST;
let child = null;
/** Runs a program without blocking, so Control+C always cleans up. */
function run(cmd, args, input) {
  return new Promise((resolve) => {
    child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", () => resolve({ status: 1, stdout, stderr }));
    child.on("close", (status) => {
      child = null;
      resolve({ status, stdout, stderr });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input ?? "");
  });
}

/** A macOS window with a hidden field; null if cancelled or left for 5 minutes. */
async function ask(text) {
  const { status, stdout } = await run("osascript", [
    "-e", "tell current application to activate",
    "-e", `set r to display dialog ${JSON.stringify(text)} default answer "" with hidden answer with title "Nadawat backup" buttons {"Cancel", "OK"} default button "OK" cancel button "Cancel" giving up after 300`,
    "-e", "if gave up of r then error number -128",
    "-e", "return text returned of r",
  ]);
  return status === 0 ? stdout.replace(/\n$/, "") : null;
}

async function choosePassword() {
  if (test) return test;
  console.log("A password window has opened (it may be behind other windows).");
  let note = "Choose a password for this backup (at least 12 characters). Save it in your password manager: without it the file cannot be opened.";
  for (;;) {
    const first = await ask(note);
    if (first === null) die("Cancelled.");
    if (first.length < 12) {
      note = "That was shorter than 12 characters. Choose a longer password.";
      continue;
    }
    const second = await ask("Type the same password again.");
    if (second === null) die("Cancelled.");
    if (first === second) return first;
    note = "The two passwords were different. Choose the password again.";
  }
}

if (checkOnly) {
  for (const t of Object.keys(TABLES)) console.log(String(await count(t)).padStart(7), t);
  console.log(String((await listPhotos()).length).padStart(7), "photos");
  console.log("\nCheck only: no records were opened, nothing was saved.");
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
const name = `nadawat-${stamp}UTC`;
const out = path.join(outDir, `${name}.dmg`);
if (fs.existsSync(out)) die(`${out} already exists. Wait a minute and run it again.`);
fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
const password = await choosePassword();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nadawat-"));
let saved = false;
process.on("exit", () => {
  fs.rmSync(tmp, { recursive: true, force: true });
  if (!saved) fs.rmSync(out, { force: true });
});
for (const s of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(s, () => {
    child?.kill("SIGKILL");
    process.exit(1);
  });
}

const dir = path.join(tmp, name);
fs.mkdirSync(path.join(dir, "photos"), { recursive: true, mode: 0o700 });
const counts = {};
let changed = false;
for (const t of Object.keys(TABLES)) {
  const rows = await readAll(t);
  const now = await count(t);
  if (now !== rows.length) changed = true;
  fs.writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows, null, 1), { mode: 0o600 });
  counts[t] = rows.length;
  console.log(String(rows.length).padStart(7), t, now === rows.length ? "" : `(now ${now})`);
}
const photos = await listPhotos();
for (const p of photos) {
  const { data, error } = await db.storage.from(PHOTO_BUCKET).download(p);
  if (error) die(`photo: ${error.message}`);
  const to = path.join(dir, "photos", p);
  if (!to.startsWith(path.join(dir, "photos") + path.sep)) die("photo: unexpected name");
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, Buffer.from(await data.arrayBuffer()));
}
console.log(String(photos.length).padStart(7), "photos");
fs.writeFileSync(
  path.join(dir, "_about.json"),
  JSON.stringify({ project: ref, saved_at: new Date().toISOString(), counts, photos: photos.length }, null, 1),
);

const made = await run(
  "hdiutil",
  ["create", "-quiet", "-encryption", "AES-256", "-stdinpass", "-format", "UDZO", "-volname", name, "-srcfolder", dir, out],
  password,
);
if (made.status !== 0 || !fs.existsSync(out)) die("The encrypted file could not be created.");
fs.chmodSync(out, 0o600);
const enc = spawnSync("hdiutil", ["isencrypted", out], { encoding: "utf8" });
if (!/encrypted: YES/i.test(`${enc.stdout}${enc.stderr}`)) {
  die("The file was not encrypted, so it was deleted.");
}
// Prove the password opens it before reporting success.
const opened = await run("hdiutil", ["imageinfo", "-stdinpass", "-plist", out], password);
if (opened.status !== 0) die("The finished file could not be opened with that password.");
saved = true;
console.log(`\n✓ Saved: ${out} (${Math.round(fs.statSync(out).size / 1024)} KB, encrypted)`);
if (changed) console.log("Note: something changed while saving (for example a new vote). Run it again for an exact copy.");
