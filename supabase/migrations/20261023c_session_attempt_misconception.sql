-- ─────────────────────────────────────────────────────────────────────────────
-- Why a session answer was wrong, not just that it was.
--
-- checkAnswer already returns the authored trap an answer matched, and that
-- trap already carries a `misconception` id from data/misconceptions.ts. The
-- practice flow has persisted it since 20260824_attempt_misconception.sql.
-- A class session computed exactly the same value and threw it away, so a
-- teacher watching a live lesson could be told "7 got this wrong" and never
-- "7 dropped the minus sign".
--
-- ── Why an id and not the answer the pupil typed ─────────────────────────────
--
-- The obvious alternative is to store the submitted answer and let the teacher
-- read the wrong ones. That is new free-text content, typed by a child, in the
-- table this feature's whole data-protection position rests on (docs/audit/29
-- §4.5). A short id from a fixed vocabulary of 43 carries most of the
-- diagnostic value and none of that cost: it says what the mistake WAS, which
-- is the thing a teacher acts on, and it cannot carry a name, a message or
-- anything else a pupil might type into an answer box.
--
-- ── Coverage is partial, by design ───────────────────────────────────────────
--
-- Measured over the 276 published questions at the time of writing: 229 carry
-- at least one trap, and 150 carry at least one TAGGED trap (280 of 620 traps
-- have an id). Null is legal and common — the answer was right, no trap
-- matched, or the trap that matched is untagged — and the teacher's panel
-- counts only what it has rather than implying the rest were untagged
-- successes.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

alter table public.session_attempts
  add column if not exists misconception text;

comment on column public.session_attempts.misconception is
  'Id from data/misconceptions.ts for the trap that fired on a wrong answer. '
  'Null when the answer was correct, when no trap matched, or when the trap '
  'that matched is not tagged. Mirrors practice_attempts.misconception.';

-- ── The grant, which is the part that actually matters ───────────────────────
--
-- session_attempts is written by SIGNED-OUT pupils, so its INSERT privilege is
-- COLUMN-LEVEL (20261020_class_sessions.sql):
--
--   grant insert (session_id, participant_id, question_id, correct)
--     on public.session_attempts to anon, authenticated;
--
-- A column-level grant does not extend to columns added later. Without the
-- line below the new column is simply not insertable, and — the trap that bit
-- 20261023_attempt_part_counts.sql — the failure is at the far end of a pupil
-- device in a classroom, not anywhere a test would look.
grant insert (misconception) on public.session_attempts to anon, authenticated;

-- No index. practice_attempts has one because it is queried BY misconception
-- across all of time for analytics; this column is only ever read as part of
-- `where session_id = ...`, which session_attempts_session_time already
-- serves. An index here would cost every insert in a live lesson and be read
-- by nothing.

commit;
