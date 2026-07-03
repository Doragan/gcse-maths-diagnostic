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
  "reverse_percentage", "proportion_with_powers",
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
]