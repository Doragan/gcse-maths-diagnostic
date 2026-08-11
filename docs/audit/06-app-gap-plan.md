# App-Gap Plan — Unblocking the Unsupported 31%

_Scoping analysis, 2026-07-06. Builds on `05-exam-coverage.md`. Source: the 444
coded part-rows in `data/exam-audit/` (`app_supported` + `app_gap_note` fields).
All mark figures are involvement-weighted 2024-series marks and re-derivable by
aggregating `app_gap_note` over the parts coded `app_supported: "no"`._

> **⚠ Revised 2026-08-08 — most of this plan has shipped.** Increments 0–2 are
> substantially built (equivalence grader, `multi_blank`, `grid_draw`), so the
> `app_gap_note` text in `data/exam-audit/` is **stale**: it records what was
> unsupported when the papers were coded, not what is unsupported now. Roughly
> **308 of the 479 `no`+`partial` marks are authorable today**; only ~104 are
> hard-blocked. **Read §Revision 2026-08-08 at the foot of this document before
> using any figure above it.** The bucket analysis below is retained because the
> clustering is still correct — only the cost-to-unblock has changed.

## Headline

Of 960 coded marks: **50% fully supported, 19% partial, 31% (295 marks) unsupported.**
The unsupported marks are NOT one monolithic "drawing gap" — they cluster into
six buckets with wildly different cost-to-unblock, and the single biggest
bucket needs **no engineering at all**.

## The six buckets

_Approximate marks; parts often straddle buckets, so treat as ±10%._

### B1 — Decision + supporting values (~65 marks) — **authorable today**
"Which shop is cheaper?", "Does Amy have enough? Tick yes/no and show working",
"Which town is denser?", plus the worded-reason tails (describe the
transformation / correlation / term-to-term rule, explain-the-error).

