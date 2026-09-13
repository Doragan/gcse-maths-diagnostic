-- ─────────────────────────────────────────────────────────────────────────────
-- Weekly goal gains a SPREAD requirement: N questions across M separate days.
--
-- Why: WEEKLY_GOAL is 10 and SESSION_LENGTH (the measured median sitting) is
-- also 10, so a typical engaged first session met the whole week's goal in ONE
-- sitting. The card read green until Monday and this selector — "practised this
-- week, still short of the goal" — had nothing to say to exactly the students
-- about to lapse. Measured over 56 students: 38 answered 6+ questions on their
-- first day and only 10 ever came back on a second.
-- See docs/audit/18-retention-diagnosis.md §3.
--
-- Two changes to the selector:
--
--   1. SHORT OF THE GOAL now means short of the COUNT *or* of the SPREAD. A
--      student on 12 answers across one day is short, and is precisely the
--      person this email exists for; the old range test (>= min and < goal)
--      excluded them entirely.
--
--   2. It RETURNS the day count, so the email can say "one more day" rather
--      than "0 questions to go", which would read as done.
--
-- Deployment order does not matter. This adds a FIVE-argument overload and
-- leaves the four-argument function in place, so the running code keeps working
-- until the new route deploys, and the new route works the moment this is
-- applied. The old one can be dropped once the new route is live:
--
--   drop function if exists get_weekly_goal_candidates(timestamptz, int, int, int);
--
-- The week itself is still defined in ONE place — lib/skills/weeklyGoal.ts
-- supplies p_week_start — and a "day" here is a UTC calendar day, matching
-- mondayOf/startOfDay in that module, so a day and a week cannot disagree about
-- which side of Monday an attempt falls on.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

create or replace function get_weekly_goal_candidates(
  p_week_start   timestamptz,
  p_goal         int,
  p_min_progress int,
  p_active_days  int,
  p_min_days     int
)
returns table (
  student_id   uuid,
  email        text,
  display_name text,
  answered     int,
  days         int
)
language sql
security definer
set search_path = public
as $$
  select
    s.id                                                          as student_id,
    u.email::text                                                 as email,
    coalesce(s.display_name, '')                                  as display_name,
    count(*) filter (where pa.attempted_at >= p_week_start)::int  as answered,
    count(distinct (pa.attempted_at at time zone 'utc')::date)
      filter (where pa.attempted_at >= p_week_start)::int          as days
  from students s
  join auth.users u         on u.id = s.id
  join practice_attempts pa on pa.student_id = s.id
  where u.email_confirmed_at is not null
    -- Opt-in only: never email someone who didn't actively turn reminders on.
    and coalesce((u.raw_user_meta_data ->> 'email_reminders')::boolean, false) = true
  group by s.id, u.email, s.display_name
  having
    -- Far enough in to be worth a nudge. Below p_min_progress this is nagging.
        count(*) filter (where pa.attempted_at >= p_week_start) >= p_min_progress
    -- Short of EITHER half of the goal. The spread test is what reaches the
    -- student who did everything in one sitting.
    and (
          count(*) filter (where pa.attempted_at >= p_week_start) < p_goal
       or count(distinct (pa.attempted_at at time zone 'utc')::date)
            filter (where pa.attempted_at >= p_week_start) < p_min_days
    )
    -- ACTIVE: the mirror of get_lapsed_students' staleness test. Same day count,
    -- passed by the same cron, so the cohorts cannot overlap or leave a gap.
    and max(pa.attempted_at) >= now() - make_interval(days => p_active_days);
$$;

-- Lock the selector to the service role (the cron). It exposes auth.users email
-- + metadata, so anon / authenticated must NOT be able to call it.
revoke all on function get_weekly_goal_candidates(timestamptz, int, int, int, int) from public;
revoke all on function get_weekly_goal_candidates(timestamptz, int, int, int, int) from anon, authenticated;

commit;
