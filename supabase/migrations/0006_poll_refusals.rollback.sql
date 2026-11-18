-- Rollback for 0006_poll_refusals.sql. Run before 0005's rollback.
drop function if exists poll_audit_entries(uuid, integer);
drop function if exists poll_refusal_summary(uuid);
drop function if exists note_poll_refusal(uuid, text);
drop table if exists poll_refusals;
