-- ── Teacher class analytics: cross-account mastery read ──────────────────────
-- The teacher dashboard needs each class member's DERIVED skill mastery,
-- including what was built in private /practice (mastery is mastery — user
-- decision 2026-06-15). practice_attempts already contains assignment work too
-- (dual-write), so it is the single full-mastery source.
--
-- This is the security model's first cross-account read (a teacher reading
-- another user's data). It is tightly scoped:
--   • SECURITY DEFINER so it can read across users, but every row is gated on
--     the CALLER owning the class (teacher_owns_class) AND the row's student
--     being an ACTIVE member of that class (is_active_class_member).
--   • Returns ONLY the mastery-relevant fields. It deliberately WITHHOLDS
--     question_id and the submitted answer, so the teacher gets the skill map,
--     never the raw "which questions / what they typed" practice transcript.
--   • Granted to authenticated only.
-- Reuses the existing helpers from 20260605_classes_and_memberships.sql.

CREATE OR REPLACE FUNCTION public.get_class_skill_mastery(_class_id uuid)
RETURNS TABLE (
  student_id   uuid,
  skill_ids    text[],
  correct      boolean,
  attempted_at timestamptz,
  kind         text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT pa.student_id, pa.skill_ids, pa.correct, pa.attempted_at, pa.kind
  FROM practice_attempts pa
  WHERE public.teacher_owns_class(_class_id, auth.uid())            -- caller owns the class
    AND public.is_active_class_member(_class_id, pa.student_id);    -- row belongs to an active member
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_skill_mastery(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_class_skill_mastery(uuid) TO authenticated;
