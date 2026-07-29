-- ── Explicit per-question marks (mark calibration, Increment 3 step 2) ───────
-- Marks for a single-part question are currently ESTIMATED from the coded 2024
-- series (lib/exam/markEvidence.ts). That estimate is a better centre than the
-- flat difficulty table it replaced, but it cannot be precise: a real question's
-- marks are the count of creditable steps in its solution, which is a property
-- of the method chain rather than the topic (skill+kind conditioning bottoms out
-- at SD 0.64; simple_arithmetic parts genuinely range 1-5 marks).
--
-- This column is the author's override for the cases the estimate gets wrong,
-- or where a question is deliberately shorter or longer than its topic's norm.
--
-- NULLABLE ON PURPOSE: NULL means "use the estimate", so the whole existing bank
-- keeps working with no backfill — the same choice `parts` made. Once set, it
-- wins everywhere (resolveQuestionMarks checks it first).
--
-- Multi-part questions are unaffected: they are priced by summing their parts'
-- authored marks, and ignore this column.
--
-- ⚠ SEQUENCING: this is an additive column the NEW CODE DEPENDS ON — the exam
-- runner's question SELECT lists it. Apply this migration BEFORE deploying that
-- code, or the select will error on an unknown column. (Same rule as the
-- calculator flag and question kind; the opposite of the RLS-lockdown rule.)

ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks int;

-- A part is worth at least one mark, and nothing in the coded series exceeds 5
-- for a single part. The bound keeps a typo from quietly distorting a paper.
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_marks_range;
ALTER TABLE questions ADD CONSTRAINT questions_marks_range
  CHECK (marks IS NULL OR (marks >= 1 AND marks <= 10));

-- Verify after applying (expect: column present, all rows NULL):
--   SELECT count(*) AS total, count(marks) AS with_explicit_marks FROM questions;
