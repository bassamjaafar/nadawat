-- ندوات — full database setup (schema + RLS + demo seed)
--
-- Safe to run repeatedly: the reset block below drops everything this script
-- owns before recreating it. Intended for the Supabase SQL Editor while there
-- is no production data. For tracked migrations use `supabase db push` with the
-- files in supabase/migrations/ instead.

begin;

-- ---------------------------------------------------------------------------
-- Reset (idempotent)
-- ---------------------------------------------------------------------------
drop table if exists consent_events      cascade;
drop table if exists registrations       cascade;
drop table if exists debate_participants cascade;
drop table if exists subscribers         cascade;
drop table if exists debates             cascade;
drop table if exists people              cascade;
drop table if exists site_content        cascade;
drop table if exists admin_users         cascade;
drop function if exists is_admin()        cascade;
drop function if exists set_updated_at()  cascade;
drop type if exists debate_status     cascade;
drop type if exists subscriber_status cascade;
drop type if exists participant_role  cascade;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type debate_status as enum ('draft', 'upcoming', 'completed', 'archived');
create type subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');
create type participant_role as enum ('speaker', 'moderator');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create function set_updated_at()
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
  summary_ar         text,
  description_ar      text,
  status             debate_status not null default 'draft',
  is_published       boolean not null default false,
  starts_at          timestamptz,
  timezone           text not null default 'Asia/Damascus',
  location_ar        text,
  registration_open  boolean not null default false,
  broadcast_url      text,
  youtube_url        text,
  youtube_video_id   text,
  cover_image_url    text,
  moderator_id       uuid references people (id) on delete set null,
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
  position_label_ar   text,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  unique (debate_id, person_id)
);
create index debate_participants_debate_idx on debate_participants (debate_id);

-- ---------------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------------
create table registrations (
  id                    uuid primary key default gen_random_uuid(),
  debate_id             uuid not null references debates (id) on delete cascade,
  first_name            text not null,
  last_name             text not null,
  email                 text not null,
  country               text not null,
  notify_future_events  boolean not null default false,
  consent_at            timestamptz,
  access_token          uuid not null default gen_random_uuid(),
  confirmation_sent_at  timestamptz,
  ip_hash               text,
  user_agent            text,
  created_at            timestamptz not null default now(),
  unique (debate_id, email)
);
create index registrations_debate_idx on registrations (debate_id);

-- ---------------------------------------------------------------------------
-- subscribers  (double opt-in)
-- ---------------------------------------------------------------------------
create table subscribers (
  id                    uuid primary key default gen_random_uuid(),
  first_name            text not null,
  last_name             text not null,
  email                 text not null unique,
  country               text not null,
  status                subscriber_status not null default 'pending',
  consent_text          text not null,
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
  subject_type  text not null,
  subject_id    uuid not null,
  email         text not null,
  action        text not null,
  consent_text  text,
  ip_hash       text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index consent_events_subject_idx on consent_events (subject_type, subject_id);
create index consent_events_email_idx on consent_events (email);

-- ---------------------------------------------------------------------------
-- admin_users  +  is_admin()
-- ---------------------------------------------------------------------------
create table admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null default 'admin',
  display_name text,
  created_at   timestamptz not null default now()
);

create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- site_content  (small custom CMS)
-- ---------------------------------------------------------------------------
create table site_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);
create trigger site_content_updated_at before update on site_content
  for each row execute function set_updated_at();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table people              enable row level security;
alter table debates             enable row level security;
alter table debate_participants enable row level security;
alter table registrations       enable row level security;
alter table subscribers         enable row level security;
alter table consent_events      enable row level security;
alter table admin_users         enable row level security;
alter table site_content        enable row level security;

create policy "people are publicly readable"
  on people for select to anon, authenticated using (true);
create policy "admins manage people"
  on people for all to authenticated using (is_admin()) with check (is_admin());

create policy "published debates are publicly readable"
  on debates for select to anon, authenticated
  using (is_published = true and status <> 'draft');
create policy "admins read all debates"
  on debates for select to authenticated using (is_admin());
create policy "admins manage debates"
  on debates for all to authenticated using (is_admin()) with check (is_admin());

create policy "participants of published debates are readable"
  on debate_participants for select to anon, authenticated
  using (exists (
    select 1 from debates d
    where d.id = debate_participants.debate_id
      and d.is_published = true and d.status <> 'draft'
  ));
create policy "admins manage participants"
  on debate_participants for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "admins read registrations"
  on registrations for select to authenticated using (is_admin());
create policy "admins update registrations"
  on registrations for update to authenticated
  using (is_admin()) with check (is_admin());

create policy "admins read subscribers"
  on subscribers for select to authenticated using (is_admin());
create policy "admins update subscribers"
  on subscribers for update to authenticated
  using (is_admin()) with check (is_admin());

