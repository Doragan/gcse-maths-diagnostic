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
	"exampleAnswer": "100°",
	"image": true
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
	"image": true
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
"exampleAnswer": "y = 2x + 6",
"image": true
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
    ],
    "exampleQuestion": "The frequency diagram below shows the number of hours students spent revising last week. How many students revised for 3 or more hours?",
    "exampleAnswer": "8 students. You need to read the frequencies for each bar from 3 hours onwards and add them together.",
    "image": true
  },
  {
    "id": "grouped_frequency_tables",
    "name": "Grouped Frequency Tables",
    "topic": "Probability and Data",
    "prerequisites": [
      "gathering_and_organising_data",
      "simple_charts"
    ],
    "exampleQuestion": "The grouped frequency table below shows the heights of 30 students. How many students are between 150cm and 170cm tall?",
    "exampleAnswer": "7 students. Read the frequencies for the 150-160 and 160-170 groups and add them together.",
    "image": true
  },
  {
    "id": "scatter_graphs",
    "name": "Scatter Graphs",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_charts"
    ],
    "exampleQuestion": "The scatter graph below shows the relationship between the age of a car and its value. Describe the correlation.",
    "exampleAnswer": "There is a negative correlation — as the age of the car increases, values tend to decrease.",
    "image": true
  },
  {
    "id": "time_series",
    "name": "Time Series",
    "topic": "Probability and Data",
    "prerequisites": [
      "simple_charts"
    ],
    "exampleQuestion": "The time series graph below shows monthly sales figures over a year. Describe the overall trend.",
    "exampleAnswer": "The overall trend is increasing — sales are generally rising over the course of the year, despite some monthly fluctuations.",
    "image": true
  },
  {
    "id": "simplifying_indices",
    "name": "Simplifying Indices",
    "topic": "Number",
    "prerequisites": [
      "indices"
    ],
    "exampleQuestion": "Simplify: a⁵ × a³",
    "exampleAnswer": "a⁸ (when multiplying powers with the same base, add the indices)"
  },
  {
    "id": "standard_form",
    "name": "Standard Form",
    "topic": "Number",
    "prerequisites": [
      "simple_arithmetic",
      "indices",
      "decimals",
      "significant_figures"
    ],
    "exampleQuestion": "Write 0.00047 in standard form.",
    "exampleAnswer": "4.7 × 10⁻⁴"
  },
  {
    "id": "quadratic_functions",
    "name": "Quadratic Functions",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "plotting_straight_line_graphs"
    ],
    "exampleQuestion": "Sketch the graph of y = x² - 4x + 3, showing where it crosses the x and y axes.",
    "exampleAnswer": "Crosses the x-axis at x = 1 and x = 3 (by factorising to (x-1)(x-3) = 0). Crosses the y-axis at y = 3 (when x = 0)."
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
    ],
    "exampleQuestion": "Calculate the length of the hypotenuse of the triangle, below:",
    "exampleAnswer": "13cm (using a² + b² = c²: 25 + 144 = 169, √169 = 13)",
	"image": true
  },
  {
    "id": "trigonometry_missing_sides",
    "name": "Trigonometry (missing sides)",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles",
      "angles_in_polygons"
    ],
    "exampleQuestion": "In a right-angled triangle below, calculate the length of x.",
    "exampleAnswer": "5.74cm (to 2dp) using opposite = hypotenuse × sin(35°)",
	"image": true
  },
  {
    "id": "trigonometry_missing_angles",
    "name": "Trigonometry (missing angles)",
    "topic": "Shape and Space",
    "prerequisites": [
      "trigonometry_missing_sides"
    ],
    "exampleQuestion": "In a right-angled triangle below,calculate the angle x.",
    "exampleAnswer": "33.69° (to 2dp) using tan⁻¹(6/9)",
	"image": true
  },
  {
    "id": "vectors",
    "name": "Vectors",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_arithmetic",
      "plotting_straight_line_graphs"
    ],
    "exampleQuestion": "Vectors a and b are shown below. Calculate 2a + b.",
    "exampleAnswer": "2a + b = (9, 8) (although this should be written vertical, just like the vectors in the question!)",
	"image": true
  },
  {
    "id": "combined_events",
    "name": "Combined Events",
    "topic": "Probability and Data",
    "prerequisites": [
      "calculating_simple_probability"
    ],
    "exampleQuestion": "A fair coin is flipped and a fair six-sided die is rolled. What is the probability of getting heads and a 4?",
    "exampleAnswer": "1/12 (probability of heads = 1/2, probability of rolling a 4 = 1/6, combined = 1/2 × 1/6 = 1/12)"
  },
  {
    "id": "probability_spaces",
    "name": "Probability Spaces",
    "topic": "Probability and Data",
    "prerequisites": [
      "combined_events"
    ],
    "exampleQuestion": "Two fair six-sided dice are rolled. Using a sample space diagram, find the probability that the total is 8.",
    "exampleAnswer": "5/36 (the combinations that give 8 are: (2,6), (3,5), (4,4), (5,3), (6,2) — 5 outcomes out of 36 total)",
    "image": true
  },
  {
    "id": "tree_diagrams",
    "name": "Tree Diagrams",
    "topic": "Probability and Data",
    "prerequisites": [
      "combined_events"
    ],
    "exampleQuestion": "A bag contains 4 red and 6 blue balls. A ball is picked at random and not replaced. A second ball is then picked. Draw a tree diagram and find the probability of picking two red balls.",
    "exampleAnswer": "P(red, red) = 4/10 × 3/9 = 12/90 = 2/15",
    "image": true
  },
  {
    "id": "sequences",
    "name": "Sequences",
    "topic": "Algebra",
    "prerequisites": [
      "simple_arithmetic"
    ],
    "exampleQuestion": "Find the next two terms in the sequence: 3, 7, 11, 15, ...",
    "exampleAnswer": "19, 23 (the sequence increases by 4 each time)"
  },
  {
    "id": "finding_the_nth_term",
    "name": "Finding the nth Term",
    "topic": "Algebra",
    "prerequisites": [
      "solving_linear_equations",
      "sequences"
    ],
    "exampleQuestion": "Find the nth term of the sequence: 5, 8, 11, 14, ...",
    "exampleAnswer": "3n + 2 (the common difference is 3, and when n = 1 the term is 5, so 3(1) + 2 = 5 ✓)"
  },
  {
    "id": "compound_units",
    "name": "Compound Units",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "substitution"
    ],
    "exampleQuestion": "A car travels 150 miles in 3 hours. Calculate its average speed in miles per hour.",
    "exampleAnswer": "50mph (speed = distance ÷ time = 150 ÷ 3 = 50)"
  },
  {
    "id": "direct_proportion",
    "name": "Direct Proportion",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "compound_units",
      "proportion"
    ],
    "exampleQuestion": "y is directly proportional to x. When x = 4, y = 20. Find y when x = 7.",
    "exampleAnswer": "y = 35 (the constant of proportionality k = 20/4 = 5, so y = 5x, giving y = 5 × 7 = 35)"
  },
  {
    "id": "inverse_proportion",
    "name": "Inverse Proportion",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "direct_proportion"
    ],
    "exampleQuestion": "y is inversely proportional to x. When x = 3, y = 12. Find y when x = 9.",
    "exampleAnswer": "y = 4 (k = 3 × 12 = 36, so y = 36/x, giving y = 36/9 = 4)"
  },
  {
    "id": "growth_and_decay",
    "name": "Growth and Decay",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "percentage_change",
      "indices"
    ],
    "exampleQuestion": "A car is bought for £12,000 and depreciates at 15% per year. What is it worth after 3 years?",
    "exampleAnswer": "£7,372.35 (to 2dp) using 12000 × 0.85³"
  },
  {
    "id": "constructions",
    "name": "Constructions",
    "topic": "Shape and Space",
    "prerequisites": [
      "measuring_lines_and_angles"
    ],
    "exampleQuestion": "Can you answer questions that require you to construct a shape with a ruler and a pair of compasses?",
    "exampleAnswer": "Set the compass to more than half the length of AB. Draw arcs above and below the line from both A and B. Connect the two intersection points to form the perpendicular bisector."
  },
  {
    "id": "loci",
    "name": "Loci",
    "topic": "Shape and Space",
    "prerequisites": [
      "constructions"
    ],
    "exampleQuestion": "Can you answer questions that require you to draw out a locus with a ruler and a pair of compasses?"
  },
  {
    "id": "translations",
    "name": "Translations",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts",
	  "vectors"
    ],
    "exampleQuestion": "What is the vector that maps shape A onto shape B?",
    "exampleAnswer": "(4,-6) although this should be written as a vector, with the 4 above the -6.",
	"image": true
  },
  {
    "id": "rotations",
    "name": "Rotations",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts",
      "angles_on_lines_and_circles"
    ],
    "exampleQuestion": "Describe the rotation shown in the diagram below:",
    "exampleAnswer": "Rotate 90 degrees clockwise about (1,1).",
	"image": true
  },
  {
    "id": "reflections",
    "name": "Reflections",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts",
	  "understanding_straight_line_graphs"
    ],
    "exampleAnswer": "(-1, 4)",
	"image": true
  },
  {
    "id": "enlargements",
    "name": "Enlargements",
    "topic": "Shape and Space",
    "prerequisites": [
      "simple_charts",
      "congruence_and_similarity"
    ],
    "exampleQuestion": "What is the scale factor shown in the enlargement below?",
    "exampleAnswer": "3 (each edge of the shape is 3x larger on the image compared to the original object).",
	"image": true
  },
  // Higher tier skills
  // Number
  {
    "id": "recurring_decimals_to_fractions",
    "name": "Recurring Decimals to Fractions",
    "topic": "Number",
    "prerequisites": [
      "converting_decimals_to_fractions",
      "solving_linear_equations"
    ],
    "exampleQuestion": "Convert 0.̄3̄6̄ to a fraction. Give your answer in its simplest form.",
    "exampleAnswer": "4/11"
  },
  {
    "id": "fractional_and_negative_indices",
    "name": "Fractional and Negative Indices",
    "topic": "Number",
    "prerequisites": [
      "simplifying_indices",
      "fractions_of_amounts"
    ],
    "exampleQuestion": "Evaluate 27^(2/3)",
    "exampleAnswer": "9"
  },
  {
    "id": "surds_simplifying",
    "name": "Simplifying Surds",
    "topic": "Number",
    "prerequisites": [
      "indices",
      "factors_and_multiples"
    ],
    "exampleQuestion": "Simplify √72",
    "exampleAnswer": "6√2"
  },
  {
    "id": "surds_expanding_and_rationalising",
    "name": "Expanding and Rationalising Surds",
    "topic": "Number",
    "prerequisites": [
      "surds_simplifying",
      "expanding_double_brackets"
    ],
    "exampleQuestion": "Rationalise the denominator: 5/√3",
    "exampleAnswer": "5√3/3"
  },
  {
    "id": "upper_and_lower_bounds",
    "name": "Upper and Lower Bounds",
    "topic": "Number",
    "prerequisites": [
      "rounding",
      "significant_figures"
    ],
    "exampleQuestion": "A length is measured as 12.4cm to 1 decimal place. Write down the upper and lower bounds.",
    "exampleAnswer": "Lower bound: 12.35cm, Upper bound: 12.45cm"
  },

  // Algebra
  {
    "id": "algebraic_fractions",
    "name": "Algebraic Fractions",
    "topic": "Algebra",
    "prerequisites": [
      "factorising",
      "factorising_quadratics",
      "simplifying_fractions"
    ],
    "exampleQuestion": "Simplify: (x² + 3x) / (x² + 5x + 6)",
    "exampleAnswer": "x / (x + 2)"
  },
  {
    "id": "completing_the_square",
    "name": "Completing the Square",
    "topic": "Algebra",
    "prerequisites": [
      "factorising_quadratics",
      "expanding_double_brackets"
    ],
    "exampleQuestion": "Write x² + 6x + 2 in the form (x + a)² + b",
    "exampleAnswer": "(x + 3)² - 7"
  },
  {
    "id": "quadratic_inequalities",
    "name": "Quadratic Inequalities",
    "topic": "Algebra",
    "prerequisites": [
      "inequalities",
      "factorising_quadratics"
    ],
    "exampleQuestion": "Solve x² - 5x + 6 > 0",
    "exampleAnswer": "x < 2 or x > 3"
  },
  {
    "id": "simultaneous_equations_quadratic",
    "name": "Simultaneous Equations (Linear and Quadratic)",
    "topic": "Algebra",
    "prerequisites": [
      "simultaneous_equations",
      "factorising_quadratics"
    ],
    "exampleQuestion": "Solve simultaneously: y = x + 1 and y = x² - 3",
    "exampleAnswer": "x = -1, y = 0 and x = 2, y = 3"
  },
  {
    "id": "nth_term_quadratic_sequences",
    "name": "Nth Term of Quadratic Sequences",
    "topic": "Algebra",
    "prerequisites": [
      "finding_the_nth_term",
      "quadratic_functions"
    ],
    "exampleQuestion": "Find the nth term of the sequence: 3, 8, 15, 24, 35...",
    "exampleAnswer": "n² + 2n"
  },
  {
    "id": "equation_of_a_circle",
    "name": "Equation of a Circle",
    "topic": "Algebra",
    "prerequisites": [
      "pythagoras_theorem",
      "plotting_straight_line_graphs"
    ],
    "exampleQuestion": "Write down the equation of a circle with centre (0, 0) and radius 5.",
    "exampleAnswer": "x² + y² = 25"
  },
  {
    "id": "algebraic_proof",
    "name": "Algebraic Proof",
    "topic": "Algebra",
    "prerequisites": [
      "expanding_double_brackets",
      "factorising_quadratics"
    ],
    "exampleQuestion": "Prove that the sum of two consecutive odd numbers is always even.",
    "exampleAnswer": "Let the two consecutive odd numbers be (2n + 1) and (2n + 3). Their sum is 4n + 4 = 4(n + 1), which is always divisible by 4 and therefore always even."
  },
  {
    "id": "functions_notation",
    "name": "Functions Notation",
    "topic": "Algebra",
    "prerequisites": [
      "substitution",
      "sketching_functions"
    ],
    "exampleQuestion": "Given f(x) = 3x² - 2, find f(4).",
    "exampleAnswer": "46"
  },
  {
    "id": "composite_functions",
    "name": "Composite Functions",
    "topic": "Algebra",
    "prerequisites": [
      "functions_notation"
    ],
    "exampleQuestion": "Given f(x) = 2x + 1 and g(x) = x², find fg(3).",
    "exampleAnswer": "19"
  },
  {
    "id": "inverse_functions",
    "name": "Inverse Functions",
    "topic": "Algebra",
    "prerequisites": [
      "functions_notation",
      "solving_linear_equations"
    ],
    "exampleQuestion": "Given f(x) = 3x - 4, find f⁻¹(x).",
    "exampleAnswer": "f⁻¹(x) = (x + 4) / 3"
  },
  {
    "id": "iteration",
    "name": "Iteration",
    "topic": "Algebra",
    "prerequisites": [
      "substitution",
      "sketching_functions"
    ],
    "exampleQuestion": "Using the iterative formula xₙ₊₁ = (xₙ² + 3) / 4, starting with x₀ = 2, find x₂.",
    "exampleAnswer": "x₁ = 1.75, x₂ = 1.515625"
  },
  {
    "id": "graph_transformations",
    "name": "Graph Transformations",
    "topic": "Algebra",
    "prerequisites": [
      "sketching_functions",
      "quadratic_functions"
    ],
    "exampleQuestion": "Describe the transformation that maps y = f(x) onto y = f(x - 3).",
    "exampleAnswer": "A translation of 3 units in the positive x direction (right)."
  },

  // Shape and Space
  {
    "id": "circle_theorem_angle_at_centre",
    "name": "Circle Theorem: Angle at Centre",
    "topic": "Shape and Space",
    "prerequisites": [
      "angles_on_lines_and_circles",
      "angles_in_polygons"
    ],
    "exampleQuestion": "The angle at the centre of a circle is 112°. What is the angle at the circumference subtended by the same arc?",
    "exampleAnswer": "56°"
  },
  {
    "id": "circle_theorem_same_segment",
    "name": "Circle Theorem: Angles in Same Segment",
    "topic": "Shape and Space",
    "prerequisites": [
      "circle_theorem_angle_at_centre"
    ],
    "exampleQuestion": "Two angles are in the same segment of a circle. One angle is 43°. What is the other?",
    "exampleAnswer": "43°"
  },
  {
    "id": "circle_theorem_cyclic_quadrilateral",
    "name": "Circle Theorem: Cyclic Quadrilateral",
    "topic": "Shape and Space",
    "prerequisites": [
      "circle_theorem_angle_at_centre"
    ],
    "exampleQuestion": "In a cyclic quadrilateral, one angle is 74°. What is the opposite angle?",
    "exampleAnswer": "106°"
  },
  {
    "id": "circle_theorem_tangent",
    "name": "Circle Theorem: Tangent and Radius",
    "topic": "Shape and Space",
    "prerequisites": [
      "circle_theorem_angle_at_centre",
      "pythagoras_theorem"
    ],
    "exampleQuestion": "A tangent meets a radius at point P on the circumference of a circle. What is the angle between them?",
    "exampleAnswer": "90°"
  },
  {
    "id": "circle_theorem_alternate_segment",
    "name": "Circle Theorem: Alternate Segment",
    "topic": "Shape and Space",
    "prerequisites": [
      "circle_theorem_tangent"
    ],
    "exampleQuestion": "The angle between a tangent and a chord at the point of contact is 58°. What is the angle in the alternate segment?",
    "exampleAnswer": "58°"
  },
  {
    "id": "sine_rule",
    "name": "Sine Rule",
    "topic": "Shape and Space",
    "prerequisites": [
      "trigonometry_missing_angles"
    ],
    "exampleQuestion": "In triangle ABC, angle A = 40°, angle B = 75° and side a = 8cm. Find side b.",
    "exampleAnswer": "11.52cm (to 2dp)"
  },
  {
    "id": "cosine_rule",
    "name": "Cosine Rule",
    "topic": "Shape and Space",
    "prerequisites": [
      "trigonometry_missing_angles",
      "pythagoras_theorem"
    ],
    "exampleQuestion": "In triangle ABC, a = 7cm, b = 5cm and angle C = 62°. Find side c.",
    "exampleAnswer": "6.37cm (to 2dp)"
  },
  {
    "id": "area_of_triangle_sine",
    "name": "Area of a Triangle (½ab sinC)",
    "topic": "Shape and Space",
    "prerequisites": [
      "sine_rule",
      "areas_of_triangles"
    ],
    "exampleQuestion": "Find the area of a triangle with sides 8cm and 11cm and an included angle of 34°.",
    "exampleAnswer": "24.63cm² (to 2dp)"
  },
  {
    "id": "trigonometry_3d",
    "name": "3D Trigonometry",
    "topic": "Shape and Space",
    "prerequisites": [
      "trigonometry_missing_angles",
      "pythagoras_theorem"
    ],
    "exampleQuestion": "A cuboid has dimensions 4cm × 6cm × 5cm. Find the angle that the space diagonal makes with the base.",
    "exampleAnswer": "39.81° (to 2dp)"
  },
  {
    "id": "frustum",
    "name": "Volume of a Frustum",
    "topic": "Shape and Space",
    "prerequisites": [
      "volume_of_a_pyramid_and_cone"
    ],
    "exampleQuestion": "A frustum is made by removing a small cone of height 4cm and radius 2cm from a large cone of height 12cm and radius 6cm. Find the volume of the frustum.",
    "exampleAnswer": "803.84cm³ (to 2dp)"
  },
  {
    "id": "vector_proof",
    "name": "Vector Proof",
    "topic": "Shape and Space",
    "prerequisites": [
      "vectors"
    ],
    "exampleQuestion": "OA = a and OB = b. M is the midpoint of AB. Show that OM = ½(a + b).",
    "exampleAnswer": "OM = OA + AM = a + ½(b - a) = a + ½b - ½a = ½a + ½b = ½(a + b)"
  },
  {
    "id": "fractional_enlargements",
    "name": "Fractional and Negative Enlargements",
    "topic": "Shape and Space",
    "prerequisites": [
      "enlargements",
      "congruence_and_similarity"
    ],
    "exampleQuestion": "A shape is enlarged by scale factor -2 about the point (1, 1). Where does the point (3, 2) map to?",
    "exampleAnswer": "(-3, -1)"
  },

  // Probability and Data
  {
    "id": "venn_diagrams",
    "name": "Venn Diagrams",
    "topic": "Probability and Data",
    "prerequisites": [
      "mutually_exclusive_events",
      "combined_events"
    ],
    "exampleQuestion": "In a class of 30 students, 18 study French, 12 study Spanish and 5 study both. How many study neither?",
    "exampleAnswer": "5"
  },
  {
    "id": "conditional_probability",
    "name": "Conditional Probability",
    "topic": "Probability and Data",
    "prerequisites": [
      "venn_diagrams",
      "tree_diagrams"
    ],
    "exampleQuestion": "A bag contains 3 red and 5 blue balls. Two are drawn without replacement. What is the probability both are red?",
    "exampleAnswer": "3/28"
  },
  {
    "id": "histograms",
    "name": "Histograms",
    "topic": "Probability and Data",
    "prerequisites": [
      "frequency_diagrams",
      "grouped_frequency_tables"
    ],
    "exampleQuestion": "A histogram shows frequency density on the y-axis. A bar has width 5 and frequency density 3.2. What is the frequency for that class?",
    "exampleAnswer": "16"
  },
  {
    "id": "cumulative_frequency",
    "name": "Cumulative Frequency",
    "topic": "Probability and Data",
    "prerequisites": [
      "grouped_frequency_tables",
      "simple_charts"
    ],
    "exampleQuestion": "The cumulative frequency for times up to 30 minutes is 24, and up to 40 minutes is 38. How many people took between 30 and 40 minutes?",
    "exampleAnswer": "14"
  },
  {
    "id": "box_plots",
    "name": "Box Plots",
    "topic": "Probability and Data",
    "prerequisites": [
      "cumulative_frequency",
      "median",
      "range"
    ],
    "exampleQuestion": "A box plot shows: minimum 10, lower quartile 20, median 30, upper quartile 45, maximum 60. What is the interquartile range?",
    "exampleAnswer": "25"
  },
  {
    "id": "interquartile_range",
    "name": "Interquartile Range",
    "topic": "Probability and Data",
    "prerequisites": [
      "box_plots"
    ],
    "exampleQuestion": "The lower quartile of a data set is 14 and the upper quartile is 31. What is the interquartile range?",
    "exampleAnswer": "17"
  },

  // Ratio and Proportion
  {
    "id": "reverse_percentage",
    "name": "Reverse Percentage",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "percentage_change"
    ],
    "exampleQuestion": "After a 20% increase, a price is £84. What was the original price?",
    "exampleAnswer": "£70"
  },
  {
    "id": "proportion_with_powers",
    "name": "Proportion with Powers",
    "topic": "Ratio and Proportion",
    "prerequisites": [
      "direct_proportion",
      "indices"
    ],
    "exampleQuestion": "y is proportional to x². When x = 3, y = 36. Find y when x = 5.",
    "exampleAnswer": "100"
  },
];