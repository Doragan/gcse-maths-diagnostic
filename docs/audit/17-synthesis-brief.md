# Synthesis brief — input for a Fable design session

_Assembled 2026-09-11 from the live bank (read-only) and all 42 files in
`data/exam-audit/`._

**Purpose.** Everything a design session needs to (1) decide whether more
`kind: exam` (synthesis) content is still the right investment, and if so,
(2) pick targets and design question shapes that pass the severability test.
Output is a spec plus about 3 exemplar questions. Batch execution happens
afterwards, on a cheaper model.

---

## 0. Read this first — the headline premise does not hold

`00-plan-of-attack.md` (E5) and `05-exam-coverage.md` (E2c) stated that
**papers are 63% exam-kind marks vs a bank at 17%** (both corrected
2026-09-11). The 63% was the 2024 series under its original coding (606 of 960
marks). `017c652` (2026-08-20) re-tagged those files onto the authoring
`kind` rule, dropping 2024 to 16% (150 of 960), and the docs were never
updated. Recomputed today:

| Source | Exam-kind share of marks |
|---|---|
| All 42 coded papers, as coded | **29%** |
| AQA (30 papers, full schema) | 20% — every exam-coded row passes the independence rule |
| Edexcel June 2025 (6 papers, lighter schema) | 50% as coded → **24%** after applying the rule |
| OCR June 2025 (6 papers, lighter schema) | 50% as coded → **25%** after applying the rule |
| **All boards, rule applied** | **21%** |
| Bank, published, by question count | 16.9% (45 of 267) |
| Bank, published, by marks | ~25% (rough: 195 of 267 have null `marks`, counted as 1) |

"Rule applied" = the row has at least one pair of skills where neither is in
the other's prerequisite closure (the project's independence test). About half
the exam-coded rows in the Edexcel/OCR files pair a skill with its own
prerequisite, so they would be `mastery` under house rules.

**Implication:** measured against the project's own definition, the bank is
roughly at parity with the papers on synthesis share. The first job of the
design session is to confirm or refute this and say plainly whether synthesis
still deserves priority over **depth** (below).

## 1. Bank state (live, 2026-09-11)

- 1,000 question rows; **267 published**; 45 published exam-kind.
- Exam-tested skills in the graph: 151.
- **14 at zero published:** `scatter_graphs`, `box_plots`, `parts_of_a_circle`,
  `rotations`, `counting_without_listing`, `sketching_functions`,
  `trigonometry_3d`, `vector_proof`, `constructions`, `translations`,
  `algebraic_proof`, `trig_graphs`, `loci`, `frequency_diagrams`.
- **93 at 1–2 published, 60 at exactly one.** Depth, not synthesis share, is
  the largest measured gap.

## 2. House rules (non-negotiable — from the user's rulings)

1. **Independence.** `exam` kind only when one answer needs 2+ skills where
   *neither is a prerequisite of the other*, and both are genuinely exercised.
   A single skill with a famous misconception is `mastery`. Multi-part with a
   different skill per part is `mastery`. Forming + solving are too close to
   count as independent. Check the closure **before** scoping, not after.
2. **Severability test.** If you tell the student the intermediate result, is
   what remains a complete single-skill question? If yes, it's a pipeline.
   Pipelines are allowed occasionally, never as house style, and **never
   signposted**. Never narrate the order of operations.
3. **Two approved coupling devices:**
   - *Change of base* — one quantity is a proportion of the whole, the other a
     percentage of a subset, so reading the base correctly *is* reading the
     structure (`5d2c02c1`).
   - *Reverse / constraint* (more reliable) — give the output, ask for an
     input, and apply skill 1 to an unknown, so the intermediate cannot be
     evaluated even in principle (`83bbf6f5`). A light third skill such as a
     linear solve is acceptable.
4. **Don't fake rigour by hiding data.** Frequency trees: at most one blank leaf.
5. **Exam-format fidelity.** Author in the skill's dominant paper format
   (transformations and symmetry are grid-based).
6. **Difficulty** = load of the heaviest step plus a little combination
   overhead. Synthesis is often d3–4; d5 needs a genuinely heavy step or a
   non-obvious path.
7. **Traps:** trap impossible values too (lead the response with *why* it's
   impossible, and trap the sign-dropped variant). π: 3.142 is the floor, 3.14
   is not acceptable. The `expression` grader rejects commuted letter products,
   so keep to one letter per algebraic answer.
