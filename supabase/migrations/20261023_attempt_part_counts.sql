-- ─────────────────────────────────────────────────────────────────────────────
-- Partial credit on a multi-part question.
--
-- A multi-part question writes ONE row to assignment_attempts and one to
-- session_attempts, on the final part, with `correct` = every part right. So a
-- pupil who got two parts of three scored the same as one who got none: the
-- teacher's column could not tell them apart, although the PUPIL was told "you
-- got 2 of 3 parts correct" on their own screen.
--
-- (Skill mastery was never affected. practice_attempts already gets one row per
-- PART, carrying that part's own skill_ids, so mastery has always moved
-- independently per skill. This is only about what a teacher reads.)
--
-- ── Why two columns and not a change to `correct` ──────────────────────────
--
-- `correct` is NOT NULL and load-bearing: aggregateProgress derives completion
-- and the score from it, in six branches, for both surfaces. Turning it into a
-- number would mean changing every one of those at the same time as the write
-- path, on live tables.
--
-- These are additive and nullable instead. NULL means "not a multi-part
-- question", which is every row written before today and every single-part
-- answer after it. `correct` keeps meaning exactly what it meant, so completion
-- does not move.
--
-- ⚠ THE GRANTS DIFFER BETWEEN THE TWO TABLES, and only one of them is a trap.
--
--   * assignment_attempts has Supabase's default TABLE-level grants, so new
--     columns are insertable the moment they exist. Nothing to do.
--   * session_attempts was locked down in 20261020 with a COLUMN-level grant:
--     `grant insert (session_id, participant_id, question_id, correct)`. A
--     column-level grant names an exact set, so a new column is NOT covered —
--     and a pupil's insert naming it would be refused. In a live lesson that is
--     thirty answers silently rejected. The grant below is the fix, and it is
--     the reason this migration must be applied BEFORE the code that writes
--     these columns is deployed.
--
-- The pupil can of course put whatever they like in these two columns, as they
-- already can in `correct` — a session roster is self-asserted by design. The
-- CHECK keeps the values arithmetically sane, which is all it is for.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent. Apply BEFORE
-- deploying.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

alter table public.assignment_attempts
  add column if not exists parts_correct integer,
  add column if not exists parts_total   integer;

alter table public.session_attempts
  add column if not exists parts_correct integer,
  add column if not exists parts_total   integer;

-- Both set or both null, and the pair has to make sense as a fraction.
-- `add constraint if not exists` does not exist in Postgres, hence the guard.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'assignment_attempts_parts_sane') then
    alter table public.assignment_attempts
      add constraint assignment_attempts_parts_sane check (
        (parts_correct is null and parts_total is null)
        or (parts_total > 0 and parts_correct between 0 and parts_total)
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'session_attempts_parts_sane') then
    alter table public.session_attempts
      add constraint session_attempts_parts_sane check (
        (parts_correct is null and parts_total is null)
        or (parts_total > 0 and parts_correct between 0 and parts_total)
      );
  end if;
end $$;

-- The trap, closed. Adds to the existing column grant rather than replacing it:
-- a plain GRANT INSERT (col) is additive, so the four columns from 20261020
-- stay granted.
grant insert (parts_correct, parts_total) on public.session_attempts to anon, authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 The SQL Editor is SUPERUSER and bypasses grants, so inserting here proves
-- nothing about whether a pupil can. The catalog query in 2 is what answers it.
--
-- 1. Both columns on both tables, nullable. EXPECT 4 rows, is_nullable = YES:
--
--      select table_name, column_name, is_nullable, data_type
--      from information_schema.columns
--      where table_schema = 'public'
--        and table_name in ('assignment_attempts','session_attempts')
--        and column_name in ('parts_correct','parts_total')
--      order by table_name, column_name;
--
-- 2. THE IMPORTANT ONE. session_attempts must now grant INSERT on SIX columns
--    to anon — the original four plus these two. Fewer than six means a pupil
--    answering a multi-part question in a lesson gets refused:
--
--      select grantee, column_name, privilege_type
--      from information_schema.column_privileges
--      where table_schema = 'public' and table_name = 'session_attempts'
--        and grantee in ('anon','authenticated') and privilege_type = 'INSERT'
--      order by grantee, column_name;
--
-- 3. The CHECK rejects nonsense. EXPECT every one of these to FAIL:
--
--      begin;
--        -- more correct than there are parts
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_correct, parts_total)
--        select id, null, null, true, 4, 3 from class_sessions limit 1;
--        -- one set without the other
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_correct)
--        select id, null, null, true, 1 from class_sessions limit 1;
--        -- zero parts
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_correct, parts_total)
--        select id, null, null, true, 0, 0 from class_sessions limit 1;
--      rollback;
--
-- 4. Existing rows are untouched and still readable. EXPECT the full count and
--    0 with either column set:
--
--      select count(*) as total,
--             count(parts_total) as with_parts
--      from session_attempts;
