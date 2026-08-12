-- ── Teacher-marked paper sittings ───────────────────────────────────────────
-- The durable record of "this student sat this paper and scored these marks",
-- entered by a teacher from a marked script rather than graded by the app.
--
-- PER STUDENT, NOT PER CLASS (user ruling): a sitting belongs to one student
-- and only optionally names a class. A teacher marking a set of 25 creates 25
-- sittings sharing a class_id; a paper handed to one student individually
-- creates one with class_id NULL. Nothing about the model assumes a class,
-- which is what keeps individual assignment open later.
--
-- A SITTING IS A ROW, NOT A KEY — deliberately no unique constraint on
-- (student_id, source_paper). A student resitting a paper, or a mock re-run in
-- a later term, is simply a second row, and both feed mastery: improvement over
-- time is precisely what the rolling window should see.
--
-- Shape follows exam_sessions (20260728): per-student, summary pinned as
-- columns so a history list renders without recomputation, detail in jsonb.
-- ONE DELIBERATE DIVERGENCE — exam_sessions is immutable (no UPDATE policy) on
-- the grounds that a student sat it and the score is what it is. A teacher's
-- mark sheet is the teacher's own work and a typo must be correctable, so this
-- table is mutable. Corrections flow through the service-role route, which
-- re-derives the attempts (see the sitting_id column added below).

create table if not exists paper_sittings (
  id           uuid        primary key default gen_random_uuid(),
  student_id   uuid        not null references students(id) on delete cascade,
  -- PaperConfig slug (lib/demoPapers/), matching questions.source_paper. A slug
  -- not an FK: papers are defined in code, like skills and courses.
  source_paper text        not null,
  -- NULL when the paper was given to a student individually rather than a class.
  -- ON DELETE SET NULL so deleting a class orphans rather than destroys the
  -- gradebook record, matching the recorded "pseudonymise, don't delete" intent.
  class_id     uuid        references classes(id) on delete set null,
  marked_by    uuid        not null references teachers(id),
  -- When the class actually sat it, which is not when it was typed in.
  sat_on       date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Integers: teacher-entered exam marks are whole. (exam_sessions uses numeric
  -- only because grid_draw earns fractional per-element credit.)
  marks_earned integer     not null check (marks_earned >= 0),
  marks_total  integer     not null check (marks_total  >  0),
  -- { "<paper item id>": <marks scored>, ... } — keys are PaperConfig question
  -- ids ('7a', '12'), the same ids stamped into questions.question_template.
  marks        jsonb       not null default '{}'::jsonb,

  constraint chk_paper_sitting_marks_within_total check (marks_earned <= marks_total)
);

alter table paper_sittings enable row level security;

-- "What has this class been marked on?" and "this student's paper history".
create index if not exists paper_sittings_class_paper
  on paper_sittings (class_id, source_paper) where class_id is not null;
create index if not exists paper_sittings_student_created
  on paper_sittings (student_id, created_at desc);

-- RLS: a student may read their OWN sittings (their marks, mirroring the
-- exam_sessions read policy). Everything else — all teacher reads and every
-- write — goes through a service-role API route that verifies teacher_owns_class
-- and active membership first. That is the established pattern for writing on
-- another user's behalf (app/api/assignments/create, app/api/classes/[id]/members);
-- there is deliberately no teacher-scoped policy here to avoid a second, weaker
-- authorisation path into the same data.
drop policy if exists paper_sittings_student_select on paper_sittings;
create policy paper_sittings_student_select on paper_sittings
  for select to public using (auth.uid() = student_id);

-- ── Tying derived attempts back to their sitting ────────────────────────────
-- Marks become practice_attempts rows so the mastery engine can read them. When
-- a teacher corrects a mark sheet those derived rows must be rebuilt — and with
-- resits allowed, "delete this student's attempts for this paper" is too broad:
-- it would wipe a different sitting of the same paper. So each derived attempt
-- names the sitting it came from.
--
-- Nullable, and NULL for every existing row: attempts from self-serve practice
-- and assignments have no sitting. Additive only — every current reader selects
-- named columns (including get_class_skill_mastery), so nothing sees this
-- unless it asks.
--
-- ON DELETE CASCADE makes re-submission simple and leak-free: delete the
-- sitting, its derived attempts go with it, insert the corrected sitting fresh.
alter table practice_attempts
  add column if not exists sitting_id uuid references paper_sittings(id) on delete cascade;

comment on column practice_attempts.sitting_id is
  'The paper_sittings row this attempt was derived from, when it came from a '
  'teacher-entered mark sheet; NULL for practice and assignment attempts.';

create index if not exists practice_attempts_sitting
  on practice_attempts (sitting_id) where sitting_id is not null;
