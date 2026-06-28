-- ── Teacher-marked curriculum coverage ───────────────────────────────────────
-- Lets a teacher mark which skills their class has actually been taught, so the
-- dashboard's mastery % is "of the material covered" rather than "of the whole
-- syllabus" — not-yet-taught skills no longer read as failure (user decision
-- 2026-06-28; supersedes the whole-curriculum denominator of 20260615).
--
-- Grain = skill (text id from data/skills.ts; skills live in code, not a DB
-- table, so there is no FK — consistent with practice_attempts.skill_ids[]).
-- A row's presence means "covered"; absence means "not yet". No UPDATE needed.
--
-- Teacher-owned: the owning teacher reads/writes directly (client-side), gated
-- by RLS on the existing teacher_owns_class() helper. Students never read it.

CREATE TABLE IF NOT EXISTS class_skill_coverage (
  class_id   uuid        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  skill_id   text        NOT NULL CHECK (char_length(skill_id) BETWEEN 1 AND 120),
  covered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, skill_id)
);
ALTER TABLE class_skill_coverage ENABLE ROW LEVEL SECURITY;

-- The owning teacher may see, add, and remove coverage for their own classes.
-- (teacher_owns_class is SECURITY DEFINER, defined in 20260605_classes_and_memberships.sql.)
CREATE POLICY csc_teacher_select ON class_skill_coverage
  FOR SELECT USING (teacher_owns_class(class_id, auth.uid()));
CREATE POLICY csc_teacher_insert ON class_skill_coverage
  FOR INSERT WITH CHECK (teacher_owns_class(class_id, auth.uid()));
CREATE POLICY csc_teacher_delete ON class_skill_coverage
  FOR DELETE USING (teacher_owns_class(class_id, auth.uid()));

-- No anon access; authenticated access is fully bounded by the policies above.
REVOKE ALL ON class_skill_coverage FROM anon;
GRANT SELECT, INSERT, DELETE ON class_skill_coverage TO authenticated;
