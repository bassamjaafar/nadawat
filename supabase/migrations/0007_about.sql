-- ندوات — 0007: About page sections and «فريق ندوات»
--
-- Requires 0004_admin_roles.sql (is_admin). Additive only: no existing table
-- is changed. Rollback: 0007_about.rollback.sql.
--
-- Model:
--  * about_sections     the 8 fixed sections of /about (title, text, shown or
--                       hidden). The public can read shown sections only;
--                       hidden ones (e.g. a founding story still being
--                       written) are invisible to the API, not just the page.
--  * team_groups        organisational groups (name, description, order,
--                       shown / hidden / archived).
--  * team_members       one profile per person: public fields plus internal
--                       status and publication consent.
--  * team_memberships   person ↔ group, with that membership's own dates.
--
-- The three team tables are never readable by the public through the API.
-- The public page gets its data from public_about_team(), which returns only
-- published members of shown groups, and only their public fields — never
-- dates, consent or drafts. Every write is limited to full administrators.

-- ---------------------------------------------------------------------------
-- about_sections
-- ---------------------------------------------------------------------------
create table if not exists about_sections (
  key            text primary key
                 check (key in ('intro', 'origin', 'principles', 'team', 'how', 'editorial', 'funding', 'join')),
  title_ar       text not null check (char_length(btrim(title_ar)) between 1 and 120),
  body_ar        text not null default '' check (char_length(body_ar) <= 8000),
  link_label_ar  text check (link_label_ar is null or char_length(link_label_ar) <= 80),
  link_url       text check (link_url is null or (char_length(link_url) <= 500 and link_url ~ '^(https://|/)')),
  is_published   boolean not null default false,
  updated_at     timestamptz not null default now()
);
drop trigger if exists about_sections_updated_at on about_sections;
create trigger about_sections_updated_at before update on about_sections
  for each row execute function set_updated_at();

alter table about_sections enable row level security;

drop policy if exists "published about sections are publicly readable" on about_sections;
create policy "published about sections are publicly readable"
  on about_sections for select
  to anon, authenticated
  using (is_published);

drop policy if exists "admins read all about sections" on about_sections;
create policy "admins read all about sections"
  on about_sections for select
  to authenticated
  using (is_admin());

-- Sections are a fixed set: admins may edit them, nobody may add or remove
-- them through the API (no insert/delete policy).
drop policy if exists "admins edit about sections" on about_sections;
create policy "admins edit about sections"
  on about_sections for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- team_groups