create policy "admins read consent events"
  on consent_events for select to authenticated using (is_admin());

create policy "user sees own admin row"
  on admin_users for select to authenticated
  using (user_id = auth.uid() or is_admin());
create policy "admins manage admin users"
  on admin_users for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "site content is publicly readable"
  on site_content for select to anon, authenticated using (true);
create policy "admins manage site content"
  on site_content for all to authenticated
  using (is_admin()) with check (is_admin());

-- ===========================================================================
-- Demo seed  (fictional names & topics; Blender open-movie video IDs)
-- ===========================================================================
insert into people (id, name_ar, title_ar, bio_ar, slug) values
  ('11111111-1111-1111-1111-111111111101', 'د. ليلى المصري', 'أستاذة اقتصاد سياسي',
   'تُدرّس الاقتصاد السياسي وتكتب عن سياسات المال العام وإعادة الإعمار. لها أبحاث في تمويل التنمية وحوكمة الموارد.', 'leila-almasri'),
  ('11111111-1111-1111-1111-111111111102', 'سامر الحلبي', 'كاتب وباحث في الشأن العام',
   'باحث مستقل يهتمّ بالإصلاح المؤسسي والسياسات الاجتماعية، وله مقالات دورية في الصحافة العربية.', 'samer-alhalabi'),
  ('11111111-1111-1111-1111-111111111103', 'نور العطّار', 'محامية وباحثة في الحوكمة المحلية',
   'تعمل على قضايا الإدارة المحلية والمشاركة المدنية، وشاركت في مراجعات تشريعية متعلّقة باللامركزية.', 'nour-alattar'),
  ('11111111-1111-1111-1111-111111111104', 'رامي دلعو', 'صحفي اقتصادي',
   'يغطّي الاقتصاد والمال العام منذ أكثر من عشر سنوات، ويهتمّ بشفافية العقود العامة.', 'rami-dalou'),
  ('11111111-1111-1111-1111-111111111105', 'هالة الشامي', 'باحثة في علم الاجتماع السياسي',
   'تركّز أبحاثها على التعليم والهوية والذاكرة الجماعية في مجتمعات ما بعد النزاع.', 'hala-alshami'),
  ('11111111-1111-1111-1111-111111111106', 'كنان بدوي', 'مهندس ومنظّم مجتمعي',
   'عمل في مشاريع خدمات محلية وإعادة تأهيل بنى تحتية، ويكتب عن إدارة المدن.', 'kanan-badawi'),
  ('11111111-1111-1111-1111-111111111107', 'د. فادي حوراني', 'أستاذ قانون دستوري',
   'متخصّص في القانون الدستوري المقارن وترتيبات الحكم في المراحل الانتقالية.', 'fadi-hourani'),
  ('11111111-1111-1111-1111-111111111108', 'ريم قاسيون', 'صحفية ومحاوِرة',
   'قدّمت برامج حوارية عن الشأن العام، وتهتمّ بأدب الاختلاف في النقاش.', 'reem-qasioun');

