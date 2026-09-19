# ندوات · Nadawat

The official website for **ندوات (Nadawat)** — an Arabic-language platform for
structured debates and thoughtful public dialogue on Syrian political, economic,
social and civic issues. Brand line: **نختلف باحترام**.

Arabic-only, RTL-first. Serious, calm, institutional. Built to last.

> **This is the foundation pass.** Public site, design system, full database
> schema, and the subscriptions + registration double-opt-in flows are built and
> working. The protected **admin area / custom CMS is not built yet** — see
> [Roadmap](#roadmap).

---

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, React Server Components), TypeScript |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` |
| Fonts | Reem Kufi + IBM Plex Sans Arabic via `next/font` |
| Database / Auth | Supabase (Postgres + RLS + Supabase Auth) |
| Email | Resend (transactional / double opt-in) |
| Validation | Zod |
| Hosting | Vercel |

No animation library, no component library, no state manager — deliberately.

## Architecture

```
src/
  app/                     Routes (App Router)
    page.tsx               Homepage — upcoming-debate mode / institutional mode
    debates/               Archive + /debates/[slug] permanent record
    subscribe/             Subscribe page, /confirm (double opt-in landing)
    unsubscribe/           One-click unsubscribe landing
    about/ contact/ privacy/
    sitemap.ts robots.ts
    */actions.ts           Server Actions (form handlers)
  components/
    layout/                Header (sticky, mobile panel), footer
    home/ debates/ forms/  Section + feature components
    ui/                    Design-system primitives
  lib/
    env.ts                 Zod-validated env, `hasSupabase` / `hasResend` flags
    supabase/server.ts     Anon client (RLS-bound) for RSC/actions
    supabase/admin.ts      Service-role client — server only, never bundled client-side
    data/                  Data access (debates, subscribers, registrations)
    data/fixtures.ts       Demo content used when Supabase is unset
    email/                 Resend sender + branded RTL HTML templates
    validation.ts          Zod schemas + exact consent wording (stored per record)
    security.ts            Salted IP-hash + user-agent capture for consent audit
supabase/
  migrations/0001_schema.sql   Tables, enums, indexes, is_admin()
  migrations/0002_rls.sql      Row Level Security policies
  seed.sql                     Fictional Arabic demo content
docs/design-system.md
```

### Degraded ("demo") mode

Every external service is optional. With **no env configured** the site builds and
runs against `lib/data/fixtures.ts`, forms complete, and email is logged to the
console instead of sent (the subscribe success panel surfaces the confirm link so
the flow is testable locally). Set the env vars to switch to live data.

### Security model

- **Anon / public** reads only *published, non-draft* debates + their people +
  `site_content`, enforced by RLS.
- `registrations`, `subscribers`, `consent_events` have **no anon policies** —
  they are written and read only by the server via the service-role key.
- The service-role key is used exclusively in `lib/supabase/admin.ts`
  (`import "server-only"`), never exposed to the client.
- Consent: separate booleans for event registration vs. future-notification;
  exact consent text + timestamp + hashed IP stored per record; append-only
  `consent_events` audit trail; double opt-in required before any subscriber is
  `confirmed`; unsubscribe token in every email.

---

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in when you have credentials
npm run dev
```

Open http://localhost:3000. Append `?preview=institutional` (dev only) to preview
the no-upcoming-debate homepage.

### Checks

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push          # runs migrations/0001 + 0002
   # load demo content (optional):
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
   ```
   Or run all three SQL files in the Supabase SQL editor in order.
3. Copy **Project Settings → API** values into `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Make yourself an admin** (needed once the admin area lands):
   create an Auth user, then
   ```sql
   insert into admin_users (user_id, role, display_name)
   values ('<auth-user-uuid>', 'admin', 'اسمك');
   ```
5. Generate typed rows (optional, recommended):
   ```bash
   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
   ```

Local stack alternative: `npx supabase start` then `npx supabase db reset`
(applies migrations + `seed.sql` automatically via `supabase/config.toml`).

## Resend setup

1. Add and **verify the `nadawat.org` domain** in [resend.com](https://resend.com)
   (DNS records).
2. Create an API key → `RESEND_API_KEY`.
3. `EMAIL_FROM="ندوات <events@nadawat.org>"`, `EMAIL_REPLY_TO="events@nadawat.org"`.
   Resend **sends only** — `events@nadawat.org` must be a real, monitored mailbox
   hosted with your email provider (it is used as `Reply-To`, replies do not go to
   Resend). Do not use a `noreply@` address.

Templates (`src/lib/email/templates.ts`): subscription double-opt-in, subscription
confirmed, registration confirmation. Event-announcement emails can be added
against the same `subscribers` table later.

## Deployment (Vercel)

1. Import the repo in Vercel (Next.js preset — no config needed).
2. Add every variable from `.env.example` in **Project → Settings → Environment
   Variables**. Set `NEXT_PUBLIC_SITE_URL=https://nadawat.org`.
3. Point the `nadawat.org` domain at the Vercel project.
4. Server Actions are same-origin by default; no extra config.

## Logo

The official calligraphic `ندوات` mark is real vector art, inlined as
`src/components/ui/logo-mark.tsx` (paths sourced from
`src/components/ui/logo-mark-data.ts`) with `fill="currentColor"`, so the same
asset recolours for the cream header and the olive footer via CSS — no
separate light/dark files. `NEXT_PUBLIC_LOGO_URL` / `_CREAM` remain as an
escape hatch to swap in an external image instead; see `logo.tsx`.

The formal institutional name, **المنتدى السوري للحوار**, is set as real text
(`ORG_NAME` in `src/lib/site.ts`) beside the mark in the header and footer —
not an image, so it stays sharp and themeable. `public/brand/nadawat-mark-512.png`
and the favicon/apple-icon are a square crop of the same mark, for icons/avatars.

## Homepage control

The homepage is fully automatic by default: it shows the soonest debate with
status `upcoming`, or — if none is scheduled — falls back to an institutional
layout featuring the latest `completed`/`archived` debate.

To **override** that (e.g. more than one debate is marked `upcoming`, or you
want a specific past debate spotlighted), set one row in `site_content`:

```sql
insert into site_content (key, value) values
  ('home.featured_debate_slug', '"the-debate-slug"'::jsonb)
on conflict (key) do update set value = excluded.value;
```

Delete that row (or set its value to `null`) to return to the automatic
behaviour. This is a deliberately low-tech lever — a proper one-click toggle
belongs in the admin panel (see Roadmap) once that exists.

---

## Data model

`people` · `debates` · `debate_participants` · `registrations` · `subscribers`
· `consent_events` · `admin_users` · `site_content`

Debate status: `draft → upcoming → completed → archived`. `debates.meta` (jsonb)
and `people` are structured so transcripts, reference docs, clips, categories and
a speaker archive can be added **without restructuring**. Voting is intentionally
absent from schema and UI.

## Roadmap

Built next, in order (architecture already accommodates all of it):

1. Protected `/admin` (Supabase Auth + `admin_users`, middleware guard).
2. Debate CRUD — schedule, status, speakers/moderator, publish/unpublish.
3. People management.
4. Registrations + subscribers views with CSV export.
5. Editable `site_content` blocks (About / contact).
6. Per-debate OpenGraph images (title + identity) for WhatsApp/Facebook sharing.
7. Event-announcement email campaigns.

Deliberately *not* in v1 and *not* teased in the UI: audience voting, debate
statistics, category filtering, transcripts, clips.
