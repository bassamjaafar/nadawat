-- ندوات — 0006: «سؤال ندوات» refused-submission counts + readable audit log
--
-- Requires 0005_polls.sql. Additive only. Rollback: 0006_poll_refusals.rollback.sql.
--
-- poll_refusals counts submissions the server turned away (failed Cloudflare
-- check, too many attempts), by reason and 10-minute window. It stores no
-- browser or network code and no answer — only a reason and a number — so
-- it says how often ordinary visitors are refused without identifying anyone.

create table if not exists poll_refusals (
  poll_id      uuid not null references polls (id) on delete cascade,
  window_start timestamptz not null,
  reason       text not null check (reason in (
                 'no_token',           -- the Cloudflare box hadn't finished / no token sent
                 'invalid_token',      -- Cloudflare rejected the token (forged or malformed)
                 'expired_or_reused',  -- token older than 5 minutes, or already used
                 'hostname_mismatch',  -- token solved on another site
                 'server_config',      -- our secret key is wrong: affects every visitor
                 'rate_limited',       -- more than 10 submissions in 10 minutes from one browser
                 'other')),
  n            integer not null default 0 check (n >= 0),
  primary key (poll_id, window_start, reason)
);

alter table poll_refusals enable row level security;
revoke all on poll_refusals from anon, authenticated;

-- Server only (service-role client), like cast_vote().
create or replace function note_poll_refusal(p_poll uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r text := case when p_reason in ('no_token', 'invalid_token', 'expired_or_reused',
                   'hostname_mismatch', 'server_config', 'rate_limited') then p_reason else 'other' end;
begin
  insert into poll_refusals as x (poll_id, window_start, reason, n)
  values (p_poll, date_bin('10 minutes', now(), timestamptz '2000-01-01'), r, 1)
  on conflict (poll_id, window_start, reason) do update set n = x.n + 1;
end;
$$;
revoke execute on function note_poll_refusal(uuid, text) from public, anon, authenticated;

-- Poll managers: totals by reason, and recent refusals.
create or replace function poll_refusal_summary(p_poll uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not can_manage_polls() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total', coalesce((select sum(n) from poll_refusals where poll_id = p_poll), 0),
    -- The current 10-minute window and the one before it (counts are stored
    -- per window, so "recent" covers the last 10–20 minutes).
    'recent', coalesce((select sum(n) from poll_refusals
                        where poll_id = p_poll
                          and window_start >= date_bin('10 minutes', now(), timestamptz '2000-01-01') - interval '10 minutes'), 0),
    'by_reason', coalesce((select jsonb_object_agg(reason, s) from (
                   select reason, sum(n) s from poll_refusals where poll_id = p_poll group by reason) t),
                 '{}'::jsonb)
  );
end;
$$;
revoke execute on function poll_refusal_summary(uuid) from public, anon;
grant execute on function poll_refusal_summary(uuid) to authenticated;

-- The audit log with each actor's display name. admin_users is readable by
-- full admins only, so producers would otherwise see bare user ids.
create or replace function poll_audit_entries(p_poll uuid, p_limit integer default 200)
returns table (at timestamptz, action text, detail jsonb, actor_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not can_manage_polls() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select l.at, l.action, l.detail, coalesce(a.display_name, case when l.actor is null then null else '—' end)
    from poll_audit_log l
    left join admin_users a on a.user_id = l.actor
    where l.poll_id = p_poll
    order by l.at desc, l.id desc
    limit least(greatest(p_limit, 1), 1000);
end;
$$;
revoke execute on function poll_audit_entries(uuid, integer) from public, anon;
grant execute on function poll_audit_entries(uuid, integer) to authenticated;
