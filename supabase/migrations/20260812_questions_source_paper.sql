-- Paper items: questions rows that exist only to be pointed at, never served.
--
-- WHY THIS COLUMN EXISTS
-- `practice_attempts.question_id` is NOT NULL and a hard FK to `questions.id`
-- (constraint `practice_attempts_question_id_fkey`, verified against the live
-- database). So recording "this student scored 2/3 on question 7 of the
-- November 2024 paper" as an attempt requires a real `questions` row for that
-- paper item. There is no synthetic-id or null-question_id shortcut.
--
-- Those rows are unpublished, so every serving path already ignores them —
-- /practice, the diagnostic, assignment creation and the demo pool all filter
-- `.eq('is_published', true)`. But `is_published = false` is ALSO how a genuine
-- draft awaiting review is marked, and the admin questions list has a "Draft"
-- filter with a one-click publish toggle. Without a discriminator, ~100 paper
-- items per paper would bury the two real drafts in that queue, and publishing
-- one by accident would serve students a question with an empty answer.
--
-- `source_paper` separates the two: NULL for everything authored for practice,
-- a PaperConfig slug (eg 'aqa-8300-1f-nov24') for a paper item. It is a slug,
-- not a foreign key — papers are defined in code (lib/demoPapers/), the same
-- way courses and skills are, so there is no papers table to reference.
--
-- The CHECK constraint makes the footgun unreachable rather than merely
-- unlikely: a paper item cannot be published at all, so the admin toggle
-- fails loudly instead of quietly exposing a broken question.

alter table questions
  add column if not exists source_paper text;

comment on column questions.source_paper is
  'PaperConfig slug when this row is a real-exam paper item that exists only as '
  'an anchor for marks-derived practice_attempts; NULL for questions authored '
  'to be served. Paper items can never be published (see chk_paper_items_unpublished).';

-- A paper item is never servable. Written as NOT (…) so existing rows, which
-- all have source_paper NULL, satisfy it unchanged.
alter table questions
  drop constraint if exists chk_paper_items_unpublished;
alter table questions
  add constraint chk_paper_items_unpublished
  check (not (source_paper is not null and is_published));

-- The marks writer re-submits by clearing this paper's attempts and reinserting,
-- which needs "every question id belonging to paper X" to be a cheap lookup.
create index if not exists idx_questions_source_paper
  on questions (source_paper)
  where source_paper is not null;
