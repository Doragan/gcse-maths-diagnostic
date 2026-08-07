# Mini-exam persistence — `exam_sessions` (Increment 2)

_Scoping decisions, 2026-07-28. Follows the mini-exam assembler + runner
(Increment 1, `65c2061`, ephemeral) and the student-facing monthly-quota release
(`f704aaa`). This is the "score-over-time / re-review" increment the runner
deferred._

## Why

A submitted mini-exam is currently **ephemeral**. On submit the runner grades
every unit, shows a score, a full per-question review (verdicts, marks, trap
feedback, explanations) and a projected-mastery panel — then throws all of it
away on navigate. The only durable trace is one `practice_attempts` row per
answered part carrying `correct` alone:

```
student_id, question_id, skill_ids, correct, kind
```

So today a student **cannot re-open a paper they sat**, cannot see what they
answered, and there is no score history — the summative half of the two-currency
model (marks / exam-readiness, as opposed to the mastery substrate) has nothing
to stand on. Everything needed already exists at submit time; it is simply not
written down.

## Decisions taken

### 1. Fidelity: full re-review, not score-only — via params + answers (user, 2026-07-28)

Questions are **parametric**, so `question_id` alone cannot reproduce a paper
(re-rendering draws different numbers). The user's ruling: store only the
**parameter draw** and the **student's raw answer** — everything else is
derived.

- re-render with `fixedValues = params` (`renderQuestion` /
  `renderMultiPartQuestion`) → exact stem, prompts, correct answers, explanations
- re-run the grader (`checkAnswer` / `checkGridDraw`) on the stored answer →
  verdicts, marks, trap feedback, grid overlay

Per-unit verdicts and marks are therefore **not stored**. Consequence to accept:
a re-opened paper reflects *current* grading, so a later grader fix or question
edit can change what the review shows. That is usually desirable (it self-heals),
and the pinned summary below stops it from rewriting history.

### 2. The summary is pinned as columns, not derived

`marks_earned` / `marks_total` / `tier` / `calculator` are real columns even
though they could be recomputed. Two reasons: the history list and score trend
must render without re-grading every past paper, and the recorded score must stay
**stable** — a grader change must never silently move a point on the trend line.
This is the only deliberate redundancy; `question_ids` are *not* duplicated (they
live in the jsonb).

### 3. Client-graded v1

The runner already computes the score and per-unit results, and writes
`practice_attempts` client-side under RLS today. The session write follows the
same path, on submit, as the student's own row.

**Upgrade path (not v1):** a client-inserted score is student-forgeable. When the
score becomes teacher-facing or a grade estimate, move grading server-side (a
submit POST that re-renders and re-grades authoritatively — natural home is
alongside `/api/exam/quota`). Acceptable while it is private and already labelled
"a practice score, not a predicted grade".

## Schema

`supabase/migrations/20260728_exam_sessions.sql` — **written, awaiting the user's
SQL-editor apply** (agent cannot run DDL; migration-first, before the write code
ships).

```
exam_sessions
  id            uuid pk
  student_id    uuid not null → students(id) on delete cascade
  created_at    timestamptz not null default now()
  tier          text not null  check (foundation | higher)
  calculator    text not null  check (calc | non_calc)
  marks_earned  numeric not null      -- numeric: grid earns fractional credit
  marks_total   integer not null
  paper         jsonb not null
```

```jsonc
paper = {
  "questions": [ { "id": "<uuid>", "params": { "a": 11, "b": 3 } } ],  // order = paper order
  "answers":   { "<questionId>:<part>[:<blank>]": "<raw answer>" }     // unit keys
}
```

Answers are raw submitted strings; a `grid_draw` answer is its
`serialiseGridAnswer` form, so it round-trips through `parseGridAnswer`.

**RLS** mirrors `practice_attempts` (`20260611_rls_baseline.sql`): own-row
`SELECT` + `INSERT` only. **No UPDATE/DELETE policy or grant** — a submitted
paper is immutable, so a score cannot be edited after the fact (same reasoning as
the SEC-2b lockdown on completed `student_sessions`). Index on
`(student_id, created_at DESC)`.

## Build

1. **Extract the review phase** out of `ExamRunner.tsx` into a shared component
   taking `items + results + score`. The live runner passes live state; the
   re-review page passes re-hydrated state. This is the enabling refactor — both
   surfaces must render an identical review.
2. **Write on submit** (student variant only; the teacher preview still records
   nothing) — insert one `exam_sessions` row alongside the existing
   `recordAttempts` call. Fire-and-forget, exactly like the attempts write: the
   review must render even if the insert fails.
3. **Re-hydrate helper** (pure, testable): `paper` → `items` + `results`, by
   re-rendering each question with its stored params and re-grading each stored
   answer. Must degrade gracefully when a question was since **deleted or
   unpublished** — show the stored answer and the summary score without the
   re-rendered stem, never a crash or a blank page.
4. **History list** on the student dashboard: date · tier/calc · score %,
   newest-first, linking to the re-review.
5. **Re-review page** `/student/exam/[sessionId]` — re-hydrate, then render the
   shared review component.
6. **Score-over-time** trend (fast follow; reuses the `ProgressChart` /
   `ClassMasteryTrend` styling).

## Verification

- Unit tests on the re-hydrate helper: round-trip (serialise → re-hydrate →
  same units, answers and marks as the live submit), a multi-part + `multi_blank`
  paper, a `grid_draw` answer, and the missing-question fallback.
- Browser walk: sit a paper → confirm exactly one `exam_sessions` row with the
  right marks and answers → reopen from history → **same numbers**, own answers
  shown, review matches what was seen at submit.
- RLS check: a second student cannot read the first's session (expect 0 rows,
  not an error); `UPDATE`/`DELETE` rejected at the grant layer.
- `tsc` + `vitest` + `npm run build`.

## Deferred

- **Teacher visibility** of exam-readiness — own increment; needs the
  class-membership RLS join, and the mastery-vs-raw-detail boundary already
  settled for the class dashboard applies.
- **Section-calibrated score** (roadmap Increment 3) — v1 stores raw nominal
  marks; calibration can recompute later from the stored answers.
- **Server-grading** — see decision 3.
- Timed exam-conditions affordances, MC-in-exam, method-marks three-state
  (Increment 4), and the adaptive map-linked surfacing (the separate thread).
