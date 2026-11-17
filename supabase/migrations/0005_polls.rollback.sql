-- ندوات — rollback for 0005_polls.sql
--
-- Removes «سؤال ندوات» entirely, INCLUDING every poll, vote and audit row.
-- Not needed for a code rollback (the tables are harmless when unused);
-- only run this to remove the feature from the database for good.

drop policy if exists "poll managers read debates" on debates;

drop function if exists set_poll_status(uuid, poll_status, poll_status);
drop function if exists revert_exclusion(uuid);
drop function if exists exclude_votes(uuid, text, timestamptz, timestamptz, text[], text);
drop function if exists poll_review_network(uuid, text);
drop function if exists poll_monitor(uuid);
drop function if exists poll_results(uuid);
drop function if exists has_voted(uuid, text);
drop function if exists cast_vote(uuid, uuid, text, text, text, integer);
drop function if exists note_vote_attempt(uuid, text, integer);
drop function if exists public_poll_state(text);

drop table if exists poll_audit_log   cascade;
drop table if exists poll_attempts    cascade;
drop table if exists poll_vote_checks cascade;
drop table if exists poll_votes       cascade;
drop table if exists poll_exclusions  cascade;
drop table if exists poll_options     cascade;
drop table if exists polls            cascade;

drop function if exists poll_options_guard();
drop function if exists polls_audit_insert();
drop function if exists polls_guard();
drop function if exists poll_audit(uuid, text, jsonb);
drop function if exists poll_effective_status(polls);
drop type if exists poll_status;
