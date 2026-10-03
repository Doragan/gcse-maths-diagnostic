import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/04 — Higher Tier Paper 4 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/OCR-JUN24-H-P4.json by
 * scripts/generate-paper-from-audit.ts. Regenerating overwrites this file, so
 * a hand correction should be noted here — the script refuses to overwrite
 * without --force precisely so corrections are not lost silently.
 *
 * WHAT IS DELIBERATELY ABSENT: `retrySet` and `challengeQuestions` are
 * hand-authored from question text, and the audit transcribes none. A feedback
 * sheet from this paper therefore omits its "Practise these" and "Push
 * yourself" sections and carries everything else — score, coverage, topic and
 * skill breakdown, and the WWW/EBI prose. Fill either object in to turn those
 * sections back on; nothing else needs to change.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const OCR_J560_04_JUN24: PaperConfig = {
  id: 'ocr-j560-04-jun24',
  title: 'OCR GCSE Mathematics J560/04',
  subtitle: 'Higher Tier Paper 4 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',      label: '1',        marks: 3,  topic: 'number',   skill: 'Exact Calculations',                                                     skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate a rooted expression over a decimal divisor on a calculator, to 4 significant figures' },
    { id: '2',      label: '2',        marks: 3,  topic: 'shape',    skill: 'Areas of Triangles + Area of a Trapezium',                               skillIds: ['areas_of_triangles', 'area_of_a_trapezium'], kind: 'exam', visual: false, desc: 'show a triangle and a trapezium have equal areas, both areas to be worked out' },
    { id: '3',      label: '3',        marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations + Mean + Range',                                  skillIds: ['simultaneous_equations', 'mean', 'range'], kind: 'exam', visual: false, desc: 'two letters from four ordered algebraic values with a stated mean and a stated range' },
    { id: '4ai',    label: '4(ai)',    marks: 2,  topic: 'probdata', skill: 'Pie Charts + Ratio',                                                     skillIds: ['pie_charts', 'ratio'], kind: 'exam', visual: false, desc: 'show one pie-chart sector angle follows from a given sector and two doubling relations' },
    { id: '4aii',   label: '4(aii)',   marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                             skillIds: ['pie_charts'], kind: 'mastery', visual: true, desc: 'complete and label a pie chart from three derived sector angles' },
    { id: '4b',     label: '4(b)',     marks: 2,  topic: 'probdata', skill: 'Pie Charts',                                                             skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'total population from one sector\'s angle and its frequency' },
    { id: '4ci',    label: '4(ci)',    marks: 1,  topic: 'probdata', skill: 'Pie Charts',                                                             skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'an advantage of a pie chart over a bar chart for the same data' },
    { id: '4cii',   label: '4(cii)',   marks: 1,  topic: 'probdata', skill: 'Pie Charts',                                                             skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'a disadvantage of a pie chart over a bar chart for the same data' },
    { id: '5',      label: '5',        marks: 3,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                   skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'best value among three pack sizes, two priced per kilogram and one per gram' },
    { id: '6',      label: '6',        marks: 4,  topic: 'shape',    skill: 'Exterior Angles + Solving Linear Equations',                             skillIds: ['exterior_angles', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'number of sides of a regular polygon whose interior angle is a stated multiple of its exterior angle' },
    { id: '7',      label: '7',        marks: 3,  topic: 'number',   skill: 'Fractional and Negative Indices + Standard Form',                        skillIds: ['fractional_and_negative_indices', 'standard_form'], kind: 'exam', visual: false, desc: 'order a decimal, a negative power of two and a standard-form value, with the comparison shown' },
    { id: '8',      label: '8',        marks: 5,  topic: 'number',   skill: 'Percentage Change',                                                      skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'the percentage decrease that turns a stated increase into a stated smaller overall increase' },
    { id: '9',      label: '9',        marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions Decimals and Percentages',                             skillIds: ['ratio', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'test a claim about the combined share of one part, from two collections each split by a three-part ratio' },
    { id: '10',     label: '10',       marks: 3,  topic: 'ratio',    skill: 'Direct Proportion',                                                      skillIds: ['direct_proportion'], kind: 'mastery', visual: false, desc: 'identify that a proportionality has been treated as an additive relation, and give the correct formula' },
    { id: '11a',    label: '11(a)',    marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                          skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage probability tree where the second stage\'s probabilities are algebraic' },
    { id: '11b',    label: '11(b)',    marks: 1,  topic: 'probdata', skill: 'Combined Events',                                                        skillIds: ['combined_events'], kind: 'mastery', visual: false, desc: 'name the independence assumption behind multiplying along the branches' },
    { id: '11c',    label: '11(c)',    marks: 4,  topic: 'probdata', skill: 'Tree Diagrams + Solving Linear Equations',                               skillIds: ['tree_diagrams', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the unknown branch probability, from the probability of exactly one success' },
    { id: '12a',    label: '12(a)',    marks: 3,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre + Circle Theorem: Cyclic Quadrilateral', skillIds: ['circle_theorem_angle_at_centre', 'circle_theorem_cyclic_quadrilateral'], kind: 'mastery', visual: false, desc: 'angle at the centre, reached through a cyclic quadrilateral and an angle in the same segment' },
    { id: '12b',    label: '12(b)',    marks: 3,  topic: 'shape',    skill: 'Circle Theorem: Alternate Segment + Alternate and Corresponding Angles', skillIds: ['circle_theorem_alternate_segment', 'alternate_and_corresponding_angles'], kind: 'exam', visual: false, desc: 'prove a triangle in a circle is isosceles, using a tangent parallel to one side, with a reason per statement' },
    { id: '13a',    label: '13(a)',    marks: 2,  topic: 'algebra',  skill: 'Inverse Functions',                                                      skillIds: ['inverse_functions'], kind: 'mastery', visual: false, desc: 'algebraic expression for the inverse of a two-step function machine, in terms of its output' },
    { id: '13b',    label: '13(b)',    marks: 4,  topic: 'algebra',  skill: 'Composite Functions',                                                    skillIds: ['composite_functions'], kind: 'mastery', visual: false, desc: 'express the composite of two two-step machines as a single two-operation machine' },
    { id: '14',     label: '14',       marks: 6,  topic: 'shape',    skill: 'Sector Calculations + Area of a Triangle (½ab sinC)',                    skillIds: ['sector_calculations', 'area_of_triangle_sine'], kind: 'exam', visual: false, desc: 'area of a circular segment, the central angle recovered from the perpendicular distance between a chord and a parallel tangent' },
    { id: '15a',    label: '15(a)',    marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                              skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'solve a non-monic quadratic by factorising' },
    { id: '15b',    label: '15(b)',    marks: 3,  topic: 'algebra',  skill: 'Completing the Square',                                                  skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'complete the square on a monic quadratic with an even linear coefficient' },
    { id: '15ci',   label: '15(ci)',   marks: 2,  topic: 'algebra',  skill: 'Completing the Square',                                                  skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'turning point read off a completed-square form' },
    { id: '15cii',  label: '15(cii)',  marks: 2,  topic: 'algebra',  skill: 'Graph Transformations',                                                  skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'describe the single translation mapping the basic quadratic onto a completed-square form' },
    { id: '16a',    label: '16(a)',    marks: 4,  topic: 'number',   skill: 'Upper and Lower Bounds + Compound Units',                                skillIds: ['upper_and_lower_bounds', 'compound_units'], kind: 'exam', visual: false, desc: 'shortest possible journey time, choosing the right bound of a distance and of a maximum speed' },
    { id: '16b',    label: '16(b)',    marks: 1,  topic: 'ratio',    skill: 'Compound Units',                                                         skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'explain why a bound-based minimum time is not physically achievable' },
    { id: '17a',    label: '17(a)',    marks: 1,  topic: 'probdata', skill: 'Box Plots',                                                              skillIds: ['box_plots'], kind: 'mastery', visual: false, desc: 'median read off a box plot' },
    { id: '17b',    label: '17(b)',    marks: 1,  topic: 'probdata', skill: 'Box Plots',                                                              skillIds: ['box_plots'], kind: 'mastery', visual: false, desc: 'percentage below the lower quartile of a box plot' },
    { id: '17c',    label: '17(c)',    marks: 1,  topic: 'probdata', skill: 'Conditional Probability + Box Plots',                                    skillIds: ['conditional_probability', 'box_plots'], kind: 'exam', visual: false, desc: 'conditional probability of exceeding the upper quartile given a value above the lower quartile' },
    { id: '18a',    label: '18(a)',    marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                       skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'distance travelled as the area under a piecewise speed-time graph' },
    { id: '18bi',   label: '18(bi)',   marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                       skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'average speed between two times on a distance-time curve' },
    { id: '18bii',  label: '18(bii)',  marks: 3,  topic: 'algebra',  skill: 'Gradient of a Curve',                                                    skillIds: ['gradient_of_a_curve'], kind: 'mastery', visual: true, desc: 'instantaneous speed at a stated time, by drawing a tangent to a distance-time curve' },
    { id: '18biii', label: '18(biii)', marks: 1,  topic: 'algebra',  skill: 'Gradient of a Curve',                                                    skillIds: ['gradient_of_a_curve'], kind: 'mastery', visual: false, desc: 'say what happens to the speed across the interval and justify it from the gradient' },
    { id: '19',     label: '19',       marks: 5,  topic: 'number',   skill: 'Expanding and Rationalising Surds + Simplifying Surds',                  skillIds: ['surds_expanding_and_rationalising', 'surds_simplifying'], kind: 'mastery', visual: false, desc: 'rationalise a two-term surd denominator and simplify to a stated form, every step shown' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
