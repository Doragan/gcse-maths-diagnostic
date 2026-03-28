export type Skill = {
  id: string
  name: string
  topic: string
  prerequisites: string[]
  exampleQuestion?: string
  exampleAnswer?: string
  image?: boolean
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
	"exampleAnswer": "48°",
	"image": true
  },
  {
    "id": "bearings",
    "name": "Bearings",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles"
    ],
	"exampleQuestion": "What is the bearing of the line AB?",
	"exampleAnswer": "335°",
	"image": true
  },
  {
    "id": "angles_in_polygons",
    "name": "Angles in Polygons",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles"
    ],
	"exampleQuestion": "What is the missing angle in the diagram, below?",
	"exampleAnswer": "104°",
	"image" : true
  },
  {
    "id": "congruence_and_similarity",
    "name": "Congruence and Similarity",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_in_polygons"
    ],
	"exampleQuestion": "Calculate the length of the side BC in the diagram below:",
	"exampleAnswer": "9cm",
	"image": true
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
    "prerequisites": [],
	"exampleQuestion": "A student is carrying out a survey of how often people go to see the football. They stand outside of the stadium on match day and asks people to take a survey. Explain why this survey is biased.",
	"exampleAnswer": "The people answering her survey are likely to be going to the football already, so are more likely to attend matches."
  },
  {
    "id": "gathering_and_organising_data",
    "name": "Gathering and Organising Data",
    "topic": "Probability and Data",
    "prerequisites": [
      "sampling"
    ],
	"exampleQuestion": "A student is carries out a survey of the number of cars at each house on her street. Calculate the number of houses on her street.",
	"exampleAnswer": "12",
	"image": true
  },
  {
    "id": "simple_charts",
    "name": "Simple Charts",
    "topic": "Probability and Data",
    "prerequisites": [
      "gathering_and_organising_data"
    ],
	"exampleQuestion": "A student is carries out a survey of the number of times he has chips for tea over a number of weeks and records them in the chart below. How many times did he have chips on a weekend?",
	"exampleAnswer": "8",
	"image": true
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
    "id": "mean",
    "name": "Mean",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "Calculate the mean of the following values: 3, 6, 1, 2",
	"exampleAnswer": "3"
  },
  {
    "id": "mode",
    "name": "Mode",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "What is the mode of the following data?: 5, 1, 7, 4, 2, 1, 0",
	"exampleAnswer": "1"
  },
  {
    "id": "median",
    "name": "Median",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "What is the median of the following data?: 3, 5, 8, 1, 2",
	"exampleAnswer": "3"
  },
  {
    "id": "range",
    "name": "Range",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "What is the range of the following data?: 3, 5, 8, 1, 2",
	"exampleAnswer": "7"
  },
  {
    "id": "fractions_of_amounts",
    "name": "Fractions of Amounts",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "What is 3/10 of 40?",
	"exampleAnswer": "12"
  },
  {
    "id": "simplifying_fractions",
    "name": "Simplifying Fractions",
    "topic": "Number",
    "prerequisites": [
      "fractions_of_amounts"
    ],
	"exampleQuestion": "Simplify Fully:",
	"exampleAnswer": "4/5",
	"image": true
  },
    {
    "id": "irregular_and_improper_fractions",
    "name": "Irregular and Improper Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions"
    ],
	"exampleQuestion": "Convert the following into a mixed number:",
	"exampleAnswer": "",
	"image": true
  },
  {
    "id": "decimals",
    "name": "Decimals",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "Calculate 3.5 + 4.61",
	"exampleAnswer": "8.11" 
  },
  {
    "id": "converting_fractions_to_decimals",
    "name": "Converting Fractions to Decimals",
    "topic": "Number",
    "prerequisites": [
      "decimals",
      "fractions_of_amounts"
    ],
	"exampleQuestion": "Convert 3/20 into a decimal number",
	"exampleAnswer": "0.15" 
  },
  {
    "id": "converting_decimals_to_fractions",
    "name": "Converting Decimals to Fractions",
    "topic": "Number",
    "prerequisites": [
      "decimals",
      "fractions_of_amounts",
      "simplifying_fractions"
    ],
	"exampleQuestion": "Convert 0.36 into a fraction and simplify fully",
	"exampleAnswer": "9/25" 
  },
  {
    "id": "adding_and_subtracting_fractions",
    "name": "Adding and Subtracting Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions",
      "simple_arithmetic"
    ],
	"exampleQuestion": "Calculate:",
	"exampleAnswer": "3/4" ,
	"image": true
  },
  {
    "id": "multiplying_fractions",
    "name": "Multiplying Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions",
      "simple_arithmetic"
    ],
	"exampleQuestion": "Calculate and simplify:",
	"exampleAnswer": "4/3" ,
	"image": true
  },
  {
    "id": "dividing_fractions",
    "name": "Dividing Fractions",
    "topic": "Number",
    "prerequisites": [
      "simplifying_fractions",
      "simple_arithmetic",
      "multiplying_fractions"
    ],
	"exampleQuestion": "Calculate and simplify:",
	"exampleAnswer": "28/45" ,
	"image": true
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
    ],
	"exampleQuestion": "Use your calculator to work out (6.1 x 5.4)² ÷ 2.1 and write down all the figures in your calculator display",
	"exampleAnswer": "516.68742857 (your answer may be to a different amount of decimal places)" 
  },
  {
    "id": "expanding_double_brackets",
    "name": "Expanding Double Brackets",
    "topic": "Algebra",
    "prerequisites": [
      "expanding_brackets"
    ],
	  "exampleQuestion": "Expand and Simplify (2y + 4)(y - 3)",
	"exampleAnswer": "2y² - 2y - 12" 
  },
  {
    "id": "factorising_quadratics",
    "name": "Factorising Quadratics",
    "topic": "Algebra",
    "prerequisites": [
      "expanding_double_brackets"
    ],
	"exampleQuestion": "Factorise x² + 7x + 12",
	"exampleAnswer": "(x + 3)(x + 4)" 
  },
  {
    "id": "difference_of_two_squares",
    "name": "Difference of Two Squares",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics"
    ],
	"exampleQuestion": "Factorise x² - 81",
	"exampleAnswer": "(x + 9)(x - 9)" 
  },
  {
    "id": "areas_of_squares_and_rectangles",
    "name": "Areas of Squares and Rectangles",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic"
    ],
	"exampleQuestion": "Calculate the area of the rectangle, below:",
	"exampleAnswer": "60mm²" ,
	"image": true
  },
  {
    "id": "areas_of_triangles",
    "name": "Areas of Triangles",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles"
    ],
	"exampleQuestion": "Calculate the area of the triangle, below:",
	"exampleAnswer": "80m²",
	"image": true
  },
  {
    "id": "area_of_parallelograms",
    "name": "Area of Parallelograms",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles"
    ],
	"exampleQuestion": "",
	"exampleAnswer": "50cm²",
	"image": true
  },
  {
    "id": "area_of_a_trapezium",
    "name": "Area of a Trapezium",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles"
    ],
	"exampleQuestion": "Calculate the area of the trapezium, below:",
	"exampleAnswer": "30cm²",
	"image": true
  },
  {
    "id": "areas_of_compound_shapes",
    "name": "Areas of Compound Shapes",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles",
      "areas_of_triangles"
    ],
	"exampleQuestion": "Calculate the area of the shape, below:",
	"exampleAnswer": "67m²",
	"image": true
  },
   {
    "id": "calculating_simple_probability",
    "name": "Calculating Simple Probability",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_arithmetic"
    ],
