# Exam conditions — timing, multiple choice, three-state marks (Increment 4)

_Built 2026-07-30. Follows the marks-first assembler (Increment 4 of the mark
work, `docs/audit/10-…`) and the score-over-time trend. Completes the
"Increment 4" line item in `08-exam-sessions-plan.md`: timed exam-conditions
affordances, multiple-choice support in exams, and method marks._

## Why: the score was systematically low, not merely cautious

The mini-exam score is labelled "a practice score, not a predicted grade", which
reads as caution. It was worse than cautious — it was **biased**.

Coding `mark_split` across the 12 papers in `data/exam-audit/`:

| | marks | share |
|---|---:|---:|
| total | 960 | |
| in parts carrying an M code | 541 | 56% |
| **that are method marks (M)** | **232** | **24%** |

A real examiner pays for a sound approach behind a wrong answer. We mark the
final answer only, so **a quarter of every paper's marks were unreachable**.
Applying grade boundaries to that would have produced a confidently wrong grade,
which is the one failure a summative score cannot survive.

The blind spot has a clean floor, and it is not a rounding artefact: across
**149 coded 1-mark parts, not one carries a method mark**. When the only mark is
the answer there is no method to buy. So the model only ever engages on parts
worth 2+.

Method marks per part, by part size (the table now emitted into
`markEvidence.data.ts` as `METHOD_SHARE_BY_MARKS`):

| part | parts | method marks | per part |
|---:|---:|---:|---:|
| 1 | 149 | 0 | 0.00 |
| 2 | 139 | 62 | 0.45 |
| 3 | 103 | 96 | 0.93 |
| 4 | 41 | 49 | 1.20 |
| 5 | 12 | 25 | 2.08 |

## Decisions taken

### 1. Three states, and the floor is what gets recorded (user, 2026-07-30)

`earned` / `unknown` / `lost`. A wrong-but-attempted answer on a 2+ mark part
tags its method share **`unknown`, not 0**.

The user's ruling on presentation: **lead with the confirmed floor, band
beneath**. So the score card reads `5 / 13` big, with "Likely 5–6 with method
marks" under it. Rationale: the floor is a number we can defend, and it keeps
`exam_sessions.marks_earned` — and therefore every point already on the score
trend — meaning exactly what it meant before.

`unknown` is an **expectation, not a ceiling**. It averages over all parts of a
size, including the many whose schemes award no method at all. A 3-mark part
could be M2 A1 or B3; 0.93 is what the mix comes to. Using the maximum
(`marks − 1`) would have turned a bad paper into a good-looking one.

**A blank earns nothing — not even uncertainty.** No work means no method, and
that distinction is what keeps attempting worthwhile.

### 2. Traps can resolve the uncertainty (user's addition, 2026-07-30)

> "If a trap fires it could indicate that method marks were picked up (such as
> if the last step was wrong). Could we integrate this into the mark logic?"

Yes — per trap, because sampling the bank's 567 published traps shows the two
flavours are roughly evenly split and **not** auto-classifiable:

- sound method, missed last step → a real scheme pays M1
  _"you added the coordinates but didn't halve them"_, _"you forgot to take the
  square root"_, _"you've found the maximum, not the difference"_
- wrong method → pays nothing
  _"that is the area; the question asks for the perimeter"_, _"you used πr³"_,
  _"a power of ½ means square root, not divide by 2"_

So `PartTrap` gains optional `method_marks`. Three settings, and the first two
are different claims:

- **unset** — marks stay `unknown` and widen the band. Nothing is invented.
- **0** — the author has ruled it earns nothing. No uncertainty.
- **n** — confirmed method marks, added to the score.

Gated hard in `verify-question.ts` (integer, ≥ 0, ≤ marks − 1) because these
marks are *added to a real score*; clamped again at grading time so bad data can
never manufacture marks.

**Authoring surface: 313 traps** sit on parts worth 2+ marks and could carry a
value. That is a reviewable content batch, not something to guess — and content
is the user's gate. **Still to do.**

### 3. Multiple choice belongs on a paper (evidence, not preference)

The instinct is that MC is unfaithful to a GCSE maths paper. The coded series
says otherwise: **22 parts / 30 marks**, on 8 of 12 papers, 0–6 marks each
(~3%). 17 of the 22 are worth exactly 1 mark.

So `candidateOf` no longer excludes them, and **an MC question is worth 1 mark**
unless the author overrides — because picking from a list shows no working,
which is also why MC can never earn method marks.

Measured over 60 assembled papers per tier/mode, MC came out at **0.5–1.9%** of
marks — *under* the real 3.1%, so no cap was needed. This also unblocks three
skills that were previously unreachable in exam mode because MC was their only
question type: `factorising_quadratics`, `exact_trig_values`,
`properties_of_3d_solids`.

**The trap here was determinism.** A stored paper keeps only ids, params and raw
answers; `buildOptions` shuffled with `Math.random`, so a re-opened paper would
have shown the options in a different order — the "C" in the review would not be
the "C" that was ticked. Options are now shuffled from a seed derived from the
question id and its parameter draw. Practice deliberately keeps the random
shuffle: meeting the same question twice should not drill the answer's position.

### 4. Timing derives from the real rate, and reads the wall clock

AQA GCSE Maths is 80 marks in 90 minutes on every paper of both tiers →
**67.5 seconds per mark**. Derived from the paper's *own* total, because the
marks-first assembler lets that move a mark or two and a fixed allowance would
quietly make the short papers the generous ones. Measured: 27.0–29.5 minutes.

