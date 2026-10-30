-- ─────────────────────────────────────────────────────────────────────────────
-- The same diagnosis on homework that a live lesson already gets.
--
-- 20261023c added `misconception` to session_attempts, so a teacher running a
-- class session is told "3 pupils divided the wrong way round" rather than
-- "3 got it wrong". An assignment computed the identical value — checkAnswer
-- returns the matched trap, the trap carries the id — and discarded it, so
-- homework was the one surface with no diagnosis at all.
--
-- ── Grants: nothing to do here, and that is worth stating ────────────────────
--
-- 20261023c needed `grant insert (misconception) ... to anon, authenticated`
-- because session_attempts was locked down in 20261020 with a COLUMN-level
-- grant, which names an exact set and therefore does not cover a column added
-- later.
--
-- assignment_attempts is the other case: Supabase's default TABLE-level grants,
-- which do cover future columns. Access is gated by the aa_student_insert RLS
-- policy (auth.uid() = student_id), not by the grant.
--
-- That asymmetry is recorded in 20261023_attempt_part_counts.sql, and this
-- migration does NOT take it on trust: assignment_attempts has zero rows, so
-- the claim has never actually been exercised in production. Verified instead
-- by the error an ungated insert returns — a table-level grant fails at the
-- RLS layer ("new row violates row-level security policy"), a missing grant
-- fails before it ("permission denied for table"). The two are distinguishable
-- and were checked after applying this.
--
-- ── Why an id and not the answer the pupil typed ─────────────────────────────
--
-- Same reasoning as 20261023c, and it applies with less force here because an
-- assignment pupil is signed in and already has practice_attempts rows. The id
-- stays the right unit anyway: it is what the teacher's panel aggregates, and
-- it is comparable across questions in a way free text is not.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

alter table public.assignment_attempts
  add column if not exists misconception text;

comment on column public.assignment_attempts.misconception is
  'Id from data/misconceptions.ts for the trap that fired on a wrong answer. '
  'Null when the answer was correct, when no trap matched, or when the trap '
  'that matched is not tagged. Mirrors practice_attempts.misconception and '
  'session_attempts.misconception.';

-- No index, for the same reason as session_attempts: this column is only ever
-- read inside `where assignment_id = ...`, which is already served. The
-- cross-time analytics index lives on practice_attempts, which is the table
-- that gets queried BY misconception.

commit;