"exampleQuestion": "There are 3 red balls, 5 blue balls and 7 yellow balls in a bag. A ball is picked from the bag at random. What is the probability of picking a red ball?",
"exampleAnswer": "3/15 or 1/5 or 0.2 (any of these answers would be allowed)."
  },
  {
    "id": "expected_outcomes",
    "name": "Expected Outcomes",
    "topic": "Probability and Data",
    "prerequisites": [
      "calculating_simple_probability"
    ],
"exampleQuestion": "If a spinner has a 0.15 chance of landing on a 2, how many times would you expect it to land on 2 if it was spun 200 times?",
"exampleAnswer": "30"
  },
  {
    "id": "mutually_exclusive_events",
    "name": "Mutually Exclusive Events",
    "topic": "Probability and Data",
    "prerequisites": [
      "calculating_simple_probability"
    ],
"exampleQuestion": "There are 3 red balls, 5 blue balls and 7 yellow balls in a bag. A ball is picked from the bag at random. What is the probability of picking a blue or a yellow ball?",
"exampleAnswer": "10/15 or 2/3 (either of these answers would be allowed)."
  },
  {
    "id": "estimating",
    "name": "Estimating",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ],
"exampleQuestion": "Estimate: (3.8 x 52) + 6.9",
"exampleAnswer": "207 (200 would also be acceptable)"
  },
  {
    "id": "converting_measurements",
    "name": "Converting Measurements",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ],
