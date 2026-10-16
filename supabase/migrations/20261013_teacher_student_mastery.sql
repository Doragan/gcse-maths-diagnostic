-- ─────────────────────────────────────────────────────────────────────────────
-- A teacher-keyed mastery read, for the 1:1 tutor view.
--
-- Design: docs/audit/26-one-to-one-tutor-dashboard.md §4.1.
--
-- ── Why this exists when get_class_skill_mastery already does ───────────────
--
-- Every teacher-facing read in the schema takes a _class_id. That is right for
-- a class of thirty and wrong for a tutor, whose students sit in one class each
-- (§1 of the design: coverage is keyed (class_id, skill_id), so a tutor's
-- students MUST be in separate classes or they share a taught-list and every
-- mastery denominator is quietly wrong).
--
-- The consequence is that "show me all my students" costs one round trip per
-- class and has no single query behind it. This is that query. It is a
-- different KEY on the same data, not a wider door: it returns exactly the rows
-- get_class_skill_mastery would return for each of the caller's classes in
-- turn, and nothing that function would not.
--
-- ── Why EXISTS rather than a join ──────────────────────────────────────────
--
-- A student can belong to more than one of a teacher's classes — uniqueness on
-- class_memberships is (class_id, student_id), not student_id. Joining
-- memberships to attempts would therefore emit each attempt once PER CLASS the
-- student shares with the teacher, and the mastery engine counts rows: a
-- student in two of your classes would appear to have attempted everything
-- twice, and `4 of the last 5 correct` would be computed over a duplicated
-- window. EXISTS tests the relationship without multiplying the rows, so no
-- DISTINCT is needed and none is used.
--
-- ── Security ───────────────────────────────────────────────────────────────
--
-- SECURITY DEFINER, because practice_attempts denies the client roles; the
-- caller's identity comes from auth.uid() inside the function, never from a
-- parameter. It takes NO ARGUMENTS deliberately: a _teacher_id parameter would
-- make it an oracle over other teachers' rosters, the same reasoning as
-- student_has_class_grant() in 20260915_schools_and_class_grant.sql.
--
-- ⚠ REVOKE FROM PUBLIC IS NOT OPTIONAL, and `grant execute ... to
-- authenticated` does NOT restrict anything on its own. PostgreSQL grants
-- EXECUTE on every new function to PUBLIC automatically, so a grant beside it
-- adds a second grant and leaves the first in place. This was found the hard
-- way on a deployed function in 20260915_class_grant_execute_grant.sql, which
-- answered `anon` rather than refusing it. search_path is pinned for the same
-- family of reasons (PR #72).
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- Apply BEFORE deploying: the tutor view calls this by name and a missing
-- function is a 404 from PostgREST, not a graceful empty list.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

CREATE OR REPLACE FUNCTION public.get_teacher_student_mastery()
RETURNS TABLE (
  student_id   uuid,
  skill_ids    text[],
  correct      boolean,
  attempted_at timestamptz,
  kind         text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT pa.student_id, pa.skill_ids, pa.correct, pa.attempted_at, pa.kind
  FROM practice_attempts pa
  WHERE EXISTS (
    SELECT 1
    FROM class_memberships m
    JOIN classes c ON c.id = m.class_id
    WHERE m.student_id = pa.student_id
      AND m.status     = 'active'
      AND c.teacher_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_teacher_student_mastery() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_teacher_student_mastery() TO authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- The SQL Editor is SUPERUSER and bypasses RLS and grants, so calling the
-- function here proves nothing about who may call it. Two checks that do mean
-- something:
--
-- 1. PUBLIC no longer holds EXECUTE. EXPECT no row with grantee 'PUBLIC':
--
--      select grantee, privilege_type
--      from information_schema.routine_privileges
--      where routine_schema = 'public'
--        and routine_name   = 'get_teacher_student_mastery';
--
-- 2. It answers as the TEACHER, not as whoever ran it. Impersonate, and expect
--    rows for that teacher's students and none for anybody else's:
--
--      begin;
--        set local role authenticated;
--        set local request.jwt.claims = '{"sub":"<TEACHER_UUID>"}';
--        select count(*), count(distinct student_id)
--        from public.get_teacher_student_mastery();
--      rollback;
--
--    Then the same with a STUDENT's uuid as sub — EXPECT 0 rows, because a
--    student owns no classes.
