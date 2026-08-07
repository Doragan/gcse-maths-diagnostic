# Mark calibration — stop guessing what a question is worth (Increment 3)

_Scoping, 2026-07-28. Follows `08-exam-sessions-plan.md`. Supersedes the
roadmap's "section-calibrated score" framing — see Finding 3._

## Why

A single-part question's marks are a guess. `NOMINAL_MARKS` in
`lib/exam/blueprint.ts`:

```ts
{ 1: 1, 2: 1, 3: 2, 4: 3 }   // by difficulty
```

used in two places (`assembler.ts:128`, `examPaper.ts:180`). It is why the
mini-exam score is honestly labelled "a practice score, not a predicted grade",
and it matters now because Increment 2 made papers persistent — a score trend
built on guessed marks would show movement that is really paper-to-paper noise.

**Scale: 186 of 220 published questions (85%) have guessed marks.** The other 34
are multi-part and carry author-set per-part marks.

### Framing correction (user, 2026-07-28)

An earlier draft called single-part questions "the problem". They are not
defective: a *part* has an authored `marks` field and a whole single-part
question does not, purely because marks were introduced at part level when the
parts model landed. A one-part question and a part are the same thing; only one
of them can be assigned marks. The real statement is: **one question shape never
got a marks field, so we guess for it** — and that shape is 85% of the bank.
Unifying the two shapes is a separate question (Appendix B).

## What the audit says

Across `data/exam-audit/` (12 papers, 444 parts, 960 marks):

- **Mean 2.16 marks/part**; 34% 1-mark, 31% 2-mark, 23% 3-mark, 9% 4-mark, 3%
  5-mark. Our nominal weights average ~1.8 — systematically cheap.
- **Kind matters:** `mastery` parts average **1.55**, `exam` parts **2.82**. Our
  weights ignore kind entirely.
- **Topic alone does not determine marks.** Overall SD 1.07; conditioning on
  skill → 0.83, skill+kind → **0.64**, skill+kind+answer_form → 0.52 but over
  only 108 of 444 parts. `simple_arithmetic` genuinely ranges 1–5 marks; 23 of
  59 well-sampled skills span 3+ marks.
- **Evidence is thin per skill:** of 127 skills with evidence, only 19 have n≥8;
  68 have ≤3.

### Finding 3 — the decisive one

`mark_split` predicts marks with SD **0.00** because it *is* the marks (`B1`=1,
`M1 A1`=2). That tautology is the insight: **a question's marks are the count of
creditable steps in its solution** — a property of the method chain, not the
topic. Hence the plateau at SD ~0.64, and hence no amount of extra data closes
it. The fix is not a cleverer formula.

## Plan

### 1. Evidence-based default marks  ← the one that moves the number

Replace `NOMINAL_MARKS[difficulty]` with a resolver that prefers, in order:

1. the question's explicit `marks` (step 2), when set;
2. **skill+kind empirical mean** from the audit (SD 0.64), rounded to a whole mark;
3. **kind mean** when the skill is thin (mastery 1.55 → 2, exam 2.82 → 3);
4. today's difficulty table as the last resort.

This improves **all 186 questions at once, with nobody authoring anything** —
which is why it goes first. Integer results only: fractional nominal marks make
paper totals odd.

Built on a pure `lib/exam/markEvidence.ts` derived from `data/exam-audit/` at
module load (metadata already in the repo — no DB, no fetch):

```
evidenceFor(skillIds, kind) → { n, mean, min, max, commonSplits } | null
```

Touches `assembler.ts:128` and `examPaper.ts:180` only.

### 2. Explicit `marks` column on `questions` — the override

Nullable `int`; NULL falls through to the resolver above, so no backfill and the
existing bank is untouched (same pattern as `parts`). Authoritative when set —
for the cases where evidence is thin or the question is deliberately short.

Migration (user applies; agent cannot run DDL) + a marks input in `QuestionForm`
+ both write paths.

### 3. Evidence at the point of authoring

Beside the marks field in `QuestionForm`, and per-part in `PartEditor`:

