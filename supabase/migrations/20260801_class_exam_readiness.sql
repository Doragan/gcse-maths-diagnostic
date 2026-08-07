-- ── Teacher class analytics: exam readiness (the marks currency) ─────────────
-- The dashboard already reads each member's derived skill MASTERY via
-- get_class_skill_mastery. This adds the other half: how they scored on the
-- mini-exams they have sat.
--
-- Same security shape as that function, and for the same reason — it is a
-- cross-account read, so every row is gated on the CALLER owning the class AND
-- the row's student being an ACTIVE member of it. Reuses the helpers from
-- 20260605_classes_and_memberships.sql.
--
-- WHAT A TEACHER MAY SEE — and how this DIFFERS from the mastery function.
-- get_class_skill_mastery deliberately withholds question_id and the submitted
-- answer: private practice is not the teacher's business, so they get the skill
-- map and never the transcript. An exam is not private practice. It is
-- assessment, and reading the script is what marking is (user decision,
-- 2026-08-01), so the paper IS exposed here.
--
-- It is exposed by a SEPARATE per-session function rather than in the list.
-- `paper` holds every question id and everything the student typed; shipping it
-- for every session of every student just to render a summary table would be
-- both wasteful and a wider read than the screen needs.

-- ── 1. The list: summary rows only, no paper ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_class_exam_sessions(_class_id uuid)
RETURNS TABLE (
  id           uuid,
  student_id   uuid,
  created_at   timestamptz,
  tier         text,
  calculator   text,
  marks_earned numeric,
  marks_total  integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT es.id, es.student_id, es.created_at, es.tier, es.calculator,
         es.marks_earned, es.marks_total
  FROM exam_sessions es
  WHERE public.teacher_owns_class(_class_id, auth.uid())            -- caller owns the class
    AND public.is_active_class_member(_class_id, es.student_id);    -- row belongs to an active member
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_exam_sessions(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_class_exam_sessions(uuid) TO authenticated;

-- ── 2. One paper, when a teacher opens it ────────────────────────────────────
-- Takes the class id as well as the session id, so ownership is checked against
-- a class the caller actually owns rather than inferred from the session. A
-- session id alone would make the gate depend on finding the student's classes,
-- which is a wider and more fragile query.
CREATE OR REPLACE FUNCTION public.get_class_exam_paper(_class_id uuid, _session_id uuid)
RETURNS TABLE (
  id           uuid,
  student_id   uuid,
  created_at   timestamptz,
  tier         text,
  calculator   text,
  marks_earned numeric,
  marks_total  integer,
  paper        jsonb
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT es.id, es.student_id, es.created_at, es.tier, es.calculator,
         es.marks_earned, es.marks_total, es.paper
  FROM exam_sessions es
  WHERE es.id = _session_id
    AND public.teacher_owns_class(_class_id, auth.uid())
    AND public.is_active_class_member(_class_id, es.student_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_exam_paper(uuid, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_class_exam_paper(uuid, uuid) TO authenticated;

-- NOTE: exam_sessions' own RLS is unchanged and still own-row only. These
-- functions are the ONLY route by which one account reads another's papers,
-- which keeps the whole widening in one reviewable place.