"exampleQuestion": "A student is 1.6m tall. Calculate their height in mm",
"exampleAnswer": "1600mm"

  },
  {
    "id": "solving_quadratic_equations_factorising",
    "name": "Solving Quadratic Equations (Factorising)",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "solving_linear_equations"
    ],
"exampleQuestion": "Solve x² + 7x + 12 = 0 through factorisation.",
"exampleAnswer": "x = -3 or x = -4. To get this answer you should factorise the equation into (x + 3)(x + 4) = 0 as part of the solving process."
  },
  {
    "id": "solving_quadratic_equations_quadratic_equation",
    "name": "Solving Quadratic Equations (Quadratic Equation)",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "solving_linear_equations"
    ],
"exampleQuestion": "Solve x² - 4x - 1 = 0 through use of the quadratic formula.",
"exampleAnswer": "x = -0.236 or x = 4.23 to 3s.f."
  },
  {
    "id": "simultaneous_equations",
    "name": "Simultaneous Equations",
    "topic": "Algebra",
    "prerequisites": [
      "solving_linear_equations"
    ],
"exampleQuestion": "Solve: \n3x + y = 21 \n4x - 2y = 8",
"exampleAnswer": "x = 5, y = 6."
  },
  {
    "id": "inequalities",
    "name": "Inequalities",
    "topic": "Algebra",
    "prerequisites": [
      "solving_linear_equations"
    ],
"exampleQuestion": "Solve: 5c - 4 < 21",
"exampleAnswer": "c < 5"

  },
  {
    "id": "circumfrence_of_a_circle",
    "name": "Circumfrence of a Circle",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic"
    ],
"exampleQuestion": "Calculate the circumfrence of the circle in the image below.",
"exampleAnswer": "54.04cm (to 2dp)",
"image": true
  },
  {
    "id": "area_of_a_circle",
    "name": "Area of a Circle",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic",
      "areas_of_squares_and_rectangles"
    ],
"exampleQuestion": "Calculate the area of the circle in the image below.",
"exampleAnswer": "232.35cm² (to 2dp)",
"image": true
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
    ],
"exampleQuestion": "Calculate the area of the sector in the image below.",
"exampleAnswer": "5.03cm² (to 2dp)",
"image": true
  },
  {
    "id": "proportion",
    "name": "Proportion",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "fractions_of_amounts",
      "fractions_decimals_and_percentages"
    ],
"exampleQuestion": "y is proportional to x /nWhen y = 10, x = 3 /nCalculate x when y = 25",
"exampleAnswer": "x = 7.5"
  },
  {
    "id": "ratio",
    "name": "Ratio",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "proportion"
    ],
"exampleQuestion": "Divide £120 in the ratio 5:1:4",
"exampleAnswer": "£60, £12, £48"
  },
  {
    "id": "percentage_change",
    "name": "Percentage Change",
    "topic": "Number",
    "prerequisites": [
      "fractions_of_amounts",
      "fractions_decimals_and_percentages"
    ],
"exampleQuestion": "Increase 60 by 15%",
"exampleAnswer": "69"
  },
  {
    "id": "factors_and_multiples",
    "name": "Factors and Multiples",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic"
    ],
