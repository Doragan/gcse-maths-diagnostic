-- ─────────────────────────────────────────────────────────────────────────────
-- A second arm on the class grant: a teacher's own pass covers their students.
--
--   student premium = personal grant
--                     OR class grant, which is now EITHER of:
--                        a) membership -> classes.school_id -> schools.granted_until
--                        b) membership -> classes.teacher_id -> teachers.paid_until
--
-- ── Why ────────────────────────────────────────────────────────────────────
--
-- There are two kinds of customer and they arrive differently. A SCHOOL is
-- provisioned by hand — a `schools` row with seats and an end date, attached to
-- the teacher's classes (docs/runbooks/tutoring-trial-setup.md). A TUTOR is
-- expected to be self-serve: they pay for themselves through Stripe, and the
-- webhook already writes `teachers.paid_until`.
--
-- Arm (a) has existed since 20260915 and works. Arm (b) did not, so a tutor who
-- paid got `teachers.paid_until` set and THEIR STUDENTS GOT NOTHING — the money
-- landed and the entitlement did not. That is the hole this closes.
--
-- ── Why this is not just a convenience ─────────────────────────────────────
--
-- It also removes the sharpest edge in the hand-provisioning runbook. Arm (a)
-- attaches CLASSES, so a class created after the grant was run has a null
-- school_id and its students silently get nothing — no error, no warning, and
-- the runbook carries a section warning about it. Arm (b) resolves through the
-- class's OWNER, who cannot change, so a class created later is covered the
-- moment it exists. Self-serve could not tolerate the old behaviour: nobody is
-- standing by to re-run SQL when a tutor adds a student.
--
-- ── Seats are still not enforced, deliberately ─────────────────────────────
--
-- Arm (a) does not cap on `schools.seats` and arm (b) has no seat concept at
-- all. That is consistent on purpose: 20260915 reasoned that blocking a
-- fifteen-year-old's join mid-lesson to settle a commercial dispute is the wrong
-- failure, and the overage is surfaced at renewal instead. A tutor on a banded
-- plan who takes on a tenth student is the same situation.
--
-- ── Blast radius, measured before applying ─────────────────────────────────
--
-- On 2026-10-27: ONE teacher holds an in-date `paid_until` (the legacy founder
-- pass, 31 Dec 2026), owning ONE class with TWO active members, neither of whom
-- already pays personally. So applying this grants premium to two students.
-- Measured rather than assumed, because this arm turns an existing column into
-- an entitlement and every holder of that column starts granting.
--
-- ⚠ CONSEQUENCE WORTH STATING: `teachers.paid_until` is currently a FIXED-DATE
-- founder pass, not a subscription. Anyone holding one now covers their
-- students until it expires. That is the intended behaviour for a paying tutor
-- and an accident of history for a founder pass; the two are indistinguishable
-- in this column. If that matters later, the fix is a separate column for
-- subscription state, not a condition here.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- Apply BEFORE deploying: lib/classGrant.ts gains the same arm and the two must
-- agree, or a student's premium would depend on whether the browser or a server
-- route asked.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Replaces the 20260915 definition. The schools arm is UNCHANGED, character for
-- character, so a reviewer can see that this only adds.
--
-- Takes no arguments and reads auth.uid() itself, as before: a _student_id
-- parameter would make it an oracle over other people's entitlements.
create or replace function public.student_has_class_grant()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    -- (a) the school arm, as it has always been
    exists (
      select 1
      from class_memberships m
      join classes c on c.id = m.class_id
      join schools  s on s.id = c.school_id
      where m.student_id = auth.uid()
        and m.status = 'active'
        and s.granted_until is not null
        and s.granted_until > now()
    )
    or
    -- (b) the teacher arm, new. Resolves through the class owner rather than an
    -- attached school, so it needs no provisioning step and covers classes made
    -- after the teacher paid.
    exists (
      select 1
      from class_memberships m
      join classes  c on c.id = m.class_id
      join teachers t on t.id = c.teacher_id
      where m.student_id = auth.uid()
        and m.status = 'active'
        and t.paid_until is not null
        and t.paid_until > now()
    );
$$;

-- ⚠ NOT OPTIONAL, and not redundant. CREATE OR REPLACE preserves an existing
-- function's privileges, so in the normal case this changes nothing — but if
-- the function were ever dropped and recreated, PostgreSQL would hand EXECUTE
-- to PUBLIC automatically and `grant ... to authenticated` would NOT take it
-- back. That is exactly how this function ended up callable by `anon` once
-- before (20260915_class_grant_execute_grant.sql). Asserting both every time
-- costs nothing and closes the case permanently.
revoke execute on function public.student_has_class_grant() from public;
grant  execute on function public.student_has_class_grant() to authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 The SQL Editor is SUPERUSER and bypasses RLS and grants, so calling the
-- function here proves nothing about who may call it, and auth.uid() is null so
-- it answers false for everyone. Impersonate instead. Nothing below writes.
--
-- 1. PUBLIC does not hold EXECUTE. EXPECT no row with grantee 'PUBLIC':
--
--      select grantee, privilege_type
--      from information_schema.routine_privileges
--      where routine_schema = 'public'
--        and routine_name   = 'student_has_class_grant';
--
-- 2. The NEW arm answers true for a student whose teacher holds a pass and
--    whose class has no school attached. Substitute a student from the class
--    owned by the in-date teacher:
--
--      begin;
--        set local role authenticated;
--        set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--        select public.student_has_class_grant();   -- EXPECT true
--      rollback;
--
-- 3. The OLD arm still answers true on its own. Roll a school grant forward in
--    a transaction, with the teacher's pass cleared, and check:
--
--      begin;
--        update teachers set paid_until = null;                 -- arm (b) off
--        update schools set granted_until = now() + interval '1 day';
--        set local role authenticated;
--        set local request.jwt.claims = '{"sub":"<SCHOOL_STUDENT_UUID>"}';
--        select public.student_has_class_grant();   -- EXPECT true
--      rollback;
--
-- 4. A student with neither still gets false:
--
--      begin;
--        set local role authenticated;
--        set local request.jwt.claims = '{"sub":"<UNAFFILIATED_STUDENT_UUID>"}';
--        select public.student_has_class_grant();   -- EXPECT false
--      rollback;
