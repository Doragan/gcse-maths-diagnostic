import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/02 — Foundation Tier Paper 2 Non-calculator — June 2024.
 *
 * GENERATED from data/exam-audit/OCR-JUN24-F-P2.json by
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
export const OCR_J560_02_JUN24: PaperConfig = {
  id: 'ocr-j560-02-jun24',
  title: 'OCR GCSE Mathematics J560/02',
  subtitle: 'Foundation Tier Paper 2 Non-calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',    label: '1(a)',    marks: 1,  topic: 'number',   skill: 'Decimals',                                                  skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'add two one-decimal-place values crossing a whole number' },
    { id: '1b',    label: '1(b)',    marks: 1,  topic: 'number',   skill: 'Decimals',                                                  skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'subtract a money amount in pence from one in pounds' },
    { id: '2a',    label: '2(a)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'subtract from a negative number' },
    { id: '2b',    label: '2(b)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'divide a negative number by a positive one' },
    { id: '2c',    label: '2(c)',    marks: 1,  topic: 'number',   skill: 'Indices',                                                   skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'square a bracketed negative number' },
    { id: '3a',    label: '3(a)',    marks: 2,  topic: 'shape',    skill: 'Reflections',                                               skillIds: ['reflections'], kind: 'mastery', visual: true, desc: 'reflect a triangle in a given vertical mirror line' },
    { id: '3b',    label: '3(b)',    marks: 2,  topic: 'shape',    skill: 'Rotations',                                                 skillIds: ['rotations'], kind: 'mastery', visual: true, desc: 'rotate a triangle a quarter turn anticlockwise about a marked point' },
    { id: '4',     label: '4',       marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                         skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'diameter from a radius' },
    { id: '5a',    label: '5(a)',    marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                            skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'read a probability off a marked probability scale, as a fraction' },
    { id: '5b',    label: '5(b)',    marks: 1,  topic: 'probdata', skill: 'Mutually Exclusive Events',                                 skillIds: ['mutually_exclusive_events'], kind: 'mastery', visual: true, desc: 'mark the complementary probability on the same scale' },
    { id: '6',     label: '6',       marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                            skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'volume used from a flow rate and a duration' },
    { id: '7a',    label: '7(a)',    marks: 2,  topic: 'number',   skill: 'Converting Decimals to Fractions',                          skillIds: ['converting_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'a one-decimal-place value written as a fraction in its simplest form' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions',                          skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'improper fraction to a mixed number' },
    { id: '8',     label: '8',       marks: 3,  topic: 'number',   skill: 'Converting Measurements',                                   skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'compare three pairs of measurements given in different metric units, one pair involving a mixed number of kilometres' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                          skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract two fractions with one denominator a multiple of the other, answer simplified' },
    { id: '9b',    label: '9(b)',    marks: 3,  topic: 'number',   skill: 'Dividing Fractions',                                        skillIds: ['dividing_fractions'], kind: 'mastery', visual: false, desc: 'divide two fractions, answer simplified' },
    { id: '10a',   label: '10(a)',   marks: 2,  topic: 'algebra',  skill: 'Simplifying Expressions',                                   skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'collect like terms in two letters, one pair with mixed signs' },
    { id: '10b',   label: '10(b)',   marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                   skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'multiply two terms with numerical coefficients and different letters' },
    { id: '11',    label: '11',      marks: 3,  topic: 'shape',    skill: 'Plans and Elevations',                                      skillIds: ['plans_and_elevations'], kind: 'mastery', visual: false, desc: 'name three solids, each from its plan view and its front elevation' },
    { id: '12a',   label: '12(a)',   marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                       skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'missing index when two powers of the same base are multiplied' },
    { id: '12b',   label: '12(b)',   marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                       skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'missing index for a power raised to a power' },
    { id: '13a',   label: '13(a)',   marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                 skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'next term of the triangular numbers' },
    { id: '13b',   label: '13(b)',   marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                 skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'the missing first and fifth terms of an add-the-previous-two sequence, the first requiring a subtraction' },
    { id: '14',    label: '14',      marks: 3,  topic: 'algebra',  skill: 'Substitution',                                              skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'substitute into a formula whose subject is squared, then take the root' },
    { id: '15a',   label: '15(a)',   marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                         skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'what is left after a repeated decimal amount is taken from a total' },
    { id: '15b',   label: '15(b)',   marks: 3,  topic: 'number',   skill: 'Converting Measurements + Simple Arithmetic',               skillIds: ['converting_measurements', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'how many small containers a remaining volume fills, the two volumes given in different units and the count rounding down' },
    { id: '15c',   label: '15(c)',   marks: 2,  topic: 'number',   skill: 'Converting Measurements',                                   skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'volume left over in millilitres after that whole number of containers' },
    { id: '16a',   label: '16(a)',   marks: 5,  topic: 'number',   skill: 'Estimating',                                                skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'estimate a week\'s pay by rounding two hourly rates and two mixed-number hour counts, to test a stated floor' },
    { id: '16b',   label: '16(b)',   marks: 1,  topic: 'number',   skill: 'Estimating',                                                skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'say why the estimate makes the conclusion certain rather than likely' },
    { id: '17',    label: '17',      marks: 2,  topic: 'number',   skill: 'Decimals',                                                  skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'non-calculator division by a two-decimal-place number' },
    { id: '18a',   label: '18(a)',   marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                        skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'complete a difference table for two cards drawn without replacement' },
    { id: '18b',   label: '18(b)',   marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                        skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'probability of a union of two overlapping conditions read off a difference table' },
    { id: '19',    label: '19',      marks: 2,  topic: 'shape',    skill: 'Constructions',                                             skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'construct a perpendicular bisector with ruler and compasses, arcs left visible' },
    { id: '20a',   label: '20(a)',   marks: 2,  topic: 'shape',    skill: 'Vectors',                                                   skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'write a vector drawn on a grid as a column vector, one component negative' },
    { id: '20b',   label: '20(b)',   marks: 1,  topic: 'shape',    skill: 'Vectors',                                                   skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'express a second drawn vector as a multiple of the first' },
    { id: '21a',   label: '21(a)',   marks: 6,  topic: 'ratio',    skill: 'Compound Units + Time Calculations + Fractions of Amounts', skillIds: ['compound_units', 'time_calculations', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'arrival time for a journey split into three stages, two of them a fraction and a percentage of the distance at stated speeds and the third given as a duration' },
    { id: '21b',   label: '21(b)',   marks: 1,  topic: 'ratio',    skill: 'Compound Units',                                            skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'state an assumption behind treating a speed limit as the speed travelled' },
    { id: '22a',   label: '22(a)',   marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe the type of correlation on a scatter diagram' },
    { id: '22b',   label: '22(b)',   marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'circle the point that does not follow the trend, given a reason it would not' },
    { id: '22c',   label: '22(c)',   marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'draw a line of best fit and read an estimate off it' },
    { id: '22d',   label: '22(d)',   marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'explain why an estimate beyond the range of the data is unreliable' },
    { id: '22e',   label: '22(e)',   marks: 3,  topic: 'probdata', skill: 'Scatter Graphs + Fractions Decimals and Percentages',       skillIds: ['scatter_graphs', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'percentage of plotted points meeting a condition on both axes' },
    { id: '23',    label: '23',      marks: 4,  topic: 'shape',    skill: 'Lengths and Perimeters + Solving Linear Equations',         skillIds: ['lengths_and_perimeters', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'letter value from equating a rectangle\'s algebraic perimeter with an equilateral triangle\'s numerical one' },
    { id: '24',    label: '24',      marks: 4,  topic: 'ratio',    skill: 'Growth and Decay',                                          skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'show two years of compound interest totals a stated amount, without a calculator' },
    { id: '25',    label: '25',      marks: 1,  topic: 'probdata', skill: 'Sampling',                                                  skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'say why scaling a proportion from a sample of ten to a population of two thousand may be unreliable' },
    { id: '26',    label: '26',      marks: 5,  topic: 'probdata', skill: 'Venn Diagrams + Ratio',                                     skillIds: ['venn_diagrams', 'ratio'], kind: 'exam', visual: false, desc: 'probability from a part-filled two-set Venn diagram, the two single-set regions fixed by a ratio' },
    { id: '27a',   label: '27(a)',   marks: 4,  topic: 'algebra',  skill: 'Expanding Double Brackets',                                 skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'show an area condition on two algebraic side lengths rearranges to a given quadratic' },
    { id: '27bi',  label: '27(bi)',  marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                 skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'solve a monic quadratic by factorising, one root negative' },
    { id: '27bii', label: '27(bii)', marks: 1,  topic: 'algebra',  skill: 'Substitution',                                              skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'a side length from the root that makes physical sense' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
