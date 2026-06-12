-- ─────────────────────────────────────────────────────────────────────────────
-- RLS BASELINE — version-controlled snapshot of the live security posture.
--
-- WHY THIS EXISTS (closes audit finding S1): until now the RLS policies on the
-- core tables lived ONLY in the Supabase SQL Editor — no reviewable, diffable,
-- reproducible source of truth. This file captures the policies that were found
-- live by the 2026-06-11 introspection (scripts/rls-introspect.sql, query 2) so
-- they are now in git.
--
-- IDEMPOTENT & SAFE: every policy is `drop ... if exists` then recreated, inside
-- a transaction — applying it to the existing DB is an atomic no-op-equivalent
-- (no window where a table is unprotected); applying it to a fresh environment
-- recreates the posture. RLS-enable is `if exists`-guarded by being harmless to
-- repeat.
--
-- DEPENDENCIES: the SECURITY DEFINER helpers (student_has_assignment,
-- teacher_owns_assignment, teacher_owns_class, is_active_class_member) are
-- defined in the classes/assignments migrations (20260605 / 20260606) — they
-- are referenced here, not redefined.
--
-- NOT CAPTURED HERE: the column/table GRANTs and REVOKEs. The security-critical
-- ones live in 20260611_lock_sensitive_columns.sql (the SEC-CRIT fix); the rest
-- are Supabase defaults.
--
-- ⚠ KNOWN ISSUE PRESERVED FAITHFULLY (audit SEC-2b): the
-- `student_sessions_public_update` policy is `USING (true)` — anon can update any
-- legacy assessment session. It is captured AS-IS (this file documents reality,
-- it does not fix it). The fix is tracked separately and needs a design decision
-- because student_sessions has no auth.uid() identity to scope to.
--
-- Apply via the Supabase SQL Editor (DDL constraint).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── RLS enabled on every table (introspection query 1: all true) ──────────────
alter table analytics_events     enable row level security;
alter table assessments          enable row level security;
alter table assignment_attempts  enable row level security;
alter table assignment_questions enable row level security;
alter table assignment_targets   enable row level security;
alter table assignments          enable row level security;
alter table class_memberships    enable row level security;
alter table classes              enable row level security;
alter table practice_attempts    enable row level security;
alter table questions            enable row level security;
alter table skill_results        enable row level security;
alter table student_sessions     enable row level security;
alter table students             enable row level security;
alter table teachers             enable row level security;

-- ── analytics_events ──────────────────────────────────────────────────────────
drop policy if exists anon_insert_analytics on analytics_events;
create policy anon_insert_analytics on analytics_events
  for insert to public with check (true);

-- ── assessments (legacy teacher-owned join-code model) ────────────────────────
drop policy if exists "assessments: own" on assessments;
create policy "assessments: own" on assessments
  for all to public using (auth.uid() = teacher_id);

drop policy if exists "assessments: teacher read own" on assessments;
create policy "assessments: teacher read own" on assessments
  for select to public using (auth.uid() = teacher_id);

-- ── assignments + children (teacher-set tasks) ────────────────────────────────
drop policy if exists assignments_teacher_select on assignments;
create policy assignments_teacher_select on assignments
  for select to public using (auth.uid() = teacher_id);

drop policy if exists assignments_student_select on assignments;
create policy assignments_student_select on assignments
  for select to public using (student_has_assignment(id, auth.uid()));

drop policy if exists aq_teacher_select on assignment_questions;
create policy aq_teacher_select on assignment_questions
  for select to public using (teacher_owns_assignment(assignment_id, auth.uid()));

drop policy if exists aq_student_select on assignment_questions;
create policy aq_student_select on assignment_questions
  for select to public using (student_has_assignment(assignment_id, auth.uid()));

drop policy if exists at_teacher_select on assignment_targets;
create policy at_teacher_select on assignment_targets
  for select to public using (teacher_owns_assignment(assignment_id, auth.uid()));

drop policy if exists aa_teacher_select on assignment_attempts;
create policy aa_teacher_select on assignment_attempts
  for select to public using (teacher_owns_assignment(assignment_id, auth.uid()));

drop policy if exists aa_student_select on assignment_attempts;
create policy aa_student_select on assignment_attempts
  for select to public using (auth.uid() = student_id);

