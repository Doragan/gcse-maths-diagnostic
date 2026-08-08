# Question-Bank vs 2024 Exams — Workstream ⑧ (Exam-Weighted Coverage)

_Read-only cross-reference of the published bank against all 12 coded 2024
papers (`data/exam-audit/`, 444 part-rows, 960 marks)._

**Revised 2026-08-08** — bank now **233 published questions covering 139 of 152
skills**. The original pass (2026-06-10) ran against a 133-question / 113-skill
bank; **its headline figures are superseded and must not be used for planning**
— see §H for what changed and why.

**Cross-validation:** every `skill_id` used across all 444 exam rows exists in
the skill graph — zero coding typos. The exam audit and the graph agree.

## Two mark measures

- **Involvement-weighted** — a 3-mark part listing two skills credits 3 to each.
  Good for "how much exam traffic touches this skill". Used throughout the
  original pass.
- **Primary** — marks on parts where the skill is `skill_ids[0]`; the coding
  convention puts the skill the part is actually testing first. This is the
  **content-priority metric**: it stops a skill that is merely along for the
  ride from outranking one the part is genuinely about.

Priority rankings below use **primary marks** and **exclude near-root skills**
(transitive dependents ≥ 8) — those are foundational rather than exam-specific
and already carry coverage. The exclusion is deliberate: ranked naively,
`simple_arithmetic` (63 primary marks, 137 dependents) tops every list forever.
See §E2b for the three skills where the rule should be overridden by hand.

## Headline (2026-08-08)

- **The zero-coverage backlog is closed.** **10** exam-tested skills have zero
  published questions, worth **29 primary marks** (44 involvement) — down from
  33 skills / ~280 marks. Eight of the ten need drawing or free-text marking;
  only `trig_graphs` (3 marks) and `sketching_functions` (2) are
  authorable-and-untouched. Ranking by zero-coverage now produces near-noise.
- **The gap moved from breadth to shape.** Real papers are **63 % exam-kind
  (synthesis) marks** — 606 of 960, across 215 of 444 parts. The published bank
  is **21 of 233 questions exam-kind (9 %)**. Several of the heaviest synthesis
  skills have *no* synthesis question at all.
- **Depth is the remaining coverage problem.** 87 exam-tested skills sit at 1–2
  questions; 51 sit at exactly 1.
- **Most `app_gap_note` text is stale.** The equivalence grader, `multi_blank`
  and `grid_draw` all shipped after those notes were written; roughly 308 of the
  479 `no`/`partial` marks are authorable today. See `06-app-gap-plan.md`
  §Revision 2026-08-08.

## E1 — Zero-coverage exam-tested skills _(what's left of the backlog)_

All ten, ranked by primary marks. None is near-root.

| Primary (F/H) | Involv. | Skill | Status |
|---|---|---|---|
| 12 (6/6) | 12 | `plans_and_elevations` | **Authorable now** — `grid_draw` `polygon`/`cells`. One part (circular plan view) still not representable. Largest single win here. |
| 4 (4/0) | 4 | `scatter_graphs` | **Half authorable** — plot + axis label via `grid_draw` `points`; the 2-mark describe-correlation tail is blocked. |
| 3 (0/3) | 3 | `box_plots` | Blocked — no box-plot mode; `points` is only an approximation. |
| 3 (0/3) | 3 | `loci` | Blocked — compass/measurement input. |
| 3 (0/3) | 3 | `trig_graphs` | **Authorable now** — coded `app_supported: yes`; no drawing needed. |
| 2 (0/2) | 6 | `algebraic_proof` | Blocked — free-text/justification marking. |
| 2 (2/0) | 5 | `constructions` | Blocked — compass/ruler input. |
| 0 | 4 | `vector_proof` | Blocked — free-text marking. |
| 0 | 2 | `translations` | Column-vector answer entry; reuse of `coordinate` needs a ruling. |
| 0 | 2 | `sketching_functions` | **Authorable now** — coded `app_supported: yes`. |

Three further skills have zero questions but no 2024 appearance, so carry no
exam-weight evidence: `frequency_diagrams`, `rotations`, `trigonometry_3d`.

## E2 — Thin coverage _(the live content backlog)_

87 exam-tested skills sit at 1–2 published questions. Ranked by primary marks,
near-root excluded — this list replaces E1 as the priority queue.

| Primary (F/H) | Bank | Skill | Note |
|---|---|---|---|
| 18 (7/11) | 2 | `inverse_proportion` | Highest thin skill outright. |
| 15 (4/11) | 2 | `tree_diagrams` | 0 exam-kind. Branch-probability entry now possible via `multi_blank`. |
| 14 (5/9) | 2 | `kinematic_graphs` | 0 exam-kind. Read-offs authorable; 4 marks want `grid_draw`. |
| 13 (7/6) | 2 | `simplifying_indices` | 7 previously-blocked marks were equivalence-checker — now clear. |
| 12 (6/6) | 2 | `time_series` | Plotting side now available (`polyline`). |
| 12 (6/6) | 2 | `reverse_percentage` | Fully supported, no blockers. |
| 10 (6/4) | 1 | `systematic_listing` | 3 marks need constraint-graded partial credit. |
| 10 (0/10) | 2 | `completing_the_square` | 7 previously-blocked marks were equivalence — now clear. |
| 8 (6/2) | 2 | `forming_expressions_and_formulae` | |
| 8 (8/0) | 2 | `pie_charts` | Calculation parts fully supported. |
| 8 (0/8) | 2 | `sector_calculations` | |
| 7 (2/5) | 1 | `vectors` | |
| 7 (0/7) | 2 | `rearranging_formulae` | Was 100 % equivalence-blocked — now clear. |
| 7 (0/7) | 2 | `cumulative_frequency` | `grid_draw` `polyline`. |
| 6 | 1–2 | `measuring_lines_and_angles`, `quadratic_functions`, `areas_of_compound_shapes`, `recurring_decimals_to_fractions`, `direct_proportion`, `iteration`, `sine_rule`, `volume_of_a_sphere`, `graph_transformations` | |
| 5 | 1–2 | `properties_of_3d_solids`, `surds_expanding_and_rationalising`, `exact_trig_values`, `cosine_rule`, `simultaneous_equations_quadratic` | |

