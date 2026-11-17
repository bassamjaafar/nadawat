-- ندوات — 0005: «سؤال ندوات» public polls
--
-- Requires 0004_admin_roles.sql (is_admin / can_manage_polls).
-- Additive only: no existing table is changed. Rollback: 0005_polls.rollback.sql.
--
-- Model:
--  * polls / poll_options      question + answers; editable until voting opens.
--  * poll_votes                the choice only (option + time). Never readable
--                              through the API by anyone — totals come from
--                              poll_results(), which returns nothing to the
--                              public until the poll is published.
--  * poll_vote_checks          security data for each vote, kept apart from the
--                              choice: keyed browser + network codes (HMACs made
--                              by the server; no raw IPs), Turnstile outcome,
--                              seconds since first visit. The keys are erased
--                              when results are published.
--  * poll_attempts             per-browser rate limiting; erased on publish.
--  * poll_exclusions           reviewed, reversible exclusions (full admins).
--  * poll_audit_log            insert-only record of every poll action.
--
-- The public site and the vote itself go through the server's service-role
-- client; anon has no direct access to any poll table.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
do $$ begin
  create type poll_status as enum ('draft', 'scheduled', 'open', 'closed', 'published');
exception when duplicate_object then null; end $$;

create table if not exists polls (
  id                uuid primary key default gen_random_uuid(),
  debate_id         uuid references debates (id) on delete restrict,
  slug              text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  question_ar       text not null check (char_length(btrim(question_ar)) between 5 and 300),
  note_ar           text check (note_ar is null or char_length(note_ar) <= 300),
  status            poll_status not null default 'draft',
  opens_at          timestamptz,
  closes_at         timestamptz,              -- optional automatic close (safety net)
  opened_at         timestamptz,              -- when voting actually opened
  closed_at         timestamptz,              -- when voting actually closed
  published_at      timestamptz,              -- set once results were first published
  require_turnstile boolean not null default true,
  warn_per_10min    integer not null default 40  check (warn_per_10min > 0),
  alert_per_10min   integer not null default 300 check (alert_per_10min > 0),
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint polls_close_after_open check (closes_at is null or opens_at is null or closes_at > opens_at),
  constraint polls_scheduled_has_time check (status <> 'scheduled' or opens_at is not null)
);

-- At most one poll is scheduled or open at any time, so /vote is never ambiguous.
create unique index if not exists polls_one_active_idx
  on polls ((true)) where status in ('scheduled', 'open');
create index if not exists polls_debate_idx on polls (debate_id);

drop trigger if exists polls_updated_at on polls;
create trigger polls_updated_at before update on polls
  for each row execute function set_updated_at();

create table if not exists poll_options (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references polls (id) on delete cascade,
  label_ar   text not null check (char_length(btrim(label_ar)) between 1 and 120),
  sort_order integer not null,
  constraint poll_options_order_key unique (poll_id, sort_order) deferrable initially deferred,
  constraint poll_options_id_poll_key unique (id, poll_id)
);

create table if not exists poll_exclusions (
  id             uuid primary key default gen_random_uuid(),
  poll_id        uuid not null references polls (id) on delete cascade,
  ip_key         text,                       -- erased on publish
  network_label  text not null,              -- short display code, e.g. 7A2F9C
  from_at        timestamptz not null,
  to_at          timestamptz not null,
  evidence       text[] not null,
  reason         text not null,
  votes_affected integer not null,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  reverted_by    uuid references auth.users (id) on delete set null,
  reverted_at    timestamptz,
  constraint poll_exclusions_evidence_check check (
    cardinality(evidence) >= 1
    and evidence <@ array['machine_timing', 'instant_after_visit', 'check_unavailable', 'other']::text[]
  ),
  constraint poll_exclusions_reason_check check (char_length(btrim(reason)) >= 20)
);
create index if not exists poll_exclusions_poll_idx on poll_exclusions (poll_id);

create table if not exists poll_votes (
  id          bigint generated always as identity primary key,
  poll_id     uuid not null references polls (id) on delete cascade,
  option_id   uuid not null,
  created_at  timestamptz not null default now(),
  excluded_by uuid references poll_exclusions (id) on delete set null,
  constraint poll_votes_option_fkey foreign key (option_id, poll_id)
    references poll_options (id, poll_id) on delete cascade
);
create index if not exists poll_votes_poll_idx on poll_votes (poll_id, option_id);