8. **Gate:** every question goes through `scripts/verify-question.ts`; nothing
   is published by Claude.

## 3. Exemplars

**Approved — change of base (`5d2c02c1`, venn_diagrams + FDP, d5).**
N students; a fraction play football; *x% of the footballers* also play
tennis; T play tennis altogether. Find how many play neither. Traps: x% of
everyone (base error), overlap not added back / tennis total read as
tennis-only, overlap subtracted twice.

**Approved — reverse / constraint (`83bbf6f5`, tree_diagrams + FDP, d5).**
p% of counters are red; without replacement, P(second red | first red) is
given. Find the original number of counters. Traps: answered the red count,
reduced the red count but not the total, gave n−1, applied p% to the remainder.

**Rejected — decision-framed (`7a289a0d`, proportion + percentage_change).**
Two shops, pack sizes and a discount; "how much does she save buying from the
cheaper shop". Severable: once told "Shop B", the rest is a standard single-skill
computation, and the comparison exists only to hand over the winner.

## 4. Candidate targets

Skills with exam-kind evidence and **zero published exam-kind questions**,
ranked by primary marks (the skill is `skill_ids[0]`) across all 42 papers.
Near-root skills (≥ 8 transitive dependents) are excluded, except the three
hand-overrides from `05-exam-coverage.md` E2b. Every exam-coded row involving
the skill is listed with a verdict against the independence rule.

Caveats: Edexcel/OCR rows (lighter schema) carry no traps, framing or
`app_supported`; `draw_plot` / `show_that` / `free_text` rows may not be
markable in the app today.

#### `simultaneous_equations` — 47 primary marks (F19 / H28), 23 exam-kind marks involving it, 2 published questions

Closure (barred partners): `solving_linear_equations`, `substitution`, `function_machines`, `simple_arithmetic`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| JUN23-H-P1 q20 | 3 | yes | ratio | numeric | passes |
| OCR-JUN25-F-P2 q20 | 4 | yes | plotting_straight_line_graphs | draw_plot | passes |
| OCR-JUN25-F-P3 q22 | 5 | yes | — | numeric | single-skill row coded exam |
| OCR-JUN25-H-P4 q11 | 5 | yes | function_machines(BARRED: prereq of target) | numeric | **fails** (prereq pairing) |
| OCR-JUN25-H-P5 q7a | 4 | yes | plotting_straight_line_graphs | draw_plot | passes |
| OCR-JUN25-H-P5 q7b | 2 | yes | understanding_straight_line_graphs | show_that | passes |

#### `inequalities` — 46 primary marks (F16 / H30), 12 exam-kind marks involving it, 3 published questions

Closure (barred partners): `solving_linear_equations`, `substitution`, `function_machines`, `simple_arithmetic`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P2 q15a | 4 | yes | plotting_straight_line_graphs | draw_plot | passes |
| JUN25-H-P3 q19 | 4 | yes | plotting_straight_line_graphs | draw_plot | passes |
| NOV23-H-P3 q23 | 4 | no | areas_of_squares_and_rectangles, properties_of_3d_solids | numeric | passes |

#### `simple_charts` — 45 primary marks (F44 / H1), 8 exam-kind marks involving it, 1 published question _(near-root hand-override, 9 dependents)_

Closure (barred partners): `gathering_and_organising_data`, `sampling`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-F-P1 q7b | 3 | no | simple_arithmetic | show_that | passes |
| JUN25-F-P1 q3 | 3 | yes | proportion | numeric | passes |
| OCR-JUN25-F-P2 q5d | 2 | no | percentage_change | show_that | passes |

#### `reverse_percentage` — 39 primary marks (F14 / H25), 16 exam-kind marks involving it, 2 published questions

Closure (barred partners): `percentage_change`, `fractions_of_amounts`, `simple_arithmetic`, `fractions_decimals_and_percentages`, `converting_fractions_to_decimals`, `decimals`, `converting_decimals_to_fractions`, `simplifying_fractions`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-F-P2 q24 | 3 | yes | — | numeric | single-skill row coded exam |
| EDEXCEL-JUN25-H-P2 q5 | 3 | yes | — | numeric | single-skill row coded exam |
| EDEXCEL-JUN25-H-P3 q12b | 3 | yes | — | numeric | single-skill row coded exam |
| JUN24-F-P2 q20 | 3 | yes | standard_form | expression | passes |
| OCR-JUN25-H-P6 q11 | 4 | no | growth_and_decay | numeric | passes |

