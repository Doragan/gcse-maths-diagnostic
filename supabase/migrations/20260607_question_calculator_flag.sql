-- ── Calculator flag on questions ────────────────────────────────────────────
-- A tri-state per-question flag describing the question's relationship to a
-- calculator. Drives the one hard paper-assembly constraint: a 'calc' question
-- must never be served on a non-calculator slot.
--
--   'non_calc' — designed for the non-calculator paper (Paper 1): mental /
--                written arithmetic or exact methods. A calculator would
--                trivialise it. Eligible for non-calc slots.
--   'calc'     — genuinely requires a calculator (messy decimals, trig values,
--                heavy computation). MUST only appear on calculator papers.
--   'na'       — calculator availability is irrelevant (symmetry count,
--                "describe the rotation", "write a formula", reasoning/proof).
--                Eligible for any paper.
--
-- Default 'na': accepts a small leak risk for an untagged calc-needing question,
-- mitigated because real-paper questions are tagged at entry and generated
-- questions at generation, so untagged-and-wrong should be rare.

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS calculator text NOT NULL DEFAULT 'na'
    CHECK (calculator IN ('calc', 'non_calc', 'na'));
