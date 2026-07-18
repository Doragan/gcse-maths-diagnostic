# Grid / Drawing Widget — Scoping Plan (B4 + B5)

_Scoping analysis, 2026-07-18. Builds on `06-app-gap-plan.md` Increments B4/B5.
Source: the 137 `app_supported: "no"` part-rows in `data/exam-audit/` (960 marks
coded across the full 2024 series), re-grouped by the interaction each part
actually needs rather than by topic. Scope-only — nothing here is built._

## Headline

The drawing gap is **~85 marks** of 2024 exam traffic once every drawable part
is counted (the earlier B4+B5 ≈ 60 estimate excluded drawable parts filed under
other notes). Those ~85 marks span eight *apparent* question families — but
they reduce to **four interaction primitives** on one snap-to-grid SVG surface:

1. **place-points** (tap to place N markers on gridline intersections)
2. **polyline / line** (placed points joined in order, or defining a straight line)
3. **shade-cells** (tap to toggle grid cells or named regions)
4. **place-polygon** (points forming a closed shape)

Bars (charts/histograms) are place-points constrained to column tops. That
consolidation is the core scoping decision: **one widget, four modes** — not
eight bespoke inputs.

## Inventory (mark-weighted, from the audit rows)

| Family | Marks | Parts | Mode(s) | Skills (top) |
|---|---|---|---|---|
| Plot points / curves | 30 | 13 | points + polyline | `time_series` 8, `plotting_straight_line_graphs` 7, `coordinates`, `box_plots`, `cumulative_frequency`, `scatter_graphs`, `inverse_proportion` |
| Draw shapes / patterns / graphs | ~17 | ~9 | polygon + cells + polyline | `kinematic_graphs` 4, `symmetry` 4, `areas_of_compound_shapes`, `sequences` (next pattern), `inequalities` (number line) |
| Plans & elevations | 13 | 7 | shade-cells (+ outline) | `plans_and_elevations` 12 |
| Transformations (draw) | 5 | 2 | polygon | `enlargements`, `fractional_enlargements` |
| Charts / pictograms | 6 | 3 | bars (column points) | `simple_charts` 6 |
| Shade / complete pattern | 6 | 4 | shade-cells | `symmetry` 5, `venn_diagrams` (region) 1 |
| Histogram | 4 | 1 | bars | `histograms` 4 |
| Draw symmetry lines | 2 | 1 | polyline | `symmetry` |

**Explicitly OUT of scope** (stays in B6/B3, unchanged): compass constructions
& loci (8m), describe-transformation and other free-text (B3), matching widgets
(3m), physical ruler measurement (3m), spinner/list construction (6m),
tangent-to-curve drawing (needs judgement marking).

**Zero-coverage skills this unblocks:** `plotting_straight_line_graphs`,
`scatter_graphs`, `box_plots`, `histograms`, `simple_charts`,
`plans_and_elevations`, `translations`/`rotations`/`reflections` (drawing side),
`symmetry` (drawing side) — most of the remaining 18.

## Architecture

### Data model — no DDL, mirrors multi_blank
- New part-level `answer_type: 'grid_draw'` (added to `PART_ANSWER_TYPES` in
  `lib/questions/answerTypes.ts`; the question-level CHECK constraint is
  untouched, storage rides in the existing `questions.parts` jsonb).
- The part gains a `grid` object:

```jsonc
grid: {
  mode: "points" | "polyline" | "line" | "cells" | "polygon" | "bars",
  x: { min: 0, max: 10, step: 1, label: "Time (s)" },   // numbers or templates
  y: { min: 0, max: "{{ymax}}", step: 1, label: "" },
  background: "<svg fragment>",       // template — pre-plotted curve, given
                                      // shape, axes decorations; same inline-SVG
                                      // house style as every existing diagram
  elements: [                          // the canonical answer, parametric
    { x: "{{t1}}", y: "{{d1}}", marks: 1 },
    { x: "{{t2}}", y: "{{d2}}", marks: 1 }
  ],
  // cells mode: elements = [{ col, row, marks }]; polygon: ordered vertices
  tolerance: 0                         // grid units per element; 0 = exact snap
}
```

- **Canonical answers are template expressions**, like every answer in the
  bank — this is what makes drawing questions parametric. Authoring is
  text-first (type the coordinate templates) with a live visual preview; you
  cannot "click" a parametric point, so the admin never draws the answer, it
  renders it.

### Marking — `lib/questions/gridDraw.ts` (pure, like multiBlank.ts)
- `checkGridDraw(drawn, canonical, mode, tolerance)` →
  `{ correct, perElement: [{correct, marks}], marksEarned }`.
- Per mode: **points** = order-insensitive matching within per-element
  tolerance (greedy nearest-match); **line** = the student's 2+ points must lie
  on the canonical line (slope+intercept within tolerance); **polyline** =
  ordered point match; **cells** = set equality; **polygon** = vertex-set match
  allowing cyclic rotation + reversal; **bars** = per-column value match.
- **v1 restricts to unique-answer questions** (complete THIS pattern, plot THIS
  line). Questions with many valid answers ("draw a rectangle with area 12")
  need predicate marking — a template expression over the drawn geometry,
  evaluated in the same `new Function` sandbox as the param engine. Natural
  extension, deliberately deferred.