create table if not exists poll_vote_checks (
  vote_id               bigint primary key references poll_votes (id) on delete cascade,
  poll_id               uuid not null references polls (id) on delete cascade,
  voter_key             text,                 -- HMAC(browser id); erased on publish
  ip_key                text,                 -- HMAC(IP), per poll; erased on publish
  check_status          text not null check (check_status in ('passed', 'disabled', 'unavailable')),
  secs_from_first_visit integer check (secs_from_first_visit is null or secs_from_first_visit >= 0),
  created_at            timestamptz not null default now()
);
-- One vote per browser per poll. NULLs (after publication) don't collide.
create unique index if not exists poll_vote_checks_browser_idx on poll_vote_checks (poll_id, voter_key);
create index if not exists poll_vote_checks_network_idx on poll_vote_checks (poll_id, ip_key, created_at);

create table if not exists poll_attempts (
  poll_id      uuid not null references polls (id) on delete cascade,
  voter_key    text not null,
  window_start timestamptz not null,
  attempts     integer not null default 0,
  primary key (poll_id, voter_key, window_start)
);

create table if not exists poll_audit_log (
  id      bigint generated always as identity primary key,
  poll_id uuid references polls (id) on delete set null,
  actor   uuid references auth.users (id) on delete set null,
  action  text not null,
  detail  jsonb not null default '{}'::jsonb,
  at      timestamptz not null default now()
);
create index if not exists poll_audit_log_poll_idx on poll_audit_log (poll_id, at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Applies the schedule: a scheduled poll past opens_at counts as open; an
-- open poll past closes_at counts as closed. No background job needed.
create or replace function poll_effective_status(p polls)
returns poll_status
language sql
stable
set search_path = public
as $$
  select case
    when p.status in ('scheduled', 'open')
         and p.closes_at is not null and p.closes_at <= now()
         and (p.status = 'open' or p.opens_at <= now())
      then 'closed'::poll_status
    when p.status = 'scheduled' and p.opens_at <= now()
      then 'open'::poll_status
    else p.status
  end;
$$;

create or replace function poll_audit(p_poll uuid, p_action text, p_detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into poll_audit_log (poll_id, actor, action, detail)
  values (p_poll, auth.uid(), p_action, coalesce(p_detail, '{}'::jsonb));
$$;
revoke execute on function poll_audit(uuid, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guards on direct edits (admin pages write polls/options through RLS)
-- ---------------------------------------------------------------------------
create or replace function polls_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  via_status_fn boolean := coalesce(current_setting('nadawat.poll_status_change', true), '') = 'on';
  eff poll_status;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.opened_at is not null or new.closed_at is not null
       or new.published_at is not null then
      raise exception 'A new poll must start as a draft.' using errcode = 'P0001';
    end if;
    if not is_admin() and (new.require_turnstile is distinct from true
        or new.warn_per_10min <> 40 or new.alert_per_10min <> 300) then
      raise exception 'Only full administrators can change protection settings.' using errcode = '42501';
    end if;
    new.created_by := coalesce(new.created_by, auth.uid());
    return new;
  end if;

  if tg_op = 'DELETE' then
    eff := poll_effective_status(old);
    if eff not in ('draft', 'scheduled')
       or exists (select 1 from poll_votes where poll_id = old.id) then
      raise exception 'Only draft or scheduled polls without votes can be deleted.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if not via_status_fn and (
       new.status is distinct from old.status
       or new.opened_at is distinct from old.opened_at
       or new.closed_at is distinct from old.closed_at
       or new.published_at is distinct from old.published_at) then
    raise exception 'Poll status can only change through set_poll_status().' using errcode = '42501';
  end if;

  if (new.require_turnstile is distinct from old.require_turnstile
      or new.warn_per_10min is distinct from old.warn_per_10min
      or new.alert_per_10min is distinct from old.alert_per_10min) then
    if not is_admin() then
      raise exception 'Only full administrators can change protection settings.' using errcode = '42501';
    end if;
    perform poll_audit(new.id, 'settings_changed', jsonb_build_object(
      'require_turnstile', jsonb_build_array(old.require_turnstile, new.require_turnstile),
      'warn_per_10min',    jsonb_build_array(old.warn_per_10min, new.warn_per_10min),
      'alert_per_10min',   jsonb_build_array(old.alert_per_10min, new.alert_per_10min)));
  end if;

  if not via_status_fn then
    eff := poll_effective_status(old);
    if eff not in ('draft', 'scheduled') and (
         new.question_ar is distinct from old.question_ar
         or new.note_ar is distinct from old.note_ar
         or new.debate_id is distinct from old.debate_id
         or new.slug is distinct from old.slug
         or new.opens_at is distinct from old.opens_at) then
      raise exception 'The question can no longer be edited once voting has opened.' using errcode = 'P0001';
    end if;
    if new.question_ar is distinct from old.question_ar
       or new.note_ar is distinct from old.note_ar
       or new.debate_id is distinct from old.debate_id
       or new.slug is distinct from old.slug
       or new.opens_at is distinct from old.opens_at
       or new.closes_at is distinct from old.closes_at then
      perform poll_audit(new.id, 'edited', jsonb_build_object(
        'question_ar', new.question_ar, 'opens_at', new.opens_at, 'closes_at', new.closes_at));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists polls_guard_ins on polls;
create trigger polls_guard_ins before insert on polls
  for each row execute function polls_guard();
drop trigger if exists polls_guard_upd on polls;
create trigger polls_guard_upd before update on polls
  for each row execute function polls_guard();
drop trigger if exists polls_guard_del on polls;
create trigger polls_guard_del before delete on polls
  for each row execute function polls_guard();

create or replace function polls_audit_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform poll_audit(new.id, 'created', jsonb_build_object('question_ar', new.question_ar));
  return null;
end;
$$;
drop trigger if exists polls_audit_ins on polls;
create trigger polls_audit_ins after insert on polls
  for each row execute function polls_audit_insert();

-- Answers are locked once voting has opened.
create or replace function poll_options_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p polls;
begin
  select * into p from polls where id = coalesce(new.poll_id, old.poll_id);
  if not found then
    return coalesce(new, old);   -- parent being deleted (cascade)
  end if;
  if poll_effective_status(p) not in ('draft', 'scheduled') then
    raise exception 'Answers can no longer be changed once voting has opened.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists poll_options_guard on poll_options;
create trigger poll_options_guard before insert or update or delete on poll_options
  for each row execute function poll_options_guard();

-- ---------------------------------------------------------------------------
-- Public state (server only)
-- ---------------------------------------------------------------------------

-- The poll /vote shows: open, else scheduled, else the most recently closed
-- or published. Returns public fields only — never counts.
create or replace function public_poll_state(p_slug text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p polls;
begin
  if p_slug is not null then
    select * into p from polls where slug = p_slug and status <> 'draft';
  else
    select * into p from polls
    where status <> 'draft'
    order by
      case poll_effective_status(polls)
        when 'open' then 0 when 'scheduled' then 1 else 2 end,
      coalesce(published_at, closed_at, closes_at, opens_at, created_at) desc
    limit 1;
  end if;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'question_ar', p.question_ar,
    'note_ar', p.note_ar,
    'status', poll_effective_status(p),
    'opens_at', p.opens_at,
    'closes_at', p.closes_at,
    'published_at', case when p.status = 'published' then p.published_at end,
    'require_turnstile', p.require_turnstile,
    'debate', (
      select jsonb_build_object(
        'slug', d.slug, 'title_ar', d.title_ar, 'starts_at', d.starts_at,
        'timezone', d.timezone, 'is_published', (d.is_published and d.status <> 'draft'))
      from debates d where d.id = p.debate_id),
    'options', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'label_ar', o.label_ar) order by o.sort_order)
      from poll_options o where o.poll_id = p.id), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public_poll_state(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Voting (server only, via the service-role key)
-- ---------------------------------------------------------------------------

-- Per-browser rate limit: at most p_limit submissions per browser identifier
-- per 10-minute window, whatever the outcome. Never applied per network.
create or replace function note_vote_attempt(p_poll uuid, p_voter_key text, p_limit integer default 10)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := date_bin('10 minutes', now(), timestamptz '2000-01-01');
  n integer;
begin
  insert into poll_attempts as a (poll_id, voter_key, window_start, attempts)
  values (p_poll, p_voter_key, w, 1)
  on conflict (poll_id, voter_key, window_start)
    do update set attempts = a.attempts + 1
  returning attempts into n;

  -- Keep the table small: old windows are useless.
  delete from poll_attempts where poll_id = p_poll and window_start < now() - interval '1 hour';

  return n <= p_limit;
end;
$$;
revoke execute on function note_vote_attempt(uuid, text, integer) from public, anon, authenticated;

-- Records one vote atomically. Outcomes:
--   ok | already_voted | not_open | invalid_option
create or replace function cast_vote(
  p_poll uuid,
  p_option uuid,
  p_voter_key text,
  p_ip_key text,
  p_check_status text,
  p_secs_from_first_visit integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  p polls;
  v_vote bigint;
begin
  if p_voter_key is null or char_length(p_voter_key) < 32 then
    raise exception 'voter key required';
  end if;
  if p_check_status not in ('passed', 'disabled', 'unavailable') then
    raise exception 'invalid check status';
  end if;

  -- FOR SHARE: a concurrent close/publish waits for in-flight votes.
  select * into p from polls where id = p_poll for share;
  if not found or poll_effective_status(p) <> 'open' then
    return 'not_open';
  end if;
  -- The server must not skip Turnstile while the poll requires it.
  if p.require_turnstile and p_check_status = 'disabled' then
    raise exception 'Turnstile is required for this poll';
  end if;
  if not exists (select 1 from poll_options where id = p_option and poll_id = p_poll) then
    return 'invalid_option';
  end if;
  if exists (select 1 from poll_vote_checks where poll_id = p_poll and voter_key = p_voter_key) then
    return 'already_voted';
  end if;

  begin
    insert into poll_votes (poll_id, option_id)
    values (p_poll, p_option)
    returning id into v_vote;

    insert into poll_vote_checks (vote_id, poll_id, voter_key, ip_key, check_status, secs_from_first_visit)
    values (v_vote, p_poll, p_voter_key, p_ip_key, p_check_status,
            least(greatest(p_secs_from_first_visit, 0), 31536000));
  exception when unique_violation then
    -- A simultaneous request from the same browser won the race; this
    -- block's inserts are rolled back.
    return 'already_voted';
  end;

  return 'ok';
end;
$$;
revoke execute on function cast_vote(uuid, uuid, text, text, text, integer) from public, anon, authenticated;

create or replace function has_voted(p_poll uuid, p_voter_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from poll_vote_checks where poll_id = p_poll and voter_key = p_voter_key);
$$;
revoke execute on function has_voted(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Results — nothing for anyone but poll managers until published
-- ---------------------------------------------------------------------------
-- Returns { options: [{id, label_ar, votes}], total, excluded } or null.
-- Counts only eligible (non-excluded) votes. `excluded` is a single total —
-- never broken down by answer.
create or replace function poll_results(p_poll uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p polls;
begin
  select * into p from polls where id = p_poll;
  if not found then
    return null;
  end if;
  if p.status <> 'published' and not can_manage_polls() then
    return null;
  end if;

  return jsonb_build_object(
    'options', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'label_ar', o.label_ar, 'votes', coalesce(c.n, 0))
                       order by o.sort_order)
      from poll_options o
      left join (
        select option_id, count(*) as n from poll_votes
        where poll_id = p_poll and excluded_by is null
        group by option_id
      ) c on c.option_id = o.id
      where o.poll_id = p_poll), '[]'::jsonb),
    'total',    (select count(*) from poll_votes where poll_id = p_poll and excluded_by is null),
    'excluded', (select count(*) from poll_votes where poll_id = p_poll and excluded_by is not null)
  );
