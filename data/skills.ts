export type Skill = {
  id: string
  name: string
  topic: string
  prerequisites: string[]
  exampleQuestion?: string
  exampleAnswer?: string
}

export const skills: Skill[] = [
  {
    "id": "simple_arithmetic",
    "name": "Simple Arithmetic",
    "topic": "Number",
    "prerequisites": [],
	"exampleQuestion": "Can you perform simple maths operations, such as 3x5 or 104÷2 without a calculator?",
	"exampleAnswer": "The answers would be 15 and 52" 
  },
  {
    "id": "indices",
    "name": "Indices",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "What is 4 squared?",
	"exampleAnswer": "16" 
  },
  {
    "id": "rounding",
    "name": "Rounding",
    "topic": "Number",
    "prerequisites": [],
	"exampleQuestion": "Round 2.035 to 2dp.",
	"exampleAnswer": "2.04" 
  },
  {
    "id": "significant_figures",
    "name": "Significant Figures",
    "topic": "Number",
    "prerequisites": [
      "rounding"
    ],
	"exampleQuestion": "Round 2.035 to 2sf.",
	"exampleAnswer": "2.0" 
  },
  {
    "id": "simplifying_expressions",
    "name": "Simplifying Expressions",
    "topic": "Algebra",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "Simplify 3x + 5 - x + 2y",
	"exampleAnswer": "2x + 5 + 2y"
  },
  {
    "id": "substitution",
    "name": "Substitution",
    "topic": "Algebra",
    "prerequisites": [],
	"exampleQuestion": "Calculate 3x + 2 if x = 4",
	"exampleAnswer": "14" 
  },
  {
    "id": "solving_linear_equations",
    "name": "Solving Linear Equations",
    "topic": "Algebra",
    "prerequisites": [
      "substitution"
    ],
	"exampleQuestion": "Solve 4y - 2 = 18",
	"exampleAnswer": "y = 5" 
  },
  {
    "id": "expanding_brackets",
    "name": "Expanding Brackets",
    "topic": "Algebra",
    "prerequisites": [
      "simplifying_expressions"
    ],
	"exampleQuestion": "Expand: 4(2x - 5)",
	"exampleAnswer": "8x - 20" 
  },
  {
    "id": "factorising",
    "name": "Factorising",
    "topic": "Algebra",
    "prerequisites": [
      "expanding_brackets"
    ],
	"exampleQuestion": "Factorise fully: 12z + 4",
	"exampleAnswer": "4(3z + 1)" 
  },
  {
    "id": "angles_on_lines_and_circles",
    "name": "Angles on lines and Circles",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "What is the missing angle in the diagram, below?",
	"exampleAnswer": "100°" 
  },
  {
    "id": "measuring_lines_and_angles",
    "name": "Measuring Lines and Angles",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles"
    ],
	"exampleQuestion": "Can you measure an angle with a protractor?"
  },
  {
    "id": "alternate_and_corresponding_angles",
    "name": "Alternate and Corresponding Angles",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles"
    ],
	"exampleQuestion": "What is the missing angle in the diagram, below?",
	"exampleAnswer": "48°"
  },
  {
    "id": "bearings",
    "name": "Bearings",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles"
    ],
	"exampleQuestion": "What is the bearing of the line AB?",
	"exampleAnswer": "335°"
  },
  {
    "id": "angles_in_polygons",
    "name": "Angles in Polygons",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles"
    ],
	"exampleQuestion": "What is the missing angle in the diagram, below?",
	"exampleAnswer": "104°"
  },
  {
    "id": "congruence_and_similarity",
    "name": "Congruence and Similarity",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_in_polygons"
    ]
  },
  {
    "id": "exterior_angles",
    "name": "Exterior Angles",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_in_polygons"
    ]
  },
  {
    "id": "sampling",
    "name": "Sampling",
    "topic": "Probability and Data",
    "prerequisites": []
  },
  {
    "id": "gathering_and_organising_data",
    "name": "Gathering and Organising Data",
    "topic": "Probability and Data",
    "prerequisites": [
      "sampling"
    ]
  },
  {
    "id": "simple_charts",
    "name": "Simple Charts",
    "topic": "Probability and Data",
    "prerequisites": [
      "gathering_and_organising_data"
    ]
  },
  {
    "id": "pie_charts",
    "name": "Pie Charts",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_charts",
      "angles_on_lines_and_circles"
    ]
  },
  {
    "id": "averages_and_spread",
    "name": "Averages and Spread",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic",
      "sampling"
    ]
  },
  {
    "id": "fractions_of_amounts",
    "name": "Fractions of Amounts",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "simplifying_fractions",
    "name": "Simplifying Fractions",
    "topic": "Number",
    "prerequisites": [
      "fractions_of_amounts"
    ]
  },
    {
    "id": "irregular_and_top_heavy_fractions",
    "name": "Irregular and Top Heavy Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions"
    ]
  },
  {
    "id": "decimals",
    "name": "Decimals",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "converting_fractions_to_decimals",
    "name": "Converting Fractions to Decimals",
    "topic": "Number",
    "prerequisites": [
      "decimals",
      "fractions_of_amounts"
    ]
  },
  {
    "id": "converting_decimals_to_fractions",
    "name": "Converting Decimals to Fractions",
    "topic": "Number",
    "prerequisites": [
      "decimals",
      "fractions_of_amounts",
      "simplifying_fractions"
    ]
  },
  {
    "id": "adding_and_subtracting_fractions",
    "name": "Adding and Subtracting Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions",
      "simple_arithmetic"
    ]
  },
  {
    "id": "multiplying_fractions",
    "name": "Multiplying Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions",
      "simple_arithmetic"
    ]
  },
  {
    "id": "dividing_fractions",
    "name": "Dividing Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions",
      "simple_arithmetic",
      "multiplying_fractions"
    ]
  },
  {
    "id": "fractions_decimals_and_percentages",
    "name": "Fractions Decimals and Percentages",
    "topic": "Number",
    "prerequisites": [
      "converting_fractions_to_decimals",
      "converting_decimals_to_fractions"
    ],
	"exampleQuestion": "Order the following from smallest to largest:\n 0.1, 1/2, 0.09, 25%",
	"exampleAnswer": "0.09, 0.1, 25%, 1/2" 
  },
  {
    "id": "exact_calculations",
    "name": "Exact Calculations",
    "topic": "Number",
    "prerequisites": [
      "fractions_decimals_and_percentages"
    ]
  },
  {
    "id": "expanding_double_brackets",
    "name": "Expanding Double Brackets",
    "topic": "Algebra",
    "prerequisites": [
      "expanding_brackets"
    ]
  },
  {
    "id": "factorising_quadratics",
    "name": "Factorising Quadratics",
    "topic": "Algebra",
    "prerequisites": [
      "expanding_double_brackets"
    ]
  },
  {
    "id": "difference_of_two_squares",
    "name": "Difference of Two Squares",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics"
    ]
  },
  {
    "id": "areas_of_squares_and_rectangles",
    "name": "Areas of Squares and Rectangles",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "areas_of_triangles",
    "name": "Areas of Triangles",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles"
    ]
  },
  {
    "id": "area_of_parallelograms",
    "name": "Area of Parallelograms",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles"
    ]
  },
  {
    "id": "area_of_a_trapezium",
    "name": "Area of a Trapezium",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles"
    ]
  },
  {
    "id": "areas_of_compound_shapes",
    "name": "Areas of Compound Shapes",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles",
      "areas_of_triangles"
    ]
  },
  {
    "id": "calculating_simple_probability",
    "name": "Calculating Simple Probability",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "expected_outcomes",
    "name": "Expected Outcomes",
    "topic": "Probability and Data",
    "prerequisites": [
      "calculating_simple_probability"
    ]
  },
  {
    "id": "mutually_exclusive_events",
    "name": "Mutually Exclusive Events",
    "topic": "Probability and Data",
    "prerequisites": [
      "calculating_simple_probability"
    ]
  },
  {
    "id": "estimating",
    "name": "Estimating",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "converting_measurements",
    "name": "Converting Measurements",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "solving_quadratic_equations_factorising",
    "name": "Solving Quadratic Equations (Factorising)",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "solving_linear_equations"
    ]
  },
  {
    "id": "solving_quadratic_equations_quadratic_equation",
    "name": "Solving Quadratic Equations (Quadratic Equation)",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "solving_linear_equations"
    ]
  },
  {
    "id": "simultaneous_equations",
    "name": "Simultaneous Equations",
    "topic": "Algebra",
    "prerequisites": [
      "solving_linear_equations"
    ]
  },
  {
    "id": "inequalities",
    "name": "Inequalities",
    "topic": "Algebra",
    "prerequisites": [
      "solving_linear_equations"
    ]
  },
  {
    "id": "circumfrence_of_a_circle",
    "name": "Circumfrence of a Circle",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "area_of_a_circle",
    "name": "Area of a Circle",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic",
      "areas_of_squares_and_rectangles"
    ]
  },
  {
    "id": "sector_calculations",
    "name": "Sector Calculations",
    "topic": "Shape and Space",
    "prerequisites": [
      "circumfrence_of_a_circle",
      "area_of_a_circle",
      "angles_on_lines_and_circles",
      "fractions_of_amounts"
    ]
  },
  {
    "id": "proportion",
    "name": "Proportion",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "fractions_of_amounts",
      "fractions_decimals_and_percentages"
    ]
  },
  {
    "id": "ratio",
    "name": "Ratio",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "proportion"
    ]
  },
  {
    "id": "percentage_change",
    "name": "Percentage Change",
    "topic": "Number",
    "prerequisites": [
      "fractions_of_amounts",
      "fractions_decimals_and_percentages"
    ]
  },
  {
    "id": "factors_and_multiples",
    "name": "Factors and Multiples",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "prime_factor_decomposition",
    "name": "Prime Factor Decomposition",
    "topic": "Number",
    "prerequisites": [
      "factors_and_multiples"
    ]
  },
  {
    "id": "plotting_straight_line_graphs",
    "name": "Plotting Straight Line Graphs",
    "topic": "Algebra",
    "prerequisites": [
      "substitution"
    ]
  },
  {
    "id": "understanding_straight_line_graphs",
    "name": "Understanding Straight Line Graphs",
    "topic": "Algebra",
    "prerequisites": [
      "plotting_straight_line_graphs"
    ]
  },
  {
    "id": "sketching_functions",
    "name": "Sketching Functions",
    "topic": "Algebra",
    "prerequisites": [
      "understanding_straight_line_graphs"
    ]
  },
  {
    "id": "kinematic_graphs",
    "name": "Kinematic Graphs",
    "topic": "Algebra",
    "prerequisites": [
      "plotting_straight_line_graphs"
    ]
  },
  {
    "id": "volume_of_a_prism",
    "name": "Volume of a prism",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles",
      "area_of_a_circle",
      "area_of_a_trapezium"
    ]
  },
  {
    "id": "volume_of_a_pyramid_and_cone",
    "name": "Volume of a Pyramid and Cone",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_prism",
      "areas_of_squares_and_rectangles",
      "area_of_a_circle"
    ]
  },
  {
    "id": "volume_of_a_sphere",
    "name": "Volume of a Sphere",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_prism",
      "area_of_a_circle"
    ]
  },
  {
    "id": "surface_area_of_a_sphere",
    "name": "Surface Area of a Sphere",
    "topic": "Shape and Space",
    "prerequisites": [
      "area_of_a_circle"
    ]
  },
  {
    "id": "surface_area_of_a_cone",
    "name": "Surface Area of a Cone",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_pyramid_and_cone"
    ]
  },
  {
    "id": "surface_area_of_a_prism",
    "name": "Surface Area of a Prism",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_prism"
    ]
  },
  {
    "id": "frequency_diagrams",
    "name": "Frequency Diagrams",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic",
      "simple_charts"
    ]
  },
  {
    "id": "grouped_frequency_tables",
    "name": "Grouped Frequency Tables",
    "topic": "Probability and Data",
    "prerequisites": [
      "gathering_and_organising_data"
    ]
  },
  {
    "id": "scatter_graphs",
    "name": "Scatter Graphs",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_charts"
    ]
  },
  {
    "id": "time_series",
    "name": "Time Series",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_charts"
    ]
  },
  {
    "id": "simplifying_indices",
    "name": "Simplifying Indices",
    "topic": "Number",
    "prerequisites": [
      "indices"
    ]
  },
  {
    "id": "standard_form",
    "name": "Standard Form",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic",
      "indices",
      "decimals"
    ]
  },
  {
    "id": "quadratic_functions",
    "name": "Quadratic Functions",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "plotting_straight_line_graphs"
    ]
  },
  {
    "id": "pythagoras_theorem",
    "name": "Pythagoras' Theorem",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic",
      "angles_on_lines_and_circles",
      "indices",
      "areas_of_squares_and_rectangles",
      "solving_linear_equations"
    ]
  },
  {
    "id": "trigonometry_missing_sides",
    "name": "Trigonometry (missing sides)",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles",
      "angles_in_polygons"
    ]
  },
  {
    "id": "trigonometry_missing_angles",
    "name": "Trigonometry (missing angles)",
    "topic": "Shape and Space",
    "prerequisites": [
      "trigonometry_missing_sides"
    ]
  },
  {
    "id": "vectors",
    "name": "Vectors",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic",
      "plotting_straight_line_graphs"
    ]
  },
  {
    "id": "combined_events",
    "name": "Combined Events",
    "topic": "Probability and Data",
    "prerequisites": [
      "calculating_simple_probability"
    ]
  },
  {
    "id": "probability_spaces",
    "name": "Probability Spaces",
    "topic": "Probability and Data",
    "prerequisites": [
      "combined_events"
    ]
  },
  {
    "id": "tree_diagrams",
    "name": "Tree Diagrams",
    "topic": "Probability and Data",
    "prerequisites": [
      "combined_events"
    ]
  },
  {
    "id": "sequences",
    "name": "Sequences",
    "topic": "Algebra",
    "prerequisites": [
      "simple_arithmetic"
    ]
  },
  {
    "id": "finding_the_nth_term",
    "name": "Finding the nth Term",
    "topic": "Algebra",
    "prerequisites": [
      "solving_linear_equations"
    ]
  },
  {
    "id": "compound_units",
    "name": "Compound Units",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "substitution"
    ]
  },
  {
    "id": "direct_proportion",
    "name": "Direct Proportion",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "compound_units",
      "proportion"
    ]
  },
  {
    "id": "inverse_proportion",
    "name": "Inverse Proportion",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "direct_proportion"
    ]
  },
  {
    "id": "growth_and_decay",
    "name": "Growth and Decay",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "percentage_change",
      "indices"
    ]
  },
  {
    "id": "constructions",
    "name": "Constructions",
    "topic": "Shape and Space",
    "prerequisites": [
      "measuring_lines_and_angles"
    ]
  },
  {
    "id": "loci",
    "name": "Loci",
    "topic": "Shape and Space",
    "prerequisites": [
      "constructions"
    ]
  },
  {
    "id": "translations",
    "name": "Translations",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts"
    ]
  },
  {
    "id": "rotations",
    "name": "Rotations",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts",
      "angles_on_lines_and_circles"
    ]
  },
  {
    "id": "enlargements",
    "name": "Enlargements",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts"
    ]
  }
];