Timed is the **default**, with an untimed option — pacing is part of the exam,
but a student building confidence should be able to switch it off.

The countdown is computed from a start **timestamp**, never decremented by an
interval: a background tab has its timers throttled or stopped, so a
decrementing counter would silently hand back time spent elsewhere.

Amber at 5 minutes, red in the last — plus screen-reader announcements at those
two thresholds only, since a clock reading itself aloud every second would make
the page unusable.

### 5. Timing rides in the `paper` jsonb; the band is not stored at all

`PaperMeta` (`timed` / `allowedSeconds` / `elapsedSeconds` / `autoSubmitted`)
goes inside the existing jsonb — no migration, since nothing queries or
aggregates it.

The **band is deliberately not persisted**. It is re-derived by `gradeUnits` on
re-open. It is an estimate about marks we never saw, so it *should* improve when
the estimate does, and nothing depends on it holding still — the exact opposite
of `marks_earned`, which is pinned precisely so it cannot move.

## Verification

- `tsc` clean; **499 tests** (up from 460) — 17 on the three-state model, 13 on
  timing, 8 on exam MC, plus the rewritten assembler assertion.
- CI-parity lint (`eslint` over `git ls-files`) **0 errors**; build succeeds.
- `audit-bank.ts` over 227 published: 0 render errors, 0 broken traps.
- Harness gate proven to fire on `method_marks: 3` on a 3-mark part and on a
  fractional `1.5`.
- Browser walk of the review (throwaway `/examlab`, since the exam pages are
  auth-gated) covering all five mark states, the MC list, the auto-submit
  notice, and clock colours at 28:00 / 5:00 / 0:47. MC order verified **byte
  identical** across a reload.
- Measured MC share and band size against the real papers (table above).

**Not exercised live:** the ticking countdown and auto-submit-at-zero inside the
running phase, which is behind student auth. The arithmetic is unit-tested and
the effect is guarded (a ref against double-submit, `allowed <= 0` against an
instant one), but the wiring itself has not been watched in a browser.

## Outstanding — carried forward 2026-07-31

Recorded after the merge (PR #17, `237aa2f`). Ordered by how much they cost if
left alone, not by effort.

### 1. ~~The ticking clock has never been watched run~~ — CLOSED 2026-07-31

**User sat a timed paper and confirmed the timeout behaves as expected.** Original note follows.

The one thing shipped without live exercise. `remainingSeconds` /
`allowanceSeconds` / `urgencyOf` are unit-tested and the auto-submit effect is
guarded twice — a ref against double-firing, `allowed <= 0` against an instant
one — but the wiring itself was never observed, because the exam pages are
behind student auth and the review was verified through a throwaway page.

**What to do:** sit one timed paper end to end. Watch for the countdown ticking
down (not frozen, not double-speed), the amber flip at 5:00, the red at 1:00,
and the paper submitting itself at 0:00 exactly once. A second submit, or a
paper that submits the moment it opens, is the failure mode to look for.

### 2. ~~42 coincidental trap collisions blunt the harness~~ — DONE 2026-07-31 (`f6791be`)

Both suggested routes turned out to be half-right, because the collisions are
two different things:

- **Degenerate draw** — a particular combination makes the WRONG METHOD give the
  RIGHT answer (`a*c+b` meets `a+b+c` at `a=c=2`), so the question silently stops
  discriminating. A constraint removes it. **24 applied across 23 questions.**
- **Inapplicable trap** — the trap models "you didn't do step X" and step X was a
  no-op on those draws ("forgot to round up" IS right when the digit is below 5).
  Nothing is wrong, and constraining it would telegraph the answer.

Whether a constraint EXISTS is what separates them, so the harness now searches
for one: found → FAIL naming it, not found → WARN. **86/86 pass, 0 failures.**

Worth knowing if this is revisited: a colliding trap never mis-marks a correct
answer — `checkAnswer` returns on `correct` before the trap loop — so the harm
was always about discrimination, not marking. And a fix is only proposed from an
EXHAUSTIVE enumeration; on a sample, a constraint removing the collisions you
happened to see proves nothing.

### 3. The 175 unset zeros

Traps judged wrong-method in the review pass, deliberately left unset so they
keep contributing uncertainty rather than asserting "no method here" (the user's
ruling — a wrong award inflates a score, a missing one merely widens a band).

Converting them would tighten the band and make the score more precise. Do it
only with an appetite for reviewing them; the proposal at
`11-trap-method-marks.json` already holds a `method_marks: 0` for each.

### 4. Content bug: a trap with no feedback

Question `0270e0be…`, trap 3 (`standard_form`): the `response` field contains
only the correct-answer template, so a student who hits it sees a bare number
where an explanation should be. Found in passing during the trap review;
unrelated to method marks.

## Deferred by design

- **Self-review mop-up** (recovery tier 3 from the exam-mode design): asking the
  student "did you use the sine rule here?" to resolve `unknown`s. Needs the
  self-review-reliability question answered first.
- **Method marks on grid and banded multi_blank parts** — both already price
  partial success, so a method estimate on top would pay twice for the same
  work. Excluded deliberately, not by oversight.
- Teacher-facing exam readiness, and server-side grading (still client-graded —
  see `08-exam-sessions-plan.md` decision 3).
