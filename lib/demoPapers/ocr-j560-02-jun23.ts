import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/02 — Foundation Tier Paper 2 Non-calculator — June 2023.
 *
 * GENERATED from data/exam-audit/OCR-JUN23-F-P2.json by
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
export const OCR_J560_02_JUN23: PaperConfig = {
  id: 'ocr-j560-02-jun23',
  title: 'OCR GCSE Mathematics J560/02',
  subtitle: 'Foundation Tier Paper 2 Non-calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',    label: '1(a)',    marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                        skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'percentage of a circle shaded, read off a diagram' },
    { id: '1b',    label: '1(b)',    marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                                      skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: true, desc: 'shade a given fraction of a divided rectangle' },
    { id: '2a',    label: '2(a)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'order of operations with a division' },
    { id: '2b',    label: '2(b)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'insert one pair of brackets to make a stated result true' },
    { id: '3a',    label: '3(a)',    marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                             skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'sample size by totalling three bars of a bar chart' },
    { id: '3b',    label: '3(b)',    marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                             skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'complete a pictogram row and choose its key, from bar chart data' },
    { id: '4a',    label: '4(a)',    marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions',                          skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'the missing numerator converting an improper fraction to a mixed number' },
    { id: '4b',    label: '4(b)',    marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions',                          skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'mixed number to improper fraction' },
    { id: '4c',    label: '4(c)',    marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                          skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract two fractions where one denominator is a multiple of the other' },
    { id: '4d',    label: '4(d)',    marks: 2,  topic: 'number',   skill: 'Multiplying Fractions',                                     skillIds: ['multiplying_fractions'], kind: 'mastery', visual: false, desc: 'multiply two fractions, answer in its simplest form' },
    { id: '5a',    label: '5(a)',    marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                  skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a one-step equation with the unknown divided' },
    { id: '5b',    label: '5(b)',    marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                  skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a one-step equation with a negative solution' },
    { id: '6a',    label: '6(a)',    marks: 2,  topic: 'number',   skill: 'Converting Measurements',                                   skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'difference between two heights given in different metric units' },
    { id: '6b',    label: '6(b)',    marks: 2,  topic: 'number',   skill: 'Converting Measurements',                                   skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'order four capacities spanning millilitres, litres and a fraction of a litre' },
    { id: '7a',    label: '7(a)',    marks: 2,  topic: 'number',   skill: 'Percentage Change',                                         skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'one year\'s simple interest' },
    { id: '7b',    label: '7(b)',    marks: 2,  topic: 'number',   skill: 'Percentage Change',                                         skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'value after three years of simple interest' },
    { id: '8',     label: '8',       marks: 3,  topic: 'number',   skill: 'Percentage Change',                                         skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage increase of a whole number' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'ratio',    skill: 'Ratio + Measuring Lines and Angles',                        skillIds: ['ratio', 'measuring_lines_and_angles'], kind: 'exam', visual: false, desc: 'real distance from a measured scale-drawing length and a stated scale' },
    { id: '9b',    label: '9(b)',    marks: 2,  topic: 'shape',    skill: 'Bearings + Ratio',                                          skillIds: ['bearings', 'ratio'], kind: 'exam', visual: true, desc: 'plot a point at a stated real distance and bearing on a scale drawing' },
    { id: '10',    label: '10',      marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Solving Linear Equations',              skillIds: ['simple_arithmetic', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'hours worked by one person, from two hourly rates and a stated difference in weekly pay' },
    { id: '11',    label: '11',      marks: 3,  topic: 'number',   skill: 'Indices + Fractional and Negative Indices',                 skillIds: ['indices', 'fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'product of a cube root and a squared fraction' },
    { id: '12a',   label: '12(a)',   marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                        skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'list every order of four digits with the first one fixed' },
    { id: '12b',   label: '12(b)',   marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                            skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability that one position holds a given digit, from that list' },
    { id: '13a',   label: '13(a)',   marks: 4,  topic: 'algebra',  skill: 'Sequences',                                                 skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'decide whether a stock of counters covers the next two terms of a triangular-number pattern' },
    { id: '13bi',  label: '13(bi)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                 skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'complete a row totalling two consecutive terms' },
    { id: '13bii', label: '13(bii)', marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                 skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'which pair of consecutive triangular numbers sums to a given square' },
    { id: '14a',   label: '14(a)',   marks: 5,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'how many of a third item a remaining budget buys, after two fixed purchases' },
    { id: '14b',   label: '14(b)',   marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'money left over after that purchase' },
    { id: '15',    label: '15',      marks: 5,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Time Calculations',      skillIds: ['adding_and_subtracting_fractions', 'time_calculations'], kind: 'exam', visual: false, desc: 'total duration in hours and minutes, from two fractions of it and the remaining minutes' },
    { id: '16',    label: '16',      marks: 2,  topic: 'algebra',  skill: 'Equations and Identities + Expanding Brackets',             skillIds: ['equations_and_identities', 'expanding_brackets'], kind: 'mastery', visual: false, desc: 'two missing numbers making a bracketed statement an identity' },
    { id: '17a',   label: '17(a)',   marks: 1,  topic: 'shape',    skill: 'Vectors',                                                   skillIds: ['vectors'], kind: 'mastery', visual: true, desc: 'draw a column vector on a grid with a direction arrow' },
    { id: '17b',   label: '17(b)',   marks: 2,  topic: 'shape',    skill: 'Vectors',                                                   skillIds: ['vectors'], kind: 'mastery', visual: true, desc: 'draw the sum of two column vectors' },
    { id: '18',    label: '18',      marks: 4,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Ratio',                skillIds: ['alternate_and_corresponding_angles', 'ratio'], kind: 'exam', visual: false, desc: 'one of two angles in a crossed parallel-line figure, given their sum via the triangle and their ratio' },
    { id: '19',    label: '19',      marks: 3,  topic: 'shape',    skill: 'Volume of a Sphere',                                        skillIds: ['volume_of_a_sphere'], kind: 'mastery', visual: false, desc: 'volume of a sphere in terms of pi, in its simplest form' },
    { id: '20',    label: '20',      marks: 3,  topic: 'shape',    skill: 'Volume of a Prism + Areas of Triangles',                    skillIds: ['volume_of_a_prism', 'areas_of_triangles'], kind: 'mastery', visual: false, desc: 'identify that a triangular cross-section\'s half was omitted, and give the correct base length' },
    { id: '21a',   label: '21(a)',   marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'add four points to a part-complete scatter diagram' },
    { id: '21b',   label: '21(b)',   marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe the type of correlation' },
    { id: '21c',   label: '21(c)',   marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'circle the point lying above the trend' },
    { id: '21di',  label: '21(di)',  marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'draw a line of best fit and read an estimate off it' },
    { id: '21dii', label: '21(dii)', marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'state the assumption behind reading an estimate off a line of best fit' },
    { id: '21e',   label: '21(e)',   marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'explain why an estimate beyond the range of the data is unreliable' },
    { id: '22',    label: '22',      marks: 3,  topic: 'shape',    skill: 'Trigonometry (Missing Sides) + Exact Trigonometric Values', skillIds: ['trigonometry_missing_sides', 'exact_trig_values'], kind: 'mastery', visual: false, desc: 'missing side of a right-angled triangle without a calculator, using the exact sine of 30 degrees' },
    { id: '23a',   label: '23(a)',   marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                    skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'factorise a monic quadratic with a positive constant' },
    { id: '23b',   label: '23(b)',   marks: 1,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                 skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'write down the roots from the factorised form' },
    { id: '24a',   label: '24(a)',   marks: 4,  topic: 'ratio',    skill: 'Proportion + Time Calculations',                            skillIds: ['proportion', 'time_calculations'], kind: 'exam', visual: false, desc: 'show a packing rate meets a target within a stated time, rate given per a non-unit count' },
    { id: '24b',   label: '24(b)',   marks: 1,  topic: 'ratio',    skill: 'Proportion',                                                skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'state the constant-rate assumption behind that conclusion' },
    { id: '25',    label: '25',      marks: 6,  topic: 'shape',    skill: 'Exterior Angles + Simultaneous Equations',                  skillIds: ['exterior_angles', 'simultaneous_equations'], kind: 'exam', visual: false, desc: 'number of sides of two regular polygons, their exterior angles given only by a sum and a difference' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
