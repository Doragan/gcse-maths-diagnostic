# Calculator mode in practice — scoping plan

_Scoped 2026-08-30, from the "what's outstanding, non-question-bank" backlog
review. Scope-only — nothing here is built. Small enough that it doesn't need
increments; it needs three decisions and then it's a single build._

## Headline

Every question already carries `calculator: 'calc' | 'non_calc' | 'na'`
(`lib/questions/calculator.ts`), but only the mini-exam assembler reads it.
`/practice` has no calculator awareness at all — a student revising for the
non-calculator paper gets calculator-only content mixed in with no way to
exclude it.

The mechanism to copy already exists and is already live: the mini-exam's
`calcEligible` rule (non-calc mode admits `non_calc` + `na`; calc mode admits
everything) has been running in production since the exam runner shipped. This
is not a new policy decision, just a second consumer of one already-validated
rule.

The one thing that makes this more than a one-line filter is **pool depth**:
some skills are calculator-only end to end, and a strict filter would starve
them silently. That's the real scoping question below, not the plumbing.

## What already exists

| | where |
|---|---|
| The tri-state type + DB column | `lib/questions/calculator.ts`; `questions.calculator` |
| The exact eligibility rule to reuse (non-calc admits `non_calc`+`na`; calc admits all) | `calcEligible()`, `lib/exam/assembler.ts:74-76` |
| The identical staged-preference problem, already solved once | `lib/skills/tierPreference.ts` — localStorage-first, bridges the existing `sessionStorage` key, DB column deliberately deferred |
| The toggle UI to copy (segmented Foundation/Higher/Both control) | `app/practice/page.tsx:321-338` (`styles.toggle`/`styles.toggleButton`) |
| The "clear focus targets that may not exist under the new setting" guard, already written for tier | `app/practice/page.tsx:327` |
| The zero-pool guard, already generic | `app/practice/page.tsx:427` — Start is `disabled={loading || !questionCount || ...}`, so an empty filtered pool already blocks Start with no new UI needed |
| Paid-only precedent for restricting the practice pool | skill/topic/weakspot focus modes, `app/practice/page.tsx:22-25`, gated on `isPaidStudent` |

## The real design question: pool depth, not eligibility

Queried the live bank (256 published questions, 140 skills with ≥1 question):

| | count | single-part | multi-part |
|---|---|---|---|
| `calc` | 59 | 49 | 10 |
| `non_calc` | 52 | 43 | 9 |
| `na` | 145 | 124 | 21 |

Applying the assembler's rule, a non-calc filter's eligible pool is
`non_calc + na` = 197 of 256 — healthy in aggregate. The risk is per-skill:

- **18 skills are 100% `calc`** — non-calc mode would return zero questions for
  them, full stop: `sector_calculations`, `trigonometry_missing_sides`,
  `sine_rule`, `cosine_rule`, `growth_and_decay`,
  `surface_area_of_a_cone/sphere/cylinder`, `volume_of_a_pyramid_and_cone`,
  `histograms`, `cumulative_frequency`, `sampling`, `grouped_frequency_tables`,
  `area_of_triangle_sine`, `solving_quadratic_equations_quadratic_equation`,
  `circumfrence_of_a_circle`, `exact_calculations`, `trigonometry_missing_angles`.
- **A further 95 skills** have only 1–2 non_calc/na questions — thin enough that
  a dedicated non-calc drill session on one of them repeats near-immediately.

