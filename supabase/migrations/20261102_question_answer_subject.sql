-- ─────────────────────────────────────────────────────────────────────────────
-- Let a question say WHAT QUANTITY its expression answer is.
--
-- A student answering "find an expression for the velocity" writes
-- "s = 6t² + 10t - 4". Measured against the live grader on 89c77019 (2026-11-02):
-- that is marked correct, as are "v =", "ds/dt =", "dv/dt =" and "y =". The
-- grader strips a leading subject from one side when the other has none, and
-- these answer templates are bare expressions, so EVERY prefix passes.
--
-- Accepting them is right and does not change: the prefix is notation, the
-- expression is the skill. But "s" is the displacement, not the velocity, and
-- the student should be told so — on the `message` channel the units and
-- simplification reminders already use, still `correct: true`.
--
-- ── WHY A COLUMN AND NOT THE ANSWER TEMPLATE ────────────────────────────────
-- The obvious move is to write the subject into answer_template ("v = 6t²…").
-- It does the opposite of what is wanted. With a subject on BOTH sides the
-- different-subjects guard in expressionMatch engages and the mismatch is
-- REJECTED — the student is marked wrong for a notation slip. And a template
-- that happens to carry a subject (several rearrangement questions do, e.g.
-- "x = (4+3y)/(y-1)") is indistinguishable from one declaring the quantity
-- deliberately, so the grader could never tell intent from accident.
--
-- ── WHY A COLUMN AND NOT THE parts JSONB ALONE ──────────────────────────────
-- The parts jsonb gets the same field (QuestionPart.answer_subjects, no
-- migration needed) and is where a multi-part question's declaration lives. But
-- a SINGLE-part question has no parts array — 36330aca, the "find dy/dx"
-- question, has parts = null and keeps its answer on the row. The row-level and
-- part-level homes mirror answer_template, answer_type, tolerance and
-- requires_simplest, every one of which already exists in both places.
--
-- ── WHY A LIST ──────────────────────────────────────────────────────────────
-- v and ds/dt are the same quantity written two ways, and a student who writes
-- either is right. One subject per question would nudge half of the students
-- who are entirely correct.
--
-- ── SAFETY ──────────────────────────────────────────────────────────────────
-- NULL (every existing row) means "declares nothing", and the grader then
-- behaves exactly as it does today — no prefix is nudged, none is rejected.
-- There is no behaviour to regress because nothing reads the column until a
-- question sets it.
--
-- No grant needed: `questions` carries Supabase's default TABLE-level SELECT
-- (RLS policy "questions: public read published" is what gates reads — see
-- 20260611_rls_baseline.sql), and a table-level grant covers new columns
-- automatically. Contrast session_attempts in 20261023, where a COLUMN-level
-- grant named an exact set and a new column had to be added to it.
--
-- ── APPLY BEFORE DEPLOYING THE CODE ─────────────────────────────────────────
-- Additive and read-only, so applying it on its own is safe: nothing reads
-- answer_subjects until the code ships. The reverse order is NOT safe — the
-- exam paper loader selects an explicit column list (QUESTION_COLUMNS in
-- lib/exam/examPaper.ts) which now names this column, and selecting a column
-- that does not exist errors the whole fetch.
-- Apply via the Supabase SQL Editor (DDL). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

alter table questions
  add column if not exists answer_subjects text[];

comment on column questions.answer_subjects is
  'For an expression answer: the quantity it IS, in every spelling that is '
  'correct — ''{v,ds/dt}'' for a velocity. Feedback only: a student who names a '
  'different quantity is still marked correct and simply told. NULL = declares '
  'nothing (the whole bank bar a handful). See 20261102_question_answer_subject.sql.';

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 1. The column exists, is nullable, and is an array. EXPECT one row,
--    is_nullable = YES, data_type = ARRAY:
--
--      select column_name, is_nullable, data_type, udt_name
--      from information_schema.columns
--      where table_schema = 'public' and table_name = 'questions'
--        and column_name = 'answer_subjects';
--
-- 2. Every existing row declares nothing. EXPECT declared = 0:
--
--      select count(*) as total, count(answer_subjects) as declared
--      from questions;
--
-- 3. Reads still work for a signed-out visitor — the thing a missing grant
--    would break. NOT answerable in the SQL Editor, which runs as superuser:
--    load /practice in a logged-out browser, or
--
--      curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/questions?select=id,answer_subjects&limit=1" \
--        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
--
--    EXPECT a row, not a 42501/permission error.