#### `inverse_proportion` — 29 primary marks (F12 / H17), 14 exam-kind marks involving it, 2 published questions

Closure (barred partners): `direct_proportion`, `compound_units`, `substitution`, `function_machines`, `simple_arithmetic`, `proportion`, `fractions_of_amounts`, `fractions_decimals_and_percentages`, `converting_fractions_to_decimals`, `decimals`, `converting_decimals_to_fractions`, `simplifying_fractions`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P1 q11 | 5 | yes | proportion_with_powers | numeric | passes |
| JUN24-H-P3 q20 | 5 | no | direct_proportion(BARRED: prereq of target), proportion_with_powers | numeric | passes |
| OCR-JUN25-F-P1 q27 | 4 | yes | time_calculations | numeric | passes |

#### `cosine_rule` — 26 primary marks (F0 / H26), 15 exam-kind marks involving it, 2 published questions

Closure (barred partners): `trigonometry_missing_angles`, `trigonometry_missing_sides`, `lengths_and_perimeters`, `simple_arithmetic`, `angles_on_lines_and_circles`, `angles_in_polygons`, `pythagoras_theorem`, `indices`, `areas_of_squares_and_rectangles`, `solving_linear_equations`, `substitution`, `function_machines`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P2 q23 | 5 | yes | sine_rule | numeric | passes |
| NOV23-H-P3 q24 | 4 | yes | area_of_triangle_sine | numeric | passes |
| OCR-JUN25-H-P5 q22 | 6 | yes | area_of_triangle_sine | numeric | passes |

#### `scatter_graphs` — 26 primary marks (F18 / H8), 9 exam-kind marks involving it, 0 published questions

Closure (barred partners): `simple_charts`, `gathering_and_organising_data`, `sampling`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| JUN23-F-P1 q20b | 3 | yes | proportion | numeric | passes |
| NOV23-F-P1 q24b | 3 | yes | proportion | numeric | passes |
| NOV23-H-P1 q6b | 3 | yes | proportion | numeric | passes |

#### `fractional_and_negative_indices` — 25 primary marks (F3 / H22), 10 exam-kind marks involving it, 3 published questions

Closure (barred partners): `simplifying_indices`, `indices`, `simple_arithmetic`, `fractions_of_amounts`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P2 q9 | 2 | yes | expanding_brackets | numeric | passes |
| NOV23-H-P1 q25 | 2 | no | sequences | exact_surd | passes |
| NOV23-H-P2 q27 | 4 | no | growth_and_decay, functions_notation | numeric | passes |
| OCR-JUN25-H-P6 q5 | 2 | yes | — | free_text | single-skill row coded exam |

#### `completing_the_square` — 25 primary marks (F0 / H25), 8 exam-kind marks involving it, 2 published questions

Closure (barred partners): `factorising_quadratics`, `expanding_double_brackets`, `expanding_brackets`, `simplifying_expressions`, `simple_arithmetic`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| NOV23-H-P2 q18 | 3 | yes | algebraic_proof | show_that | passes |
| NOV24-H-P1 q18b | 2 | yes | graph_transformations | coordinate | passes |
| NOV24-H-P2 q22 | 3 | yes | nth_term_quadratic_sequences | show_that | passes |

#### `estimating` — 22 primary marks (F15 / H7), 12 exam-kind marks involving it, 1 published question

Closure (barred partners): `simple_arithmetic`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| JUN24-H-P1 q7c | 1 | no | area_of_a_circle | free_text | passes |
| JUN24-H-P1 q15b | 3 | yes | indices | show_that | passes |
| OCR-JUN25-F-P2 q10 | 3 | yes | significant_figures | numeric | passes |
| OCR-JUN25-H-P5 q11 | 5 | no | compound_units, volume_of_a_prism | show_that | passes |

#### `recurring_decimals_to_fractions` — 22 primary marks (F0 / H22), 13 exam-kind marks involving it, 2 published questions

Closure (barred partners): `converting_decimals_to_fractions`, `decimals`, `simple_arithmetic`, `fractions_of_amounts`, `simplifying_fractions`, `solving_linear_equations`, `substitution`, `function_machines`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P1 q13 | 5 | yes | multiplying_fractions | fraction | passes |
| NOV23-H-P1 q19 | 3 | yes | adding_and_subtracting_fractions | fraction | passes |
| OCR-JUN25-H-P5 q18 | 5 | yes | dividing_fractions | fraction | passes |

