-- ─────────────────────────────────────────────────────────────────────────────
-- Re-engagement email: one per student per FORTNIGHT, not one per student ever.
--
-- Amends 20260630_reengagement.sql. The original cap was a lifetime limit —
-- `unique(student_id)` on reengagement_sends plus a `not exists` clause in
-- get_lapsed_students. Twelve students have spent theirs; the eligible pool is
-- currently 0 not because nobody qualifies but because everyone who does has
-- already been contacted once, in some cases in July.
--
-- The cohort analysis of 2026-09-01 is why: 38 of 56 students answered 6+
-- questions on their first day and only 10 ever returned on a second. The
-- failure is not "drifted away, remind once" — it is a single good session
-- followed by permanent silence, which one email cannot address.
--
-- ── Two different jobs, deliberately split ──────────────────────────────────
--
--   1. THE RACE GUARD stays in the database, because only the database can
--      enforce it under concurrency. It becomes `unique (student_id, sent_on)`
--      — at most one send per student per UTC day, which is the realistic
--      double-run window for a daily cron.
--
--   2. THE CADENCE (14 days) moves to the cron. It cannot be an index: "no send
--      within the last 14 days" is a rolling window, and any bucketed
--      approximation permits two sends a day apart across a bucket boundary —
--      the exact thing the cap exists to prevent. See lib/email/cadence.ts.
--
-- This also removes the frequency cap from get_lapsed_students, so the selector
-- answers only "who is lapsed" and not "have we contacted them". That coupling
-- is what this change had to unpick, and it is recorded in
-- docs/audit/13-pwa-push-plan.md constraint 3 as the thing to avoid deepening.
-- The weekly nudge already follows the split pattern.
--
-- NOTE ON FIRST RUN: every student whose one historical send is more than 14
-- days old becomes eligible again immediately. Eleven of the twelve qualify on
-- that basis, so the first run after deploy may send a burst — subject to the
-- lapsed and minimum-attempt thresholds, which still apply.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── 1. Per-day uniqueness key ────────────────────────────────────────────────
-- A plain column rather than an expression index: `sent_at::date` depends on the
-- session TimeZone and so is not immutable, which an index requires. The cron
-- supplies this explicitly, mirroring how weekly_nudge_sends takes week_start.
alter table reengagement_sends
  add column if not exists sent_on date;

update reengagement_sends
   set sent_on = ((sent_at at time zone 'UTC')::date)
 where sent_on is null;

alter table reengagement_sends
  alter column sent_on set default ((now() at time zone 'UTC')::date);

alter table reengagement_sends
  alter column sent_on set not null;

-- ── 2. Swap the lifetime cap for the daily race guard ────────────────────────
-- Safe in either order for existing data: today there is at most one row per
-- student, so (student_id, sent_on) cannot collide.
drop index if exists reengagement_sends_student_uniq;

create unique index if not exists reengagement_sends_student_day_uniq
  on reengagement_sends (student_id, sent_on);

-- Supports the cron's "who has been contacted since <cutoff>" lookup.
create index if not exists reengagement_sends_sent_at_idx
  on reengagement_sends (sent_at desc);

-- ── 3. Selector: drop the welded-in frequency cap ────────────────────────────
-- Signature unchanged, so the existing REVOKEs continue to apply. Re-asserted
-- below anyway, since `create or replace` on an existing function keeps its ACL
-- but a fresh create (on a database where it was dropped) would not.
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
    -- The `not exists (reengagement_sends …)` frequency cap that used to sit
    -- here is GONE. It is now the cron's job — see the header, and
    -- lib/email/cadence.ts for why 14 days cannot be expressed as an index.
  group by s.id, u.email, s.display_name
  having count(*) >= p_min_attempts
     and max(pa.attempted_at) < now() - make_interval(days => p_days);
$$;

revoke all on function get_lapsed_students(int, int) from public;
revoke all on function get_lapsed_students(int, int) from anon, authenticated;

commit;