The audit notes repeatedly observe that **the tick is incidental and the marks
sit in the computed values** (e.g. _"town a/b tick is incidental; the 3 marks
are the comparative density working"_). That maps exactly onto existing
machinery: **multi-part mastery questions** — numeric parts for the comparable
values, a final MC part for the decision. No schema change, no new input.

Skills this unblocks marks for: `proportion` (27 app-blocked marks — best-buy
is the archetype), `percentage_change` (14), `compound_units` (13, density
comparisons), `relative_frequency`, `upper_and_lower_bounds` (bounds
decisions), `growth_and_decay`.

Caveat: a multi-part decomposition scaffolds what the exam leaves open (the
student chooses the comparison strategy). Marks-fidelity is imperfect but the
skills coverage is real; the mini-exam can still present them as one item.

### B2 — Multi-cell structured entry (~35 marks) — one new input type
Frequency-tree cell completion (9), multiplication grids, Venn-region counts,
two-way/table completion, function-machine operation boxes, tree-diagram
branch probabilities.

Needs a **`multi_blank` answer type**: one part rendering N labelled numeric/
expression inputs (each with its own answer template + traps), graded
independently, part credit = per-blank marks. Renderer + admin editor + grader
loop + attempts storage. No canvas, no drag — a form. Medium-small task.

Design note: blanks should be *positioned* (the tree/machine/Venn SVG carries
`<foreignObject>` or overlay-anchored inputs) or listed below the diagram with
letter labels — the latter is far cheaper and exam-acceptable ("write down the
values of A, B, C").

### B3 — "Show that" / proof / explain (~45–50 marks) — hardest, split it
`algebraic_proof`, `vector_proof`, "show that (2+√3)³ = 26+15√3", bounds
justifications. True marking of a reasoning chain needs either human/AI
judgement or heavy structure.

Two-stage approach:
- **B3a (rides on B2):** _structured_ show-that — the key intermediate steps
  become labelled blanks ("Step 1: expand (2+√3)² = ___ + ___√3 …"). Converts
  perhaps a third of these marks with zero marking risk. The equivalence
  grader (shipped 2026-06) already handles the per-blank algebra.
- **B3b (deferred):** free-text proof marking (AI-assisted with rubric +
  self-review). Its own project with its own reliability bar; do not gate the
  rest of the plan on it.

### B4 — Point/line plotting on a grid (~30 marks) — first real drawing surface
Plot a straight line / points / time-series; draw a CF curve, box plot,
histogram bars, tangent to a curve.

Needs an **interactive grid widget**: snap-to-gridline click-to-place points,
click-pair to draw segments, drag to adjust; marking = compare placed
geometry to the canonical (with per-point tolerance). This is the genuinely
new surface — browser-tested, touch-friendly, its own increment.

### B5 — Grid drawing / shading (~30 marks) — same widget, second mode
Draw the enlarged/reflected/translated shape, shade squares, complete the
symmetric pattern, plans & elevations, composite bars, pictograms.

Extends B4's grid with **cell-shading mode and polygon-vertex mode**. Marking
is set-equality on cells / vertex-set congruence. Do as B4 phase 2 — shares
all the plumbing.

### B6 — Specialised / low yield (~35 marks) — mostly defer
Compass constructions + loci (7 — genuinely hard to fake on screen), physical
ruler measurement (4), number-line drawing (2), match/connect UIs (9),
set-validity answers ("give two values that…", coin combinations, ~10).

Two cheap carve-outs worth taking opportunistically:
- **set-validity grading** (~8–10 marks): grader-only change — accept any
  member of a defined valid set / any set matching a predicate. No UI.
- **matching** (9 marks): a simple pair-matching widget, independent of the
  grid work.

## Zero-coverage skills → increments

Of the 18 zero-coverage skills (all app-gapped):

| Increment | Unblocks authoring for |
|---|---|
| B2 multi-blank | `gathering_and_organising_data` (tables), better `frequency_diagrams` support |
| B4 plotting | `plotting_straight_line_graphs`, `scatter_graphs`, `histograms`, `box_plots`, `frequency_diagrams`, `simple_charts`, `sketching_functions`/`trig_graphs` (partial) |
| B5 shading/shapes | `translations`, `rotations`, `reflections`, `symmetry` (drawing side), `plans_and_elevations`, `constructions`-adjacent items |
| B3b proof | `algebraic_proof`, `vector_proof` |
| Not addressed | `constructions`, `loci` (compass simulation), `trigonometry_3d` (needs 3-D reasoning content, arguably authorable as numeric anyway) |

## Recommended sequence

1. **Increment 0 (authoring, now):** B1 decision-cluster as multi-part — ~65
   marks, zero code, heaviest skills first (`proportion` best-buy,
   `compound_units` density comparison, `percentage_change`). Gate every
   question through `scripts/verify-question.ts`.
2. **Increment 1 (small eng):** B2 `multi_blank` input type, then author
   frequency-tree/Venn/table/machine content + B3a structured show-thats
   against it. ~35 marks direct + ~15 via B3a.
3. **Increment 2 (the widget):** B4 grid plotting, then B5 modes. ~60 marks
   combined and most of the zero-coverage list. Browser-test as its own
   project; consider `Content-Security-Policy` interactions and touch input
   from day one.
4. **Opportunistic:** set-validity grader extension; matching widget.
5. **Deferred:** B3b free-text proof marking; compass constructions/loci.

Rough mark-yield per unit effort: Increment 0 ≈ 65 marks / zero eng;
Increment 1 ≈ 50 / small; Increment 2 ≈ 60 / large; B3b ≈ 30 / large+risky.

## What this does NOT change

The mastery graph, grader, and mini-exam assembler all consume questions
uniformly — none of these increments touch attribution logic. B2/B4/B5 add
answer *types*; the assembler's calculator/difficulty logic is unaffected.

---

# Revision 2026-08-08 — re-scored against shipped capability

Re-derived by bucketing every `app_gap_note` on the 113 parts coded
`app_supported: no` or `partial` (479 marks: 295 `no` + 184 `partial`), then
checking each bucket against what the engine can actually do now.

## Capability that landed since 2026-07-06

- **Equivalence grader** (2e44ee4, 3072b09) — answer types `exact`, `numeric`,
  `fraction`, `expression`, `set`, `ratio`, `coordinate`, all with equivalence
  checking. Full CAS deferred.
- **`multi_blank`** — part-level; N labelled scalar blanks, per-blank traps,
  per-blank marks, errors-carried-forward across siblings.
- **`grid_draw`** — modes `points`, `polyline`, `line`, `cells`, `polygon`,
  `bars`, `bars_free`, `number_line`, with per-element marks and wrong-drawing
  traps. This is B4 **and** B5, both delivered.
- **`mark_bands`** — partial credit on multi-blank parts.

## Buckets re-scored

| Bucket | Marks | Status now | Heaviest skills |
|---|---|---|---|
| **A — Equivalence-checkable answers** | **163** | ✅ **Shipped.** Was the single biggest bucket and is entirely gone. | `understanding_straight_line_graphs` 21, `ratio` 19, `simplifying_expressions` 19, `coordinates` 17, `simplifying_indices` 10 |
| **C — Grid drawing/plotting** (old B4+B5) | **86** | ✅ **Shipped** for all eight modes. | `plans_and_elevations` 12, `symmetry` 10, `time_series` 8, `plotting_straight_line_graphs` 7, `cumulative_frequency`/`interquartile_range` 7, `simple_charts` 6, `enlargements` 5 |
| **D — Decision + supporting values** (old B1) | **34** | ✅ Always authorable — multi-part numeric + final MC. Original estimate of ~65 was generous; the strict decision-note total is 34. | `proportion` 19, `percentage_change` 13, `compound_units` 10 |
| **B — Multi-cell structured entry** (old B2) | **25** | ✅ **Shipped** as `multi_blank`. Original estimate ~35. | `frequency_trees` 9, `venn_diagrams` 5, `inverse_proportion` 4, `simple_arithmetic` 4 |
| **E — Free-text / proof / explain** (old B3) | **74** | ❌ **Blocked.** B3a (structured show-that on `multi_blank`) could convert perhaps a third; B3b free-text marking still deferred. | `enlargements` 6, `calculating_simple_probability` 6, `relative_frequency` 6, `algebraic_proof` 6, `upper_and_lower_bounds` 5, `vectors`/`vector_proof` 4 each |
| **Z — Other / mixed** | **67** | ◐ Mixed. Column-vector entry, structured listing with set-equality, reading intervals off a graph. Small grader/input additions, not one project. | `function_machines` 9, `proportion` 6, `ratio` 6, `tree_diagrams` 4 |
| **H — Matching / connecting** (part of old B6) | **15** | ❌ Blocked — needs the pair-matching widget. | `graph_transformations`, `quadratic_functions`, vocabulary recall |
| **F — Compass / ruler / physical** (old B6) | **10** | ❌ Blocked, low yield. Still the right call to defer. | `constructions`, `loci`, `measuring_lines_and_angles` |
| **G — Set-validity / constraint partial credit** | **5** | ◐ Grader-only change; cheapest remaining carve-out. | `systematic_listing`, `factors_and_multiples` |

**Authorable today: ~308 marks (A+C+D+B). Hard-blocked: ~104 (E+H+F), plus a
mixed ~67 in Z.** Box-plot drawing (3 marks) is the one drawing case `grid_draw`
does not cover — there is no box-plot mode and `points` is only an
approximation.

## The actual bottleneck is now authoring, not engineering

Across all 242 published questions the bank uses (recounted 2026-08-09; the
first synthesis batch added no new-input parts, so only the denominator moved):

- **6 `multi_blank` parts** — `frequency_trees`, `venn_diagrams`,
  `function_machines`, `simultaneous_equations`, `quadratic_functions`,
  `solving_quadratic_equations_factorising`, `gathering_and_organising_data`
- **6 `grid_draw` parts** — modes `polygon` ×2, `bars`, `bars_free`, `line`,
  `number_line`; skills `histograms`, `inequalities`, `simple_charts`,
  `enlargements`, `reflections`, `plotting_straight_line_graphs`
- **3 `mark_bands` parts**

~86 marks of coded exam traffic fit `grid_draw`'s modes against 6 parts built.
The capability is in place and essentially unexploited — content, not code, is
what converts it.

## Revised sequence

1. **Author against what shipped** — no engineering gate. Priority order lives in
   `05-exam-coverage.md` §Suggested action order (synthesis on the heavy skills,
   then thin-coverage depth, then `grid_draw` content led by
   `plans_and_elevations`).
2. **Set-validity grader extension** (~5 marks) — smallest remaining code win.
3. **Matching widget** (~15 marks) — independent of everything else.
4. **B3a structured show-that** on `multi_blank` — converts part of E's 74 marks
   with zero marking risk.
5. **Still deferred:** B3b free-text proof marking; compass constructions/loci;
   a box-plot grid mode.
