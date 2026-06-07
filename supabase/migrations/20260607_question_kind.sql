-- ── Two-kind question model: `kind` flag ────────────────────────────────────
-- Splits questions into two attribution classes (the "two-kind model"):
--
--   'mastery' — cleanly assesses exactly one skill. Credits on success AND
--               penalises on failure (today's behaviour). Drives the mastery
--               graph. This is what the entire current bank already is.
--   'exam'    — an irreducible multi-skill synthesis question (a single answer
--               chaining several skills with no clean per-part breakdown).
--               Positive-only: a correct answer credits its skills upward (and
--               propagates through prerequisites); a wrong answer NEVER lowers
--               mastery — it only routes the student to revision. Whole-paper
--               exam performance is tracked as its own metric, separately.
--
-- Default 'mastery' so every existing row keeps today's exact behaviour.

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mastery'
    CHECK (kind IN ('mastery', 'exam'));

-- Denormalised snapshot of the question's kind onto each attempt, mirroring the
-- existing denormalisation of skill_ids. The mastery engine reads this to decide
-- whether a wrong answer penalises (mastery) or is a no-op (exam). Default
-- 'mastery' so all historical attempts retain today's behaviour.
ALTER TABLE practice_attempts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mastery'
    CHECK (kind IN ('mastery', 'exam'));
