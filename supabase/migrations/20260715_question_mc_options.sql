-- Bring version control back in sync with the live schema.
--
-- questions.mc_options (jsonb, nullable) holds author-supplied multiple-choice
-- options. It was added to the live DB by hand in the Supabase SQL Editor when
-- the MC feature shipped, but never captured as a migration — so a rebuild from
-- migrations (fresh env, staging, DR restore) would lack the column and every MC
-- write path (lib/questions/multipleChoice.ts, QuestionForm, the admin new/[id]
-- pages, the practice + diagnostic pages) would throw. Same class of gap as S1
-- (posture living only in the SQL Editor); this closes it for mc_options.
--
-- `if not exists` makes this a no-op against the live DB that already has the
-- column, so it is safe to apply and purely reconciles git with reality. NULL =
-- legacy / non-MC question (unchanged behaviour). Run via the Supabase SQL Editor.

alter table public.questions
  add column if not exists mc_options jsonb;
