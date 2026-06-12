# Data Integrity Audit — Workstream ② (Skill Graph & Question Bank)

_Read-only. Method: a sweep script rendering every published question across 25
parameter draws + skill-graph traversal. Date: 2026-06-10._

## ① Skill graph — CLEAN ✓
- 151 nodes, **no duplicate ids, no missing prerequisites, no self-references,
  no cycles** (DFS 3-colour check).
- No dangling `skill_ids` — every skill referenced by a question exists in the graph.
- Existing `validateSkills()` only checks dupes + missing prereqs; it does **not**
  check cycles/orphans. Worth folding the fuller checks into it (or a test).

## ② Question bank (133 published) — mostly clean
- ✓ no render errors, ✓ all `answer_type`s valid, ✓ no question without a skill,
  ✓ no empty rendered answers.
- ⚠ **Trap quality is the one real issue** (details below).

### D1 — 12 broken traps that can never fire _(Medium, feedback-quality)_
These trap templates render **equal to the correct answer on every draw**, so the
trap can never trigger. NB: this does **not** mis-grade — the grader checks
correctness first, so a correct answer is still marked correct. The only effect is
the trap's targeted feedback is dead.

Two clusters:
- **`round(x ± 0.01, 2)` "slightly off" traps** that round back to the answer:
  `e6fc8f3f`, `73af9feb`, `28f4dd18` (the cm³/cm²/cos ones). Systematic
  authoring anti-pattern — the offset is smaller than the rounding step.
- **Algebraically-equal-to-answer traps**: `5636b618` `{{a**b}}`, `9221a578`
  `{{b}}`, `a653ffa7` `{{a*c+(b-a)*c}}`, `3c72b3a4`, `501366d5`, `a4bd3d9f`.

### D2 — 47 coincidental trap collisions _(Low, feedback-quality)_
Traps that collide with the answer only on some draws. Most are rare edge
coincidences (1–3 / 25) and harmless, but several collide often enough to be worth
re-parameterising:
- `8bccad20` trap collides **22/25**; `e71c4daa` **16/25**; `62ee516f` two traps
  **11–12/25**; `c179e489` **8/25**; `b1f3d882` **9/25**.
- The commutative case `cb37e981` `{{b*a}}` vs answer `{{a*b}}` shows 1/25 only
  because the grader's `expression` type already treats them as equal — so that
  trap is effectively always dead too (it's a "reordered" distractor the grader
  can't distinguish by design).

**Action:** a dedicated trap-quality pass — keep the sweep script (classifies
always vs sometimes), fix the 12 broken traps, re-parameterise the high-frequency
coincidental ones, and add a guard so the `round(x±0.01)` pattern isn't reused.

### RESOLVED 2026-06-12 (Phase 4)
- **9 of 12 broken traps deleted** — 3 units-reminder (the grader's units handling
  supersedes them) + 6 `round(x±0.01)` rounding traps. The `round(x±0.01)`
  anti-pattern is **replaced by a generic grader rounding check** in
  `answerChecker.ts` (off-by-one-in-last-place → reject with "check your rounding";
  over-precise value → accept with "round to N dp"; gated to 1–4 dp). 3 broken
  traps remain — `a653ffa7`, `3c72b3a4`, `5636b618` (**Bucket C**, left for the
  user to investigate individually).
- **D2:** parameter constraints added to the clean colliders (`cb37e981` k≠a,
  `b1f3d882` n≥2, `c179e489` a≥2/c≥3) → 0 collisions. Low-frequency remainder
  left as-is (user is relaxed; floor-truncation ones are now complemented by the
  grader rounding check).
- **The sweep script is now committed as `scripts/audit-bank.ts`** (render-sweep,
  trap classifier, coverage, + an unrounded-numeric-answer flag → found 0).
  Re-run after any authoring batch.

## ③ Coverage — 38 / 151 skills have no published question _(Medium, product)_
Notable gaps (full list in script output): `areas_of_compound_shapes` (the draft
we just gave a diagram is unpublished), `relative_frequency`,
`perpendicular_gradients`, `simplifying_ratio`, most of stats (`histograms`,
`box_plots`, `scatter_graphs`, `time_series`, `cumulative`/`grouped` tables),
transformations (`rotations`, `reflections`, `translations`, `loci`,
`constructions`), `plans_and_elevations`, `trig_graphs`, `exact_trig_values`,
`rearranging_formulae`, `algebraic_proof`, `vector_proof`.

These are diagnosable skills a student can land on with **zero practice
questions** behind them. **Action:** treat as a content backlog; prioritise by
exam-frequency (ties into the exam-audit work).

## Tooling note
The sweep script (`_audit-data-integrity.ts`) was a throwaway, but the
trap-collision classifier + coverage check are reusable. Candidate to keep as
`scripts/audit-bank.ts` and/or wire into a test.
