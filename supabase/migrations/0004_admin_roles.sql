-- ندوات — 0004: admin roles («سؤال ندوات» producer access)
--
-- Until now is_admin() was true for ANY row in admin_users, whatever its
-- role. Adding a limited role on top of that would silently grant it full
-- access to subscribers, participation requests and everything else, so
-- this migration narrows is_admin() to role = 'admin' first.
--
-- Roles:
--   admin       full access (unchanged for every existing account — all
--               existing rows already have role 'admin')
--   polls_only  may operate «سؤال ندوات» polls and see their statistics;
--               nothing else
--
-- Safe to run more than once. Rollback: 0004_admin_roles.rollback.sql.

-- Defensive: the column defaulted to 'admin' and no other value is in use,
-- but normalise any stray value to 'admin' so the constraint below can be
-- added without locking anyone out.
update admin_users set role = 'admin' where role is null or role not in ('admin', 'polls_only');

alter table admin_users drop constraint if exists admin_users_role_check;
alter table admin_users
  add constraint admin_users_role_check check (role in ('admin', 'polls_only'));

-- Full administrators only. Every existing RLS policy (subscribers,
-- registrations, consent_events, people, debates, admin_users, …) keeps
-- calling is_admin(), so a polls_only account can read none of them, even
-- directly through the Supabase API, and cannot change its own role.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Full administrators and poll producers.
create or replace function can_manage_polls()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users
    where user_id = auth.uid() and role in ('admin', 'polls_only')
  );
$$;

revoke execute on function can_manage_polls() from public, anon;
grant execute on function can_manage_polls() to authenticated;