#### `histograms` — 22 primary marks (F0 / H22), 8 exam-kind marks involving it, 1 published question

Closure (barred partners): `frequency_diagrams`, `simple_arithmetic`, `simple_charts`, `gathering_and_organising_data`, `sampling`, `grouped_frequency_tables`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P1 q15 | 4 | yes | calculating_simple_probability | fraction | passes |
| OCR-JUN25-H-P5 q17a | 4 | yes | — | draw_plot | single-skill row coded exam |

#### `time_series` — 22 primary marks (F11 / H11), 6 exam-kind marks involving it, 2 published questions

Closure (barred partners): `simple_charts`, `gathering_and_organising_data`, `sampling`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| JUN25-F-P2 q20b | 3 | yes | proportion | numeric | passes |
| JUN25-H-P2 q3b | 3 | yes | proportion | numeric | passes |

#### `systematic_listing` — 21 primary marks (F17 / H4), 13 exam-kind marks involving it, 1 published question

Closure (barred partners): none

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| EDEXCEL-JUN25-H-P3 q15 | 4 | no | combined_events | show_that | passes |
| JUN24-F-P2 q12 | 3 | yes | indices | numeric | passes |
| NOV23-H-P3 q26 | 4 | no | conditional_probability, combined_events | fraction | passes |
| NOV24-H-P3 q13 | 2 | yes | combined_events | fraction | passes |

#### `conditional_probability` — 21 primary marks (F0 / H21), 14 exam-kind marks involving it, 1 published question

Closure (barred partners): `venn_diagrams`, `mutually_exclusive_events`, `calculating_simple_probability`, `simple_arithmetic`, `combined_events`, `tree_diagrams`, `frequency_trees`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| JUN25-H-P1 q25 | 5 | yes | solving_quadratic_equations_factorising, algebraic_fractions | numeric | passes |
| NOV23-H-P3 q26 | 4 | yes | systematic_listing, combined_events(BARRED: prereq of target) | fraction | passes |
| OCR-JUN25-H-P4 q22 | 5 | yes | — | fraction | single-skill row coded exam |

#### `cumulative_frequency` — 21 primary marks (F0 / H21), 6 exam-kind marks involving it, 2 published questions

Closure (barred partners): `grouped_frequency_tables`, `gathering_and_organising_data`, `sampling`, `simple_charts`

| Row | Marks | Primary? | Paired with | Answer form | Rule |
|---|---|---|---|---|---|
| NOV24-H-P2 q18b | 4 | yes | interquartile_range(BARRED: target is its prereq), median | free_text | passes |
| OCR-JUN25-H-P4 q14a | 2 | yes | — | show_that | single-skill row coded exam |

## 5. What the Fable session should produce

1. **Verdict on §0:** is synthesis still under-weighted relative to papers
   under the independence rule? Recommend synthesis vs depth, with numbers.
2. **If synthesis goes ahead:** 4–6 targets chosen from §4, using only
   rule-passing, app-markable pairings. Where the evidenced pairings are all
   barred, propose an invented pairing and flag it as such.
3. **Shapes:** for each target, a coupling device (change of base, reverse/
   constraint, or a new one) with a one-paragraph argument that it passes
   the severability test.
4. **About 3 exemplar questions** in the bank's JSON shape (`skill_ids`, `kind`,
   `difficulty`, template, parameters, answer, traps) ready for
   `verify-question.ts --file`.

## 6. Data-quality issues found while assembling this

- The 12 Edexcel/OCR files have **no `paper_id`**, so scripts that key on it
  (`audit-exam-coverage.ts`, `build-skill-exam-profiles.ts`) merge them into
  one "undefined" paper and undercount `papersSeen`.
- Edexcel/OCR `kind` coding doesn't apply the independence rule (half the
  exam rows fail it), and those files omit traps, framing and `app_supported`.
- `JUN24-H-P1` / `JUN24-H-P3` use `session` / `max_marks` instead of
  `series` / `total_marks`.
- 195 of 267 published questions have null `marks`, so any mark-weighted bank
  figure is approximate.
- The 63% figure in `00-plan-of-attack.md` and `05-exam-coverage.md` —
  corrected 2026-09-11.
