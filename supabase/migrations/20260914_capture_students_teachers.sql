-- ─────────────────────────────────────────────────────────────────────────────
-- Capture the `students` and `teachers` table definitions in version control.
--
-- WHY: these two tables predate the migrations directory and existed ONLY in the
-- database. Every other core table can be read from git; the two that carry
-- identity, entitlement and admin rights could not. That is audit finding S1,
-- and it is the same gap PR #71 closed for the auth.users signup triggers.
--
-- It is a prerequisite for school accounts (docs/audit/20 §7 step 2): adding a
-- column to a table version control does not know about means extending
-- something no review, diff or deploy has ever seen.
--
-- Introspected from the live database on 2026-09-14:
--   information_schema.columns          (types, nullability, defaults)
--   pg_constraint / pg_get_constraintdef (keys, foreign keys, checks)
--   pg_indexes                           (indexes)
--
-- This file is a NO-OP to apply. `create table if not exists` means an existing
-- database is untouched; a fresh environment gets the real shape.
--
-- ── SCOPE: TABLE SHAPE ONLY ─────────────────────────────────────────────────
-- Three things are deliberately NOT here, because each already has a home and a
-- second copy would be a second source of truth free to drift (PR #71's rule):
--
--   * RLS policies  -> 20260611_rls_baseline.sql, as amended 2026-09-14
--   * Grants        -> 20260611_lock_sensitive_columns.sql (UPDATE) and
--                      20260914_close_teachers_self_admin.sql (INSERT)
--   * The signup triggers on auth.users -> 20260913_auth_signup_triggers.sql
--
-- ⚠ ONE THING GENUINELY NOT YET CAPTURED: triggers on public.students and
-- public.teachers THEMSELVES. The 2026-09-13 pass covered auth.users only. If
-- any exist they are still outside version control, and the open question in the
-- next section is the reason to go and look:
--
--   select c.relname, t.tgname, p.proname
--   from pg_trigger t
--   join pg_class c on c.oid = t.tgrelid
--   join pg_proc  p on p.oid = t.tgfoid
--   where c.relname in ('students','teachers') and not t.tgisinternal;
--
-- ── 🔴 OPEN CONTRADICTION: teachers.email IS NOT NULL, AND NOTHING SETS IT ───
-- `teachers.email` is `not null` with NO default. Both code paths that create a
-- teacher row supply ONLY the id:
--
--   handle_new_user (20260710_handle_new_user_oauth.sql), the email signup path:
--       insert into public.teachers (id) values (new.id) on conflict do nothing;
--
--   app/api/auth/provision/route.ts, the Google path:
--       admin.from('teachers').insert({ id: user.id })
--
-- On the schema as introspected, both must fail with 23502 (not-null violation),
-- and teacher signup would be broken on BOTH paths. The trigger one fails inside
-- an AFTER INSERT trigger on auth.users, which aborts the whole signup.
--
-- The circumstantial evidence fits: there are exactly 2 teacher accounts, created
-- 31 March and 4 April 2026, and NONE since; and the 90 days to 2026-09-13 show
-- 3 teacher signup starts and 0 completions.
--
-- Two possibilities, and they are distinguishable:
--
--   (a) A BEFORE INSERT trigger on public.teachers populates email from
--       auth.users. Then signup works, and that trigger is another uncaptured
--       database object — exactly the gap this file exists to close.
--   (b) There is no such trigger, and teacher signup has been broken since
--       whenever `email` was made not-null. Then PR #74 opens the door to a form
--       that cannot submit, and this is the real reason the funnel reads zero.
--
-- The trigger query above answers it. A rolled-back probe answers it too, and
-- tests constraints and triggers together without creating an account.
-- Substitute the uuid of an existing STUDENT (they have no teachers row, so the
-- primary key does not collide, and the foreign key to auth.users is satisfied):
--
--   begin;
--     insert into public.teachers (id) values ('<STUDENT_UUID>');
--     -- succeeds -> something fills email, case (a)
--     -- ERROR 23502 -> teacher signup is broken, case (b)
--   rollback;
--
-- Run it as the SQL Editor superuser deliberately: bypassing RLS and grants is
-- correct here, because the question is about constraints and triggers, which a
-- superuser does NOT bypass.
--
-- This file records the shape as found. It does not fix it: the fix depends on
-- which case holds, and would be a behavioural change to a live account-creation
-- path, which belongs in its own reviewed migration.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── students ─────────────────────────────────────────────────────────────────
-- Column order, types, nullability and defaults verbatim from
-- information_schema.columns, 2026-09-14. Do not "tidy" them: the value of this
-- file is that it matches production exactly.
--
-- Note the asymmetry with `teachers` below — here created_at and the counters
-- are NOT NULL, there they are nullable. That is real, not a transcription slip.
create table if not exists public.students (
  id                     uuid        not null,
  display_name           text        not null,
  year_group             text,
  confirmed_13           boolean     not null default false,
  subscription_tier      text        not null default 'free'::text,
  paid_until             timestamptz,
  created_at             timestamptz not null default now(),
  stripe_customer_id     text,
  stripe_subscription_id text,
  mini_exam_period       text,
  mini_exams_used        integer     not null default 0,

  constraint students_pkey primary key (id),
  constraint students_id_fkey foreign key (id)
    references auth.users(id) on delete cascade,
  -- The two values lib/entitlements.ts reads for the personal grant. A third
  -- value could never reach isPaidStudent.
  constraint students_subscription_tier_check
    check (subscription_tier = any (array['free'::text, 'paid'::text]))
);

-- ── teachers ─────────────────────────────────────────────────────────────────
-- `email` is not null with no default. See the open contradiction above before
-- relying on that.
--
-- is_admin is NULLABLE, so `is_admin = true` is the only safe test — `not
-- is_admin` silently skips null rows. app/api/admin/usage/route.ts uses
-- `!== true` and app/dashboard/page.tsx uses `?? false`; both are correct, and
-- this is why.
create table if not exists public.teachers (
  id                    uuid        not null,
  email                 text        not null,
  created_at            timestamptz default now(),
  paid_until            timestamptz,
  free_assessments_used integer     default 0,
  is_admin              boolean     default false,

  constraint teachers_pkey primary key (id),
  constraint teachers_id_fkey foreign key (id)
    references auth.users(id) on delete cascade
);

commit;

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Both tables carry ONLY the unique index implied by their primary key. Nothing
-- to create here; recorded so the absence is known rather than assumed.
--
--   students_pkey  unique btree (id)
--   teachers_pkey  unique btree (id)
--
-- Worth knowing, not proposed here: app/api/stripe/webhook/route.ts looks rows
-- up by `stripe_subscription_id`, which has neither an index nor a unique
-- constraint. The scan is free at this number of students. The UNIQUE is the
-- part that would eventually matter, because the webhook updates every matching
-- row.

-- ── The cascade this records ─────────────────────────────────────────────────
-- Both foreign keys are ON DELETE CASCADE from auth.users, and that is the head
-- of a chain worth seeing in one place:
--
--   auth.users -> teachers -> classes     -> class_memberships
--                          -> assignments -> assignment_targets
--                                         -> assignment_attempts
--
--   auth.users -> students -> class_memberships
--                          -> assignment_attempts
--                          -> practice_attempts
--
-- So deleting ONE teacher's account destroys their classes, every membership row
-- in them, every assignment, and every student's attempts at those assignments —
-- other people's work, removed by a third party's account deletion. See
-- docs/audit/20-school-accounts-design.md §4, which proposes making
-- classes.teacher_id and assignments.teacher_id nullable with ON DELETE SET NULL
-- once classes belong to a school, so a class survives its teacher.

-- ── Verify after applying ────────────────────────────────────────────────────
-- Re-run the three introspection queries and diff against this file. Because
-- `create table if not exists` is a no-op on the existing database, a difference
-- means this file is wrong, not that the database changed.
