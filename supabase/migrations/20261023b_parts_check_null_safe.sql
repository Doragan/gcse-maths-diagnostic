-- ─────────────────────────────────────────────────────────────────────────────
-- Make the parts CHECK actually reject a half-written pair.
--
-- 20261023_attempt_part_counts.sql added this, and its own comment says "both
-- set or both null":
--
--     check (
--       (parts_correct is null and parts_total is null)
--       or (parts_total > 0 and parts_correct between 0 and parts_total)
--     )
--
-- It does not do that. With parts_correct = 1 and parts_total = NULL:
--
--   * the first disjunct is FALSE (parts_correct is not null);
--   * the second is `NULL > 0 AND ...`, which is NULL, not false;
--   * FALSE OR NULL is NULL — and a CHECK constraint only REJECTS on false.
--     NULL passes.
--
-- So the row went in. Found by actually attempting the insert as the anon role
-- after the migration was applied; the constraint had been read, reviewed and
-- believed, and it is a shape that reads correct right up until it is tried.
--
-- ── What it cost, which is nothing yet ──────────────────────────────────────
--
-- Nothing in production has a half pair: the write path sets both columns
-- together, and aggregateProgress already requires both to be numbers before
-- counting them (with a test for exactly that). The damage was to the
-- guarantee, not the data — the schema promised something it did not enforce,
-- which is the failure this project keeps writing post-mortems about.
--
-- ── The null-safe form ─────────────────────────────────────────────────────
--
--   (parts_correct is null) = (parts_total is null)
--
-- compares two booleans, so it is never NULL, and the range test is guarded
-- behind `parts_total is null or ...` so it only runs when both are present.
--
-- The UPDATE first is not optional: ALTER TABLE ... ADD CONSTRAINT validates
-- existing rows, so one half pair anywhere would fail the whole migration.
-- Nulling both columns is the right repair — half a pair carries no meaning,
-- and NULL is exactly what "not a multi-part answer" means here.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

update public.assignment_attempts
   set parts_correct = null, parts_total = null
 where (parts_correct is null) <> (parts_total is null);

update public.session_attempts
   set parts_correct = null, parts_total = null
 where (parts_correct is null) <> (parts_total is null);

alter table public.assignment_attempts
  drop constraint if exists assignment_attempts_parts_sane;
alter table public.assignment_attempts
  add constraint assignment_attempts_parts_sane check (
    (parts_correct is null) = (parts_total is null)
    and (
      parts_total is null
      or (parts_total > 0 and parts_correct between 0 and parts_total)
    )
  );

alter table public.session_attempts
  drop constraint if exists session_attempts_parts_sane;
alter table public.session_attempts
  add constraint session_attempts_parts_sane check (
    (parts_correct is null) = (parts_total is null)
    and (
      parts_total is null
      or (parts_total > 0 and parts_correct between 0 and parts_total)
    )
  );

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 1. No half pairs survive anywhere. EXPECT 0 and 0:
--
--      select count(*) from public.assignment_attempts
--       where (parts_correct is null) <> (parts_total is null);
--      select count(*) from public.session_attempts
--       where (parts_correct is null) <> (parts_total is null);
--
-- 2. The four cases behave. EXPECT the first two to SUCCEED and the last three
--    to FAIL — the third is the one the old constraint let through:
--
--      begin;
--        -- both null: a single-part answer
--        insert into session_attempts (session_id, participant_id, question_id, correct)
--        select s.id, p.id, q.id, true
--        from class_sessions s, session_participants p, questions q
--        where p.session_id = s.id and q.is_published limit 1;
--        -- both set and sane
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_correct, parts_total)
--        select s.id, p.id, q.id, false, 2, 3
--        from class_sessions s, session_participants p, questions q
--        where p.session_id = s.id and q.is_published limit 1;
--        -- HALF A PAIR — the bug this migration fixes
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_correct)
--        select s.id, p.id, q.id, true, 1
--        from class_sessions s, session_participants p, questions q
--        where p.session_id = s.id and q.is_published limit 1;
--        -- the other half
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_total)
--        select s.id, p.id, q.id, true, 3
--        from class_sessions s, session_participants p, questions q
--        where p.session_id = s.id and q.is_published limit 1;
--        -- more correct than there are parts
--        insert into session_attempts (session_id, participant_id, question_id, correct, parts_correct, parts_total)
--        select s.id, p.id, q.id, true, 4, 3
--        from class_sessions s, session_participants p, questions q
--        where p.session_id = s.id and q.is_published limit 1;
--      rollback;
--
--    🚨 Needs an open session with a participant to have something to point at,
--    and the SQL Editor is superuser so this tests the CONSTRAINT only, never
--    the grants. The grants were proven separately by inserting as anon.
