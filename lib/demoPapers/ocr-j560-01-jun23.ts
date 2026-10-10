import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/01 — Foundation Tier Paper 1 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/OCR-JUN23-F-P1.json by
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
export const OCR_J560_01_JUN23: PaperConfig = {
  id: 'ocr-j560-01-jun23',
  title: 'OCR GCSE Mathematics J560/01',
  subtitle: 'Foundation Tier Paper 1 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',   label: '1(a)',   marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'pick an even number from a list' },
    { id: '1b',   label: '1(b)',   marks: 1,  topic: 'number',   skill: 'Indices',                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'pick a square number from a list' },
    { id: '1c',   label: '1(c)',   marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'pick a factor of a given number from a list' },
    { id: '2',    label: '2',      marks: 3,  topic: 'probdata', skill: 'Range + Median + Factors and Multiples',                                                  skillIds: ['range', 'median', 'factors_and_multiples'], kind: 'exam', visual: false, desc: 'four numbers satisfying a stated range, median, primeness and lowest value at once' },
    { id: '3a',   label: '3(a)',   marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'next term of an arithmetic sequence' },
    { id: '3b',   label: '3(b)',   marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'state the rule, with quantity and direction' },
    { id: '4a',   label: '4(a)',   marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                          skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'pick the arrow on a probability scale for a single outcome of a fair dice' },
    { id: '4b',   label: '4(b)',   marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                          skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'pick the arrow for an impossible outcome' },
    { id: '4c',   label: '4(c)',   marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                          skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'pick the arrow for a compound outcome' },
    { id: '5a',   label: '5(a)',   marks: 1,  topic: 'number',   skill: 'Converting Decimals to Fractions',                                                        skillIds: ['converting_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'a two-decimal-place value written as a fraction' },
    { id: '5b',   label: '5(b)',   marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                      skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'decimal to percentage conversion, below 1 per cent of a whole' },
    { id: '5c',   label: '5(c)',   marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                                        skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'an eighths fraction written as a terminating decimal' },
    { id: '6a',   label: '6(a)',   marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                                       skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'input of a two-step function machine from its output' },
    { id: '6b',   label: '6(b)',   marks: 2,  topic: 'algebra',  skill: 'Function Machines + Forming Expressions and Formulae',                                    skillIds: ['function_machines', 'forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'write the function machine as an equation in two letters' },
    { id: '7ai',  label: '7(ai)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'evaluate a power of 3' },
    { id: '7aii', label: '7(aii)', marks: 1,  topic: 'number',   skill: 'Indices',                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'cube root of a four-digit number' },
    { id: '7b',   label: '7(b)',   marks: 2,  topic: 'number',   skill: 'Simplifying Indices',                                                                     skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'the index making a product of a number and a power equal a given value' },
    { id: '7c',   label: '7(c)',   marks: 1,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                         skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'a negative index written as a fraction' },
    { id: '8',    label: '8',      marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                    skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'cost of a kilogram from the cost of a mass given in grams' },
    { id: '9',    label: '9',      marks: 4,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Converting Measurements + Proportion',                  skillIds: ['areas_of_squares_and_rectangles', 'converting_measurements', 'proportion'], kind: 'exam', visual: false, desc: 'stocking limit for a field, from its dimensions, a rate per hectare and the hectare definition' },
    { id: '10a',  label: '10(a)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                                                skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'identify that a term was added instead of subtracted when solving' },
    { id: '10b',  label: '10(b)',  marks: 1,  topic: 'algebra',  skill: 'Substitution',                                                                            skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'identify that the final velocity was substituted where the initial one belongs' },
    { id: '11a',  label: '11(a)',  marks: 1,  topic: 'ratio',    skill: 'Proportion',                                                                              skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'double a recipe quantity' },
    { id: '11b',  label: '11(b)',  marks: 1,  topic: 'ratio',    skill: 'Proportion',                                                                              skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'scale a recipe quantity down by a factor of four' },
    { id: '11c',  label: '11(c)',  marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                                              skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'decide whether a stock of one ingredient reaches a stated batch size, with working' },
    { id: '11d',  label: '11(d)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'takings from a count divided into fixed-size packets at a fixed price' },
    { id: '12',   label: '12',     marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles',                                                         skillIds: ['areas_of_squares_and_rectangles'], kind: 'mastery', visual: false, desc: 'total surface area of a cuboid from its three dimensions' },
    { id: '13a',  label: '13(a)',  marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'average speed in metres per minute from a distance and a time' },
    { id: '13b',  label: '13(b)',  marks: 1,  topic: 'ratio',    skill: 'Compound Units',                                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'state an assumption behind scaling that speed to a longer time' },
    { id: '14',   label: '14',     marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                                            skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'show a strict one-sided inequality on a number line, open circle and arrow' },
    { id: '15',   label: '15',     marks: 4,  topic: 'number',   skill: 'Fractions of Amounts + Adding and Subtracting Fractions',                                 skillIds: ['fractions_of_amounts', 'adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'show the fraction left after a percentage and a fraction of the same total are given away' },
    { id: '16',   label: '16',     marks: 4,  topic: 'shape',    skill: 'Lengths and Perimeters + Simplifying Expressions',                                        skillIds: ['lengths_and_perimeters', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'side of an equilateral triangle whose perimeter equals a quadrilateral\'s, all sides algebraic' },
    { id: '17',   label: '17',     marks: 3,  topic: 'algebra',  skill: 'Expanding Double Brackets',                                                               skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'expand and simplify a product of two brackets in two letters' },
    { id: '18a',  label: '18(a)',  marks: 2,  topic: 'shape',    skill: 'Translations',                                                                            skillIds: ['translations'], kind: 'mastery', visual: true, desc: 'draw the pre-image of a translation given by a column vector' },
    { id: '18b',  label: '18(b)',  marks: 2,  topic: 'shape',    skill: 'Rotations',                                                                               skillIds: ['rotations'], kind: 'mastery', visual: true, desc: 'rotate a triangle a quarter turn anticlockwise about the origin' },
    { id: '18c',  label: '18(c)',  marks: 2,  topic: 'shape',    skill: 'Reflections',                                                                             skillIds: ['reflections'], kind: 'mastery', visual: true, desc: 'reflect a triangle in a horizontal line below the axis' },
    { id: '19',   label: '19',     marks: 2,  topic: 'number',   skill: 'Exact Calculations',                                                                      skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate an expression with a square and a negative product on a calculator, to 3 significant figures' },
    { id: '20',   label: '20',     marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                                       skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage decrease between two money amounts' },
    { id: '21',   label: '21',     marks: 4,  topic: 'number',   skill: 'Lowest Common Multiple + Time Calculations',                                              skillIds: ['lowest_common_multiple', 'time_calculations'], kind: 'exam', visual: false, desc: 'next time two repeating timetables coincide, from a shared start time and two intervals' },
    { id: '22a',  label: '22(a)',  marks: 2,  topic: 'ratio',    skill: 'Direct Proportion',                                                                       skillIds: ['direct_proportion'], kind: 'mastery', visual: false, desc: 'say what about a graph shows direct proportion — straight line and through the origin' },
    { id: '22b',  label: '22(b)',  marks: 2,  topic: 'ratio',    skill: 'Direct Proportion + Understanding Straight Line Graphs',                                  skillIds: ['direct_proportion', 'understanding_straight_line_graphs'], kind: 'exam', visual: true, desc: 'draw a parallel line with a positive intercept, for the same rate plus a fixed charge' },
    { id: '23a',  label: '23(a)',  marks: 2,  topic: 'ratio',    skill: 'Ratio',                                                                                   skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'one share of a three-part ratio from another share\'s value' },
    { id: '23b',  label: '23(b)',  marks: 3,  topic: 'ratio',    skill: 'Ratio + Solving Linear Equations',                                                        skillIds: ['ratio', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the unknown term of a three-part ratio, given that its share is a stated fraction of the total' },
    { id: '24a',  label: '24(a)',  marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                           skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage probability tree with different probabilities at each stage' },
    { id: '24b',  label: '24(b)',  marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                           skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of one outcome then its complement, from a completed tree' },
    { id: '25',   label: '25',     marks: 4,  topic: 'probdata', skill: 'Mean + Solving Linear Equations',                                                         skillIds: ['mean', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'two unknowns in a frequency table — a missing frequency and a missing score — fixed by the total and the mean' },
    { id: '26a',  label: '26(a)',  marks: 3,  topic: 'algebra',  skill: 'Sketching Functions',                                                                     skillIds: ['sketching_functions'], kind: 'mastery', visual: true, desc: 'draw a two-branch curve from a table of values, the curve not touching the y-axis' },
    { id: '26b',  label: '26(b)',  marks: 1,  topic: 'algebra',  skill: 'Sketching Functions',                                                                     skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'read the positive root off the drawn curve, to 1 decimal place' },
    { id: '27',   label: '27',     marks: 6,  topic: 'shape',    skill: 'Area of a Circle + Areas of Squares and Rectangles + Fractions Decimals and Percentages', skillIds: ['area_of_a_circle', 'areas_of_squares_and_rectangles', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'percentage of a square left shaded by a quarter-circle inscribed in it' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
