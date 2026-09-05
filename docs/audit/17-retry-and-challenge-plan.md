# Retry and challenge questions for the 39 generated papers

Scoped 2026-09-05. Prerequisite: the 42-paper registry and the feedback
pipeline (PR #61).

Three of the 42 papers carry `retrySet` and `challengeQuestions`, so their
sheets print "Practise these" and "Push yourself". The other 39 omit both
sections. This plans closing that.

## 1. The size was wrong

I first sized this at "1000+ authored questions" from the item count. That
number came from the schema, not from the work, and it is wrong by an order of
magnitude.

**These are not bank questions.** `PaperRetryQuestion` is `{ skill, question }`
— printed prose on a paper sheet. No answer, no `answer_template`, no
tolerance, no traps, no SVG, no parameter engine, no `verify-question` run. A
student writes on paper and a teacher marks it. None of the machinery that
makes a bank question expensive applies.

**The content is a function of the skill, not of the item.** `retrySet` is
keyed by question id, which is why the cost *looked* per-item. But a retry for
a `ratio` question is a ratio question, whichever paper it came from.

Measured across the 39 generated papers:

| | count |
|---|---|
| items | 1,425 |
| of those, `visual` (need no retry, by design) | 101 |
| non-visual items — the naive figure | 1,324 |
| **distinct skills behind them** | **153** |
| distinct topic × tier pairs (for challenges) | 10 |

And `MAX_PRACTICE = 3` / `MAX_CHALLENGE = 2` in `wwwEbi.ts` cap what any one
sheet can print, however many entries exist.

## 2. Change the shape before writing anything

Authoring 153 questions into a per-paper `Record<questionId, …>` would mean
writing each one out once per paper that uses the skill — recreating the 1,324
by hand. So the pool comes first.

**`lib/papers/retryPool.ts`** — one module, keyed by skill id:

```ts
export const RETRY_POOL: Record<string, { question: string; skill: string }>
```

Resolution for an item, in order:

1. `paper.retrySet[item.id]` — the per-paper override. The three hand-authored
   papers keep theirs untouched, and any paper can still overrule the pool.
2. `RETRY_POOL[item.skillIds[0]]`
3. nothing — the item contributes no suggestion.

Step 3 is already the behaviour for `visual` items
(`feedbackEvidence.ts:282`), so **partial coverage ships**. Every skill added
to the pool turns on for all 39 papers at once, and no sheet breaks while the
pool is incomplete.

**Also: dedupe practice by skill.** `simple_arithmetic` appears on up to 8
non-visual items on a single Foundation paper. Without a dedupe, a student who
dropped three of them gets the same question printed three times. With one, a
sheet shows three *different* skills — a better sheet, and it removes the need
for per-skill variants entirely. One line in `feedbackEvidence.ts`, before the
`MAX_PRACTICE` slice.

## 3. What actually has to be written

Of the 153 skills, **108 already have a published, prose-safe bank question**
(no `<svg>` in the template, not a grid-draw answer type) that could seed the
pool by rendering one parameter set to text. 45 do not.

Of those 45, roughly 15 are **inherently diagram-dependent** — a fair retry
needs a picture, so prose cannot carry them:

> rotations, translations, symmetry, loci, plans_and_elevations,
> measuring_lines_and_angles, scatter_graphs, box_plots, time_series,
> trig_graphs, sketching_functions, exponential_graphs, gradient_of_a_curve,
> kinematic_graphs, cumulative_frequency

These are the grid/drawing skills. They should be recorded as **deliberately
no-retry**, with the reason in the file, so a later reader does not "fix" the
gap by writing a bad prose substitute.

That leaves **~30 skills genuinely needing fresh prose**, ranked by how many of
the 39 papers use them (author down this list; stop whenever it stops paying):

```
13 congruence_and_similarity      6 area_of_a_trapezium
12 angles_on_lines_and_circles    6 cosine_rule
10 areas_of_triangles             6 sine_rule
 9 algebraic_proof                6 circle_theorem_angle_at_centre
 9 trigonometry_missing_sides     6 frequency_trees
 8 parts_of_a_circle              5 alternate_and_corresponding_angles
 7 trigonometry_missing_angles    5 counting_without_listing
 7 bearings                       4 areas_of_compound_shapes
 7 area_and_volume_scale_factors  4 area_of_triangle_sine
 7 equations_and_identities       4 vector_proof
 7 sector_calculations            3 circle_theorem_cyclic_quadrilateral
 7 lengths_and_perimeters         3 trigonometry_3d
 6 ...                            3 properties_of_2d_shapes
                                  3 circle_theorem_tangent
                                  2 loci · exponential_graphs · …
```

Several of these read as diagram-dependent but are not: the hand-authored
paper already states a circle theorem and a right-angled triangle in words
("A and B are points on a circle with centre O. Angle AOB = 84°…"). Geometry
is prose-able when the configuration can be *described*; it is not when the
student must *read a value off* the diagram.

**Challenges** are cheaper: 10 topic × tier pairs, capped at 2 per sheet, so a
pool of ~6 each ≈ 60. Sampled deterministically per paper (hash the paper id)
so regenerating a sheet never changes which challenge it shows — the same rule
`wwwEbiPhrases` already follows.

**Total ≈ 90 authored items**, plus whatever the bank spike does not cover.

## 4. Phases

**Phase 0 — the spike, and the gate.** Render 20 prose-safe bank questions to
plain text and read them. Do they stand up as printed practice questions
without their parameter engine and answer box? This decides whether 108 skills
are close to free or need rewriting, and everything below is sized off the
answer. Do not start Phase 2 before this.

**Phase 1 — plumbing, no content.** `retryPool.ts`, the resolver, the
dedupe-by-skill, tests. Ships dark: with an empty pool, every sheet is
byte-identical to today. That is the acceptance test.

**Phase 2 — content.** Seed from the bank if Phase 0 passes, then author down
the ~30 list. Each addition is independently shippable.

**Phase 3 — challenges.** The ~60, plus deterministic per-paper sampling.

**Phase 4 — record the deliberate gaps.** The ~15 diagram-dependent skills,
with reasons.

## 5. Open questions

1. **Tier.** One question per skill (153) or per skill × tier (262)? 109 of the
   153 appear on both Foundation and Higher papers. My recommendation is
   **tier-blind**: the atomic skill is the same thing, and what makes a Higher
   item harder is the synthesis around it, not the ratio. A retry is meant to
   be the accessible version either way. Splitting costs 71% more for a
   distinction the sheet never surfaces.
2. **Should a retry carry its answer?** Today it does not, so a teacher marking
   the retry has to work it out. Adding one is nearly free if seeded from the
   bank (the template has it) and expensive if hand-authored. It also changes
   the sheet layout — the answer must not print next to the question.
3. **Where is this authored?** These are a TypeScript module, not `questions`
   rows, so they do not belong in the DB-only authoring session despite being
   "questions". Worth confirming, because the naming invites the wrong split.
