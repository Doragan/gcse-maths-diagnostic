# Placement test: make it close the gap it exists for

_Scoped 2026-09-11. Scope only, nothing built. Written after measuring the
student placement test (`/student/diagnostic`) against its stated purpose:_

> quickly close the gap between a fresh dashboard's record and the student's
> actual level, and communicate that to the student.

## Headline

**The test measures well enough. What it learns never reaches the rest of the
app.** A single question per skill carries real signal. But every consumer of
mastery either drops that signal or shows something different from the results
screen. The fix is therefore not a better test. It is one agreed meaning for
placement evidence, computed in one place.

## What was measured

All-time data. The student test has been live since June. 26 of the 56 students
with any attempts took it.

| | |
|---|---|
| Sessions that started the test | 77 |
| …finished all 10 questions | 40 (**52%**) |
| Average score | 61% |
| Took it as their very first activity | **26 of 26** (0 prior attempts every time) |
| Signed up *before* the test, in test-then-signup sessions | 21 of 24 |
| Later accuracy on a skill answered **right** in the test | **61%** (first 5 later attempts) |
| …on a skill answered **wrong** in the test | **43%** (n = 84 later attempts in total) |
| Dashboard straight after the test (typical) | 2–3 mastered, **0 needs practice**, ~20 in progress |
| Sittings leaving **no** weak spot on the dashboard | **25 of 26** |
| Never practised again after the test | 10 of 26 |
| Came back on a second day: took test / did not | 4/26 vs 6/30 |

The 18-point accuracy gap is the headline number. The measurement works. Two
sections of this document are about why it has no effect.

## Findings

### 1. A wrong answer leaves no trace

A placement answer is stored as one ordinary `mastery` attempt. One wrong
attempt makes a skill `in_progress`, the same state as a right answer. The
student cannot see the difference, because `needs_practice` requires 5
attempts. So a 3/10 and an 8/10 produce near-identical dashboards. "Strengths
and gaps", as the dashboard's welcome card promises, never shows the gaps.

### 2. The results screen and the dashboard contradict each other

- **The results screen** runs the binary `inferPrerequisiteMastery`. A correct
  answer marks every transitive prerequisite mastered, shown as "+N
  prerequisite skills also credited" in green.
- **The dashboard** runs `applyPrerequisiteCredit` (the L2 ruling). It gives
  each prerequisite 2 synthetic correct attempts, which only ever reaches "In
  progress".

Simulated on the live 10-skill set with the real engine:

| score | results screen says credited | dashboard shows mastered |
|---|---|---|
| 10/10 Foundation | 12 | 4 |
| 10/10 Higher | 19 | 2 |
| ~6/10 (the observed average) | ~10–15 | ~1–2 |

The student is told one thing and then shown another.

### 3. It does not steer practice

`app/practice/page.tsx` computes mastery with plain `calculateMastery`, with no
prerequisite credit at all. Its accessibility filter (`getAccessibleSkillIds`)
treats `in_progress` as unlocked. So:

- a **wrong** placement answer unlocks the skills that depend on it, exactly
  like a right one;
- the prerequisite credit a right answer earns does not exist here, so it
  unlocks nothing;
- in paid weighted mode, a wrong answer has the same weight as a skill never
  touched.

The data agrees: students rarely practised the skills they had just got wrong.

### 4. Six mastery computations, three behaviours

| consumer | prerequisite credit |
|---|---|
| `app/student/dashboard/page.tsx` | L2 (2 credits) |
| `lib/skills/progressSeries.ts` | L2 |
| `lib/skills/masteryProgress.ts` (mini-exam review card) | L2 |
| `app/practice/page.tsx` (question selection) | **none** |
| `app/skills/page.tsx` (skill map dots) | **none** |
| `lib/teacherAnalytics.ts` | **none** |
| `app/student/diagnostic/page.tsx` (results screen) | **binary** |

The placement test sits on top of this disagreement and exposes it first,
because it is the first thing every student does. The same disagreement also
affects ordinary practice today (the skill map and practice selection disagree
with the dashboard). It is simply less visible there.

### 5. Smaller issues

- **The same 10 skills every time.** Selection is a fixed sort on
  `min(prereqs, dependents)`; only the question varies. It never branches on an
  answer. A perfect score touches at most **19%** of the tier's skills. At the
  cut-off, 20 skills (Foundation) and 16 (Higher) are tied on score.
