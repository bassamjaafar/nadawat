-- ندوات — 0003: public watch-live links + "شارك في الحوار" participation form
--
-- Safe to run more than once. Non-destructive: no data is removed.

-- ---------------------------------------------------------------------------
-- Watch-live links (public). These replace `broadcast_url` on the public
-- site, which the app no longer reads — studio links (Zoom/StreamYard) must
-- never be published. The old column is left in place, unused.
-- ---------------------------------------------------------------------------
alter table debates add column if not exists youtube_live_url  text;
alter table debates add column if not exists facebook_live_url text;

-- ---------------------------------------------------------------------------
-- Registrations become audience-participation requests. Watching needs no
-- registration; this table now only holds people asking to take part in the
-- Q&A segment, either in writing or live by audio/video.
-- ---------------------------------------------------------------------------
alter table registrations add column if not exists full_name text;
update registrations
   set full_name = trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
 where full_name is null;
alter table registrations alter column first_name drop not null;
alter table registrations alter column last_name  drop not null;

alter table registrations add column if not exists participation_type text
  check (participation_type in ('written', 'live'));
alter table registrations add column if not exists question text;
-- WhatsApp / phone — only collected for live participation.
alter table registrations add column if not exists phone text;
-- Live-only acknowledgments + recording consent (timestamped, like other consents).
alter table registrations add column if not exists ack_limited_selection boolean not null default false;
alter table registrations add column if not exists ack_time_limit       boolean not null default false;
alter table registrations add column if not exists consent_recording_at timestamptz;
-- Admin workflow.
alter table registrations add column if not exists status text not null default 'new'
  check (status in ('new', 'selected', 'not_selected', 'participated'));
alter table registrations add column if not exists admin_note text;

-- One person may send more than one question to the same event.
alter table registrations drop constraint if exists registrations_debate_id_email_key;
