-- Increment 2: multi-part (parts) question model.
--
-- A question may optionally decompose into an ordered list of PARTS
-- (e.g. part a, part b, ...). Each part is independently graded and
-- independently attributed: one practice_attempts row per part, carrying
-- that part's own skill_ids and kind (mastery vs exam / positive-only).
--
-- Storage mirrors the existing `parameters` and `traps` jsonb precedent.
-- The column is NULLABLE: NULL (or absent) means a single, non-part question,
-- which is the entire existing bank. No backfill required.
--
-- Shape (TypeScript: QuestionPart[] in lib/questions/parts.ts):
--   [
--     {
--       "prompt":          "...{{a}}... html template for this part",
--       "skill_ids":       ["skill_a"],
--       "answer_template": "{{a*2}}",
--       "answer_type":     "numeric" | "exact" | "fraction" | "expression",
--       "tolerance":       0,                         -- numeric only, else null
--       "traps":           [{ "answer_template": "...", "response": "..." }],
--       "marks":           1,
--       "kind":            "mastery" | "exam",
--       "explanation":     "..." | null
--     },
--     ...
--   ]
--
-- The shared stem (question_template), shared parameters and image_url stay
-- at the question level so every part renders against ONE generated value set
-- (part b can reference {{a}} from part a's working).

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS parts jsonb;

COMMENT ON COLUMN questions.parts IS
  'Optional ordered list of independently-graded/attributed question parts (QuestionPart[]). NULL = single non-part question.';