- **Logged-out test answers are only imported on email/password login.**
  `pending_diagnostic` is read only in `app/student/page.tsx`. Google sign-up
  (`app/auth/callback`, ~80% of sign-ups) never imports it, and the migration
  has never fired. Low impact today, since most students sign up before the
  test, but it is a real bug.
- **The migrated rows have no timestamps**, so they all get the insert time.
  This is the same tie bug that `lib/pendingPractice.ts` was written to fix for
  practice.

## The design: placement evidence is a *prior*

One rule, which also explains itself in a sentence to a student:

> **The placement test sets a skill's starting status. Practise any skill and
> your own answers take over.**

The starting statuses:

| placement result | starting status |
|---|---|
| answered **right** | `mastered` *(placement)* |
| answered **wrong** | `needs_practice` *(placement)* |
| prerequisite of a right answer | `mastered` *(placement, inferred)* |
| not touched | not started |

_Revised while building:_ a prior holds **until the student's practice
disagrees with it**, not merely until the first real attempt.

| practice on the skill so far | status |
|---|---|
| none | the prior |
| enough to settle it (fast-track, or a full 5-answer window) | practice |
| prior mastered, every real answer right | still mastered |
| prior a gap, every real answer wrong | still a gap |
| anything else (practice disagrees) | practice |

Replacing the prior on the first real attempt would have demoted a
placement-mastered skill to "In progress" *for answering it correctly*, and
cleared a gap for getting it wrong again. Either would be the dashboard
contradicting the student's own evidence, which is the problem this plan exists
to fix.

A right answer does not reach `mastered` on one question in ordinary practice.
Under this rule it does, but only as a labelled prior that gives way the moment
practice disagrees. That is the honest reading of the results screen's existing
promise ("credited"), rather than a new claim.

Why a prior rather than feeding placement answers into the window:

- The fast-track reads a skill's *first three* attempts. A wrong placement
  answer sitting there permanently blocks it, so a student would need 4 real
  correct answers instead of 3 to master a skill they missed once on day one.
- It keeps the L2 ruling intact for practice. The binary inference applies only
  to placement evidence, and only until it is superseded.
- It gives `getAccessibleSkillIds` the right answer for free. A placement gap
  (`needs_practice`) blocks the skills above it, and placement-credited
  prerequisites unlock the skills above them.

### Engine changes (`lib/skills/masteryEngine.ts`)

1. **`kind: 'placement'`** on `Attempt`, alongside `mastery` and `exam`.
2. **`SkillMastery` gains a `source?: 'placement'` flag.** No new
   `MasteryStatus`, so `RANK`, the status palette, the weighting and the
   accessibility filter all keep working unchanged.
3. **One entry point, `studentMastery(attempts, getPrerequisiteTree)`.** It:
   - splits off placement attempts;
   - runs the existing `calculateMastery(applyPrerequisiteCredit(real))`;
   - overlays placement priors on every skill that has no real attempt.

   This becomes the only way anything computes a student's map.
4. `calculateMastery` keeps ignoring a `placement` attempt if one ever reaches
   it directly, so that no caller can double-count one.

### Callers

| file | change |
|---|---|
| `app/student/dashboard/page.tsx` | use `studentMastery`; label placement-sourced rows ("from your placement test") |
| `app/practice/page.tsx` | use `studentMastery`. **This changes selection for every student, not just test-takers — see Decision 2** |
| `app/skills/page.tsx` | use `studentMastery` |
| `lib/skills/progressSeries.ts`, `lib/skills/masteryProgress.ts` | use `studentMastery` |
| `app/practice/question/[id]/page.tsx` | exclude `placement` from `priorSkillAttempts`, so the celebration and the "N more to master" count follow the prior rule |
| `lib/teacherAnalytics.ts` | **Decision 3** |
| `app/student/diagnostic/page.tsx` | write `kind: 'placement'`; build the results screen from `studentMastery`, not `inferPrerequisiteMastery`, so the screen and dashboard cannot drift again |

### Schema

- One migration: widen the `practice_attempts.kind` CHECK (from
  `20260607_question_kind.sql`) to `('mastery', 'exam', 'placement')`.
  `questions.kind` is untouched; placement is a property of the attempt, not the
  question.