### E2b — Near-root exclusions to override by hand

The deps ≥ 8 rule filters these out, but they are exam-specific data/number
skills rather than foundational plumbing, and they are thin. Treat as Tier 2:

| Primary | Bank | Skill | Dependents |
|---|---|---|---|
| 19 (19/0) | 1 | `simple_charts` | 9 |
| 19 (8/11) | 2 | `calculating_simple_probability` | 8 |
| 16 (16/0) | 1 | `fractions_decimals_and_percentages` | 9 |

`simple_arithmetic` (63 primary, 1 question, 137 dependents) stays excluded —
it is the exact case the rule exists for.

## E2c — The synthesis shortfall _(largest single mismatch)_

Papers: **63 % of marks are `kind: exam`**. Bank: **9 % of questions**. The
heaviest synthesis skills with no synthesis question, by exam-kind marks
(primary / involvement), near-root excluded:

| Exam-kind (pri/inv) | Bank total | Bank exam-kind | Skill |
|---|---|---|---|
| 19 / 49 | 3 | **0** | `proportion` |
| 24 / 30 | 10 | 3 | `compound_units` |
| 23 / 33 | 5 | 1 | `ratio` |
| 17 / 22 | 8 | 2 | `percentage_change` |
| 12 / 12 | 2 | **0** | `kinematic_graphs` |
| 12 / 12 | 5 | 1 | `upper_and_lower_bounds` |
| 10 / 13 | 4 | **0** | `growth_and_decay` |
| 9 / 9 | 2 | **0** | `tree_diagrams` |
| 9 / 9 | 2 | **0** | `simplifying_indices` |
| 7 / 15 | 2 | **0** | `forming_expressions_and_formulae` |

Author these to the project's synthesis rule — `exam` kind only where one answer
genuinely needs two *independent* skills; otherwise they land in E2 as mastery
depth.

## E3 — Bank skills with no 2024 appearance _(info, no action)_

22 skills, e.g. `difference_of_two_squares`, `bearings`, `area_of_a_trapezium`,
`circle_theorem_same_segment`, `quadratic_inequalities`, `frustum`. One year's
series is a weak sample — keep them.

## E4 — skill_gap watchlist, consolidated counts

Merging note-text variants across papers:
- **Circle-parts vocabulary** — **5 rows / ~7 marks / 4+ papers**. The most
  recurrent gap by far; the "add if it recurs" threshold is arguably met within
  this single series. (Decision 2026-06-09 was to skip — revisit when 2025
  papers are coded.)
- Identities / equating coefficients — 2 rows / 4 marks.
- "Least n where quadratic exceeds a bound" — 2 rows / 2 marks.
- Parity/odd-even properties — 1 row / 3 marks. π-exact manipulation — 1 row.

## Suggested action order (2026-08-08)

1. **Synthesis on the heaviest skills** (E2c) — `proportion` and `ratio` first;
   both are top-5 by exam-kind marks and near-empty of synthesis items. The
   best-buy / cheapest-shop decision pattern is a multi-part numeric + final MC:
   no engine work.
2. **Thicken E2 top-down** — `inverse_proportion`, `tree_diagrams`,
   `kinematic_graphs`, `simplifying_indices`, `time_series`,
   `reverse_percentage` — plus the three E2b hand-overrides.
3. **Exploit `grid_draw`** — it carries only 6 parts across the whole bank while
   ~86 marks of coded exam traffic now fit its eight modes.
   `plans_and_elevations` (12 marks, zero coverage) is the best first target.
4. **Close E1's authorable tail** — `trig_graphs`, `sketching_functions`.
5. **Watchlist (E4)** — revisit the circle-vocabulary node when 2025 is coded.
6. **Genuinely blocked** — free-text/proof, compass/ruler, matching, box plots.
   See `06-app-gap-plan.md` §Revision for the current blocked set (~104 marks,
   down from ~295).

## §H — What changed since the 2026-06-10 pass _(historical)_

The original headline was "**33 exam-tested skills have ZERO published
questions**, together touching ~280 marks", with an 18-skill "authorable now"
table and a 9-skill "blocked by app gaps" table. Every skill in that authorable
table now has coverage. Two things invalidated it:

1. **The bank roughly doubled** (133 → 233 published; 113 → 139 skills covered),
   consuming the backlog it described.
2. **Engine capability landed** — the equivalence grader (2e44ee4 + 3072b09),
   `multi_blank` with per-blank traps and errors-carried-forward, `grid_draw`
   (`points`/`polyline`/`line`/`cells`/`polygon`/`bars`/`bars_free`/
   `number_line`), and `mark_bands` partial credit. Most of the original
   "blocked" table is now authorable: `simple_charts`,
   `plotting_straight_line_graphs`, `histograms`, `plans_and_elevations`,
   `scatter_graphs` (plot side), `translations`/`reflections`.

The original pass also ranked purely by involvement-weighted marks, which
over-weighted foundational skills; the primary-marks + near-root-exclusion
metric documented above replaced it for exactly that reason.
