-- ─────────────────────────────────────────────────────────────────────────────
-- Give a student account the course they are sitting.
--
-- Qualification and tier have been per-BROWSER preferences (localStorage, see
-- lib/skills/qualificationPreference.ts and tierPreference.ts). That is right
-- for a signed-out visitor and wrong for an account: a student who sets up
-- iGCSE Higher on a laptop should not be shown GCSE Foundation on a phone.
--
-- Stored as ONE course id rather than a qualification column and a tier column.
-- A student signs up to "iGCSE Higher", not to "iGCSE" and separately to
-- "Higher"; two columns can hold a pair that is not a real course, one cannot.
-- data/courses.ts decomposes it (courseFor / higherOnlySkillsFor).
--
-- NULL means "not stated" — the per-browser preference still answers, which is
-- what every existing account has until it is asked. Not defaulted to
-- 'gcse_foundation', because a default here is indistinguishable from a student
-- who actually chose it, and it would silently overwrite a browser preference
-- they had already set.
--
-- ── WHY A COLUMN-LEVEL GRANT ────────────────────────────────────────────────
-- 20260611_lock_sensitive_columns.sql revoked the blanket table-level UPDATE on
-- `students` from anon and authenticated, because the self-row UPDATE policy
-- (USING auth.uid() = id) is row-granular and cannot stop a student setting
-- subscription_tier / paid_until / stripe_customer_id on their OWN row — i.e.
-- granting themselves a paid subscription. It closes with exactly this case:
--
--     If a profile-edit feature is ever added, re-grant only those columns, e.g.
--       grant update (display_name, year_group) on students to authenticated;
--
-- This is that feature, so this is that grant. The table-level revoke STAYS
-- revoked; a column-level grant re-opens precisely one column and nothing else.
-- Note the asymmetry that makes this safe and that the earlier migration was
-- written to correct: a column-level REVOKE cannot subtract from a table-level
-- GRANT (it is a no-op), but a column-level GRANT with no table-level grant
-- present is the whole permission. Adding a column to `students` later does NOT
-- become writable by this.
--
-- NOT is_admin: that column is on `teachers`, not on `students` — see the
-- captured schema in 20260914_capture_students_teachers.sql. The 2026-06-11
-- migration covered both tables, so its wording names it; this one is students
-- only, and repeating the list verbatim would send the next reader looking for
-- a column that is not there. The students-side prize is the subscription.
--
-- ── VERIFIED AFTER APPLYING (2026-10-16) ────────────────────────────────────
-- information_schema.column_privileges, privilege_type = 'UPDATE' on students:
--
--     authenticated  course_id        <- this migration, and nothing else
--     postgres       (every column)   <- owner
--     service_role   (every column)   <- backend key, never reaches a browser
--     anon           (none)
--
-- Read from the catalog rather than probed with a write: the SQL Editor runs as
-- superuser and bypasses grants, so an attempted write there proves nothing.
-- One row for `authenticated` is the assertion — a table-level UPDATE would
-- list every column instead, which is exactly how the 2026-09-14 audit found
-- the hole on `teachers`.
--
-- ── WHY THE EXISTING POLICY IS ENOUGH ───────────────────────────────────────
-- `students` already carries "Students can update own record", FOR UPDATE,
-- USING (auth.uid() = id). It has been latent since the revoke; this grant is
-- what makes it reachable, for this column only.
--
-- It has no WITH CHECK, so Postgres reuses USING as the WITH CHECK — the rule
-- that made a FOR ALL policy on `teachers` into a self-granted-admin hole
-- (20260914_close_teachers_self_admin.sql). Here that reuse is harmless and in
-- fact wanted: the new row must still satisfy auth.uid() = id, and `id` is not
-- in the grant, so a student cannot move their row onto another account. The
-- policy is FOR UPDATE, not FOR ALL, so it is not an INSERT gate either —
-- client INSERT on `students` stays revoked.
--
-- ── WHY A CHECK CONSTRAINT ──────────────────────────────────────────────────
-- The client can now write this column, so the client can write anything into
-- it. Courses live in data/courses.ts, not in a table, so there is no foreign
-- key to lean on and this CHECK is the only server-side guard against a typo or
-- a hand-crafted request parking junk on the row.
--
-- KEEP IN STEP WITH data/courses.ts. lib/skills/accountCourse.test.ts parses
-- this file and fails if the two lists diverge, so adding a course means adding
-- it in both places.
--
-- ── APPLY BEFORE DEPLOYING THE CODE ─────────────────────────────────────────
-- Additive, so it is safe to apply on its own: nothing reads or writes
-- course_id until the code ships. The reverse order is NOT safe — deployed code
-- selecting a column that does not exist errors on every profile fetch.
-- Apply via the Supabase SQL Editor (DDL).
-- ─────────────────────────────────────────────────────────────────────────────

alter table students
  add column if not exists course_id text;

alter table students
  drop constraint if exists students_course_id_known;

alter table students
  add constraint students_course_id_known
  check (course_id is null or course_id in (
    'gcse_foundation',
    'gcse_higher',
    'igcse_foundation',
    'igcse_higher'
  ));

comment on column students.course_id is
  'The course this student is sitting (data/courses.ts id), or NULL for not stated. Client-writable: see 20261016_student_course.sql.';

grant update (course_id) on students to authenticated;
