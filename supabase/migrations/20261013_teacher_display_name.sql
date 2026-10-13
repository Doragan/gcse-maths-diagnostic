-- ─────────────────────────────────────────────────────────────────────────────
-- A teacher's name, so an invitation email can say who sent it.
--
-- WHY THIS EXISTS. Class invitations currently open with "Your teacher has
-- invited you…", because there was no name to use: `teachers` carried only
-- (id, email, created_at, paid_until, free_assessments_used, is_admin). The one
-- name available was the login EMAIL, and putting that in front of a whole class
-- discloses an adult's personal address — for a sole tutor, usually their own
-- gmail — to thirty children, on their behalf and without being asked. So the
-- email said "Your teacher" and this column is the fix.
--
-- It matters more than politeness: the sender's name is the main thing that
-- makes a message to a child look legitimate rather than like phishing.
--
-- ── NULLABLE, and it has to be ──────────────────────────────────────────────
-- Every teacher that exists predates this column, so there is nothing to
-- backfill from — see the WHY above; the only candidate was the address we are
-- deliberately not using. `invitationEmail()` already falls back to "Your
-- teacher" when the name is null, and that fallback is covered by tests, so an
-- empty column changes nothing until a teacher fills it in.
--
-- ── NOT A FORM FIELD AT TEACHER SIGNUP, deliberately ────────────────────────
-- The signup form keeps it OPTIONAL. Teacher signup conversion is measured and
-- the funnel is small; adding a required field to it to improve the wording of
-- an email is the wrong trade. Teachers who skip it set it later on /account,
-- which is also the only route available to the teachers who already exist.
--
-- ── WHY NO RLS POLICY IS ADDED HERE ─────────────────────────────────────────
-- ⚠ Writes go through a SERVICE-ROLE ROUTE (app/api/account/display-name),
-- which is the same shape as every other teacher write in this codebase
-- (createClass, rotate-code, members). An UPDATE policy on `teachers` was
-- considered and rejected: this is the table where a policy once let an account
-- grant itself `is_admin` (20260914_close_teachers_self_admin.sql), and letting
-- a client write ANY column of it again — even one as harmless as a name —
-- means getting column grants exactly right, where a column-level REVOKE is a
-- silent no-op and the table-level grant is what actually decides. The route
-- updates one named column and cannot be talked into touching another.
--
-- So: no new policy, no new grant, and `teachers` stays closed to clients.
--
-- Apply via the Supabase SQL Editor. Idempotent. Apply BEFORE deploying.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Free text. What a teacher's pupils actually call them ("Mr Okafor", "Miss R",
-- "Chris"), which is the only thing that makes the email recognisable — so no
-- enforced structure. Length is capped in the route rather than here, because a
-- constraint violation surfaces as a 500 while the route can say what is wrong.
alter table public.teachers
  add column if not exists display_name text;

-- Carry a name given at signup through to the row.
--
-- Unchanged from 20260914_fix_teacher_signup_email.sql except for the one new
-- column: students still return early, and only the email provider inserts a
-- teachers row (OAuth signups are handled by handle_new_user_oauth, which makes
-- students).
--
-- nullif(trim(...), '') so a form submitted with the optional field left blank
-- stores NULL rather than an empty string — "no name" has exactly one
-- representation, and the email's fallback tests for null.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $function$
begin
  if new.raw_user_meta_data->>'role' = 'student' then
    return new;
  end if;
  if new.raw_app_meta_data->>'provider' = 'email' then
    insert into public.teachers (id, email, display_name)
    values (
      new.id,
      new.email,
      nullif(trim(new.raw_user_meta_data->>'display_name'), '')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$function$;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 1. The column exists and is nullable. EXPECT one row, is_nullable = YES:
--
--      select column_name, data_type, is_nullable
--      from information_schema.columns
--      where table_schema = 'public' and table_name = 'teachers'
--        and column_name = 'display_name';
--
-- 2. Existing teachers are untouched and all NULL — nothing was invented for
--    them. EXPECT total = the number of teachers, named = 0 before anyone has
--    used /account:
--
--      select count(*) as total, count(display_name) as named
--      from public.teachers;
--
-- 3. ⚠ CLIENTS STILL CANNOT WRITE THIS TABLE. The SQL Editor is SUPERUSER and
--    bypasses RLS and grants, so updating a row here proves nothing. Check the
--    grant instead — EXPECT 0 rows, i.e. no UPDATE for client roles:
--
--      select grantee, privilege_type
--      from information_schema.table_privileges
--      where table_schema = 'public' and table_name = 'teachers'
--        and grantee in ('anon', 'authenticated')
--        and privilege_type = 'UPDATE';
--
--    If that returns anything, this migration has NOT done what its header
--    claims and the route is not the only write path.
--
-- 4. The trigger still compiles and still copies the name. Rolled back, so it
--    leaves nothing behind:
--
--      begin;
--        -- A teacher signup carries no 'role', so it must insert a teachers row.
--        -- (Done through auth.users because that is what the trigger fires on.)
--        select nullif(trim('  Mr Okafor  '), '') as stored;   -- EXPECT 'Mr Okafor'
--        select nullif(trim('   '), '')           as stored;   -- EXPECT NULL
--      rollback;
