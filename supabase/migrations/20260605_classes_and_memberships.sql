-- Phase 0: class identity layer
--
-- Persistent, teacher-owned CLASSES + student-consented MEMBERSHIP (many-to-many).
-- This is the foundation the real teacher dashboard hangs off: every later
-- results source (teacher-set questions, mocks, topic tests, the diagnostic)
-- attaches to a student ACCOUNT, and class membership is the student's own act
-- of consent that grants their teacher a view of the relevant data.
--
-- Design notes:
--   * classes.code is a short join code (like assessments.code) but for a
--     PERSISTENT class, not a one-off assessment.
--   * Class creation goes through a server route (service role) so codes can be
--     de-duped on collision and a gate can be added later — INSERT is revoked
--     from anon/authenticated, mirroring assessments.
--   * Membership is the student's own act: a logged-in student inserts/updates
--     their OWN row (auth.uid() = student_id). Leaving flips status to 'left'
--     (keeping the row) rather than deleting, so it can be reasoned about later
--     (e.g. the pseudonymise-on-leave behaviour for marked work).
--   * The two "see across the link" checks (a student seeing a class they
--     belong to; a teacher seeing the memberships of their class) reference the
--     OTHER table. Doing that inline in RLS USING clauses creates mutually
--     recursive policies (Postgres error 42P17). We therefore route those
--     checks through SECURITY DEFINER helper functions, which run with the
--     definer's rights and so bypass RLS inside the function — breaking the
--     recursion. (Standard Supabase pattern.)
--   * Reading a linked student's PROFILE fields (display_name etc.) for a roster
--     is done SERVER-SIDE with the service role (see app/api/classes/[id]/members)
--     so the cross-account read stays controlled and column-scoped — there is no
--     broad SELECT policy on `students`.

-- ── Tables ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  code       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classes_teacher ON classes (teacher_id);

CREATE TABLE IF NOT EXISTS class_memberships (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','left')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  left_at    timestamptz,
  UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS class_memberships_class   ON class_memberships (class_id);
CREATE INDEX IF NOT EXISTS class_memberships_student ON class_memberships (student_id);

-- ── SECURITY DEFINER helpers (break RLS recursion) ───────────────────────────
CREATE OR REPLACE FUNCTION public.is_active_class_member(_class_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_memberships m
    WHERE m.class_id = _class_id
      AND m.student_id = _uid
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.teacher_owns_class(_class_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = _class_id
      AND c.teacher_id = _uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_class_member(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_owns_class(uuid, uuid)     TO anon, authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;

-- classes: a teacher sees/owns their classes; a student sees a class they're in.
CREATE POLICY "classes_teacher_select" ON classes
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "classes_member_select" ON classes
  FOR SELECT USING (public.is_active_class_member(id, auth.uid()));

-- Creation is server-only (service role) so codes can be de-duped + gated later.
-- (Belt-and-braces alongside RLS, which already denies with no INSERT policy.)
REVOKE INSERT ON classes FROM anon, authenticated;

-- class_memberships: the student manages their OWN row; the teacher reads the
-- memberships of classes they own.
CREATE POLICY "memberships_student_select" ON class_memberships
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "memberships_teacher_select" ON class_memberships
  FOR SELECT USING (public.teacher_owns_class(class_id, auth.uid()));

CREATE POLICY "memberships_student_insert" ON class_memberships
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "memberships_student_update" ON class_memberships
  FOR UPDATE USING (auth.uid() = student_id)
             WITH CHECK (auth.uid() = student_id);

-- Identity + join timestamp are immutable from the client; only status/left_at
-- (i.e. leaving / rejoining) may be changed. Mirrors the column-level REVOKE
-- hardening used on teachers/students.
REVOKE UPDATE (class_id, student_id, joined_at) ON class_memberships FROM anon, authenticated;
