-- ندوات — core schema
-- Reproducible database structure. Apply with the Supabase CLI:
--   supabase db reset            (local)
--   supabase db push             (linked project)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type debate_status as enum ('draft', 'upcoming', 'completed', 'archived');
create type subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');
create type participant_role as enum ('speaker', 'moderator');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- people  (speakers & moderators)
-- ---------------------------------------------------------------------------
create table people (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null,
  title_ar    text,
  bio_ar      text,
  image_url   text,
  slug        text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger people_updated_at before update on people
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- debates
-- ---------------------------------------------------------------------------
create table debates (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title_ar           text not null,
  summary_ar         text,                       -- short line for cards / hero
  description_ar      text,                       -- longer contextual text (detail page)
  status             debate_status not null default 'draft',
  is_published       boolean not null default false,
  starts_at          timestamptz,                -- date + time of the debate
  timezone           text not null default 'Asia/Damascus',
  location_ar        text,
  registration_open  boolean not null default false,
  broadcast_url      text,                       -- live stream link
  youtube_url        text,                       -- full recording URL
  youtube_video_id   text,                       -- 11-char id (thumbnail + embed)
  cover_image_url    text,                       -- event photograph (upcoming)
  moderator_id       uuid references people (id) on delete set null,
  -- Room for future archival fields (transcript, reference docs, clips…)
  -- without a schema change.
  meta               jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index debates_status_starts_at_idx on debates (status, starts_at);
create index debates_published_idx on debates (is_published, starts_at desc);
create trigger debates_updated_at before update on debates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- debate_participants
-- ---------------------------------------------------------------------------
create table debate_participants (
  id                  uuid primary key default gen_random_uuid(),
  debate_id           uuid not null references debates (id) on delete cascade,
  person_id           uuid not null references people (id) on delete restrict,
  role                participant_role not null default 'speaker',
  position_label_ar   text,           -- e.g. «مع توسيع الصلاحيات المحلية» (not a vote)
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  unique (debate_id, person_id)
);
create index debate_participants_debate_idx on debate_participants (debate_id);

-- ---------------------------------------------------------------------------
-- registrations  (per-debate attendance)
-- ---------------------------------------------------------------------------
create table registrations (
  id                    uuid primary key default gen_random_uuid(),
  debate_id             uuid not null references debates (id) on delete cascade,
  first_name            text not null,
  last_name             text not null,
  email                 text not null,
  country               text not null,
  notify_future_events  boolean not null default false,  -- marketing consent, kept separate
  consent_at            timestamptz,                     -- set only when marketing consent granted
  access_token          uuid not null default gen_random_uuid(),  -- for future private event links
  confirmation_sent_at  timestamptz,
  ip_hash               text,
  user_agent            text,
  created_at            timestamptz not null default now(),
  unique (debate_id, email)
);
create index registrations_debate_idx on registrations (debate_id);

-- ---------------------------------------------------------------------------
-- subscribers  (long-term notification list, double opt-in)
-- ---------------------------------------------------------------------------
create table subscribers (
  id                    uuid primary key default gen_random_uuid(),
  first_name            text not null,
  last_name             text not null,
  email                 text not null unique,
  country               text not null,
  status                subscriber_status not null default 'pending',
  consent_text          text not null,               -- exact wording shown to the user
  consent_at            timestamptz not null default now(),
  confirmation_token    uuid not null default gen_random_uuid(),
  confirmation_sent_at  timestamptz,
  confirmed_at          timestamptz,
  unsubscribe_token     uuid not null default gen_random_uuid(),
  unsubscribed_at       timestamptz,
  source                text not null default 'website',
  ip_hash               text,
  user_agent            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index subscribers_status_idx on subscribers (status);
create index subscribers_confirmation_token_idx on subscribers (confirmation_token);
create index subscribers_unsubscribe_token_idx on subscribers (unsubscribe_token);
create trigger subscribers_updated_at before update on subscribers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- consent_events  (append-only audit trail)
-- ---------------------------------------------------------------------------
create table consent_events (
  id            bigint generated always as identity primary key,
  subject_type  text not null,   -- 'subscriber' | 'registration'
  subject_id    uuid not null,
  email         text not null,
  action        text not null,   -- 'opt_in_requested' | 'opt_in_confirmed' | 'unsubscribed' | 'registration'
  consent_text  text,
  ip_hash       text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index consent_events_subject_idx on consent_events (subject_type, subject_id);
create index consent_events_email_idx on consent_events (email);

-- ---------------------------------------------------------------------------
-- admin_users  (roles — does not preclude adding more admins later)
-- ---------------------------------------------------------------------------
create table admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null default 'admin',   -- 'admin' | 'editor'
  display_name text,
  created_at   timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- site_content  (small custom CMS for About/contact blocks)
-- ---------------------------------------------------------------------------
create table site_content (
  key         text primary key,          -- e.g. 'about.mission', 'contact.email'
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);
create trigger site_content_updated_at before update on site_content
  for each row execute function set_updated_at();
