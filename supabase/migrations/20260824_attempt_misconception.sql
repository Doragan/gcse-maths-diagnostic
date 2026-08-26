-- Record WHICH misconception a wrong answer showed, not just that it was wrong.
--
-- practice_attempts currently stores skill_ids, correct, attempted_at, kind —
-- enough to compute mastery, but nothing about HOW an answer was wrong. Every
-- authored trap already explains the mistake in prose, and the grader already
-- knows which trap fired; that diagnosis was simply discarded at the point of
-- writing the attempt.
--
-- Without this column, "you have made this mistake three times in two weeks"
-- and a class-level view of common misconceptions are not features waiting to
-- be built — they are uncomputable. The 1,500 existing rows cannot be
-- backfilled either, because the fired trap was never recorded, so this only
-- accrues value going forward. That is the reason to add it early even though
-- nothing reads it yet.
--
-- Deliberately a plain nullable text column rather than a foreign key to a
-- misconceptions table:
--   • The vocabulary lives in data/misconceptions.ts alongside data/skills.ts,
--     which is where this project keeps its taxonomies — version-controlled and
--     reviewable in a PR rather than edited in a live database.
--   • Most attempts are correct, and correct answers never consult traps, so
--     the column is null for the large majority of rows.
--   • An untagged trap is normal. A constraint would force a one-off id for
--     every trap that fits nothing existing, which is exactly the sprawl this
--     taxonomy exists to avoid.

alter table practice_attempts
  add column if not exists misconception text;

comment on column practice_attempts.misconception is
  'Id from data/misconceptions.ts for the trap that fired on a wrong answer. '
  'Null when the answer was correct, when no trap matched, or when the trap '
  'that matched is not tagged.';

-- Aggregation is always "this student, recently" or "this class, recently", and
-- both filter to rows that HAVE a misconception — which is a small minority of
-- the table. A partial index keeps it proportionate to the rows that qualify
-- rather than the whole attempt history.
create index if not exists practice_attempts_misconception_idx
  on practice_attempts (misconception, attempted_at desc)
  where misconception is not null;
