import { skills } from "./skills";

/**
 * Which qualification a course sits under.
 *
 * This exists because the coded exam corpus in `data/exam-audit/` holds more
 * than one qualification, and nothing downstream could tell them apart. Both
 * derived-data builders read that whole directory, so once the iGCSE 4MA1
 * papers were coded they silently joined GCSE data: the board switcher offered
 * "Edexcel International" to every GCSE student, and iGCSE mark statistics were
 * pooled into the GCSE exam assembler. Neither was caught by a test, because
 * neither builder had any notion that a qualification existed.
 */
export type Qualification = 'gcse' | 'igcse'

/**
 * Exam boards per qualification, spelled exactly as `meta.board` in the coded
 * audit files — that string is the join key, so a typo here silently empties a
 * slice rather than failing.
 *
 * THIS IS THE ONE SOURCE OF TRUTH. The builders and the board switcher all read
 * it; none of them keeps its own list. `courses.test.ts` fails if a board
 * appears in the audit and is not claimed here, so adding a board is a decision
 * someone has to make rather than something that happens by itself.
 */
export const BOARDS_BY_QUALIFICATION: Record<Qualification, readonly string[]> = {
  gcse: ['AQA', 'OCR', 'Pearson Edexcel'],
  igcse: ['Edexcel International'],
}

/** The qualification a coded board belongs to, or null if it is unclaimed. */
export function qualificationOfBoard(board: string): Qualification | null {
  for (const q of Object.keys(BOARDS_BY_QUALIFICATION) as Qualification[]) {
    if (BOARDS_BY_QUALIFICATION[q].includes(board)) return q
  }
  return null
}

