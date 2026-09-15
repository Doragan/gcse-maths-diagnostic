-- ─────────────────────────────────────────────────────────────────────────────
-- A class must outlive the teacher who created it.
--
-- Step 3 of docs/audit/20-school-accounts-design.md, §4. Found by introspecting
-- the constraints on 2026-09-14: every link from auth.users down is
-- ON DELETE CASCADE.
--
--   auth.users -> teachers -> classes     -> class_memberships
--                          -> assignments -> assignment_targets
--                                         -> assignment_attempts
--
-- So deleting ONE teacher's account destroys their classes, every membership row
-- in them, every assignment, and EVERY STUDENT'S ATTEMPTS at those assignments.
-- That last one is other people's work, removed by a third party's account
-- deletion, which contradicts the principle the rest of this design rests on:
-- the student owns their account and their record.
--
-- For an individual teacher that is untidy. For a school it is an operational
-- hazard — staff turnover is normal, and a school buying seats cannot have a
-- leaver's account deletion erase class records and pupil work.
--
-- ── The fix: SET NULL, not CASCADE ──────────────────────────────────────────
-- A class whose teacher is gone becomes unowned rather than deleted, and — now
-- that classes carry a school_id — the school still owns it. Reassignment is one
-- update.
--
-- ⚠ NO RLS CHANGE IS NEEDED, and that is worth being explicit about rather than
-- assuming. Every ownership test compares the column to auth.uid():
--
--   classes_teacher_select        auth.uid() = teacher_id
--   teacher_owns_class()          c.teacher_id = _uid
--   assignments_teacher_select    auth.uid() = teacher_id
--   teacher_owns_assignment()     teacher_id = _uid
--
-- NULL is never equal to anything in SQL, so an unowned class or assignment is
-- invisible to every teacher until a human reassigns it. The safe default falls
-- out of the null semantics; nothing needs to be added to enforce it.
--
-- ── paper_sittings.marked_by ────────────────────────────────────────────────
-- Included because it is the same idea and the same family. It is `not null
-- references teachers(id)` with NO on-delete clause, which defaults to NO
-- ACTION — so a teacher who has ever marked a paper cannot be deleted at all.
-- The delete fails with a foreign-key violation naming the table, which is
-- precisely the failure account deletion would hit (see PR #78).
--
-- Making it nullable and SET NULL keeps the sitting, which is the STUDENT's
-- record, and loses only the attribution. That is the intent the table already
-- states for its class_id column: "ON DELETE SET NULL so deleting a class
-- orphans rather than destroys the gradebook record, matching the recorded
-- 'pseudonymise, don't delete' intent." Applying the same rule to marked_by
-- makes the table consistent with itself.
--
-- No policy consequence: paper_sittings has exactly one policy,
-- paper_sittings_student_select (auth.uid() = student_id). Every teacher read
-- goes through a service-role route.
--
-- ── ⚠ DEPLOY ORDER — SQL FIRST, THEN THE CODE ───────────────────────────────
-- This inverts the project's usual rule ("deploy code first, then lock the DB"),
-- so it needs saying. Both migrations here are purely additive and relaxing: a
-- new nullable column, and NOT NULL constraints dropped. Nothing the currently
-- deployed code does becomes invalid, so applying first is safe.
--
-- The code in this PR reads `classes.school_id`, which does not exist until the
-- other migration is applied. Deploying the code first would break the class
-- join route. Apply both files, then deploy.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- The foreign keys were created unnamed in 20260605 / 20260606 / 20260812, so
-- they carry whatever name PostgreSQL assigned. Look it up by the column it
-- covers rather than guessing the name: guessing, and guessing wrong, would
-- leave the old CASCADE constraint in place beside the new one.

-- ── classes.teacher_id ───────────────────────────────────────────────────────
do $$
declare cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.classes'::regclass
    and c.contype = 'f'
    and c.conkey = array[(select attnum from pg_attribute
                          where attrelid = 'public.classes'::regclass
                            and attname = 'teacher_id')];
  if cname is not null then
    execute format('alter table public.classes drop constraint %I', cname);
  end if;
end $$;

alter table public.classes alter column teacher_id drop not null;

alter table public.classes
  add constraint classes_teacher_id_fkey
  foreign key (teacher_id) references public.teachers(id) on delete set null;

-- ── assignments.teacher_id ───────────────────────────────────────────────────
do $$
declare cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.assignments'::regclass
    and c.contype = 'f'
    and c.conkey = array[(select attnum from pg_attribute
                          where attrelid = 'public.assignments'::regclass
                            and attname = 'teacher_id')];
  if cname is not null then
    execute format('alter table public.assignments drop constraint %I', cname);
  end if;
end $$;

alter table public.assignments alter column teacher_id drop not null;

alter table public.assignments
  add constraint assignments_teacher_id_fkey
  foreign key (teacher_id) references public.teachers(id) on delete set null;

-- ── paper_sittings.marked_by ─────────────────────────────────────────────────
do $$
declare cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.paper_sittings'::regclass
    and c.contype = 'f'
    and c.conkey = array[(select attnum from pg_attribute
                          where attrelid = 'public.paper_sittings'::regclass
                            and attname = 'marked_by')];
  if cname is not null then
    execute format('alter table public.paper_sittings drop constraint %I', cname);
  end if;
end $$;

alter table public.paper_sittings alter column marked_by drop not null;

alter table public.paper_sittings
  add constraint paper_sittings_marked_by_fkey
  foreign key (marked_by) references public.teachers(id) on delete set null;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
-- Read the delete rules back. EXPECT 'n' (SET NULL) in confdeltype for all
-- three, where it was 'c' (CASCADE) for the first two and 'a' (NO ACTION) for
-- marked_by:
--
--   select c.conrelid::regclass as tbl, c.conname, c.confdeltype
--   from pg_constraint c
--   where c.confrelid = 'public.teachers'::regclass and c.contype = 'f'
--   order by 1;
--
-- And confirm the columns are nullable now:
--
--   select table_name, column_name, is_nullable
--   from information_schema.columns
--   where table_schema = 'public'
--     and (table_name, column_name) in
--         (values ('classes','teacher_id'),
--                 ('assignments','teacher_id'),
--                 ('paper_sittings','marked_by'));
--
-- There is nothing to smoke-test in the app: no teacher has been deleted, so no
-- row has a null owner yet. The behaviour this buys only shows up the first time
-- a teacher account is removed, which is exactly when it is too late to add it.
