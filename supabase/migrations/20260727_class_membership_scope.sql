-- ─────────────────────────────────────────────────────────────────────────────
-- Scope class membership to the join code (audit F2).
--
-- TWO DEFECTS, one root cause: `memberships_student_insert` / `_update` check
-- WHO the row belongs to (auth.uid() = student_id) but never validate WHICH
-- class it points at.
--
--   1. INSERT — `joinClass()` inserted straight from the browser, so any
--      logged-in student could join ANY class by supplying its uuid. The 4-char
--      join code was never actually required: it was a client-side convention,
--      not a server-enforced gate.
--
--   2. UPDATE — a student could rewrite `class_id` on their own membership row
--      and hop into a class they were never given the code for.
--
-- ⚠ WHY THE EXISTING GUARD DIDN'T WORK: 20260605_classes_and_memberships.sql
-- ends with
--     REVOKE UPDATE (class_id, student_id, joined_at) ON class_memberships …
-- which is a NO-OP, for exactly the reason this repo already documented in
-- 20260611_lock_sensitive_columns.sql: a table-level `GRANT UPDATE` (Supabase's
-- default for anon/authenticated) confers UPDATE on every column, and a
-- column-level REVOKE cannot subtract from it. That lesson was applied to
-- students/teachers and missed here. The correct shape — revoke the blanket
-- table-level privilege, then grant back only the columns the client may touch —
-- is what this migration does.
--
-- WHAT A FORGED MEMBERSHIP BOUGHT: is_active_class_member() is the hinge for
-- classes_member_select (see the class), student_has_assignment() (see and
-- attempt that class's assignments), and get_class_skill_mastery() (hand the
-- class's teacher your own practice history).
--
-- CODE DEPENDENCY — apply this WITH the matching deploy, not before it:
-- revoking INSERT breaks the old client-side `joinClass(classId)`. Joining now
-- goes through app/api/classes/join (service role), which resolves the CODE
-- server-side, so code knowledge is finally enforced. Order per the project's
-- deploy rule: ship the code first, then apply this. `leaveClass()` and the
-- rejoin path keep working — status/left_at stay client-writable below.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── 1. Membership creation is server-only ────────────────────────────────────
-- Mirrors `classes` (INSERT revoked in 20260605) and `assignments` (20260606):
-- the route holds the join-code check, RLS holds the identity check.
revoke insert on class_memberships from anon, authenticated;

-- Belt-and-braces: even via a path that regains INSERT, the row must be the
-- caller's own AND point at a class that exists.
drop policy if exists memberships_student_insert on class_memberships;
create policy memberships_student_insert on class_memberships
  for insert to public
  with check (
    auth.uid() = student_id
    and exists (select 1 from classes c where c.id = class_id)
  );

-- ── 2. Make the identity columns genuinely immutable ─────────────────────────
-- Replaces the no-op column REVOKE from 20260605. A student may leave and
-- rejoin (status/left_at); they may not move a membership between classes,
-- reassign it to another student, or backdate joined_at.
revoke update on class_memberships from anon, authenticated;
grant  update (status, left_at) on class_memberships to authenticated;

-- The row-level check is unchanged and still required: the grant says WHICH
-- COLUMNS, the policy says WHOSE ROW.
drop policy if exists memberships_student_update on class_memberships;
create policy memberships_student_update on class_memberships
  for update to public
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 DO NOT paste these into the SQL Editor as-is. The editor runs as a
-- SUPERUSER, which bypasses BOTH table grants and RLS — every statement below
-- would succeed no matter what this migration did, giving you a false pass.
-- This fix lives entirely in the grant layer, so it is invisible to a superuser.
--
-- Impersonate the client role instead. `begin/rollback` means nothing is
-- written, so these are safe to run against production. Substitute a real
-- student uuid and two real class uuids.
--
--   begin;
--     set local role authenticated;
--     set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--
--     -- (1) EXPECT ERROR 42501 — creation is server-only now
--     insert into class_memberships (class_id, student_id)
--     values ('<ANY_CLASS_UUID>', '<STUDENT_UUID>');
--   rollback;
--
--   begin;
--     set local role authenticated;
--     set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--
--     -- (2) EXPECT ERROR 42501 on class_id — no hopping between classes
--     update class_memberships set class_id = '<OTHER_CLASS_UUID>'
--     where student_id = '<STUDENT_UUID>';
--   rollback;
--
--   begin;
--     set local role authenticated;
--     set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--
--     -- (3) EXPECT SUCCESS — leaving a class must keep working
--     update class_memberships set status = 'left', left_at = now()
--     where student_id = '<STUDENT_UUID>';
--   rollback;
--
-- Then smoke-test the real flow in the app as a student: join by code → leave →
-- rejoin. That exercises app/api/classes/join, which is the path that now
-- carries the join-code check.
