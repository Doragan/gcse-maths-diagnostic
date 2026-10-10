import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/05 — Higher Tier Paper 5 Non-calculator — June 2023.
 *
 * GENERATED from data/exam-audit/OCR-JUN23-H-P5.json by
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
export const OCR_J560_05_JUN23: PaperConfig = {
  id: 'ocr-j560-05-jun23',
  title: 'OCR GCSE Mathematics J560/05',
  subtitle: 'Higher Tier Paper 5 Non-calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 3,  topic: 'number',   skill: 'Dividing Fractions + Irregular and Improper Fractions',              skillIds: ['dividing_fractions', 'irregular_and_improper_fractions'], kind: 'exam', visual: false, desc: 'divide two mixed numbers, answer as a fraction in its simplest form' },
    { id: '2a',    label: '2(a)',    marks: 2,  topic: 'shape',    skill: 'Alternate and Corresponding Angles',                                 skillIds: ['alternate_and_corresponding_angles'], kind: 'mastery', visual: false, desc: 'an angle on a transversal of parallel lines, with the reason named' },
    { id: '2b',    label: '2(b)',    marks: 3,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Angles on Lines and Circles',   skillIds: ['alternate_and_corresponding_angles', 'angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'a second angle in the same figure, via a straight line and the triangle sum' },
    { id: '3',     label: '3',       marks: 2,  topic: 'number',   skill: 'Decimals',                                                           skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'non-calculator division by a two-decimal-place number' },
    { id: '4',     label: '4',       marks: 3,  topic: 'shape',    skill: 'Volume of a Prism + Areas of Triangles',                             skillIds: ['volume_of_a_prism', 'areas_of_triangles'], kind: 'mastery', visual: false, desc: 'identify that a triangular cross-section\'s half was omitted, and give the correct base length' },
    { id: '5a',    label: '5(a)',    marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'add four points to a part-complete scatter diagram' },
    { id: '5b',    label: '5(b)',    marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe the type of correlation' },
    { id: '5c',    label: '5(c)',    marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'circle the point lying above the trend' },
    { id: '5di',   label: '5(di)',   marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'draw a line of best fit and read an estimate off it' },
    { id: '5dii',  label: '5(dii)',  marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'state the assumption behind reading an estimate off a line of best fit' },
    { id: '5e',    label: '5(e)',    marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'explain why an estimate beyond the range of the data is unreliable' },
    { id: '6',     label: '6',       marks: 4,  topic: 'ratio',    skill: 'Proportion',                                                         skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'full capacity from the volume left after a stated number of equal doses out of a known total' },
    { id: '7a',    label: '7(a)',    marks: 4,  topic: 'ratio',    skill: 'Proportion + Time Calculations',                                     skillIds: ['proportion', 'time_calculations'], kind: 'exam', visual: false, desc: 'show a packing rate meets a target within a stated time, rate given per a non-unit count' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'ratio',    skill: 'Proportion',                                                         skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'state the constant-rate assumption behind that conclusion' },
    { id: '8',     label: '8',       marks: 5,  topic: 'number',   skill: 'Estimating + Compound Units + Volume of a Prism',                    skillIds: ['estimating', 'compound_units', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'test a stated mass by estimating a cuboid\'s volume and applying a density, all values rounded first' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'ratio',    skill: 'Ratio + Fractions Decimals and Percentages',                         skillIds: ['ratio', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'one part of a ratio as a percentage of another' },
    { id: '9b',    label: '9(b)',    marks: 4,  topic: 'ratio',    skill: 'Ratio',                                                              skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'a shared quantity, from two ratios chained through it and a stated difference between the outer two' },
    { id: '10',    label: '10',      marks: 6,  topic: 'shape',    skill: 'Exterior Angles + Simultaneous Equations',                           skillIds: ['exterior_angles', 'simultaneous_equations'], kind: 'exam', visual: false, desc: 'number of sides of two regular polygons, their exterior angles given only by a sum and a difference' },
    { id: '11',    label: '11',      marks: 4,  topic: 'ratio',    skill: 'Proportion with Powers + Percentage Change',                         skillIds: ['proportion_with_powers', 'percentage_change'], kind: 'exam', visual: false, desc: 'percentage decrease in a variable proportional to a square, when its partner falls by a stated percentage' },
    { id: '12a',   label: '12(a)',   marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                          skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'next term of a sequence of fractions' },
    { id: '12b',   label: '12(b)',   marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term + Nth Term of Quadratic Sequences',             skillIds: ['finding_the_nth_term', 'nth_term_quadratic_sequences'], kind: 'mastery', visual: false, desc: 'nth term of a sequence of fractions, numerator linear and denominator quadratic' },
    { id: '13a',   label: '13(a)',   marks: 3,  topic: 'shape',    skill: 'Trigonometry (Missing Sides) + Exact Trigonometric Values',          skillIds: ['trigonometry_missing_sides', 'exact_trig_values'], kind: 'mastery', visual: false, desc: 'perpendicular height of a triangle without a calculator, using the exact sine of 30 degrees' },
    { id: '13b',   label: '13(b)',   marks: 3,  topic: 'shape',    skill: 'Exact Trigonometric Values + Simplifying Surds',                     skillIds: ['exact_trig_values', 'surds_simplifying'], kind: 'exam', visual: false, desc: 'exact length of a second side, using the exact sine of 45 degrees, simplified' },
    { id: '14',    label: '14',      marks: 5,  topic: 'algebra',  skill: 'Inequalities + Understanding Straight Line Graphs',                  skillIds: ['inequalities', 'understanding_straight_line_graphs'], kind: 'exam', visual: true, desc: 'draw the one missing boundary and shade the region satisfying three inequalities, one with a strict boundary' },
    { id: '15a',   label: '15(a)',   marks: 2,  topic: 'algebra',  skill: 'Difference of Two Squares',                                          skillIds: ['difference_of_two_squares'], kind: 'mastery', visual: false, desc: 'factorise a difference of two squares with a non-unit leading coefficient' },
    { id: '15b',   label: '15(b)',   marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                          skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'solve a non-monic quadratic by factorising, one root fractional' },
    { id: '15c',   label: '15(c)',   marks: 4,  topic: 'algebra',  skill: 'Algebraic Fractions + Solving Linear Equations',                     skillIds: ['algebraic_fractions', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'solve an equation where the unknown appears in both the numerator and the denominator' },
    { id: '16a',   label: '16(a)',   marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                    skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'evaluate a number raised to a fractional power greater than one' },
    { id: '16b',   label: '16(b)',   marks: 4,  topic: 'number',   skill: 'Recurring Decimals to Fractions + Adding and Subtracting Fractions', skillIds: ['recurring_decimals_to_fractions', 'adding_and_subtracting_fractions'], kind: 'exam', visual: false, desc: 'numerator and denominator of a fraction left when a recurring decimal is subtracted from a given fraction' },
    { id: '17',    label: '17',      marks: 4,  topic: 'algebra',  skill: 'Perpendicular Gradients + Understanding Straight Line Graphs',       skillIds: ['perpendicular_gradients', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of the second diagonal of a rhombus, from the first diagonal\'s equation and one point' },
    { id: '18',    label: '18',      marks: 3,  topic: 'number',   skill: 'Fractional and Negative Indices + Simplifying Indices',              skillIds: ['fractional_and_negative_indices', 'simplifying_indices'], kind: 'mastery', visual: false, desc: 'show an index equals a stated fraction, from two equations relating two positive quantities' },
    { id: '19',    label: '19',      marks: 5,  topic: 'probdata', skill: 'Conditional Probability + Ratio',                                    skillIds: ['conditional_probability', 'ratio'], kind: 'exam', visual: false, desc: 'probability two without-replacement picks differ in colour, the counts given only by a ratio of a known total' },
    { id: '20ai',  label: '20(ai)',  marks: 1,  topic: 'shape',    skill: 'Vectors',                                                            skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'a diagonal of a parallelogram in terms of its two side vectors' },
    { id: '20aii', label: '20(aii)', marks: 2,  topic: 'shape',    skill: 'Vectors',                                                            skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'a vector to a point dividing one side in a given ratio' },
    { id: '20b',   label: '20(b)',   marks: 4,  topic: 'shape',    skill: 'Vector Proof',                                                       skillIds: ['vector_proof'], kind: 'mastery', visual: false, desc: 'show three points are collinear, by expressing one vector as a multiple of another' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
