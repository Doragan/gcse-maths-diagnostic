-- ── Phase 1: Teacher-set assignments ────────────────────────────────────────
-- Teacher creates assignments from the question bank, targeting their classes
-- (and/or individual students). Students complete them; the teacher sees a
-- per-student results view. Attempts are deliberately separate from the
-- private practice_attempts table (class-context work is always teacher-visible;
-- private practice is visible only in aggregate — the engagement-vs-detail split).

-- ── assignments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       uuid        NOT NULL REFERENCES teachers(id)  ON DELETE CASCADE,
  title            text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  instructions     text        CHECK (char_length(instructions) <= 2000),

  -- 'picked'  = teacher hand-picks specific questions (see assignment_questions)
  -- 'pool'    = draw target_count questions at random from a skill
  selection_mode   text        NOT NULL DEFAULT 'picked'
                               CHECK (selection_mode IN ('picked', 'pool')),

  -- Pool-mode settings (unused in 'picked' mode)
  skill_ids        text[]      NOT NULL DEFAULT '{}',
  target_count     integer     CHECK (target_count > 0 AND target_count <= 100),

  -- Teacher-chosen completion semantics
  -- 'attempt_once'   — done when every question has been attempted ≥ 1 time; score = first-attempt correct %
  -- 'until_correct'  — done when every question has been answered correctly; retries allowed
  -- 'mastery_based'  — open-ended; done when the skill reaches mastery (4/5 correct)
  completion_mode  text        NOT NULL DEFAULT 'attempt_once'
                               CHECK (completion_mode IN ('attempt_once', 'until_correct', 'mastery_based')),

  due_at           timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- ── assignment_questions ─────────────────────────────────────────────────────
-- The ordered question list for 'picked' mode.  Not used for 'pool' mode.
CREATE TABLE IF NOT EXISTS assignment_questions (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid    NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id    uuid    NOT NULL REFERENCES questions(id)   ON DELETE CASCADE,
  position       integer NOT NULL DEFAULT 0,
  UNIQUE (assignment_id, question_id)
);
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;

-- ── assignment_targets ───────────────────────────────────────────────────────
-- Flexible targeting: one row per target.  Each row targets EITHER a class
-- (all active members) OR an individual student — never both.
CREATE TABLE IF NOT EXISTS assignment_targets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid        NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  class_id       uuid        REFERENCES classes(id)   ON DELETE CASCADE,
  student_id     uuid        REFERENCES students(id)  ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT target_one_of CHECK (
    (class_id IS NOT NULL AND student_id IS NULL) OR
    (class_id IS NULL     AND student_id IS NOT NULL)
  )
);
ALTER TABLE assignment_targets ENABLE ROW LEVEL SECURITY;

-- ── assignment_attempts ──────────────────────────────────────────────────────
-- One row per student × question × attempt.  Students may attempt a question
-- multiple times (the completion_mode governs whether retries matter).
-- Separate from practice_attempts so that:
--   (a) the teacher can read this table (class-context work), and
--   (b) private practice_attempts remain teacher-invisible except in aggregate.
-- Attempts are ALSO written to practice_attempts for mastery/skill tracking.
CREATE TABLE IF NOT EXISTS assignment_attempts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid        NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id     uuid        NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  question_id    uuid        NOT NULL REFERENCES questions(id)  ON DELETE CASCADE,
  correct        boolean     NOT NULL,
  attempted_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE assignment_attempts ENABLE ROW LEVEL SECURITY;

-- ── SECURITY DEFINER helpers ─────────────────────────────────────────────────
-- Bypass RLS to avoid mutually-recursive policy chains.

-- True if _uid is the teacher who created this assignment.
CREATE OR REPLACE FUNCTION teacher_owns_assignment(_assignment_id uuid, _uid uuid)
  RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignments
    WHERE id = _assignment_id AND teacher_id = _uid
  );
$$;
GRANT EXECUTE ON FUNCTION teacher_owns_assignment(uuid, uuid) TO anon, authenticated;

-- True if the student (_uid) is targeted by this assignment, either directly
-- or through an active class membership.  Calls the existing
-- is_active_class_member() helper to avoid a second recursive chain.
CREATE OR REPLACE FUNCTION student_has_assignment(_assignment_id uuid, _uid uuid)
  RETURNS boolean
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignment_targets t
    WHERE t.assignment_id = _assignment_id
      AND (
        t.student_id = _uid
        OR (t.class_id IS NOT NULL AND is_active_class_member(t.class_id, _uid))
      )
  );
$$;
GRANT EXECUTE ON FUNCTION student_has_assignment(uuid, uuid) TO anon, authenticated;

-- ── RLS policies ─────────────────────────────────────────────────────────────

-- assignments
CREATE POLICY assignments_teacher_select ON assignments
  FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY assignments_student_select ON assignments
  FOR SELECT USING (student_has_assignment(id, auth.uid()));
-- Only the API route (service role) may insert — teachers cannot insert directly.
REVOKE INSERT ON assignments FROM anon, authenticated;

-- assignment_questions
CREATE POLICY aq_teacher_select ON assignment_questions
  FOR SELECT USING (teacher_owns_assignment(assignment_id, auth.uid()));
CREATE POLICY aq_student_select ON assignment_questions
  FOR SELECT USING (student_has_assignment(assignment_id, auth.uid()));
REVOKE INSERT ON assignment_questions FROM anon, authenticated;

-- assignment_targets (teacher only; students don't query this directly)
CREATE POLICY at_teacher_select ON assignment_targets
  FOR SELECT USING (teacher_owns_assignment(assignment_id, auth.uid()));
REVOKE INSERT ON assignment_targets FROM anon, authenticated;
REVOKE UPDATE ON assignment_targets FROM anon, authenticated;

-- assignment_attempts
-- Students write and read their own attempts directly (no API round-trip).
CREATE POLICY aa_student_insert ON assignment_attempts
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    AND student_has_assignment(assignment_id, auth.uid())
  );
CREATE POLICY aa_student_select ON assignment_attempts
  FOR SELECT USING (auth.uid() = student_id);
-- Teachers can read all attempts for their own assignments (class-context work).
CREATE POLICY aa_teacher_select ON assignment_attempts
  FOR SELECT USING (teacher_owns_assignment(assignment_id, auth.uid()));