end;
$$;
revoke execute on function poll_results(uuid) from public;
grant execute on function poll_results(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Monitoring & review — security data only, never answers
-- ---------------------------------------------------------------------------
create or replace function poll_monitor(p_poll uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p polls;
begin
  if not can_manage_polls() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into p from polls where id = p_poll;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'accepted',      (select count(*) from poll_vote_checks where poll_id = p_poll),
    'last_10_min',   (select count(*) from poll_vote_checks where poll_id = p_poll and created_at > now() - interval '10 minutes'),
    'checks',        coalesce((select jsonb_object_agg(check_status, n) from (
                        select check_status, count(*) as n from poll_vote_checks
                        where poll_id = p_poll group by check_status) s), '{}'::jsonb),
    'warn_per_10min',  p.warn_per_10min,
    'alert_per_10min', p.alert_per_10min,
    'networks', coalesce((
      select jsonb_agg(row_to_json(n)::jsonb order by n.peak_10min desc, n.votes desc)
      from (
        select upper(left(ip_key, 6)) as label,
               count(*) as votes,
               max(win) as peak_10min,
               min(created_at) as first_at,
               max(created_at) as last_at,
               case when max(win) >= p.alert_per_10min then 'alert'
                    when max(win) >= p.warn_per_10min then 'warning'
                    else 'normal' end as level
        from (
          select ip_key, created_at,
                 count(*) over (partition by ip_key order by created_at
                                range between interval '10 minutes' preceding and current row) as win
          from poll_vote_checks
          where poll_id = p_poll and ip_key is not null
        ) w
        group by ip_key
        order by max(win) desc, count(*) desc
        limit 20
      ) n), '[]'::jsonb)
  );
end;
$$;
revoke execute on function poll_monitor(uuid) from public, anon;
grant execute on function poll_monitor(uuid) to authenticated;

-- Technical indicators for one network code. Full administrators only.
-- Reads poll_vote_checks only: the answers of these votes are never visible.
create or replace function poll_review_network(p_poll uuid, p_label text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  keys text[];
begin
  if not is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select array_agg(distinct ip_key) into keys
  from poll_vote_checks
  where poll_id = p_poll and ip_key is not null and upper(left(ip_key, 6)) = upper(p_label);
  if keys is null then
    return null;
  end if;

  return (
    with v as (
      select created_at, check_status, secs_from_first_visit,
             extract(epoch from created_at - lag(created_at) over (order by created_at)) as gap
      from poll_vote_checks
      where poll_id = p_poll and ip_key = any (keys)
    )
    select jsonb_build_object(
      'label', upper(p_label),
      'ambiguous', cardinality(keys) > 1,
      'votes', count(*),
      'first_at', min(created_at),
      'last_at', max(created_at),
      'checks', (select jsonb_object_agg(check_status, n) from (
                   select check_status, count(*) n from v group by check_status) s),
      'instant_after_visit', count(*) filter (where secs_from_first_visit is not null and secs_from_first_visit <= 5),
      'gap_mean_secs', round(avg(gap)::numeric, 1),
      -- Coefficient of variation of the gaps: near 0 = machine-regular timing.
      'gap_cv', case when avg(gap) > 0 then round((stddev_samp(gap) / avg(gap))::numeric, 2) end,
      'per_minute', (select jsonb_agg(jsonb_build_object('minute', m, 'votes', n) order by m) from (
                       select date_trunc('minute', created_at) m, count(*) n from v group by 1) pm),
      'already_excluded', (select count(*) from poll_votes pv
                            join poll_vote_checks c on c.vote_id = pv.id
                            where c.poll_id = p_poll and c.ip_key = any (keys) and pv.excluded_by is not null)
    )
    from v
  );
end;
$$;
revoke execute on function poll_review_network(uuid, text) from public, anon;
grant execute on function poll_review_network(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Reviewed exclusions — full administrators only, reversible before publication
-- ---------------------------------------------------------------------------
create or replace function exclude_votes(
  p_poll uuid,
  p_label text,
  p_from timestamptz,
  p_to timestamptz,
  p_evidence text[],
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p polls;
  keys text[];
  ex_id uuid;
  n integer;
begin
  if not is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into p from polls where id = p_poll for update;
  if not found or p.status = 'published' then
    raise exception 'Exclusions are only possible before results are published.' using errcode = 'P0001';
  end if;
  if p_evidence is null or cardinality(p_evidence) = 0
     or not (p_evidence <@ array['machine_timing', 'instant_after_visit', 'check_unavailable', 'other']::text[]) then
    raise exception 'At least one piece of technical evidence is required.' using errcode = 'P0001';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) < 20 then
    raise exception 'A written reason of at least 20 characters is required.' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Invalid time range.' using errcode = 'P0001';
  end if;

  select array_agg(distinct ip_key) into keys
  from poll_vote_checks
  where poll_id = p_poll and ip_key is not null and upper(left(ip_key, 6)) = upper(p_label);
  if keys is null then
    raise exception 'Unknown network code.' using errcode = 'P0001';
  end if;
  if cardinality(keys) > 1 then
    raise exception 'This short code matches more than one network; exclusion refused.' using errcode = 'P0001';
  end if;

  insert into poll_exclusions (poll_id, ip_key, network_label, from_at, to_at, evidence, reason, votes_affected, created_by)
  values (p_poll, keys[1], upper(p_label), p_from, p_to, p_evidence, btrim(p_reason), 0, auth.uid())
  returning id into ex_id;

  update poll_votes v set excluded_by = ex_id
  from poll_vote_checks c
  where c.vote_id = v.id and c.poll_id = p_poll and c.ip_key = keys[1]
    and c.created_at >= p_from and c.created_at <= p_to
    and v.excluded_by is null;
  get diagnostics n = row_count;

  if n = 0 then
    raise exception 'No eligible votes from this network in that time range.' using errcode = 'P0001';
  end if;

  update poll_exclusions set votes_affected = n where id = ex_id;
  perform poll_audit(p_poll, 'votes_excluded', jsonb_build_object(
    'exclusion_id', ex_id, 'network', upper(p_label), 'from', p_from, 'to', p_to,
    'evidence', to_jsonb(p_evidence), 'reason', btrim(p_reason), 'votes', n));

  return jsonb_build_object('exclusion_id', ex_id, 'votes', n);
end;
$$;
revoke execute on function exclude_votes(uuid, text, timestamptz, timestamptz, text[], text) from public, anon;
grant execute on function exclude_votes(uuid, text, timestamptz, timestamptz, text[], text) to authenticated;

create or replace function revert_exclusion(p_exclusion uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  e poll_exclusions;
  p polls;
  n integer;
begin
  if not is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into e from poll_exclusions where id = p_exclusion for update;
  if not found or e.reverted_at is not null then
    raise exception 'Exclusion not found or already reversed.' using errcode = 'P0001';
  end if;
  select * into p from polls where id = e.poll_id for update;
  if p.status = 'published' then
    raise exception 'Exclusions can no longer be reversed after publication.' using errcode = 'P0001';
  end if;

  update poll_votes set excluded_by = null where excluded_by = p_exclusion;
  get diagnostics n = row_count;
  update poll_exclusions set reverted_at = now(), reverted_by = auth.uid() where id = p_exclusion;
  perform poll_audit(e.poll_id, 'exclusion_reverted', jsonb_build_object(
    'exclusion_id', p_exclusion, 'network', e.network_label, 'votes', n));
  return n;
end;
$$;
revoke execute on function revert_exclusion(uuid) from public, anon;
grant execute on function revert_exclusion(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Lifecycle — the only way status changes
-- ---------------------------------------------------------------------------
-- p_expected is the status the caller saw (effective status). If the poll
-- has moved on (another tab, another producer), the change is refused.
--
-- Allowed:  draft → scheduled | open        scheduled → draft | open
--           open → closed                   closed → open (never-published only)
--           closed → published              published → closed (hide results)
create or replace function set_poll_status(p_poll uuid, p_expected poll_status, p_to poll_status)
returns poll_status
language plpgsql
security definer
set search_path = public
as $$
declare
  p polls;
  eff poll_status;
begin
  if not can_manage_polls() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into p from polls where id = p_poll for update;
  if not found then
    raise exception 'Poll not found.' using errcode = 'P0001';
  end if;
  eff := poll_effective_status(p);
  if eff <> p_expected then
    raise exception 'The poll status has changed in the meantime (now: %). Reload the page.', eff using errcode = 'P0001';
  end if;

  if not (
       (eff = 'draft'     and p_to in ('scheduled', 'open'))
    or (eff = 'scheduled' and p_to in ('draft', 'open'))
    or (eff = 'open'      and p_to = 'closed')
    or (eff = 'closed'    and p_to = 'open' and p.published_at is null)
    or (eff = 'closed'    and p_to = 'published')
    or (eff = 'published' and p_to = 'closed')
  ) then
    raise exception 'Status change % to % is not allowed.', eff, p_to using errcode = 'P0001';
  end if;

  if p_to in ('scheduled', 'open')
     and (select count(*) from poll_options where poll_id = p_poll) < 2 then
    raise exception 'A poll needs at least two answers.' using errcode = 'P0001';
  end if;
  if p_to = 'scheduled' and (p.opens_at is null or p.opens_at <= now()) then
    raise exception 'Set a future opening time first.' using errcode = 'P0001';
  end if;

  perform set_config('nadawat.poll_status_change', 'on', true);

  if p_to = 'scheduled' then
    update polls set status = 'scheduled' where id = p_poll;
  elsif p_to = 'draft' then
    update polls set status = 'draft' where id = p_poll;
  elsif p_to = 'open' then
    update polls set
      status = 'open',
      opened_at = coalesce(case when eff = 'closed' then opened_at end, least(coalesce(opens_at, now()), now())),
      opens_at = case when opens_at is null or opens_at > now() then now() else opens_at end,
      closed_at = null,
      -- Reopening after an automatic close: drop the passed closing time.
      closes_at = case when closes_at is not null and closes_at <= now() then null else closes_at end
    where id = p_poll;
  elsif p_to = 'closed' and eff = 'open' then
    update polls set
      status = 'closed',
      opened_at = coalesce(opened_at, opens_at),
      closed_at = coalesce(case when closes_at <= now() then closes_at end, now())
    where id = p_poll;
  elsif p_to = 'closed' and eff = 'published' then
    update polls set status = 'closed' where id = p_poll;   -- hide results; published_at kept
  elsif p_to = 'published' then
    update polls set
      status = 'published',
      opened_at = coalesce(opened_at, opens_at),
      closed_at = coalesce(closed_at, closes_at, now()),
      published_at = coalesce(published_at, now())
    where id = p_poll;
    -- Results are final: erase every link between a vote and a browser or network.
    update poll_vote_checks set voter_key = null, ip_key = null where poll_id = p_poll;
    update poll_exclusions set ip_key = null where poll_id = p_poll;
    delete from poll_attempts where poll_id = p_poll;
  end if;

  perform set_config('nadawat.poll_status_change', '', true);
  perform poll_audit(p_poll, 'status_' || eff || '_to_' || p_to, '{}'::jsonb);
  return p_to;
end;
$$;
revoke execute on function set_poll_status(uuid, poll_status, poll_status) from public, anon;
grant execute on function set_poll_status(uuid, poll_status, poll_status) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table polls            enable row level security;
alter table poll_options     enable row level security;
alter table poll_votes       enable row level security;
alter table poll_vote_checks enable row level security;
alter table poll_attempts    enable row level security;
alter table poll_exclusions  enable row level security;
alter table poll_audit_log   enable row level security;

-- polls / options: managed by admins and producers. No anon policies at all.
drop policy if exists "poll managers read polls" on polls;
create policy "poll managers read polls" on polls for select to authenticated using (can_manage_polls());
drop policy if exists "poll managers insert polls" on polls;
create policy "poll managers insert polls" on polls for insert to authenticated with check (can_manage_polls());
drop policy if exists "poll managers update polls" on polls;
create policy "poll managers update polls" on polls for update to authenticated using (can_manage_polls()) with check (can_manage_polls());
drop policy if exists "poll managers delete polls" on polls;
create policy "poll managers delete polls" on polls for delete to authenticated using (can_manage_polls());

drop policy if exists "poll managers manage options" on poll_options;
create policy "poll managers manage options" on poll_options for all to authenticated
  using (can_manage_polls()) with check (can_manage_polls());

-- poll_votes, poll_vote_checks, poll_attempts: no policies — nobody reads or
-- writes them through the API. Only the functions above touch them.

-- Producers must be able to pick the (often still unpublished) event a poll
-- belongs to. Read-only; event editing stays is_admin().
drop policy if exists "poll managers read debates" on debates;
create policy "poll managers read debates" on debates for select to authenticated using (can_manage_polls());

drop policy if exists "admins read exclusions" on poll_exclusions;
create policy "admins read exclusions" on poll_exclusions for select to authenticated using (is_admin());

drop policy if exists "poll managers read audit log" on poll_audit_log;
create policy "poll managers read audit log" on poll_audit_log for select to authenticated using (can_manage_polls());

-- Belt and braces: no direct table privileges for anon on anything poll-related.
revoke all on polls, poll_options, poll_votes, poll_vote_checks, poll_attempts,
              poll_exclusions, poll_audit_log from anon;
revoke all on poll_votes, poll_vote_checks, poll_attempts from authenticated;
revoke insert, update, delete on poll_exclusions, poll_audit_log from authenticated;
