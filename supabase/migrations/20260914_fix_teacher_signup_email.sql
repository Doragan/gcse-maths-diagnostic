-- ─────────────────────────────────────────────────────────────────────────────
-- Fix teacher signup: handle_new_user must supply teachers.email.
--
-- 🔴 TEACHER SIGNUP IS BROKEN, AND HAS BEEN. This is not hardening.
--
-- `teachers.email` is `not null` with NO default (introspected 2026-09-14, and
-- now recorded in 20260914_capture_students_teachers.sql). handle_new_user
-- inserts ONLY the id:
--
--     insert into public.teachers (id) values (new.id) on conflict (id) do nothing;
--
-- That is a not-null violation (23502). Because the function runs in an AFTER
-- INSERT trigger on auth.users, the exception aborts the whole signup
-- transaction, so GoTrue returns an error and NO ACCOUNT IS CREATED. Every
-- email teacher signup has been failing at the database.
--
-- ── Why nothing rescued it ──────────────────────────────────────────────────
-- Introspection of triggers on public.students and public.teachers, 2026-09-14,
-- returned ZERO rows. Nothing populates the column, and there is no default.
-- This was the open question in 20260914_capture_students_teachers.sql; the
-- answer is case (b), the bad one.
--
-- ── The evidence lines up exactly ───────────────────────────────────────────
--   * 2 teacher accounts exist, created 31 March and 4 April 2026, NONE since.
--   * Over the 90 days to 2026-09-13: 3 teacher signup starts, 0 completions.
--   * Students are unaffected and kept signing up throughout (69 of them):
--     handle_new_student supplies every not-null column on `students`, and the
--     Google student path in /api/auth/provision does too.
--
-- The two surviving teacher rows predate the current function body, which was
-- introspected as `(id)`-only on 2026-07-10. Whether the column gained NOT NULL
-- later or the body lost the email, the break is somewhere after early April and
-- nothing has created a teacher account since.
--
-- This also revises the diagnosis in PR #74. That PR found no teacher CTA opened
-- a signup form, which was true and worth fixing, but it is now clear the form
-- could not have succeeded anyway. The funnel reads zero for two independent
-- reasons, and both had to be fixed.
--
-- ── The fix ─────────────────────────────────────────────────────────────────
-- Supply the column. `new.email` is available on the trigger row, and the insert
-- is already gated to `provider = 'email'`, so GoTrue guarantees it is present.
-- The Google path is fixed in the same commit, in app/api/auth/provision.
--
-- Making `email` nullable was the alternative and is rejected: nothing in the
-- app reads teachers.email today, but it is the only human-identifying column on
-- the table and the natural handle for attaching a teacher to a school
-- (docs/audit/20 §4). Keep the invariant, fill the column.
--
-- ── ⚠ ORDER MATTERS — this supersedes TWO earlier files ─────────────────────
-- handle_new_user's body has three prior homes, and re-applying ANY of them
-- afterwards silently reverts this fix and re-breaks signup:
--
--   20260710_handle_new_user_oauth.sql   — added the provider gate
--   20260913_auth_signup_triggers.sql    — verbatim snapshot (PR #71)
--   20260913_pin_definer_search_path.sql — added the search_path pin (PR #72)
--
-- Filename order already puts this one last. The note is here because these are
-- applied by hand. `set search_path = public` is carried forward deliberately so
-- that applying this does not undo PR #72.
--
-- ── VERIFICATION IS MANUAL AND REQUIRED ─────────────────────────────────────
-- CI never executes SQL, so a green build proves nothing here. After applying,
-- create ONE throwaway teacher account by email at /auth?mode=signup and confirm
-- a public.teachers row appears with the email populated. Do the Google path too
-- if you can: it is fixed by the code change, not by this file, so it needs the
-- deploy rather than the apply.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Body is verbatim from 20260913_pin_definer_search_path.sql — the current
-- definition — with ONE change: the insert now supplies `email`.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  if new.raw_user_meta_data->>'role' = 'student' then
    return new;
  end if;
  -- Only auto-create a teacher row for EMAIL signups. Google (OAuth) teachers
  -- are provisioned explicitly via /api/auth/provision after /auth/callback, so
  -- that a Google *student* (who also arrives with no 'role') is not mis-filed
  -- as a teacher.
  --
  -- `email` is NOT NULL on public.teachers and has no default. Omitting it here
  -- raised 23502 inside this AFTER INSERT trigger, which aborted the signup —
  -- see this file's header. new.email is guaranteed present on the branch that
  -- reaches here, because it is gated to provider = 'email'.
  if new.raw_app_meta_data->>'provider' = 'email' then
    insert into public.teachers (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$function$;

commit;

-- ── Confirm the shape before trusting a signup test ──────────────────────────
-- A rolled-back probe proves the constraint is now satisfiable. Substitute the
-- uuid of an existing STUDENT: they have no teachers row, so the primary key
-- does not collide, and their auth.users row satisfies the foreign key.
--
--   begin;
--     -- EXPECT 23502 — the bug, still reproducible directly
--     insert into public.teachers (id) values ('<STUDENT_UUID>');
--   rollback;
--
--   begin;
--     -- EXPECT SUCCESS — what the fixed trigger now does
--     insert into public.teachers (id, email) values ('<STUDENT_UUID>', 'x@example.com');
--   rollback;
--
-- Run these as the SQL Editor superuser deliberately. It bypasses RLS and
-- grants, which is what you want: the question is about constraints, and a
-- superuser does NOT bypass those. Both roll back, so nothing is written.
