-- ─────────────────────────────────────────────────────────────────────────────
-- Take EXECUTE on every SECURITY DEFINER function away from `anon`.
--
-- ── The rule this file corrects ────────────────────────────────────────────
--
-- 20260915_class_grant_execute_grant.sql found `student_has_class_grant()`
-- callable by `anon`, and wrote down the lesson:
--
--     "grant execute ... to authenticated is not a restriction. Revoke from
--      PUBLIC in the same statement block, always."
--
-- That lesson is HALF RIGHT, and the remedy it prescribes does not work. The
-- migration ran `revoke execute ... from public` and declared the class closed.
-- Probed on 2026-10-27, over six weeks later, `anon` could still execute it.
--
-- WHY. Supabase's default privileges for the `public` schema grant EXECUTE on
-- new functions DIRECTLY to `anon`, `authenticated` and `service_role` — not
-- through PUBLIC. `information_schema.routine_privileges` for
-- student_has_class_grant lists exactly those four grantees plus `postgres`,
-- and PUBLIC is absent: the 20260915 revoke succeeded and removed nothing,
-- because the grant it targeted had never been the one in force.
--
-- So revoking from PUBLIC is necessary (a bare CREATE FUNCTION does grant to
-- PUBLIC) and NOT SUFFICIENT on this platform. The grant that actually exposes
-- a function here is the direct one to `anon`.
--
-- 20261027_teacher_grant_arm.sql repeated the ineffective line an hour before
-- this was found, because it followed the documented pattern. Both headers are
-- corrected in the same change as this.
--
-- ── What was actually exposed, measured rather than assumed ────────────────
--
-- All seven definer functions were callable by `anon` on 2026-10-27. Five of
-- them leak nothing, because their bodies gate on auth.uid(), which is NULL for
-- `anon`:
--
--   student_has_class_grant()            -> constant false
--   get_teacher_student_mastery()        -> 0 rows
--   get_class_skill_mastery(_class_id)   -> 0 rows, gated on teacher_owns_class
--   get_class_exam_sessions(_class_id)   -> 0 rows, same
--   get_class_exam_paper(_class_id, …)   -> same
--
-- TWO DO LEAK, because they take the uid as a PARAMETER and so never consult
-- auth.uid() at all. Probed against real ids, as `anon`, both answered
-- truthfully:
--
--   is_active_class_member(_class_id, _uid)  -> true
--   teacher_owns_class(_class_id, _uid)      -> true
--
-- That is an oracle: anyone may ask "is this student in that class" and "does
-- this teacher own that class" without an account. It is bounded by needing two
-- uuids, which are 122 bits each and appear in no public surface, so the
-- practical exposure is small — but it is a real answer about real people given
-- to an unauthenticated caller, which is not something to leave because it is
-- inconvenient to reach.
--
-- ── Why REVOKE, and not a guard inside the functions ───────────────────────
--
-- The tidier-looking fix is to make each function refuse to answer about anyone
-- but its caller (`_uid = auth.uid()`). It works for teacher_owns_class, whose
-- eight call sites all pass auth.uid(). It BREAKS is_active_class_member, which
-- is called from inside other definer bodies with other people's ids —
-- `(_class_id, pa.student_id)` and `(_class_id, es.student_id)` — where asking
-- about another person is the entire point and the caller has already been
-- authorised. A guard there would silently empty the teacher analytics.
--
-- So: revoke the grant, keep the bodies.
--
-- ── Why this does not break anonymous reads ────────────────────────────────
--
-- Both helpers are referenced by RLS policies, two of them `to public`, so a
-- role evaluating such a policy needs EXECUTE. If an anonymous visitor queried
-- `classes` directly, this change would turn "0 rows" into a permission error.
--
-- Checked before writing: no anonymous path does. Every browser-side query
-- against classes / class_memberships / class_skill_coverage is on an
-- authenticated teacher page or in lib/classes.ts, and the one public lookup a
-- logged-out visitor can reach, app/api/classes/lookup, holds the SERVICE ROLE
-- and never touches the policy. `authenticated` and `service_role` keep EXECUTE
-- throughout.
--
-- ── What this does NOT close, stated so it is not mistaken for closed ──────
--
-- A SIGNED-IN user can still call both helpers about anybody. Revoking `anon`
-- removes the unauthenticated surface, not the oracle itself. Closing it
-- properly means splitting each helper into an internal one for definer bodies
-- and a guarded one for clients, which is a behavioural change to functions
-- that sit inside live RLS policies and belongs in its own reviewed migration —
-- the same judgement 20260915 made, now with the evidence it lacked.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent — REVOKE on a
-- privilege already absent is a no-op.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

revoke execute on function public.student_has_class_grant()                     from anon;
revoke execute on function public.get_teacher_student_mastery()                 from anon;
revoke execute on function public.get_class_skill_mastery(uuid)                 from anon;
revoke execute on function public.get_class_exam_sessions(uuid)                 from anon;
revoke execute on function public.get_class_exam_paper(uuid, uuid)              from anon;
revoke execute on function public.is_active_class_member(uuid, uuid)            from anon;
revoke execute on function public.teacher_owns_class(uuid, uuid)                from anon;

-- Belt and braces, and cheap: PUBLIC is not the grant in force here, but a
-- future bare CREATE FUNCTION would make it one.
revoke execute on function public.student_has_class_grant()                     from public;
revoke execute on function public.get_teacher_student_mastery()                 from public;
revoke execute on function public.get_class_skill_mastery(uuid)                 from public;
revoke execute on function public.get_class_exam_sessions(uuid)                 from public;
revoke execute on function public.get_class_exam_paper(uuid, uuid)              from public;
revoke execute on function public.is_active_class_member(uuid, uuid)            from public;
revoke execute on function public.teacher_owns_class(uuid, uuid)                from public;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 The SQL Editor is SUPERUSER and bypasses grants, so calling a function
-- here proves nothing. Two checks that do mean something:
--
-- 1. `anon` no longer holds EXECUTE on any of them. EXPECT no rows:
--
--      select routine_name, grantee
--      from information_schema.routine_privileges
--      where routine_schema = 'public'
--        and grantee = 'anon'
--        and routine_name in (
--          'student_has_class_grant', 'get_teacher_student_mastery',
--          'get_class_skill_mastery', 'get_class_exam_sessions',
--          'get_class_exam_paper', 'is_active_class_member',
--          'teacher_owns_class');
--
-- 2. `authenticated` still does, or every teacher dashboard breaks.
--    EXPECT seven rows from the same query with grantee = 'authenticated'.
--
-- 3. From the application side, re-run the probe that found this: calling each
--    as the anon key should now return 42501 rather than an answer. A teacher
--    dashboard should be unchanged.