drop policy if exists aa_student_insert on assignment_attempts;
create policy aa_student_insert on assignment_attempts
  for insert to public
  with check ((auth.uid() = student_id) and student_has_assignment(assignment_id, auth.uid()));

-- ── classes + memberships (persistent class identity) ─────────────────────────
drop policy if exists classes_teacher_select on classes;
create policy classes_teacher_select on classes
  for select to public using (auth.uid() = teacher_id);

drop policy if exists classes_member_select on classes;
create policy classes_member_select on classes
  for select to public using (is_active_class_member(id, auth.uid()));

drop policy if exists memberships_teacher_select on class_memberships;
create policy memberships_teacher_select on class_memberships
  for select to public using (teacher_owns_class(class_id, auth.uid()));

drop policy if exists memberships_student_select on class_memberships;
create policy memberships_student_select on class_memberships
  for select to public using (auth.uid() = student_id);

drop policy if exists memberships_student_insert on class_memberships;
create policy memberships_student_insert on class_memberships
  for insert to public with check (auth.uid() = student_id);

drop policy if exists memberships_student_update on class_memberships;
create policy memberships_student_update on class_memberships
  for update to public using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- ── practice_attempts (private student practice) ──────────────────────────────
drop policy if exists "Students can view own attempts" on practice_attempts;
create policy "Students can view own attempts" on practice_attempts
  for select to public using (auth.uid() = student_id);

drop policy if exists "Students can insert own attempts" on practice_attempts;
create policy "Students can insert own attempts" on practice_attempts
  for insert to public with check (auth.uid() = student_id);

-- ── questions (public read published; admin authors) ──────────────────────────
drop policy if exists "questions: public read published" on questions;
create policy "questions: public read published" on questions
  for select to public using (is_published = true);

drop policy if exists "questions: admin full access" on questions;
create policy "questions: admin full access" on questions
  for all to public
  using (exists (select 1 from teachers where teachers.id = auth.uid() and teachers.is_admin = true));

-- ── skill_results / student_sessions (legacy assessment results) ──────────────
drop policy if exists "skill_results: public insert" on skill_results;
create policy "skill_results: public insert" on skill_results
  for insert to public with check (true);

drop policy if exists "skill_results: teacher read" on skill_results;
create policy "skill_results: teacher read" on skill_results
  for select to public using (
    exists (
      select 1 from student_sessions
      join assessments on assessments.id = student_sessions.assessment_id
      where student_sessions.id = skill_results.session_id
        and assessments.teacher_id = auth.uid()
    )
  );

drop policy if exists "student_sessions: public insert" on student_sessions;
create policy "student_sessions: public insert" on student_sessions
  for insert to public
  with check (exists (select 1 from assessments where assessments.id = student_sessions.assessment_id));

drop policy if exists "student_sessions: teacher read" on student_sessions;
create policy "student_sessions: teacher read" on student_sessions
  for select to public using (
    exists (
      select 1 from assessments
      where assessments.id = student_sessions.assessment_id
        and assessments.teacher_id = auth.uid()
    )
  );

-- SEC-2b FIXED (see 20260612_sec2b_lock_sessions.sql): only an unsubmitted
-- session is updatable, so submitted results are immutable. The single legit
-- update (setting completed_at at completion) targets a still-NULL row.
drop policy if exists "student_sessions: public update" on student_sessions;
create policy "student_sessions: public update" on student_sessions
  for update to public using (completed_at is null) with check (true);

-- ── students / teachers (account rows) ────────────────────────────────────────
-- NB: column UPDATE for client roles is REVOKE'd in
-- 20260611_lock_sensitive_columns.sql, so these UPDATE policies are now
-- unreachable from the client (grant checked before policy) — kept for the
-- record and for any future service-role-independent path.
drop policy if exists "Students can view own record" on students;
create policy "Students can view own record" on students
  for select to public using (auth.uid() = id);

drop policy if exists "Students can update own record" on students;
create policy "Students can update own record" on students
  for update to public using (auth.uid() = id);

drop policy if exists "teachers: own row" on teachers;
create policy "teachers: own row" on teachers
  for all to public using (auth.uid() = id);

drop policy if exists "teachers: update own row" on teachers;
create policy "teachers: update own row" on teachers
  for update to public using (auth.uid() = id);

commit;