- Mastery attribution follows the multi_blank ruling: **ONE `practice_attempts`
  row per part, `correct` = every element right**; per-element marks surface in
  the exam layer only.

### Student surface — `components/practice/GridCanvas.tsx`
- Hand-rolled inline SVG + pointer events. **No library**: keeps the CSP story
  clean (no external origins), matches the bank's inline-SVG house style, and
  the core is small (~300–400 lines).
- Interactions: tap a gridline intersection to place (snapped), tap a placed
  element to remove (doubles as undo), element counter + Clear button. One
  submit per part (multi_blank precedent). **No dragging required in v1** —
  tap-to-place/tap-to-remove is the whole gesture vocabulary, which is what
  makes touch tractable.
- **Touch-first sizing rule:** minimum ~28px between gridlines on a 375px
  viewport → grids capped at ~12 columns visible. The audit questions fit
  (exam grids are typically 8–14 cells across).
- Keyboard: arrow-keys move a cursor cell, Enter places — cheap and included
  in v1. Honest limitation: true screen-reader accessibility for drawing input
  is effectively unsolved industry-wide; flagged, not blocking, revisit with
  audit item ⑥.

### Integration points (all follow the multi_blank pattern)
- `paramEngine.renderMultiPartQuestion`: evaluate `grid` axis/background/element
  templates against the shared value set → rendered grid spec.
- `MultiPartQuestion.tsx`: `grid_draw` branch renders GridCanvas; per-element
  ✓/✗ feedback + a canonical-answer overlay (student's drawing in one colour,
  correct answer ghosted) in the answered box.
- Exam runner: a `grid_draw` part = **one Unit** (a drawing is one
  interaction, unlike blanks) — but per-element marks mean the exam runner
  needs **fractional Unit credit** (`marksEarned` on `UnitResult`, score sums
  it). Small, contained change; also the first step toward method-marks.
- Diagnostic: excluded automatically (parts-bearing questions already are).
- Admin: `GridEditor` inside PartEditor — mode picker, axis fields, element
  template list (one row per element, like blanks), background SVG textarea,
  live preview rendering the canonical drawing at the previewed param set.
- Harness (`verify-question.ts`): per combo — evaluate element templates, FAIL
  on render artefacts, off-grid positions, off-lattice positions when
  tolerance 0, and canonical-vs-canonical self-grade via `checkGridDraw`;
  `--svg` rasterises grid + background + canonical overlay for the eyeball
  pass. `audit-bank.ts` mirrored.

## Increments

| # | Contents | Marks | Size |
|---|---|---|---|
| **G1** | Canvas core + **points / polyline / line** modes; marking lib; practice + exam integration (incl. fractional Unit credit); GridEditor; harness. Content: straight-line plotting, time series, CF curve, scatter, coordinates, kinematic graphs | ~35–38 | **Large** — the platform build; everything after reuses it |
| **G2** | **shade-cells + polygon** modes. Content: symmetry completion, plans & elevations, next-pattern, draw/transform a shape, enlargements, Venn region shading | ~30 | Medium — new modes on the existing core |
| **G3** | **bars** (as constrained points) + number-line variant (1-D grid, open/closed endpoint toggle). Content: bar charts, composite bars, pictograms, histograms, inequalities on a number line | ~13 | Small |
| Later | Predicate marking (many-valid-answer questions); box-plot dedicated affordance; drag-to-adjust; SR accessibility | — | As needed |

G1 is the investment; G2/G3 are cheap because the canvas, marking shape,
editor, and harness plumbing all exist by then. Recommended entry content for
G1: `plotting_straight_line_graphs` (7 marks, zero coverage, simplest marking)
first, then `time_series` plotting (its read-off questions already exist — the
draw side completes the skill).

## Secondary payoff

The canvas doubles as the **first lesson interactive** (the lessons thread,
2026-07-17): the same component with marking off is an exploratory
manipulative — drag a point, watch the line change. Building G1 pays for the
flagship interactive of the lesson pilot.

## Risks

- **Authoring model is text-first** — an author types coordinate templates
  rather than drawing. Mitigated by the live preview; consistent with how every
  SVG diagram is authored today. Budget GridEditor as a third of G1, not an
  afterthought.
- **Element-count ambiguity** — marking assumes the student places exactly the
  asked-for number of elements; the UI enforces the count per mode (submit
  gated until N placed), so the marker never guesses intent.
- **Parametric grids** must keep a stable shape across draws (axis ranges may
  vary, cell count must stay within the touch cap) — a harness gate, same
  spirit as "blank count is fixed".
- **Partial credit in exam mode** touches the just-shipped Unit scoring —
  contained, but test it against the multi_blank per-blank marks path.
- **Accessibility** — keyboard v1 yes; screen-reader honestly deferred.

## What this does NOT change

Mastery engine, grader (`checkAnswer`), assembler, diagnostic and the
multi_blank machinery are untouched. `grid_draw` is one more part answer type
consuming the same parts/attribution/marks conventions.
