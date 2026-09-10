-- ندوات — Row Level Security
--
-- Model:
--  * Public (anon) may read only PUBLISHED debates, their participants, the
--    people involved, and site_content. Nothing else is readable by anon.
--  * registrations / subscribers / consent_events have NO anon or
--    authenticated-user policies — they are written and read exclusively by
--    the server using the service role key (which bypasses RLS).
--  * Admin/editor users (admin_users) get full read/write on content tables.

alter table people              enable row level security;
alter table debates             enable row level security;
alter table debate_participants enable row level security;
alter table registrations       enable row level security;
alter table subscribers         enable row level security;
alter table consent_events      enable row level security;
alter table admin_users         enable row level security;
alter table site_content        enable row level security;

-- --- people -----------------------------------------------------------------
create policy "people are publicly readable"
  on people for select
  to anon, authenticated
  using (true);

create policy "admins manage people"
  on people for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --- debates ---------------------------------------------------------------
create policy "published debates are publicly readable"
  on debates for select
  to anon, authenticated
  using (is_published = true and status <> 'draft');

create policy "admins read all debates"
  on debates for select
  to authenticated
  using (is_admin());

create policy "admins manage debates"
  on debates for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --- debate_participants -------------------------------------------------
create policy "participants of published debates are readable"
  on debate_participants for select
  to anon, authenticated
  using (
    exists (
      select 1 from debates d
      where d.id = debate_participants.debate_id
        and d.is_published = true
        and d.status <> 'draft'
    )
  );

create policy "admins manage participants"
  on debate_participants for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --- registrations (admin read only; writes via service role) ----------
create policy "admins read registrations"
  on registrations for select
  to authenticated
  using (is_admin());

create policy "admins update registrations"
  on registrations for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --- subscribers (admin read only; writes via service role) ------------
create policy "admins read subscribers"
  on subscribers for select
  to authenticated
  using (is_admin());

create policy "admins update subscribers"
  on subscribers for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --- consent_events (admin read only) ---------------------------------
create policy "admins read consent events"
  on consent_events for select
  to authenticated
  using (is_admin());

-- --- admin_users -----------------------------------------------------
create policy "user sees own admin row"
  on admin_users for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

create policy "admins manage admin users"
  on admin_users for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- --- site_content --------------------------------------------------
create policy "site content is publicly readable"
  on site_content for select
  to anon, authenticated
  using (true);

create policy "admins manage site content"
  on site_content for all
  to authenticated
  using (is_admin())
  with check (is_admin());