insert into debates (id, slug, title_ar, summary_ar, description_ar, status, is_published,
                     starts_at, timezone, location_ar, registration_open, youtube_url,
                     youtube_video_id, moderator_id) values
  ('22222222-2222-2222-2222-222222222201',
   'al-lamarkaziyya-al-idariyya',
   'اللامركزية الإدارية في سوريا: مدخل لإعادة البناء أم طريق إلى التفكّك؟',
   'نقاش هادئ حول توزيع الصلاحيات بين المركز والأقاليم: ما الذي يعزّز الخدمات والمساءلة، وما الذي قد يفتح باب الانقسام؟',
   E'تطرح المرحلة الانتقالية سؤالاً قديماً بصيغة جديدة: كيف تُدار الدولة؟ يرى فريق أنّ توسيع صلاحيات الإدارات المحلية يقرّب القرار من الناس ويحسّن الخدمات ويعيد الثقة، بينما يرى فريق آخر أنّ مركزية انتقالية منضبطة ضرورية لإعادة بناء المؤسسات وضمان المساواة بين المناطق.\n\nتتناول الندوة الحوكمة المالية، والعدالة بين الأقاليم، وتسلسل الخطوات الزمني.',
   'upcoming', true,
   '2026-10-02T18:00:00+03:00', 'Asia/Damascus', 'بثّ مباشر عبر الإنترنت', true,
   null, null, '11111111-1111-1111-1111-111111111107'),
  ('22222222-2222-2222-2222-222222222202',
   'iadat-al-iemar-man-yumawwil',
   'إعادة الإعمار: من يموّل، ومن يقرّر الأولويات؟',
   'بين التمويل الخارجي والموارد الداخلية، ومن يملك حقّ ترتيب الأولويات: السكن، البنية التحتية، أم الاقتصاد المنتج؟',
   E'تقدَّر كلفة إعادة الإعمار بعشرات المليارات، ومصدر التمويل يحدّد إلى حدّ بعيد من يرسم الأولويات.\n\nناقش الضيفان خيارات التمويل وشروطها، ودور القطاع الخاص، وآليات الشفافية في العقود العامة، والموازنة بين الإغاثة العاجلة والاستثمار طويل الأمد.',
   'completed', true,
   '2026-06-12T18:00:00+03:00', 'Asia/Damascus', null, false,
   'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'aqz-KE-bpKQ',
   '11111111-1111-1111-1111-111111111108'),
  ('22222222-2222-2222-2222-222222222203',
   'al-taleem-fi-marhala-intiqaliyya',
   'التعليم في مرحلة انتقالية: منهج موحّد أم مناهج متعدّدة؟',
   'كيف نوازن بين وحدة الهوية الوطنية وتنوّع المجتمع، وبين المركزية التربوية ومرونة المدارس؟',
   E'المناهج الدراسية ليست مسألة تربوية فقط، بل سؤال عن السردية الوطنية والذاكرة المشتركة.\n\nتناولت الندوة حدود التوحيد، ومساحة التنوّع المحلي، وتدريس التاريخ القريب، ودور المعلّم.',
   'completed', true,
   '2026-03-20T18:00:00+03:00', 'Asia/Damascus', null, false,
   'https://www.youtube.com/watch?v=eRsGyueVLvQ', 'eRsGyueVLvQ',
   '11111111-1111-1111-1111-111111111108'),
  ('22222222-2222-2222-2222-222222222204',
   'al-iilaam-al-aam-khidma-am-tawjih',
   'الإعلام العام: خدمة عمومية مستقلّة أم أداة توجيه؟',
   'ما الذي يجعل مؤسسة إعلام عامة جديرة بالثقة: التمويل، الحوكمة، أم مسافتها من السلطة؟',
   E'بحثت الندوة في نماذج الإعلام العام حول العالم، وشروط استقلاليته، وآليات تمويله وحوكمته، والفرق بين إعلام الدولة وإعلام الخدمة العامة.',
   'archived', true,
   '2025-11-15T18:00:00+03:00', 'Asia/Damascus', null, false,
   'https://www.youtube.com/watch?v=R6MlUcmOul8', 'R6MlUcmOul8',
   '11111111-1111-1111-1111-111111111107');

insert into debate_participants (debate_id, person_id, role, position_label_ar, sort_order) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'speaker', 'مع توسيع الصلاحيات المحلية', 0),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111106', 'speaker', 'مع مركزية انتقالية منضبطة', 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'speaker', 'أولوية للاقتصاد المنتج', 0),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111104', 'speaker', 'أولوية للسكن والبنية التحتية', 1),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111105', 'speaker', 'مع منهج وطني موحّد', 0),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'speaker', 'مع مرونة ومناهج متعدّدة', 1),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104', 'speaker', 'مع نموذج خدمة عامة مستقلّ', 0),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'speaker', 'مع إشراف عام في المرحلة الانتقالية', 1);

insert into site_content (key, value) values
  ('contact.email', '"events@nadawat.org"'::jsonb),
  ('home.institutional_intro',
   '"ندوات تنظّم ندواتٍ دوريّة بين أصحاب مواقف مختلفة حول قضايا سوريا، وتحفظها أرشيفًا عامًّا مفتوحًا."'::jsonb);

-- Homepage override (left unset = fully automatic: soonest "upcoming" debate,
-- else the latest completed/archived one). To pin a specific debate to the
-- homepage instead, set/replace this row with its slug:
--
--   insert into site_content (key, value) values
--     ('home.featured_debate_slug', '"al-lamarkaziyya-al-idariyya"'::jsonb)
--   on conflict (key) do update set value = excluded.value;
--
-- Delete the row (or set the value to null) to go back to automatic.

-- ---------------------------------------------------------------------------
-- Watch-live links + "شارك في الحوار" participation form
-- (mirrors supabase/migrations/0003_participation.sql)
-- ---------------------------------------------------------------------------
alter table debates add column youtube_live_url  text;
alter table debates add column facebook_live_url text;

alter table registrations add column full_name text;
alter table registrations alter column first_name drop not null;
alter table registrations alter column last_name  drop not null;
alter table registrations add column participation_type text
  check (participation_type in ('written', 'live'));
alter table registrations add column question text;
alter table registrations add column phone text;
alter table registrations add column ack_limited_selection boolean not null default false;
alter table registrations add column ack_time_limit       boolean not null default false;
alter table registrations add column consent_recording_at timestamptz;
alter table registrations add column status text not null default 'new'
  check (status in ('new', 'selected', 'not_selected', 'participated'));
alter table registrations add column admin_note text;
alter table registrations drop constraint registrations_debate_id_email_key;

commit;
