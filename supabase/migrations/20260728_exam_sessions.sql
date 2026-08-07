-- ── Mini-exam session records (Increment 2) ──────────────────────────────────
-- Until now a submitted mini-exam was ephemeral: the score and the per-question
-- review existed only on screen and were gone on navigate. Only a handful of
-- correct/incorrect signals reached practice_attempts. This table makes a paper
-- durable, which unlocks (a) re-opening a completed paper with your own answers
-- and the full review, and (b) score-over-time / exam-readiness.
--
-- FIDELITY — why this is enough (user ruling 2026-07-28):
-- questions are PARAMETRIC, so a question_id alone cannot reproduce a paper
-- (re-rendering draws different numbers). But question_id + the parameter draw +
-- the student's raw answer is sufficient: re-rendering with fixedValues
-- reproduces the exact stem, prompts, correct answers and explanations, and
-- re-running the grader on the stored answer reproduces the verdicts, marks,
-- trap feedback and grid overlay. So per-unit verdicts/marks are NOT stored —
-- they are derived. `paper` is deliberately lean:
--
--   {
--     "questions": [ { "id": "<uuid>", "params": { "a": 11, "b": 3 } }, ... ],
--     "answers":   { "<questionId>:<part>[:<blank>]": "<raw answer>", ... }
--   }
--
-- Question order in `questions` IS the paper order (item numbering). Answers are
-- raw strings exactly as submitted — a grid_draw answer is its serialised form
-- (serialiseGridAnswer), so it round-trips through parseGridAnswer.
--
-- The SUMMARY is pinned as columns rather than derived, for two reasons: the
-- history list and the score trend must render without re-grading every past
-- paper, and the recorded score must stay STABLE — if a grader fix or a question
-- edit lands later, a re-opened paper shows current grading, but the score that
-- fed the trend does not silently change underneath it.
--
-- question_ids are intentionally NOT duplicated into a column; they live in
-- paper->'questions' and are reachable with a jsonb query if ever needed.

CREATE TABLE IF NOT EXISTS exam_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Paper configuration, so the history row can be labelled without opening it.
  tier         text        NOT NULL CHECK (tier IN ('foundation', 'higher')),
  calculator   text        NOT NULL CHECK (calculator IN ('calc', 'non_calc')),
  -- numeric, not integer: grid_draw parts earn fractional per-element credit.
  marks_earned numeric     NOT NULL CHECK (marks_earned >= 0),
  marks_total  integer     NOT NULL CHECK (marks_total  >  0),
  paper        jsonb       NOT NULL
);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Newest-first history for one student — the only read pattern.
CREATE INDEX IF NOT EXISTS exam_sessions_student_created
  ON exam_sessions (student_id, created_at DESC);

-- Mirrors practice_attempts exactly (see 20260611_rls_baseline.sql): a student
-- may read and write their OWN sessions, nothing else. No UPDATE and no DELETE
-- policy — a submitted paper is immutable, so a score cannot be edited after the
-- fact (same reasoning as the SEC-2b lockdown on completed student_sessions).
-- Teacher visibility is a separate increment and needs the class-membership join.
DROP POLICY IF EXISTS exam_sessions_student_select ON exam_sessions;
CREATE POLICY exam_sessions_student_select ON exam_sessions
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS exam_sessions_student_insert ON exam_sessions;
CREATE POLICY exam_sessions_student_insert ON exam_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- No anon access at all; authenticated access is fully bounded by the policies
-- above. UPDATE/DELETE are granted to nobody, so immutability holds at the grant
-- layer as well as the policy layer.
REVOKE ALL ON exam_sessions FROM anon, authenticated;
GRANT SELECT, INSERT ON exam_sessions TO authenticated;

-- Verify after applying (expect: table present, rowsecurity = true, 2 policies):
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'exam_sessions';
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'exam_sessions';