-- ---------------------------------------------------------------------------
create table if not exists team_groups (
  id              uuid primary key default gen_random_uuid(),
  name_ar         text not null check (char_length(btrim(name_ar)) between 1 and 120),
  description_ar  text not null default '' check (char_length(description_ar) <= 3000),
  sort_order      integer not null default 0,
  status          text not null default 'hidden' check (status in ('published', 'hidden', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
drop trigger if exists team_groups_updated_at on team_groups;
create trigger team_groups_updated_at before update on team_groups
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create table if not exists team_members (
  id                   uuid primary key default gen_random_uuid(),
  full_name_ar         text not null check (char_length(btrim(full_name_ar)) between 1 and 150),
  title_ar             text not null default '' check (char_length(title_ar) <= 200),
  bio_ar               text not null default '' check (char_length(bio_ar) <= 2000),
  image_url            text,
  status               text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  consent_given        boolean not null default false,
  consent_recorded_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- A profile can only be published when all four public fields are filled
  -- in and the person has agreed to publication.
  constraint team_members_publishable check (
    status <> 'published' or (
      btrim(title_ar) <> '' and btrim(bio_ar) <> ''
      and coalesce(btrim(image_url), '') <> '' and consent_given
    )
  )
);
drop trigger if exists team_members_updated_at on team_members;
create trigger team_members_updated_at before update on team_members
  for each row execute function set_updated_at();

-- The consent date is set by the database when consent is ticked, cleared
-- when it is unticked, and can't be edited directly.
create or replace function team_members_consent_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.consent_given then
    if tg_op = 'INSERT' or not old.consent_given then
      new.consent_recorded_at := now();
    else
      new.consent_recorded_at := old.consent_recorded_at;
    end if;
  else
    new.consent_recorded_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists team_members_consent on team_members;
create trigger team_members_consent before insert or update on team_members
  for each row execute function team_members_consent_stamp();

-- ---------------------------------------------------------------------------
-- team_memberships
-- ---------------------------------------------------------------------------
create table if not exists team_memberships (
  member_id   uuid not null references team_members (id) on delete cascade,
  group_id    uuid not null references team_groups (id) on delete restrict,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  primary key (member_id, group_id),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index if not exists team_memberships_group_idx on team_memberships (group_id);

-- ---------------------------------------------------------------------------
-- Access: full administrators only. The public has no access at all.
-- ---------------------------------------------------------------------------
alter table team_groups      enable row level security;
alter table team_members     enable row level security;
alter table team_memberships enable row level security;

revoke all on team_groups, team_members, team_memberships from anon;

drop policy if exists "admins manage team groups" on team_groups;
create policy "admins manage team groups"
  on team_groups for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins manage team members" on team_members;
create policy "admins manage team members"
  on team_members for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins manage team memberships" on team_memberships;
create policy "admins manage team memberships"
  on team_memberships for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- Public read: shown groups that have at least one published member, with
-- those members' public fields only. Returns a JSON array.
-- ---------------------------------------------------------------------------
create or replace function public_about_team()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(g.obj order by g.sort_order, g.name_ar), '[]'::jsonb)
  from (
    select tg.sort_order, tg.name_ar,
      jsonb_build_object(
        'id', tg.id,
        'name_ar', tg.name_ar,
        'description_ar', tg.description_ar,
        'members', (
          select jsonb_agg(jsonb_build_object(
                   'id', m.id,
                   'full_name_ar', m.full_name_ar,
                   'title_ar', m.title_ar,
                   'bio_ar', m.bio_ar,
                   'image_url', m.image_url))
          from team_memberships tm
          join team_members m on m.id = tm.member_id
          where tm.group_id = tg.id and m.status = 'published'
        )
      ) as obj
    from team_groups tg
    where tg.status = 'published'
      and exists (
        select 1 from team_memberships tm
        join team_members m on m.id = tm.member_id
        where tm.group_id = tg.id and m.status = 'published'
      )
  ) g;
$$;
revoke execute on function public_about_team() from public;
grant execute on function public_about_team() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Starting content (only added if not already there)
-- ---------------------------------------------------------------------------
insert into about_sections (key, title_ar, body_ar, is_published) values
  ('intro', $txt$عن ندوات$txt$,
   $txt$ندوات منصة سورية مستقلة وغير ربحية للحوار العام.

ننظّم لقاءات افتراضية تستضيف ضيوفًا وضيفات بآراء وخبرات وتجارب مختلفة لمناقشة القضايا السياسية والاقتصادية والاجتماعية التي تهمّ السوريات والسوريين.

نؤمن أن الاختلاف جزء طبيعي من أي مجتمع، وأن قيمة الحوار لا تكمن بالضرورة في الوصول إلى رأي واحد، بل في إتاحة المجال لعرض المواقف بوضوح، وطرح الأسئلة، وفهم وجهات النظر المختلفة.$txt$,
   true),
  ('origin', $txt$كيف بدأت ندوات؟$txt$,
   $txt$$txt$,
   false),
  ('principles', $txt$رؤيتنا ومبادئنا$txt$,
   $txt$نسعى إلى المساهمة في بناء ثقافة سورية ترى في الاختلاف فرصة للفهم والتفكير، لا سببًا للخصومة؛ وتشجّع على النقاش الجاد، والتفكير النقدي، والانفتاح على الآراء المختلفة.

لا تتبنّى ندوات موقفًا مسبقًا من القضايا التي تطرحها، وتسعى إلى توفير مساحة جادة ومنظّمة يُدار فيها الحوار باحترام، ويُمنح الضيوف/ات مجالًا عادلًا لعرض الأفكار ومناقشتها.

«نختلف باحترام» ليست شعارًا، بل قاعدة العمل. تعني أن نختلف في الرأي دون أن ننتقص من قدر المخالف/ة، وأن نستمع بنيّة الفهم لا بنيّة الردّ، وأن نقبل أنّ من نختلف معهم/ن في النقاش شركاء وشريكات في الوطن.$txt$,
   true),
  ('team', $txt$فريق ندوات$txt$,
   $txt$$txt$,
   true),
  ('how', $txt$كيف نعمل؟$txt$,
   $txt$تُعقد ندوات افتراضيًا وتُبثّ مباشرة، وفق صيغة ثابتة:
- ثلاثة ضيوف/ات من وجهات نظر متنوّعة.
- محاور/ة مستقل/ة لإدارة الحوار.
- نحو 60 دقيقة من النقاش.
- نحو 30 دقيقة لمشاركة الجمهور وأسئلته.
- «سؤال ندوات»: استطلاع رأي مجهول الهوية يرافق كل ندوة، وتُعرض نتائجه خلال البث.$txt$,
   true),
  ('editorial', $txt$السياسة التحريرية$txt$,
   $txt$تلتزم «ندوات» بالاستقلالية التحريرية والتعددية والإنصاف، وتسعى إلى توفير مساحة للحوار تستوعب اختلاف الآراء ووجهات النظر، دون تبنّي موقف سياسي أو فكري مسبق.

وتسترشد في عملها بالمبادئ التالية:
- الاستقلالية: اختيار المواضيع والضيوف/ات بعيدًا عن تأثير المصالح السياسية والمالية.
- التعددية: إتاحة المجال لوجهات نظر متنوعة ومختلفة.
- الدقة والإنصاف: الحرص على دقة المعلومات واحترام السياق والتمييز بين الرأي والمعلومة.
- إدارة الحوار: ضمان استقلالية المحاور/ة وحرية طرح الأسئلة والمساءلة، مع إتاحة فرص عادلة للضيوف/ات للتعبير عن آرائهم/ن.
- مشاركة الجمهور: إتاحة المجال للجمهور لطرح الأسئلة والتعبير عن آرائه والمساهمة في الحوار.

لا تسعى «ندوات» إلى فرض إجابات أو توجيه الجمهور نحو موقف محدد، بل إلى طرح الأسئلة وفتح المجال أمام التفكير والنقاش.$txt$,
   true),
  ('funding', $txt$الاستقلالية والتمويل$txt$,
   $txt$«ندوات» مبادرة سورية مستقلة غير ربحية، تقوم بالدرجة الأولى على العمل التطوعي ومساهمات أشخاص يؤمنون بأهمية الحوار واحترام الاختلاف.

تعتمد المبادرة في تمويلها على مساهمات فردية تُستخدم لتغطية تكاليف التشغيل والإنتاج وبدلات المشاركة.

وتحرص «ندوات» على استقلالية قراراتها التحريرية، ولا يمنح الدعم المالي أي فرد أو جهة حق التدخل في اختيار المواضيع أو الضيوف/ات أو توجيه الحوار.$txt$,
   true),
  ('join', $txt$كن/كوني جزءًا من الحوار$txt$,
   $txt$$txt$,
   false)
on conflict (key) do nothing;

-- Groups are seeded only into an empty table, so re-running never duplicates them.
insert into team_groups (name_ar, description_ar, sort_order, status)
select * from (values
  ($txt$فريق التنسيق$txt$, $txt$$txt$, 10, 'published'),
  ($txt$فريق الإنتاج والتصميم$txt$, $txt$$txt$, 20, 'published'),
  ($txt$الدائرة الاستشارية$txt$, $txt$تستعين «ندوات» بدائرة استشارية تضم مجموعة من الأشخاص الذين يؤمنون بأهمية الحوار واحترام الاختلاف، ويساهمون بخبراتهم وآرائهم وعلاقاتهم في تطوير المبادرة ودعم استمراريتها.

تشارك الدائرة في تقديم الملاحظات والمقترحات حول المواضيع والندوات، وترشيح الضيوف/ات، والمساعدة في توسيع شبكة العلاقات والوصول إلى جمهور أوسع.

المشاركة تطوعية، ولمدة ستة أشهر قابلة للتجديد بالتوافق.

وتبقى القرارات التحريرية والتنظيمية من مسؤولية فريق «ندوات»، ولا تعني المشاركة في الدائرة الاستشارية تبنّي جميع الآراء المطروحة في الندوات.$txt$, 30, 'hidden')
) as v(name_ar, description_ar, sort_order, status)
where not exists (select 1 from team_groups);
