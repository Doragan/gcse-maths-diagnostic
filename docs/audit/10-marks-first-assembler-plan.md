# Marks-first paper assembly, per tier (Increment 4)

_Scoping, 2026-07-28. Follows `09-mark-calibration-plan.md`, which made a
question's marks trustworthy. This changes what the assembler optimises FOR._

## Why

The assembler fills **11 fixed slots** by difficulty band; the mark total is
whatever falls out — measured at 19–35 across tiers. Real papers work the other
way round: **every one of the 12 coded 2024 papers is exactly 80 marks**, with
the question count as the free variable (25–27 questions, 28–46 parts).

Marks are what a student is scored on and what the trend will plot, so marks are
what should be fixed. A 19-mark paper and a 35-mark paper are not the same
assessment, and no amount of percentage normalisation makes them one.

## What the audit says

### Real papers do NOT ramp marks-per-question

```
JUN24-F-P1:  3 4 3 4 3 3 3 4 3 3 3 2 3 4 1 3 4 2 1 2 3 4 3 3 3 3 3
```

Noisy around 3, with 1- and 2-mark questions appearing late. Marks split
**31.9% / 34.2% / 34.0%** by position across all 12 papers. Real papers ramp
**difficulty**, holding marks-per-question roughly flat. So a marks-first design
must not try to make later questions worth more.

### The two tiers are different papers, not one paper with harder questions

| | Foundation | Higher |
|---|---|---|
| Parts per paper | 39–46 (mean 42) | 28–38 (mean 32) |
| Mean marks/part | 1.92 | **2.47** |
| 1-mark parts | 41% | 24% |
| 3+ mark parts | 25% | **49%** |
| Synthesis (`exam`) | 30% of parts, 48% of marks | **72% of parts, 78% of marks** |
| Marks by position | 35 / 34 / 31 | 29 / 34 / 37 |

Same 80 marks, ten fewer parts. Scaled to a 25-mark slice: Foundation ≈ **13
parts**, Higher ≈ **10**.

### Synthesis supply — a prediction this doc got WRONG

The original draft said the bank "cannot yet supply a faithful Higher paper",
reasoning from synthesis being **15% of pool marks** against a blueprint wanting
~78%. **Measurement after building disproved that.** The Higher synthesis gap is
**1–2 marks out of 20** — the blueprint is ~93% satisfied.

The error was comparing a *pool share* with a *per-paper requirement*. One paper
needs ~20 synthesis marks; the pool holds **74** across 18 questions. Ample for
any single paper.

**The real constraint is freshness, not capacity.** Across 5 consecutive Higher
papers only **7 distinct** synthesis questions appeared, 6 of them more than
once. A student sitting several papers meets the same synthesis questions
repeatedly — and since these are the memorable, heavily-weighted questions, that
is exactly where repetition is most noticeable. Growing the `exam`-kind bank is
still the right content priority; the reason is variety, not whether a paper can
be built.

(Foundation for reference: real 1.92 mean marks/part vs our pool 1.95.)

## Design

### Blueprint becomes a per-tier mark budget

```ts
export type BandBudget = { band: DifficultyBand; share: number; preferKind?: SlotKind }
export type ExamBlueprint = {
  targetMarks: number
  tolerance: number          // accept target ± this before stopping
  bands: BandBudget[]        // shares sum to 1
}
export const BLUEPRINTS: Record<Tier, ExamBlueprint>
```

Starting points (tuned during build against measured output):

- **Foundation** — target 25: d1 12%, d2 24%, d3 34%, d4 30% → ≈ 13 questions
- **Higher** — target 25: d1 6%, d2 14%, d3 34%, d4 46% (`preferKind: 'exam'` on
  d3 and d4) → ≈ 10–11 questions

Tier stops being only a skill filter and becomes a paper shape. The Foundation
skill-block still applies on top.

### Filling

Per band, in ascending difficulty (preserving the ramp):

1. budget = `targetMarks × share`; spend until within tolerance of it;
2. eligible = not used, calculator-legal, not tier-blocked, under `MAX_MULTI_PART`,
   and **marks ≤ remaining band budget + tolerance** (no wild overshoot);
3. among eligible, keep today's least-used-strand preference and random tiebreak
   — deliberately NOT pure best-fit, which would make every paper identical and
   destroy the structural variation that matters more than parametric variation;
4. if nothing fits, relax kind → then band (±1) → then stop that band.

Leftover budget rolls into the next band, so an under-filled easy band is made up
later rather than silently shortening the paper.

### Honest degradation

`AssembledExam` gains a report:

```ts
{ questionIds, totalMarks,
  shortfall: number,                        // target − achieved
  bandShortfalls: { band, wanted, got }[],
  kindShortfall: number }                   // synthesis marks wanted − supplied
```

This is the point of the increment as much as the totals: today a relaxed slot is
invisible. With Higher needing 78% synthesis against a 15% supply, we need to
*see* that a paper is 6 marks short of its synthesis target — it drives content
priorities and stops us believing the blueprint is being met. Surface it in the
teacher preview; log it (not shown to students).

## Migration

`DEFAULT_BLUEPRINT: ExamSlot[]` is exported and consumed by `ExamRunner` and the
assembler tests. Replacing it with `BLUEPRINTS[tier]` touches:
`lib/exam/blueprint.ts`, `lib/exam/assembler.ts` (+tests),
`components/exam/ExamRunner.tsx`. No DB change, no migration.

## Verification

- Unit: totals land within tolerance for both tiers; the ramp holds (mean marks
  per band non-decreasing); an all-heavy pool cannot overshoot; an exhausted pool
  reports shortfall rather than looping; `MAX_MULTI_PART` and the calculator rule
  still hold at every rung; variety — 20 papers from one pool are not identical.
- Measured on the live bank, 200+ papers per tier × calc mode: total marks mean
  and range (expect a tight band around 25 vs today's 19–35), question count
  distribution, and the reported synthesis shortfall for Higher.
- `tsc` + `vitest` + `npm run build`.

## Deferred

- **Position-aware ordering** (Foundation front-loads 35/34/31, Higher back-loads
  29/34/37). Real but mild, and ordering is cosmetic next to composition.
- **Re-tuning band shares from evidence** rather than from today's implicit mix —
  the audit has no difficulty field, so band shares stay a judgement.
- Stored papers are unaffected: `exam_sessions` pins its own `marks_total`, so
  historical scores keep their original denominators.
