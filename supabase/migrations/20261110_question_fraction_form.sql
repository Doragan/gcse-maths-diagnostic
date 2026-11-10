-- ─────────────────────────────────────────────────────────────────────────────
-- Let a question insist that its fraction answer be written as a MIXED NUMBER
-- (or as an improper fraction).
--
-- ── THE BUG THIS COMES WITH ─────────────────────────────────────────────────
-- normalise() in lib/questions/answerChecker.ts stripped all whitespace, so
-- "2 1/3" became "21/3" — the string for seven. Measured against the live
-- grader on 2026-11-03:
--
--   student  canonical                    verdict
--   21/3     2 1/3                        ACCEPTED   (it is 7, not 2⅓)
--   7/3      2 1/3                        rejected   (it IS 2⅓)
--   2 1/3    7/3                          rejected
--   2 1/3    2 1/3, requires_simplest     rejected — "give it in its simplest
--                                         form", because gcd(21, 3) = 3
--
-- The exact type was no better: it compares the same normalised string, so it
-- accepted "21/3" too. There was no answer type that could mark a mixed number.
-- The grader now parses the form properly; this column is the part the database
-- has to carry.
--
-- ── WHY THE COLUMN IS NEEDED AT ALL ─────────────────────────────────────────
-- Two requirements pull opposite ways, and the coded papers settle both:
--
--   1. Equivalent forms are normally BOTH right. Nearly every fraction answer
--      in the mark schemes is marked "oe" — NOV24-H-P3 q21 credits "90/552 oe".
--      So by default "7/3" and "2 1/3" are the same answer and neither is
--      penalised. That is what the grader now does with no column set.
--   2. Some questions must demand one form. JUN23-H-P1 q3's gap note is
--      explicit: "mixed-number answer; improper form not credited".
--
-- Nothing in the question the grader can see distinguishes the two cases: the
-- demand is in the WORDING ("write this improper fraction as a mixed number"),
-- which the grader never receives. Hence a declaration, exactly as
-- requires_simplest is one.
--
-- ── WHY NOT A NEW ANSWER TYPE ───────────────────────────────────────────────
-- An answer_type of 'mixed' would make the form compulsory wherever it was
-- used, which is backwards: requirement 1 is the common case and requirement 2
-- the handful. It would also duplicate everything the fraction type already
-- does — simplest-form checking, the terminating-decimal rule, trap matching by
-- value — and it would not have fixed the bug for 'exact'.
--
-- ── WHY A COLUMN AND NOT THE parts JSONB ALONE ──────────────────────────────
-- The parts jsonb gets the same field (QuestionPart.requires_fraction_form, no
-- migration needed). But a SINGLE-part question has no parts array and keeps
-- its answer on the row, and "write this improper fraction as a mixed number"
-- is a one-mark single-part question — 6 of the 30 coded parts for
-- irregular_and_improper_fractions, its most frequent single shape. Same
-- reasoning as 20261102_question_answer_subject.sql.
--
-- ── THE PRIZE ───────────────────────────────────────────────────────────────
-- Measured over the 86 coded papers: 38 parts worth 96 marks carry an
-- app_gap_note recording a mixed-number or improper-form problem, across 11
-- skills — irregular_and_improper_fractions 26 parts / 57 marks, then
-- dividing_fractions, adding_and_subtracting_fractions, multiplying_fractions,
-- recurring_decimals_to_fractions and six more with a part or two each. Of the
-- 16 notes that state which form the scheme credits, 15 want the mixed form
-- and 1 (OCR-JUN23-F-P2) the improper one. That single part is why 'improper'
-- is a value here: without it that question cannot be authored at all.
--
-- ── SAFETY ──────────────────────────────────────────────────────────────────
-- NULL (every existing row) means "either form is accepted", which is both the
-- new default and — since no existing answer anywhere renders as a mixed
-- number — exactly today's behaviour. Proved rather than assumed: scripts/
-- audit-grader-snapshot.ts graded all 1,847 rows of this table (300 bank +
-- 1,547 coded exam rows) across 8 seeded parameter draws each, 13,224 graded
-- probes covering every question's own correct answer, that answer with its
-- whitespace removed, and every authored trap's value. Verdict, message, trap
-- and units flag were identical before and after: 0 changes.
--
-- No grant needed: `questions` carries Supabase's default TABLE-level SELECT
-- (RLS policy "questions: public read published" is what gates reads — see
-- 20260611_rls_baseline.sql), and a table-level grant covers new columns
-- automatically. Contrast session_attempts in 20261023, where a COLUMN-level
-- grant named an exact set and a new column had to be added to it.
--
-- ── APPLY BEFORE DEPLOYING THE CODE ─────────────────────────────────────────
-- Additive and read-only, so applying it on its own is safe: nothing reads
-- requires_fraction_form until the code ships. The reverse order is NOT safe —
-- the exam paper loader selects an explicit column list (QUESTION_COLUMNS in
-- lib/exam/examPaper.ts) which now names this column, and so does the tutorial
-- bank-question component (components/practice/BankQuestion.tsx); selecting a
-- column that does not exist errors the whole fetch.
-- Apply via the Supabase SQL Editor (DDL). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

alter table questions
  add column if not exists requires_fraction_form text;

alter table questions
  drop constraint if exists questions_requires_fraction_form_check;

-- The CHECK mirrors FRACTION_FORMS in lib/questions/answerTypes.ts. A typo'd
-- value would not throw anywhere in the app — the grader tests it for equality
-- and a value matching neither branch silently accepts both forms, which is a
-- question that quietly stops assessing the thing it was written for.
alter table questions
  add constraint questions_requires_fraction_form_check
  check (requires_fraction_form is null
         or requires_fraction_form in ('mixed', 'improper'));

comment on column questions.requires_fraction_form is
  'For a fraction answer: the form the question insists on — ''mixed'' for '
  '"write 7/3 as a mixed number", ''improper'' for the reverse. NULL = either '
  'form is accepted, which is the whole bank and what the mark schemes say '
  '("oe"). See 20261110_question_fraction_form.sql.';

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 1. The column exists, is nullable and is text. EXPECT one row,
--    is_nullable = YES, data_type = text:
--
--      select column_name, is_nullable, data_type
--      from information_schema.columns
--      where table_schema = 'public' and table_name = 'questions'
--        and column_name = 'requires_fraction_form';
--
-- 2. Every existing row declares nothing. EXPECT declared = 0:
--
--      select count(*) as total, count(requires_fraction_form) as declared
--      from questions;
--
-- 3. The CHECK bites. EXPECT an error (23514), not a row:
--
--      update questions set requires_fraction_form = 'mixed_number'
--      where id = (select id from questions limit 1);
--
-- 4. Reads still work for a signed-out visitor — the thing a missing grant
--    would break. NOT answerable in the SQL Editor, which runs as superuser:
--    load /practice in a logged-out browser, or
--
--      curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/questions?select=id,requires_fraction_form&limit=1" \
--        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
--
--    EXPECT a row, not a 42501/permission error.
