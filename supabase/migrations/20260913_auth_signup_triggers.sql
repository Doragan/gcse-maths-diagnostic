-- ─────────────────────────────────────────────────────────────────────────────
-- Capture the auth.users signup triggers in version control.
--
-- WHY: two triggers on auth.users decide who becomes a teacher and who becomes
-- a student, and neither existed anywhere in this repo — they were created in
-- the Supabase SQL Editor and lived only in the database. That is the same
-- exposure as audit finding S1 (docs/audit/00-plan-of-attack.md): DDL that no
-- review, diff or deploy ever sees.
--
-- It has already cost us once. Reading 20260710_handle_new_user_oauth.sql alone
-- shows handle_new_user returning early for students, which reads as "nothing
-- creates a student row on email signup". The truth is that a SECOND trigger
-- owns that path, and nothing in the repo said so.
--
--   on_auth_user_created -> handle_new_user     (teacher rows, email signups)
--   on_student_created   -> handle_new_student  (student rows, role='student')
--
-- Introspected from the live database 2026-09-13:
--   select t.tgname, p.proname from pg_trigger t
--     join pg_proc p on p.oid = t.tgfoid
--    where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;
--
-- This file is a NO-OP to apply: the body below is exactly what is already
-- running. handle_new_user is deliberately NOT redefined here — its definition
-- already lives in 20260710_handle_new_user_oauth.sql, and a second copy would
-- be a second source of truth free to drift from the first.
--
-- ── Two things worth knowing, neither changed here ──────────────────────────
--
-- 1. The student row is created at SIGNUP, before the email is confirmed. So an
--    abandoned confirmation still leaves a students row: measured 2026-09-13,
--    4 of 69 students were unconfirmed and none of them had ever practised.
--    Any cohort rate computed over students alone is diluted by those rows
--    (by ~1pp at that volume — real, but small).
--
-- 2. confirmed_13 is hardcoded true, here and in /api/auth/provision for the
--    Google path. It records "the 13+ gate was passed" — the form and the
--    provision route each block submission without it — NOT an independent
--    capture of consent. Reading the column as evidence of consent would be
--    a mistake; the evidence is that the row exists at all.
--
-- ── Follow-up NOT applied here (deliberate) ─────────────────────────────────
-- handle_new_student is SECURITY DEFINER with no pinned search_path, unlike
-- get_weekly_goal_candidates (`set search_path = public`). Pinning it would be
-- a behavioural change to a live account-creation path, so it belongs in its
-- own reviewed change rather than hiding inside a file whose whole point is to
-- record what is already there.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Verbatim from pg_get_functiondef(), 2026-09-13. Do not "tidy" it: the value
-- of this file is that it matches production exactly.
CREATE OR REPLACE FUNCTION public.handle_new_student()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if new.raw_user_meta_data->>'role' = 'student' then
    insert into public.students (id, display_name, year_group, confirmed_13)
    values (
      new.id,
      new.raw_user_meta_data->>'display_name',
      nullif(new.raw_user_meta_data->>'year_group', ''),
      true
    );
  end if;
  return new;
end;
$function$;

-- ── TRIGGER OBJECTS ────────────────────────────────────────────────────────
-- From pg_get_triggerdef(), 2026-09-13. Both are AFTER INSERT FOR EACH ROW on
-- auth.users. The only change from the captured text is CREATE OR REPLACE
-- TRIGGER (pg 14+) in place of a drop-then-create pair: it swaps the
-- definition atomically, so re-applying this file never leaves account
-- creation without a trigger, not even for the width of a transaction.
--
-- They are mutually exclusive by the role check inside each function, so the
-- firing order (alphabetical by trigger name, hence on_auth_user_created
-- first) carries no behaviour. Recorded because it is the kind of thing that
-- stops being true quietly.
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE OR REPLACE TRIGGER on_student_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_student();

commit;
