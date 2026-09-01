-- ─────────────────────────────────────────────────────────────────────────────
-- Weekly-goal nudge email (retention, sequel to 20260630_reengagement.sql).
--
-- Emails an ACTIVE student — practised this week, still short of the weekly
-- goal — once, on the day the cron runs. The re-engagement email is its
-- opposite number (LAPSED students, idle 4+ days).
--
-- The two cohorts are DISJOINT BY CONSTRUCTION, not by a cross-table check:
-- this selector requires a recent attempt (p_active_days), the lapsed selector
-- requires the absence of one. Both day counts derive from one env var, and the
-- cron passes a value one day TIGHTER here — the crons run at different times,
-- each measuring back from its own start, so equal thresholds would leave a
-- few hours in which a student qualifies as both. See nudgeActiveDays in
-- lib/email/weeklyNudge.ts.
--
-- Two pieces:
--
--   1. weekly_nudge_sends — one row per email sent, keyed (student_id, week_start).
--      Doubles as the frequency cap (unique index ⇒ one nudge per student per
--      week, even if the cron double-runs) and as the opaque-token target for
--      the click / unsubscribe links, so those URLs carry no student id or PII.
--      Service-role only: RLS on, no policies. Deliberately a SEPARATE table
--      from reengagement_sends — the two channels must not be able to suppress
--      each other, and reengagement_sends is unique on student_id alone
--      (one lapsed email ever), which is the wrong shape for a weekly cadence.
--
--   2. get_weekly_goal_candidates(...) — SECURITY DEFINER selector, service-role
--      only, mirroring get_lapsed_students.
--
--      NOTE the deliberate difference: this function does NOT filter out students
--      already emailed. get_lapsed_students welds its frequency cap into the
--      selector, which couples "who is lapsed" to "have we contacted them" and
--      means a second channel would have to fork the query. Here the two stay
--      separate — the selector answers only "who is short of their goal", and the
--      cron applies the cap by reading weekly_nudge_sends for the week. A future
--      push notification or in-app prompt can reuse this function unchanged.
--
-- Consent is the SAME opt-in as the re-engagement email
-- (auth.users.raw_user_meta_data->>'email_reminders'), and the same one-click
-- unsubscribe turns both off. One switch labelled "practice reminders": a
-- granular preference centre would make opting out harder, which is the wrong
-- direction for a service used by children.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── weekly_nudge_sends ────────────────────────────────────────────────────────
create table if not exists weekly_nudge_sends (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references students(id) on delete cascade,
  -- The Monday (UTC) of the week the nudge was about. Supplied by the app so
  -- there is ONE definition of a week — lib/skills/weeklyGoal.ts — rather than a
  -- second one here that could drift from the dashboard's.
  week_start  date        not null,
  sent_at     timestamptz not null default now(),
  clicked_at  timestamptz
);

create unique index if not exists weekly_nudge_sends_student_week_uniq
  on weekly_nudge_sends (student_id, week_start);

alter table weekly_nudge_sends enable row level security;
-- No policies, on purpose: service-role only, exactly like reengagement_sends.

-- ── get_weekly_goal_candidates(week_start, goal, min_progress, active_days) ───
create or replace function get_weekly_goal_candidates(
  p_week_start   timestamptz,
  p_goal         int,
  p_min_progress int,
  p_active_days  int
)
returns table (
  student_id   uuid,
  email        text,
  display_name text,
  answered     int
)
language sql
security definer
set search_path = public
as $$
  select
    s.id                                                                as student_id,
    u.email::text                                                       as email,
    coalesce(s.display_name, '')                                        as display_name,
    count(*) filter (where pa.attempted_at >= p_week_start)::int        as answered
  from students s
  join auth.users u         on u.id = s.id
  join practice_attempts pa on pa.student_id = s.id
  where u.email_confirmed_at is not null
    -- Opt-in only: never email someone who didn't actively turn reminders on.
    and coalesce((u.raw_user_meta_data ->> 'email_reminders')::boolean, false) = true
  group by s.id, u.email, s.display_name
  having
    -- Short of the goal, but far enough in to be worth a nudge. Below
    -- p_min_progress this is nagging rather than nudging; at or above the goal
    -- there is nothing to say.
        count(*) filter (where pa.attempted_at >= p_week_start) >= p_min_progress
    and count(*) filter (where pa.attempted_at >= p_week_start) <  p_goal
    -- ACTIVE: the mirror of get_lapsed_students' staleness test. Same day count,
    -- passed by the same cron, so the cohorts cannot overlap or leave a gap.
    and max(pa.attempted_at) >= now() - make_interval(days => p_active_days);
$$;

-- Lock the selector to the service role (the cron). It exposes auth.users email
-- + metadata, so anon / authenticated must NOT be able to call it.
revoke all on function get_weekly_goal_candidates(timestamptz, int, int, int) from public;
revoke all on function get_weekly_goal_candidates(timestamptz, int, int, int) from anon, authenticated;

commit;
