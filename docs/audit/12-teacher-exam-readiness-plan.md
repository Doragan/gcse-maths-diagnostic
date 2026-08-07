# Teacher-facing exam readiness — scope

_Scoped 2026-08-01. The deferred half of `08-exam-sessions-plan.md` ("Teacher
visibility of exam-readiness — own increment; needs the class-membership RLS
join"). Everything the student side needs now exists, so this is the increment
that turns it into something a paying teacher sees._

## Why now

The teacher dashboard shows the **mastery** currency — which topics a class has
built. It shows nothing of the **marks** currency, because until Increment 4
there was nothing to show: no stored papers, no calibrated marks, no trend.

All three now exist, and the class-analytics machinery is already shaped to take
them. The gap is one RLS boundary.

## What already exists (this increment is mostly plumbing)

| | where |
|---|---|
| `classes` + `class_memberships`, `teacher_owns_class`, `is_active_class_member` | `20260605_classes_and_memberships.sql` |
| A cross-account read RPC to copy exactly | `20260615_class_mastery_rpc.sql` |
| `computeClassAnalytics` / `StudentAnalytics` | `lib/teacherAnalytics.ts` |
| `ClassAnalytics`, `StudentDetailModal` (already hosts a per-student chart) | `components/` |
| `exam_sessions` with PINNED `marks_earned`/`marks_total`/`tier`/`calculator` | `20260728_exam_sessions.sql` |
| `buildScoreTrend` + `ScoreTrend` — date-bucketed, gap-preserving | `lib/exam/scoreTrend.ts` |
| `rehydratePaper` + shared `ExamReview` | `lib/exam/examSession.ts` |

**The convenient fit:** `buildScoreTrend` takes exactly
`{id, created_at, tier, calculator, marks_earned, marks_total}` — precisely the
columns the new RPC returns. The whole bucketing/averaging/gap-preservation
story drops in per student unchanged, so a teacher's view of a student's trend
is literally the same chart the student sees.

## Decisions taken

### 1. The teacher CAN see the paper (user, 2026-08-01)

> "The teacher could see the paper. There's no reason why not now that we save
> the papers."

This **departs from the practice boundary and should**: the mastery RPC
deliberately withholds `question_id` and the submitted answer, because private
study is not the teacher's business. An exam is assessment — reading the script
is what marking IS.

So `paper` is exposed. But **not in the list**: the jsonb carries every question
id and every answer, and shipping it for every session of every student to
render a summary table would be wasteful and slow. Two functions:

- `get_class_exam_sessions(_class_id)` — summary rows only, for the dashboard.
- `get_class_exam_paper(_session_id)` — one paper, when a teacher opens it.

Same gate on both: caller owns the class AND the row's student is an active
member.

### 2. No qualitative descriptor — carried over deliberately

The class dashboard shows percentages and **no status word**. The user rejected
"strong / developing / concern" outright: a low figure usually means *not taught
yet*, and a label brands a student who is doing fine.

Exam readiness must inherit that. A score, a trend, a count of papers — never
"on track" or "at risk". The temptation is stronger here because a mark feels
like a grade, which is exactly why the rule matters more.

### 3. Readiness is NOT scoped to covered material

`class_skill_coverage` scopes the mastery denominator to what a teacher has
taught. Exam readiness must **not** be scoped, because a mini-exam is
deliberately a representative whole-curriculum paper — that is the point of the
marks-first blueprint, and the user reaffirmed it when rejecting adaptive
surfacing ("the exam should be representative of what a student could see").

Scoping the score would make it incomparable between students *and* between
papers. State it in the caption so a teacher reads a low early score correctly.

### 4. The list shows the pinned floor, not the band

`marks_earned` is the confirmed floor. The three-state band is **re-derived**,
which needs the questions rehydrated and re-graded — far too heavy for a class
list. So: the summary shows the pinned score; the band appears only when a
teacher opens a paper, where `ExamReview` already computes it.

This also keeps the teacher's number identical to the student's, which is worth
more than the extra precision.

## Build

1. **Migration** `20260801_class_exam_readiness.sql` — the two RPCs above,
   `SECURITY DEFINER`, `REVOKE` from `anon`, `GRANT` to `authenticated`.
   **Agent cannot run DDL — the user applies this in the SQL editor.**
2. **Pure analytics** in `lib/teacherAnalytics.ts` (or a sibling): per student
   `{ papersSat, latest, best, average, trend }`, plus a class aggregate.
   Composes `buildScoreTrend`; unit-tested with no UI, as `scoreTrend` was.
3. **Fetch** alongside `getClassAnalytics`, degrading to "no exam data" on error
   so the dashboard still renders **before the migration is applied** (the same
   graceful-degradation `getClassCoverage` uses).
4. **Class list** — a readiness figure per student in `ClassAnalytics`.
5. **Student detail** — the `ScoreTrend` chart inside `StudentDetailModal`,
   beside the mastery trend it already shows, plus a list of papers.
6. **Paper view** — a teacher route rendering the shared `ExamReview` from
   `rehydratePaper`. Reuses the student re-review page's shape entirely.

## Verification

- Unit tests on the pure analytics (empty class, one paper, mixed tiers, a
  student with no papers).
- **RLS is the risk and needs empirical proof, not reasoning**: a teacher who
  does NOT own the class gets 0 rows; a student who has left (status flipped)
  disappears; a plain `select` on `exam_sessions` still returns only your own.
  Same shape as the checks run for the mastery RPC.
- Seeded test student for a populated view (as "Firefox" was seeded for the
  mastery trend), then a throwaway lab page — teacher pages are auth-gated and
  the agent cannot log in.
- tsc / vitest / CI-parity lint / build.

## Risks and constraints

- **`exam_sessions` is near-empty in production.** The empty state is what most
  teachers will actually see for a while, so it deserves the same care as the
  populated one. It cannot be verified against real data.
- **The migration gates everything.** Steps 2–6 can be written and unit-tested
  first, but nothing renders until it is applied. Build in that order so the
  wait costs nothing.
- **Exposing `paper` is a real widening** of what one account can read of
  another. It is the user's explicit decision and the gate is the same proven
  one — but it is worth a deliberate RLS check rather than assuming the copied
  template carried over correctly.
- **Not in scope:** assigning mini-exams to a class (a teacher setting papers),
  which is a separate build on the assignments thread.