export interface Course {
  id: string
  name: string
  qualification: Qualification
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
// STUDENT-SELECTABLE; teacher-side it is still GCSE-only. Corrected 2026-10-29:
// this block used to say "NOT YET SELECTABLE ANYWHERE", and that half has been
// false for a while. `QUALIFICATIONS` is derived from BOARDS_BY_QUALIFICATION
// above, so components/CourseSetupCard.tsx offers 'igcse' the moment there is
// more than one qualification and writes courseIdFor(qualification, tier) to
// students.course_id; app/account/page.tsx renders a picker over the whole
// `courses` array, all four of them. A signed-in student can be on either
// iGCSE course today. What is still true is the teacher side:
// ALLOWED_COURSES in app/api/assessments/create/route.ts lists only
// gcse_foundation and gcse_higher, so a class assessment cannot be set on 4MA1.
//
// They also exist so the iGCSE-only skills are not orphans — a skill in no
// course is unreachable AND poisons its dependents, which is the failure mode
// courses.test.ts exists to make loud.
//
// Built from the GCSE lists by applying ONLY the deltas the coded papers
// evidence (data/exam-audit/IGCSE-*.json, now 20 of 20 papers: five series,
// both tiers, both papers). The exclusions in docs/audit/25-igcse-4ma1-delta.md
// §4 ARE applied — see `igcseExcluded` and `igcseAbsentAndGating` below, landed
// 2026-10-08 and re-tested against the complete corpus on 2026-10-29.
//
// Every move below is verified against the CODED PAPERS rather than read off
// the specification. That is not pedantry: the spec's two-column layout misled
// an earlier reading of this exact question, and a Foundation paper overturned
// it. Counts are (Foundation parts : Higher parts) across all 20 coded papers,
// refreshed 2026-10-29 — they used to be 12-paper counts.
//
// READ THE PART COUNTS WITH CARE. 4MA1 prints the SAME question on both tiers:
// the Foundation paper's stretch block is the Higher paper's opening block, item
// for item. `set_notation` is 10 parts on each tier and that is THREE questions
// in total, not six — Jun24 1F q22 = 1H q7, Nov23 1F q15 = 1H q1, Nov24 1F q21
// = 1H q4. Summing the two tiers double-counts every crossover item, so the
// four-part bar reads about twice as generous on 4MA1 as it does on a GCSE
// board. Judge a tier on ITS OWN slice, which is what skillExamProfiles.json
// does, and never on the sum.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Foundation on GCSE, Higher-only on 4MA1.
 *
 * `vectors` 0:8 (6 distinct questions) — never once at Foundation across the
 * coded papers, and spec 5.1 is flagged "Higher Tier only".
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
 *
 * Across all 20 papers: `venn_diagrams` 4:4 (3 and 2 distinct questions),
 * `upper_and_lower_bounds` 4:9 (2 and 7). Both reach the four-part bar on the
 * Foundation slice alone, which is what the move rests on.
 *
 * `venn_diagrams` was recorded here as 6:11 at twelve papers and is now 4:4.
 * Nothing was overturned: the 2026-10-07 set-notation build retagged the pure
 * membership rows off their interim `venn_diagrams` tag onto `set_notation` and
 * `counting_elements_in_sets`, where they belonged. The move still clears the
 * bar on its own evidence, with no part borrowed from the sets skills.
 */
const igcseMovedToFoundation = ["venn_diagrams", "upper_and_lower_bounds"]

// NOT moved, deliberately. The spec puts algebraic proportion at Higher while
// keeping ratio word problems at Foundation, which would split one app concept
// across two tiers. Updated 2026-10-29: this used to say both appear on NO
// coded 4MA1 paper, and `direct_proportion` no longer does — Jun23 2H q16 is
// 0:2 (one question), proportion given as a graph and wanted as a formula,
// which is spec 2.5's "relate algebraic solutions to graphical representation"
// exactly. `inverse_proportion` is still 0:0 across all twenty. One part is
// well short of the bar, so the direction now matches the spec but the move
// still has nothing like enough behind it. See the delta doc §3 and §10.

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
 *   equations_and_identities — "identities" appears only in a section heading
 *
 * CORRECTION 2026-10-09, after coding the November 2023 series: `frustum` and
 * `function_machines` were both on this list and are both WRONG. Nov23 2H q23
 * opens "Here is a frustum of a cone"; Nov23 2F q10 is a two-step number
 * machine. Thirteen papers of silence, then the fourteenth examines them.
 *
 * The method was too literal, and in a way the remaining entries may share. A
 * spec that never writes "frustum" still examines one, because 4.10 gives the
 * cone and a frustum is two cones; a spec that never writes "function machine"
 * still uses one as the vehicle for 2.2's "derive a formula or expression".
 * **Absence of a WORD from the specification is weak evidence** — weakest for
 * question FORMATS and for COMPOSITES of listed content.
 *
 * Entries carrying the same risk were flagged for re-test once all twenty
 * papers were coded rather than trusted then: `relative_frequency` (examinable
 * as "estimate the probability from these results"), `equations_and_identities`
 * (a concept, not a named topic), `exact_trig_values` and `frequency_diagrams`.
 * The safer entries are the ones the spec excludes by positive statement rather
 * than by silence — `nth_term_quadratic_sequences` (3.1 is arithmetic only),
 * `scatter_graphs` and `time_series` (Foundation data is capped by its own note
 * at pictograms, bar charts, pie charts and two-way tables).
 *
 * RE-TEST DONE 2026-10-29, corpus complete at 20 of 20. **All four stay out.**
 * Searched the question SUBSTANCE in every row's `app_gap_note`, not just
 * `skill_ids` — an excluded skill is never tagged, so matching on tags would
 * have proved nothing. Per tier, parts / distinct questions:
 *
 *   relative_frequency        F 0/0   H 0/0
 *   equations_and_identities  F 0/0   H 0/0
 *   exact_trig_values         F 0/0   H 0/0
 *   frequency_diagrams        F 0/0   H 0/0
 *
 * Zero on every wording tried: "relative frequenc", "estimate the probability",
 * "trial", "experiment", "identit", "equivalen", "true for all", "exact value",
 * "surd form", "frequency polygon", "frequency diagram". The four strings also
 * appear nowhere in the twenty files at all, `coding_notes` included.
 *
 * Three of the four now have a POSITIVE reason too, which is what the frustum
 * correction said to look for instead of spec silence:
 *   exact_trig_values  — every one of the twenty papers is a CALCULATOR paper
 *                        (`meta.paper` on all 20; 4MA1 has no non-calculator
 *                        component, unlike 1MA1's 1 in 3). The skill is "write
 *                        down the exact value of sin 90" — a non-calculator
 *                        question form 4MA1 does not possess.
 *   frequency_diagrams — the spec's own note on Foundation 6.1 caps the data
 *                        strand at "pictograms, bar charts and pie charts, and
 *                        only two-way tables", and the papers match it exactly:
 *                        22 Foundation parts of `simple_charts` (bar charts and
 *                        pictograms), 0 of anything else chart-shaped.
 *   relative_frequency — 4MA1 examines the CONVERSE and only the converse.
 *                        `expected_outcomes` is 4:4 — given a probability, how
 *                        many in n trials. The estimate-a-probability-from-
 *                        results direction appears nowhere.
 * `equations_and_identities` rests on silence alone, now across twenty papers.
 *
 * Cost of leaving them out, measured against the live bank the same day: 3
 * published questions are hidden from an iGCSE student — 2 on
 * `relative_frequency`, 1 on `exact_trig_values`, 0 on the other two. That is
 * the price of the exclusion, and it is the right price: a question for content
 * the student will not be examined on is worse than a gap.
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
  "equations_and_identities",
]

/**
 * These five are also absent from 4MA1, and were briefly KEPT as scaffolding
 * because each gates something 4MA1 does examine:
 *
 *   sampling            → gathering_and_organising_data → the whole data tree
 *   frequency_diagrams  → histograms
 *   frequency_trees     → tree_diagrams
 *   box_plots           → interquartile_range
 *   exact_trig_values   → trig_graphs
 *
 * This list said "six" and named `function_machines → substitution,
 * forming_expressions_and_formulae` until 2026-10-29. The array lost that entry
 * in the 2026-10-09 correction recorded above — Nov23 2F q10 and Jun23 1F q9
 * are number machines, 4:0 — but the prose here was not updated with it. The
 * five above are what the array holds.
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
  // Calculus, spec 3.4, flagged "Higher Tier only" in the Foundation listing
  // and confirmed by the papers — all eight coded calculus parts are on Higher
  // papers, none on a Foundation one.
  //
  // RESHAPED 2026-10-30, and `calculus_kinematics` is gone; see the block above
  // these three in data/skills.ts for why. `rates_of_change` clears the
  // four-part evidence bar with 4 parts and 17 marks;
  // `polynomial_differentiation` (2) and `stationary_points` (2) do not, and
  // are built anyway: minParts gates whether the app makes an EXAM CLAIM about
  // a skill, not whether the skill exists. Only 13-18% of skills clear it on
  // the OCR and Edexcel slices, and those are all real skills students
  // practise. `polynomial_differentiation` is in any case exercised by all
  // eight parts as the prerequisite of the other two.
  "polynomial_differentiation",
  "rates_of_change",
  "stationary_points",
]

export const courses: Course[] = [
  {
    id: "gcse_foundation",
    name: "GCSE Foundation",
    qualification: "gcse",
    skills: foundationSkillIds,
  },
  {
    id: "gcse_higher",
    name: "GCSE Higher",
    qualification: "gcse",
    skills: [...foundationSkillIds, ...higherOnlySkillIds],
  },
  {
    id: "igcse_foundation",
    name: "iGCSE Foundation (4MA1)",
    qualification: "igcse",
    skills: igcseFoundationSkillIds,
  },
  {
    id: "igcse_higher",
    name: "iGCSE Higher (4MA1)",
    qualification: "igcse",
    skills: [...igcseFoundationSkillIds, ...igcseHigherOnlySkillIds],
  },
]

/**
 * Which tier of a qualification a course is. Not a field on Course because the
 * pair is what matters: a qualification has exactly one Foundation and one
 * Higher course, and resolving that pair is the only thing callers ever want.
 */
export type CourseTier = 'foundation' | 'higher'

const COURSE_IDS: Record<Qualification, Record<CourseTier, string>> = {
  gcse:  { foundation: 'gcse_foundation',  higher: 'gcse_higher' },
  igcse: { foundation: 'igcse_foundation', higher: 'igcse_higher' },
}

/**
 * The course a (qualification, tier) names.
 *
 * Every student-facing skill pool used to be resolved by looking up the string
 * "gcse_foundation" inline — in /practice, in the practice question page and in
 * the diagnostic, each with its own copy of the higher-only filtering below.
 * That is three places that silently stay GCSE whatever a student picks, so the
 * lookup lives here once and takes the qualification as an argument.
 */
export function courseFor(qualification: Qualification, tier: CourseTier): Course {
  const id = COURSE_IDS[qualification][tier]
  const course = courses.find(c => c.id === id)
  if (!course) throw new Error(`no course ${id} for ${qualification} ${tier}`)
  return course
}

/**
 * The skills a Higher candidate gets that a Foundation one does not.
 *
 * Derived by difference rather than read from the *HigherOnlySkillIds arrays,
 * so it stays right for any qualification whose Higher course is assembled some
 * other way. Note this is NOT the Higher course: courseFor(q, 'higher').skills
 * is the whole paper, Foundation content included.
 */
/** Every course id, for guarding a value that came from outside the app. */
export const COURSE_IDS_ALL: string[] =
  (Object.keys(COURSE_IDS) as Qualification[])
    .flatMap(q => (['foundation', 'higher'] as CourseTier[]).map(t => COURSE_IDS[q][t]))

/** The id a (qualification, tier) names. */
export function courseIdFor(qualification: Qualification, tier: CourseTier): string {
  return COURSE_IDS[qualification][tier]
}

/**
 * Split a stored course id back into the pair it stands for, or null if it is
 * not a course this build knows. Null rather than a throw: the id comes off a
 * database row written by an older or newer deploy, so an unknown one is a
 * situation to fall back from, not a crash.
 */
export function courseParts(
  id: string | null | undefined,
): { qualification: Qualification; tier: CourseTier } | null {
  for (const q of Object.keys(COURSE_IDS) as Qualification[]) {
    for (const tier of ['foundation', 'higher'] as CourseTier[]) {
      if (COURSE_IDS[q][tier] === id) return { qualification: q, tier }
    }
  }
  return null
}

export function higherOnlySkillsFor(qualification: Qualification): string[] {
  const foundation = new Set(courseFor(qualification, 'foundation').skills)
  return courseFor(qualification, 'higher').skills.filter(id => !foundation.has(id))
}
