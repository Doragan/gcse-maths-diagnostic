import { skills } from "./skills";

export interface Course {
  id: string
  name: string
  skills: string[]
}

export const foundationSkillIds = [
  "simple_arithmetic", "indices", "rounding", "significant_figures",
  "estimating", "converting_measurements", "factors_and_multiples",
  "prime_factor_decomposition", "lowest_common_multiple", "highest_common_factor",
  "fractions_of_amounts", "simplifying_fractions", "irregular_and_improper_fractions",
  "decimals", "converting_fractions_to_decimals", "converting_decimals_to_fractions",
  "adding_and_subtracting_fractions", "multiplying_fractions", "dividing_fractions",
  "fractions_decimals_and_percentages", "percentage_change", "exact_calculations",
  "simplifying_indices", "standard_form",
  "simplifying_expressions", "substitution", "solving_linear_equations",
  "expanding_brackets", "factorising", "expanding_double_brackets",
  "factorising_quadratics", "difference_of_two_squares",
  "solving_quadratic_equations_factorising", "solving_quadratic_equations_quadratic_equation",
  "simultaneous_equations", "inequalities", "sequences", "finding_the_nth_term",
  "plotting_straight_line_graphs", "understanding_straight_line_graphs",
  "sketching_functions", "kinematic_graphs", "quadratic_functions",
  "angles_on_lines_and_circles", "measuring_lines_and_angles",
  "alternate_and_corresponding_angles", "bearings", "angles_in_polygons",
  "congruence_and_similarity", "exterior_angles", "constructions", "loci",
  "translations", "rotations", "enlargements","reflections",
  "areas_of_squares_and_rectangles", "areas_of_triangles", "area_of_parallelograms",
  "area_of_a_trapezium", "areas_of_compound_shapes",
  "circumfrence_of_a_circle", "area_of_a_circle", "sector_calculations",
  "pythagoras_theorem", "trigonometry_missing_sides", "trigonometry_missing_angles",
  "volume_of_a_prism", "volume_of_a_pyramid_and_cone", "volume_of_a_sphere",
  "surface_area_of_a_sphere", "surface_area_of_a_cone", "surface_area_of_a_cylinder",
  "vectors",
  "sampling", "gathering_and_organising_data", "simple_charts", "pie_charts",
  "frequency_diagrams", "grouped_frequency_tables", "scatter_graphs", "time_series",
  "mean", "mode", "median", "range",
  "calculating_simple_probability", "expected_outcomes", "mutually_exclusive_events",
  "combined_events", "probability_spaces", "tree_diagrams",
  "proportion", "ratio", "compound_units", "direct_proportion",
  "inverse_proportion", "growth_and_decay",
  // Added 2026-08-21. These skills existed in data/skills.ts but were in no tier
  // list, so they never entered the practice pool — and, worse, any skill with
  // one of them as a PREREQUISITE could never satisfy getAccessibleSkillIds
  // (which requires every prerequisite to have been attempted). That silently
  // gated 12 in-pool skills, `ratio` and `pythagoras_theorem` among them.
  // Tier placement is taken from the coded exam audit: a skill appearing on any
  // Foundation paper is Foundation. See courses.test.ts, which now fails if a
  // skill is ever added to skills.ts without being placed here.
  "lengths_and_perimeters", "parts_of_a_circle", "properties_of_3d_solids",
  "plans_and_elevations", "symmetry", "coordinates",
  "function_machines", "forming_expressions_and_formulae", "rearranging_formulae",
  "systematic_listing", "frequency_trees", "relative_frequency",
  "time_calculations", "reciprocals", "simplifying_ratio", "exact_trig_values",
  // Added 2026-09-04 with the skills themselves. Both appear on Foundation
  // papers, so the rule above places them here: properties_of_2d_shapes on AQA
  // 1F/3F Nov 2023, Edexcel 1F and OCR 02; equations_and_identities on AQA 3F
  // June 2024 and OCR 01, as well as on several Higher papers.
  "properties_of_2d_shapes", "equations_and_identities",
  // Moved from higherOnlySkillIds 2026-09-22. It was placed as Higher-only, but
  // the coded audit has it on five Foundation parts across all three boards —
  // AQA Nov 2023 1F q25, June 2024 2F q20 and Nov 2024 2F q24, Edexcel June 2025
  // 2F q24, and OCR June 2025 J560/03 q8b — so the rule above places it here.
  // Always late in the paper, in the stretch section, and below the four-part
  // evidence bar on any single board, so /skill/reverse-percentage still shows
  // no audit-derived claim on Foundation.
  "reverse_percentage",
  // area_and_volume_scale_factors does most of its work on Higher papers, but
  // it appears on Foundation ones too (AQA 3F June 2023 q19, OCR J560/03 q19),
  // and the rule above is "any Foundation paper".
  "area_and_volume_scale_factors",
]

