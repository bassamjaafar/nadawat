-- ندوات — rollback for 0004_admin_roles.sql
--
-- Restores the original is_admin() (true for any admin_users row). Run
-- 0005_polls.rollback.sql first if polls were installed.

-- Producer accounts must go first: under the old is_admin() any row in
-- admin_users has full access.
delete from admin_users where role = 'polls_only';

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

drop function if exists can_manage_polls();
alter table admin_users drop constraint if exists admin_users_role_check;
