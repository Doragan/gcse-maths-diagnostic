-- Increment 2 of the equivalence-grader work: storage for two new things the
-- grader (lib/questions/answerChecker.ts) already supports.
--
-- 1) requires_simplest — did the question demand simplest form? Drives the
--    "not simplified" nudge for fraction/ratio answers (and, later, exam-mode
--    mark loss). Default TRUE preserves today's always-nudge fraction behaviour;
--    every existing row keeps grading exactly as before.
--
-- 2) Two new answer_type values — 'ratio' and 'coordinate'. The questions table
--    may or may not carry a CHECK constraint on answer_type (its base schema
--    predates this migrations folder), so we drop any existing answer_type CHECK
--    and re-add an inclusive one. Live values are a subset of the list below
--    (numeric, exact, expression, fraction, set), so this cannot fail on data.
--
-- Apply BEFORE deploying the increment-2 code (it reads/writes requires_simplest
-- and persists ratio/coordinate answer types). Additive + safe-default, mirroring
-- the calculator/kind/parts columns. Run via the Supabase SQL Editor.

alter table public.questions
  add column if not exists requires_simplest boolean not null default true;

do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where rel.relname = 'questions'
      and nsp.nspname = 'public'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%answer_type%'
  loop
    execute format('alter table public.questions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.questions
  add constraint questions_answer_type_check
  check (answer_type in ('exact', 'numeric', 'fraction', 'expression', 'set', 'ratio', 'coordinate'));