export const higherOnlySkillIds = [
  "recurring_decimals_to_fractions", "fractional_and_negative_indices",
  "surds_simplifying", "surds_expanding_and_rationalising", "upper_and_lower_bounds",
  "algebraic_fractions", "completing_the_square", "quadratic_inequalities",
  "simultaneous_equations_quadratic", "nth_term_quadratic_sequences",
  "equation_of_a_circle", "algebraic_proof", "functions_notation",
  "composite_functions", "inverse_functions", "iteration", "graph_transformations",
  "circle_theorem_angle_at_centre", "circle_theorem_same_segment",
  "circle_theorem_cyclic_quadrilateral", "circle_theorem_tangent",
  "circle_theorem_alternate_segment", "sine_rule", "cosine_rule",
  "area_of_triangle_sine", "trigonometry_3d", "frustum",
  "vector_proof", "fractional_enlargements",
  "venn_diagrams", "conditional_probability", "histograms",
  "cumulative_frequency", "box_plots", "interquartile_range",
  "proportion_with_powers",
  // Added 2026-08-21 alongside the Foundation additions above. These three
  // appear ONLY on Higher papers across all 30 coded series.
  "perpendicular_gradients", "trig_graphs", "counting_without_listing",
  // Added 2026-09-04. Tangent and chord gradients on a curve appear only on
  // Higher papers (OCR J560/04 q21), so this one is Higher-only.
  "gradient_of_a_curve",
  // Exponential curves appear only on Higher papers.
  "exponential_graphs",
]

// ─────────────────────────────────────────────────────────────────────────────
// Edexcel International GCSE 4MA1 ("iGCSE"). Added 2026-10-07.
//
// PROVISIONAL, AND NOT YET SELECTABLE ANYWHERE. No UI offers these courses and
// ALLOWED_COURSES in app/api/assessments/create/route.ts does not list them.
// They exist so the two iGCSE-only skills are not orphans — a skill in no
// course is unreachable AND poisons its dependents, which is the failure mode
// courses.test.ts exists to make loud.
//
// Built from the GCSE lists by applying ONLY the deltas the coded papers
// evidence (data/exam-audit/IGCSE-*.json, 12 of 20 papers). The exclusions in
// docs/audit/25-igcse-4ma1-delta.md §4 — scatter graphs, time series, sampling,
// box plots, frequency trees, plans and elevations, loci, iteration — are NOT
// yet applied; that list needs the full corpus before it is safe to act on.
//
// Every move below is verified against the CODED PAPERS rather than read off
// the specification. That is not pedantry: the spec's two-column layout misled
// an earlier reading of this exact question, and a Foundation paper overturned
// it. Counts are (Foundation parts : Higher parts) across the 12 coded papers.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Foundation on GCSE, Higher-only on 4MA1.
 *
 * `vectors` 0:5 — never once at Foundation across the coded papers, and spec
 * 5.1 is flagged "Higher Tier only".
 *
 * `translations` was briefly moved here too, and has been PUT BACK. That move
 * was never evidence-driven: it was forced by the prerequisite graph, which
 * makes `vectors` the sole prerequisite of `translations`, so moving vectors to
 * Higher left translations unreachable in the iGCSE Foundation pool.
 * courses.test.ts caught it, which is what it is for.
 *
 * Scoping the blocking rule to the course removed the need for the compromise:
 * with vectors outside the iGCSE Foundation pool it is simply not a
 * prerequisite there, and translations sits at Foundation where spec 5.2 puts
 * transformation geometry. See `prerequisiteTreeWithin`.
 */
const igcseMovedToHigher = ["vectors"]

/**
 * Higher-only on GCSE, Foundation on 4MA1.
 * venn_diagrams 6:11, upper_and_lower_bounds 4:7 — both well past the
 * four-part evidence bar on the Foundation slice alone.
 */
const igcseMovedToFoundation = ["venn_diagrams", "upper_and_lower_bounds"]

