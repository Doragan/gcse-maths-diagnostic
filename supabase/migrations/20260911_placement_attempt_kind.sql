-- ── practice_attempts.kind gains 'placement' ──────────────────────────────────
-- Placement-test answers are recorded as their own kind so the mastery engine
-- can treat them as PRIORS: a skill's starting status, replaced by the first
-- real practice on that skill (lib/skills/masteryEngine.ts → studentMastery,
-- docs/audit/17-placement-test-plan.md).
--
-- questions.kind is untouched — placement is a property of the attempt, not of
-- the question.
--
-- APPLY THIS BEFORE DEPLOYING the code that writes kind = 'placement'. Widening
-- the CHECK is backward-compatible, so it is safe to run first; the other way
-- round, every placement answer is rejected by the old constraint.
--
-- The original CHECK was declared inline on ADD COLUMN (20260607_question_kind),
-- so its name is generated. Drop whichever check constraint mentions `kind`
-- rather than guessing the name.

DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'practice_attempts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%kind%'
  LOOP
    EXECUTE format('ALTER TABLE practice_attempts DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE practice_attempts
  ADD CONSTRAINT practice_attempts_kind_check
  CHECK (kind IN ('mastery', 'exam', 'placement'));
