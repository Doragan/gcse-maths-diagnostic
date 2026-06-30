-- ─────────────────────────────────────────────────────────────────────────────
-- Re-engagement email pipeline (Phase 0 retention).
--
-- Emails a student account-holder who OPTED IN (auth user_metadata.email_reminders
-- = true), practised for real, but hasn't returned in N days. Two pieces:
--
--   1. reengagement_sends — one row per email we send. Doubles as
--      • the frequency cap (a student with a row here is never re-sent), and
--      • the opaque-token target for the click / unsubscribe links (the row id is
--        an unguessable uuid, so the email links carry NO student id or PII).
--      Service-role only: RLS is enabled with NO client policies, so anon /
--      authenticated callers can neither read nor write it. The cron and the
--      email link routes use the service role (bypasses RLS).
--
--   2. get_lapsed_students(p_days, p_min_attempts) — SECURITY DEFINER selector
--      that joins students + auth.users + practice_attempts and returns ONLY the
--      accounts that should be emailed now. Keeps the filtering in Postgres (no
--      pulling every user into the function) and keeps auth.users access off the
--      client entirely. EXECUTE is revoked from anon/authenticated — only the
--      service role (used by /api/cron/reengagement) may call it.
--
-- Consent lives in auth.users.raw_user_meta_data->>'email_reminders' (opt-in
-- only). It is written at signup, toggled from the dashboard, and flipped to
-- false by the one-click unsubscribe link. Nothing here touches the students
-- table (whose client UPDATE is revoked — see 20260611_lock_sensitive_columns).
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── reengagement_sends ────────────────────────────────────────────────────────
create table if not exists reengagement_sends (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references students(id) on delete cascade,
  sent_at     timestamptz not null default now(),
  clicked_at  timestamptz
);

-- One re-engagement email per student (this phase). Enforced in SQL so a double
-- cron run can't double-send.
create unique index if not exists reengagement_sends_student_uniq
  on reengagement_sends (student_id);

alter table reengagement_sends enable row level security;
-- No policies, on purpose: this table is service-role only. Clients (anon /
-- authenticated) get zero rows and cannot insert/update — there is nothing for a
-- student to do here directly.

-- ── get_lapsed_students(days, min_attempts) ───────────────────────────────────
create or replace function get_lapsed_students(p_days int, p_min_attempts int)
returns table (
  student_id     uuid,
  email          text,
  display_name   text,
  total_attempts bigint,
  skill_ids      text[],
  last_attempt   timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    s.id                                            as student_id,
    u.email::text                                   as email,
    coalesce(s.display_name, '')                    as display_name,
    count(*)                                        as total_attempts,
    array(
      select distinct unnest(pa2.skill_ids)
      from practice_attempts pa2
      where pa2.student_id = s.id
    )                                               as skill_ids,
    max(pa.attempted_at)                            as last_attempt
  from students s
  join auth.users u        on u.id = s.id
  join practice_attempts pa on pa.student_id = s.id
  where u.email_confirmed_at is not null
    -- Opt-in only: never email someone who didn't actively turn reminders on.
    and coalesce((u.raw_user_meta_data ->> 'email_reminders')::boolean, false) = true
    -- Frequency cap: skip anyone we've already emailed.
    and not exists (select 1 from reengagement_sends rs where rs.student_id = s.id)
  group by s.id, u.email, s.display_name
  having count(*) >= p_min_attempts
     and max(pa.attempted_at) < now() - make_interval(days => p_days);
$$;

-- Lock the selector down to the service role (the cron). It exposes auth.users
-- email + metadata, so anon / authenticated must NOT be able to call it.
revoke all on function get_lapsed_students(int, int) from public;
revoke all on function get_lapsed_students(int, int) from anon, authenticated;

commit;