- `lib/pendingPractice.ts` normalises any unknown kind to `mastery`. It must
  pass `placement` through, or anonymous test answers get silently demoted to
  ordinary attempts.

### Anonymous import fix

Move the `pending_diagnostic` import into `migratePendingPractice` (`lib/auth`),
so every login path runs it, including both Google branches in
`app/auth/callback`. Store a per-answer `at` timestamp, as `pendingPractice`
does. Fire the existing `pending_diagnostic_migrated` event.

### Communication

The results screen needs to show three things, all computed from the same map
the dashboard will show:

1. **Strengths.** Skills answered right, plus the prerequisites credited, in
   plain words.
2. **Gaps found.** Skills answered wrong, named, with one primary action:
   **"Practise your gaps"**.
3. **The rule, once, in one line.** "These are your starting points. Practise
   any skill and your real answers take over."

The dashboard carries the same labels, so arriving there confirms the results
screen rather than contradicting it.

## Increments

**Increment 1: one meaning, everywhere.** Everything above: the kind, the
prior, `studentMastery` in every caller, the results screen rebuilt on it, the
anonymous import fix, and tests (`masteryEngine.test.ts` covers the prior
table row by row). This is the whole fix for findings 1–4.

**Increment 2: "Practise your gaps" hand-off.** A session from the results
screen targeting the gaps just found. Gated on Decision 1.

**Increment 3: adaptive selection. DO NOT BUILD YET.** Branch on answers: a
wrong answer asks a prerequisite, a right answer climbs to a dependent. Rotate
among tied skills too, so repeat takers and the aggregate data are not stuck on
one set of 10. Only worth it once Increment 1 means the answers persist.
Otherwise a smarter test just produces better-measured evidence that is thrown
away.

## Decisions

_Taken 2026-09-11: all four as recommended below. Increment 1 is built, with
the free gap session from Decision 1 included._

1. **Is "Practise your gaps" free?** Targeted practice (skill, topic and
   weak-spot focus) is paid today. Free students get a random question from the
   accessible pool, so even with gaps recorded, nothing steers a free student to
   them. Recommend **one free gap session from the results screen**. It is the
   hand-off the test exists for, and it happens at the one moment every student
   passes through. Ongoing weak-spot blitz stays paid. This is a pricing call.
2. **Accept that practice selection changes for everyone.** Moving
   `/practice` onto the shared map means L2 prerequisite credit starts counting
   there. Credited prerequisites become "attempted", which unlocks more skills
   for existing students. Recommend yes: it removes a disagreement that exists
   today regardless of the test. But it is a behaviour change for existing
   students and should be a deliberate one.
3. **What do teachers see?** Options:
   - (a) the student's full map including placement priors, labelled;
   - (b) real attempts only.

   The roadmap already ranks the diagnostic as one *low-weight* input to the
   teacher view, which argues for (b) at first, or (a) visibly labelled.
   Recommend (b) for Increment 1; revisit with the teacher dashboard.
4. **Backfill the 26 past sittings?** Their answers are stored as `mastery`
   attempts and can only be identified heuristically. Relabelling would
   suddenly give those students gaps they never saw. Recommend **no backfill**;
   the rule applies to new sittings only.

## How we'll know it worked

Re-run the same measurements. Baselines are above.

| metric | today | Increment 1 target |
|---|---|---|
| Sittings leaving ≥1 visible gap (score < 10/10) | 1 of 26 | all |
| Results screen agrees with dashboard (credited vs shown) | no | identical by construction (test) |
| Share of post-test practice on skills answered wrong | low (measured per student) | clearly higher (needs Increment 2) |
| Took test, never practised again | 10 of 26 | down |
| Second-day return after the test | 4 of 26 | watch; small n, don't over-read |

New events: `placement_gaps_practice_clicked` (results screen),
`dashboard_placement_gaps_clicked`, and `placement_first_practice` (a student's
first real answer on a skill the test judged, carrying both verdicts). The last
measures whether the prior was right. It is the same accuracy comparison as the
61% / 43% finding above, now recorded automatically.

## Recommendation

Build **Increment 1** once Decisions 2–4 are settled. Take Decision 1 with it
if the free gap session is agreed, since that is what turns a recorded gap into
practice. Leave adaptive selection on the shelf until the rebuilt test has
produced a few weeks of measured data.
