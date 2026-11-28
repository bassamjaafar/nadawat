-- Rollback for 0007_about.sql. Removes the About page sections and all team
-- groups, members and memberships (their photos stay in storage).
drop function if exists public_about_team();
drop table if exists team_memberships;
drop table if exists team_members;
drop function if exists team_members_consent_stamp();
drop table if exists team_groups;
drop table if exists about_sections;