> 2024 papers, `histograms` · exam-kind: **n=4, mean 3.2, range 2–4** — usually `M1 M1 A1`

Guidance, never enforcement; says "not enough evidence" for thin skills rather
than inventing a number.

### 4. Outlier gate in the harness

`verify-question.ts` (mirrored in `audit-bank.ts`): **warn**, not fail, when a
question's marks sit outside the empirical range for its skills — the spread is
real and a short version may be deliberate. Run bank-wide once to produce a
review list.

### 5. Re-check paper totals — DONE, no blueprint change needed

Measured over 40 assembled papers per configuration:

| config | mean | range | questions | short papers |
|---|---|---|---|---|
| foundation · non-calc | 26.4 | 19–34 | 11.0 | 0/40 |
| foundation · calc | 25.5 | 21–30 | 11.0 | 0/40 |
| higher · non-calc | 24.1 | 20–30 | 11.0 | 0/40 |
| higher · calc | 23.8 | 20–30 | 11.0 | 0/40 |

All four centre on the ~25-mark target (was 20 nominal / 20–25 observed), and
**every** paper fills all 11 slots — no relaxation to a short paper. So the slot
counts stay as they are.

**The ramp is intact and monotonic**, which was the thing at risk from centring
marks on skill evidence rather than difficulty:

```
d1 1.06 · d2 1.44 · d3 2.35 · d4 2.84 · d5 4.67   (mean marks per question)
```

**Residual spread (19–34) is multi-part draw luck**, not a calibration fault:
multi-part questions average 3.56 marks against 1.72 for single-part, so a paper
that happens to draw several runs heavy. Percentage is therefore the right unit
for the score trend; the remaining variance is in a paper's *composition*, which
is the part a fixed-total assembler (or sectioning) would address if it ever
proves to matter.

**One outlier found, for content review:** `60fd2421` is a **d2 question worth 6
marks** — the heaviest in the bank, at the second-easiest difficulty, while d4
averages 2.84. It is multi-part, so the 6 comes from summed authored part marks.
Either its difficulty rating or its part marks look wrong. Not a code issue.

## Explicitly NOT in this increment

- **Section-weighted scoring** (the roadmap's original framing). Once marks are
  honest, most of the moving-ruler problem is gone; revisit only if the trend
  still misbehaves.
- **Coding more paper series.** Would rescue the 68 thin skills, but per Finding
  3 cannot fix within-skill variance. Later.
- **Unifying the question shapes** — Appendix B.
- **Calling the score a grade.** Needs human-marked data.

## Verification

- Unit tests: `markEvidence` (known / thin / unknown skill, kind split) and the
  resolver's full fallback chain including the explicit-marks override.
- Harness: a deliberately over- and under-marked question each produce a warning.
- Assemble both tiers × both calc modes; totals sane, ramp intact.
- `tsc` + `vitest` + `npm run build`; browser check of the authoring evidence and
  a mini-exam showing the new totals.

## Sequencing

markEvidence + resolver + tests (**no migration needed — ships alone**) → harness
gate → migration for the override column (user applies) → authoring UI →
bank-wide outlier review → paper-total check. The score-over-time trend follows,
on honest marks.

---

## Appendix B — unify the question shapes (separate candidate, NOT scoped here)

Collapse single-part questions into a one-part `parts` array so there is one
model: marks always authored, `NOMINAL_MARKS` deleted outright, and the dual
branches in `buildItem` / practice rendering / the review path collapse.

**Why it is tempting:** the two-shapes split already costs us — it is why
`buildItem` branches, why practice has separate single and multi components, and
why marks landed in one shape and not the other.

**Why it is not this increment:** it is a data migration over 186 *published*
questions, touching practice, the diagnostic, the exam runner, the admin form,
the harness and the audit scripts. The original parts-model decision explicitly
chose "parts = null → legacy single-part, no backfill" to avoid exactly this.
High risk, real long-term payoff — it deserves its own increment, its own
verification, and a reversible migration, not to be smuggled into a calibration
change.

Note the plan above is deliberately compatible either way: the resolver and the
evidence module are keyed on skills + kind, which both shapes have, so unifying
later would not invalidate them.
