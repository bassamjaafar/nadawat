-- ندوات — STAGING ONLY synthetic data for «سؤال ندوات» testing.
--
-- Run in the nadawat-staging project after migrations 0001–0005.
-- NEVER run this against production. Everything here is invented: no real
-- people, subscribers or participation requests.

begin;

insert into debates (slug, title_ar, summary_ar, status, is_published, starts_at, timezone, youtube_video_id)
values
  ('staging-past-event', 'ندوة تجريبية سابقة (بيئة الاختبار)', 'نصّ تجريبي لأغراض الاختبار فقط.',
   'completed', true, now() - interval '30 days', 'Asia/Damascus', null),
  ('staging-poll-event', 'ندوة تجريبية لسؤال ندوات (بيئة الاختبار)', 'نصّ تجريبي لأغراض الاختبار فقط.',
   'upcoming', true, now() + interval '7 days', 'Asia/Damascus', null)
on conflict (slug) do nothing;

insert into polls (slug, question_ar, debate_id)
select 'staging-test-poll', 'هل تحسّن الوضع المعيشي في سوريا منذ سقوط نظام الأسد؟', d.id
from debates d where d.slug = 'staging-poll-event'
on conflict (slug) do nothing;

insert into poll_options (poll_id, label_ar, sort_order)
select p.id, o.label, o.ord
from polls p
cross join (values ('تحسّن', 1), ('لم يتغيّر بشكل ملحوظ', 2), ('تراجع', 3)) as o(label, ord)
where p.slug = 'staging-test-poll'
  and not exists (select 1 from poll_options x where x.poll_id = p.id);

-- Open it straight away for testing (the admin pages will do this normally).
select set_config('nadawat.poll_status_change', 'on', true);
update polls
   set status = 'open', opens_at = now(), opened_at = now()
 where slug = 'staging-test-poll' and status = 'draft';

commit;
