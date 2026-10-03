import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1F — Foundation Tier Paper 1 Non-calculator — November 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-NOV24-F-P1.json by
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
export const EDEXCEL_1MA1_1F_NOV24: PaperConfig = {
  id: 'edexcel-1ma1-1f-nov24',
  title: 'Edexcel GCSE Mathematics 1MA1/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                    skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'percentage to decimal conversion' },
    { id: '2',   label: '2',     marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                             skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'continue a simple arithmetic sequence to a stated term' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                               skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'metric length conversion' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                 skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'a multiple of a given number inside a stated range' },
    { id: '5',   label: '5',     marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'bare three-digit addition' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'money problem: a daily rate, a fixed charge and change from a payment' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                            skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'measure a length on an accurately drawn triangle' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'shape',    skill: 'Angles on Lines and Circles',                                           skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'name an angle by type' },
    { id: '7c',  label: '7(c)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                            skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'measure an angle with a protractor' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                           skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'read coordinates off a grid' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                           skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'plot a point with a negative coordinate' },
    { id: '8c',  label: '8(c)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                           skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'midpoint of two plotted points' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'probdata', skill: 'Simple Charts',                                                         skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'complete a bar chart, with the missing bar derived from a stated overall total' },
    { id: '9b',  label: '9(b)',  marks: 2,  topic: 'number',   skill: 'Simplifying Fractions + Simple Charts',                                 skillIds: ['simplifying_fractions', 'simple_charts'], kind: 'exam', visual: false, desc: 'form a fraction from a bar read off a chart and simplify it' },
    { id: '9c',  label: '9(c)',  marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                                 skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'fraction of the whole from a two-part ratio' },
    { id: '9d',  label: '9(d)',  marks: 1,  topic: 'ratio',    skill: 'Simplifying Ratio',                                                     skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'express a two-part ratio in the form n : 1' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'shape',    skill: 'Reflections',                                                           skillIds: ['reflections'], kind: 'mastery', visual: true, desc: 'reflect a shape in a given horizontal mirror line' },
    { id: '10b', label: '10(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                    skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a horizontal mirror line' },
    { id: '11a', label: '11(a)', marks: 3,  topic: 'probdata', skill: 'Gathering and Organising Data',                                         skillIds: ['gathering_and_organising_data'], kind: 'mastery', visual: false, desc: 'complete a two-way table from partial row, column and overall totals' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability',                                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability of a single cell of a completed two-way table' },
    { id: '12',  label: '12',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'explain an order-of-operations error in someone else\'s method' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                     skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'output of a two-step function machine' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                     skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'find the missing operation in a function machine from its input and output' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'shape',    skill: 'Volume of a Prism',                                                     skillIds: ['volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'missing height of a cuboid from its volume and two dimensions' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles',                                       skillIds: ['areas_of_squares_and_rectangles'], kind: 'mastery', visual: false, desc: 'total surface area of a cuboid from its three dimensions' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                           skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise a two-term linear expression' },
    { id: '15b', label: '15(b)', marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations + Expanding Brackets',                         skillIds: ['solving_linear_equations', 'expanding_brackets'], kind: 'mastery', visual: false, desc: 'solve a linear equation with a bracket' },
    { id: '16',  label: '16',    marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two unknown unit prices from two combined totals, then the cost of a third combination' },
    { id: '17',  label: '17',    marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                 skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'test whether three given stock amounts are enough for a three-part ratio mix of a stated total' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Decimals',                                                              skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'non-calculator division of one decimal by another' },
    { id: '19a', label: '19(a)', marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Mutually Exclusive Events',                         skillIds: ['expected_outcomes', 'mutually_exclusive_events'], kind: 'exam', visual: false, desc: 'expected frequency where the missing probability must first be recovered from the total of 1 and split equally' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'probdata', skill: 'Expected Outcomes',                                                     skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: 'state the direction an expected frequency moves when an assumption is relaxed' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                                      skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract two mixed numbers, answer as a mixed number' },
    { id: '20b', label: '20(b)', marks: 3,  topic: 'number',   skill: 'Dividing Fractions + Irregular and Improper Fractions',                 skillIds: ['dividing_fractions', 'irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'show a division of two mixed numbers reaches a stated result, with every stage evidenced' },
    { id: '21',  label: '21',    marks: 3,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Forming Expressions and Formulae', skillIds: ['alternate_and_corresponding_angles', 'forming_expressions_and_formulae'], kind: 'exam', visual: false, desc: 'expression for an angle in a parallelogram in terms of a letter, with a parallel-line reason required' },
    { id: '22a', label: '22(a)', marks: 3,  topic: 'number',   skill: 'Estimating + Compound Units',                                           skillIds: ['estimating', 'compound_units'], kind: 'exam', visual: false, desc: 'estimate a journey time in minutes from a distance and a speed, by rounding both first' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'number',   skill: 'Estimating',                                                            skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'decide whether an estimate is an under- or overestimate, with a reason' },
    { id: '23',  label: '23',    marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Solving Linear Equations',                         skillIds: ['angles_in_polygons', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'pentagon angle from an angle sum where four of the five angles are multiples of one unknown' },
    { id: '24',  label: '24',    marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                      skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'interpret what the gradient of a volume-time graph represents' },
    { id: '25',  label: '25',    marks: 2,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                           skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'change the subject of a two-step linear formula' },
    { id: '26',  label: '26',    marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                             skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'solve a monic quadratic with a negative constant term' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