// NOT moved, deliberately: direct_proportion and inverse_proportion appear on
// NO coded 4MA1 paper, Foundation or Higher. The spec puts algebraic proportion
// at Higher while keeping ratio word problems at Foundation, which would split
// one app concept across two tiers — but with zero paper evidence either way
// that stays an open question rather than a guess. See the delta doc §3.

/**
 * Content 4MA1 does not examine. Each one verified absent from BOTH the
 * specification text AND all 12 coded papers — the delta doc's §4 list had only
 * the first of those, and three of these ("probable, unconfirmed") are now
 * settled. Removed from the iGCSE pools so a student is never served a question
 * for an exam they will not sit.
 *
 * Why each is out, beyond "zero parts in the audit":
 *   loci                 — spec has none; every apparent match was "ve-LOCI-ty"
 *   iteration            — absent from the spec
 *   scatter_graphs       — absent; 4MA1 Foundation data is capped by its own
 *   time_series            note at "pictograms, bar charts and pie charts, and
 *   relative_frequency     only two-way tables"
 *   plans_and_elevations — the spec's only "elevation" is ANGLES of elevation
 *   nth_term_quadratic_sequences — 4MA1's 3.1 is arithmetic sequences only
 *   equation_of_a_circle — the spec's one `x² + y² =` is an EXAMPLE of a
 *                          simultaneous pair, not a circle topic
 *   exponential_graphs   — absent; 3.3 lists cubic, reciprocal and trig curves
 *   frustum              — absent; 4.10 is the sphere and the right circular cone
 *   equations_and_identities — "identities" appears only in a section heading
 */
const igcseExcluded = [
  "loci",
  "iteration",
  "scatter_graphs",
  "time_series",
  "relative_frequency",
  "plans_and_elevations",
  "nth_term_quadratic_sequences",
  "equation_of_a_circle",
  "exponential_graphs",
  "frustum",
  "equations_and_identities",
]

/**
 * These six are also absent from 4MA1, and were briefly KEPT as scaffolding
 * because each gates something 4MA1 does examine:
 *
 *   sampling            → gathering_and_organising_data → the whole data tree
 *   function_machines   → substitution, forming_expressions_and_formulae
 *                         → most of algebra
 *   frequency_diagrams  → histograms
 *   frequency_trees     → tree_diagrams
 *   box_plots           → interquartile_range
 *   exact_trig_values   → trig_graphs
 *
 * Excluding them naively made 63 of 161 skills unreachable — `substitution`,
 * `pythagoras_theorem` and `solving_linear_equations` among them.
 *
 * They are now excluded properly, because the blocking rule is scoped to the
 * course: a prerequisite outside the course is not a prerequisite OF the
 * course. See `prerequisiteTreeWithin` in lib/skills/skillGraph.ts. A course no
 * longer has to carry a topic it does not teach just to keep the graph
 * walkable, which is what would otherwise have made any A-level or Further
 * Maths course drag GCSE scaffolding along behind it.
 */
const igcseAbsentAndGating = [
  "sampling",
  "function_machines",
  "frequency_diagrams",
  "frequency_trees",
  "box_plots",
  "exact_trig_values",
]

export const igcseFoundationSkillIds = [
  ...foundationSkillIds.filter(
    id => !igcseMovedToHigher.includes(id)
      && !igcseExcluded.includes(id)
      && !igcseAbsentAndGating.includes(id),
  ),
  ...igcseMovedToFoundation,
  "set_notation",
]

export const igcseHigherOnlySkillIds = [
  ...higherOnlySkillIds.filter(
    id => !igcseMovedToFoundation.includes(id)
      && !igcseExcluded.includes(id)
      && !igcseAbsentAndGating.includes(id),
  ),
  ...igcseMovedToHigher,
  "counting_elements_in_sets",
]

export const courses: Course[] = [
  {
    id: "gcse_foundation",
    name: "GCSE Foundation",
    skills: foundationSkillIds,
  },
  {
    id: "gcse_higher",
    name: "GCSE Higher",
    skills: [...foundationSkillIds, ...higherOnlySkillIds],
  },
  {
    id: "igcse_foundation",
    name: "iGCSE Foundation (4MA1)",
    skills: igcseFoundationSkillIds,
  },
  {
    id: "igcse_higher",
    name: "iGCSE Higher (4MA1)",
    skills: [...igcseFoundationSkillIds, ...igcseHigherOnlySkillIds],
  },
]