"exampleQuestion": "List all of the factors of 28",
"exampleAnswer": "1, 2, 4, 7, 14, 28"
  },
  {
    "id": "prime_factor_decomposition",
    "name": "Prime Factor Decomposition",
    "topic": "Number",
    "prerequisites": [
      "factors_and_multiples"
    ],
"exampleQuestion": "Write 36 as a product of its prime factors",
"exampleAnswer": "2 x 2 x 3 x 3 or 2² x 3²"
  },
    {
    "id": "lowest_common_multiple",
    "name": "Lowest Common Multiple",
    "topic": "Number",
    "prerequisites": [
      "prime_factor_decomposition"
    ],
"exampleQuestion": "Find the Lowest Common Multiple of 15 and 25",
"exampleAnswer": "75"
  },
    {
    "id": "highest_common_factor",
    "name": "Highest Common Factor",
    "topic": "Number",
    "prerequisites": [
      "prime_factor_decomposition"
    ],
"exampleQuestion": "Find the Highest Common Factor of 12 and 18",
"exampleAnswer": "6"
  },
  {
    "id": "plotting_straight_line_graphs",
    "name": "Plotting Straight Line Graphs",
    "topic": "Algebra",
    "prerequisites": [
      "substitution"
    ],
"exampleQuestion": "Do you know how to plot a straight line graph like y = 3x - 1 on an axis?"
  },
  {
    "id": "understanding_straight_line_graphs",
    "name": "Understanding Straight Line Graphs",
    "topic": "Algebra",
    "prerequisites": [
      "plotting_straight_line_graphs"
    ],
"exampleQuestion": "What is the equation of the graph shown below:",
"exampleAnswer": "y = 2x + 6"
  },
  {
    "id": "sketching_functions",
    "name": "Sketching Functions",
    "topic": "Algebra",
    "prerequisites": [
      "understanding_straight_line_graphs"
    ],
"exampleQuestion": "Do you know how to plot a graph like y = 3x² + 3x - 1 on an axis?"
  },
  {
    "id": "kinematic_graphs",
    "name": "Kinematic Graphs",
    "topic": "Algebra",
    "prerequisites": [
      "plotting_straight_line_graphs"
    ],
"exampleQuestion": "What is the speed the object in the graph below is moving at between point A and B",
"exampleAnswer": "40mph",
"image": true
  },
  {
    "id": "volume_of_a_prism",
    "name": "Volume of a prism",
    "topic": "Shape and Space",
    "prerequisites": [
      "areas_of_squares_and_rectangles",
      "areas_of_triangles"
    ],
"exampleQuestion": "Calculate the volume of the prism in the image below:",
"exampleAnswer": "120cm³",
"image": true
  },
  {
    "id": "volume_of_a_pyramid_and_cone",
    "name": "Volume of a Pyramid and Cone",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_prism",
      "areas_of_squares_and_rectangles",
      "area_of_a_circle"
    ],
"exampleQuestion": "Calculate the volume of the pyramid in the image below:",
"exampleAnswer": "192cm³",
"image": true
  },
  {
    "id": "volume_of_a_sphere",
    "name": "Volume of a Sphere",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_prism",
      "area_of_a_circle"
    ],
"exampleQuestion": "Calculate the volume of the sphere in the image below:",
"exampleAnswer": "904.78cm³ to 2dp",
"image": true
  },
  {
    "id": "surface_area_of_a_sphere",
    "name": "Surface Area of a Sphere",
    "topic": "Shape and Space",
    "prerequisites": [
      "area_of_a_circle"
    ],
"exampleQuestion": "Calculate the surface area of the sphere in the image below:",
"exampleAnswer": "452.39cm² to 2dp",
"image": true
  },
  {
    "id": "surface_area_of_a_cone",
    "name": "Surface Area of a Cone",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_pyramid_and_cone"
    ],
"exampleQuestion": "Calculate the surface area of the cone in the image below:",
"exampleAnswer": "373.85cm² to 2dp",
"image": true
  },
  {
    "id": "surface_area_of_a_cylinder",
    "name": "Surface Area of a Cylinder",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_prism",
	  "circumfrence_of_a_circle"
    ],
"exampleQuestion": "Calculate the surface area of the cylinder in the image below:",
"exampleAnswer": "226.19cm² to 2dp",
"image": true
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