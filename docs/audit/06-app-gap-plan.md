# App-Gap Plan — Unblocking the Unsupported 31%

_Scoping analysis, 2026-07-06. Builds on `05-exam-coverage.md`. Source: the 444
coded part-rows in `data/exam-audit/` (`app_supported` + `app_gap_note` fields).
All mark figures are involvement-weighted 2024-series marks and re-derivable by
aggregating `app_gap_note` over the parts coded `app_supported: "no"`._

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