**Why this is a low-severity gap rather than a blocker.** `/practice`'s default
"auto" mode draws from a wide weighted pool across many skills at once
(`getWeightedSkillPool`), so a filtered draw rarely dead-ends completely — if
even one currently-weighted skill has eligible content, a question is served.
The dead-end case is narrow: a **paid** student who has also chosen **single-skill
focus** on one of the 18 100%-calc skills, then switches to non-calc mode. That
already surfaces as "0 questions available" with Start disabled — correct,
just unexplained. Worth a one-line message eventually ("no non-calculator
questions for this skill yet"), not worth blocking v1 on.

## Where the filter plugs in

Filtering belongs at the **question-fetch level**, not the skill-pool level —
skills are calculator-agnostic (a skill can have a mix of tags), so
`getWeightedSkillPool` / `getAccessibleSkillIds` stay untouched. Four call
sites need the same predicate added to their `.overlaps('skill_ids', …)` query:

1. `app/practice/page.tsx` `loadQuestionCount()` — the "N questions available" label.
2. `app/practice/page.tsx` `startPractice()` — the initial pick, and its fallback query.
3. `app/practice/question/[id]/page.tsx` `fetchQuestionPool()` — feeds both `prepareNext` and `nextQuestion`; shared via a module-scope `poolCache`.

**One easy-to-miss bug in waiting:** `poolCache` is presently keyed by skill set
only. If calculator mode is threaded in without extending that cache key, a
student who switches mode mid-session would silently keep drawing from the
pool cached under the previous mode. The cache key needs the calculator mode
folded in.

**Worth extracting while touching this:** `calcEligible` currently lives only
inside `lib/exam/assembler.ts`, in-memory over an already-fetched candidate
array. Practice needs the same rule expressed as a SQL predicate
(`.in('calculator', ['non_calc', 'na'])` for non-calc mode, no filter for calc
or mixed). Lifting the rule itself into `lib/questions/calculator.ts` as a
single named export both sites call keeps the two consumers from drifting
apart if the rule is ever revisited.

## Where the choice lives

Follow `tierPreference.ts` exactly rather than inventing a second pattern:
`lib/questions/calculatorPreference.ts`, `localStorage` key
(`mathsense_calculator_mode`), bridging a `sessionStorage` key
(`practice_calculator`) the same way tier bridges `practice_tier`. No
migration, no `students` column, in v1 — deliberately the same staged
deferral tier already uses, for the same reason: this is a trial of the
feature shape, not yet a commitment to a schema change.

**Default: `'mixed'`** (today's unfiltered behaviour). A returning student sees
no change until they opt in — the same safe-default reasoning `tierPreference`
uses for defaulting to Foundation.

## UI

Reuse the exact segmented-toggle component already sitting on this screen for
tier (`app/practice/page.tsx:321-338`) — a second control, same visual
language, directly below it: **Mixed / Non-calculator / Calculator**. Switching
it should run the same defensive clear the tier toggle already does for focus
targets (`app/practice/page.tsx:327`) — a focus target valid under Mixed can be
empty under Non-calculator.

## Explicitly out of scope

- **No in-app calculator widget.** This is a pure eligibility filter, exactly
  matching what the mini-exam already assumes: the student supplies their own
  calculator, or doesn't, and the app only controls which questions can appear.
  Confirmed no calculator UI exists anywhere in `components/` today.
- **No change to the mini-exam's own calculator choice or `exam_sessions.calculator`.**
  That's an already-shipped, per-attempt record of which mode a given paper was
  sat under — a different concept from a standing practice preference, and not
  touched by this.
- **No DB migration / persistent account-level column in v1** — same staged
  deferral as tier; revisit together if either graduates to a `students` column.
- **No new empty-state copy.** The existing disabled-Start-on-zero-count
  behaviour is inherited as-is; the "0 questions, no explanation" case above is
  noted but not fixed here.

## Decisions (settled 2026-08-30)

1. **Persistent** — localStorage, follows the student back next visit, mirrors tier.
2. **Free** — no paid gate, matching the mini-exam's own calc/non-calc split.
3. **Default `'mixed'`** — today's unfiltered behaviour; no change for existing users.

All three match this doc's recommendations. Scoping is complete; nothing here blocks starting the build.

## Build surface (small)

- **New:** `lib/questions/calculatorPreference.ts` (~40 lines, mirrors
  `tierPreference.ts` almost line for line).
- **Edit:** `lib/questions/calculator.ts` — extract the shared eligibility
  predicate so the assembler and practice both call one definition.
- **Edit:** `app/practice/page.tsx` — toggle UI; thread the mode into the count
  query and both `startPractice` fetches; extend the tier-switch focus-clearing
  guard to also fire on a calculator-mode switch.
- **Edit:** `app/practice/question/[id]/page.tsx` — thread the mode into
  `fetchQuestionPool`; extend `poolCache`'s key to include it.
- **No migration.** Tests: preference get/set (`tierPreference.ts` itself has
  no test file today, so this would be the first — worth adding both), and the
  extracted eligibility predicate's three cases.

## Built — and one asymmetry worth recording (2026-08-30)

Built with a genuinely new, symmetric rule rather than a reuse of
`calcEligible` (see `calculator-practice-toggle` / PR #38 for why: the
assembler's rule models paper structure and would make Calculator mode behave
identically to Mixed). `calculatorValuesFor` in `lib/questions/calculator.ts`
excludes `non_calc` from Calculator mode and `calc` from Non-calculator mode;
`na` is eligible under both.

**The Foundation pool is 53% `na`** (110 of 206), so the toggle narrows the
pool far less than its three-way UI implies:

| filter | admits | count |
|---|---|---|
| Mixed | everything | 206 |
| Non-calculator | 47 `non_calc` + 110 `na` | 157 |
| Calculator | 49 `calc` + 110 `na` | 159 |

Non-calculator and Calculator overlap in their shared 110 `na` questions,
which is why the two counts don't sum to Mixed's — raised by the user after
shipping, checked against the live bank rather than reasoned about, and left
as-is deliberately. The two modes are not equally strong: **Non-calculator is
a real guarantee** (nothing in it needs a calculator, the reason the toggle
exists). **Calculator is weak** — it only removes the 47 questions a
calculator would trivialise, so a student picking it still gets mostly
calculator-neutral content rather than a pool concentrated on genuine
calculator practice. Narrowing it to `calc` alone (49 for Foundation, thin but
usable) was offered and explicitly declined for now — revisit if the current
behaviour turns out to disappoint students expecting calculator-paper drilling
specifically.
