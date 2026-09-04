import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/01 — Foundation Tier Paper 1 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/OCR-JUN25-F-P1.json by
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
export const OCR_J560_01_JUN25: PaperConfig = {
  id: 'ocr-j560-01-jun25',
  title: 'OCR GCSE Mathematics J560/01',
  subtitle: 'Foundation Tier Paper 1 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',   label: '1(a)',   marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'write down an odd number in a given range' },
    { id: '1b',   label: '1(b)',   marks: 2,  topic: 'number',   skill: 'Indices',                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'write down two cube numbers below a bound' },
    { id: '2a',   label: '2(a)',   marks: 1,  topic: 'shape',    skill: 'Coordinates',                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'read the coordinates of a plotted point' },
    { id: '2b',   label: '2(b)',   marks: 1,  topic: 'shape',    skill: 'Coordinates',                                          skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'plot a point at given coordinates' },
    { id: '3',    label: '3',      marks: 2,  topic: 'shape',    skill: 'Reflections',                                          skillIds: ['reflections'], kind: 'mastery', visual: true, desc: 'reflect a shape in a given mirror line' },
    { id: '4a',   label: '4(a)',   marks: 1,  topic: 'probdata', skill: 'Mode',                                                 skillIds: ['mode'], kind: 'mastery', visual: false, desc: 'mode of a list of numbers' },
    { id: '4b',   label: '4(b)',   marks: 1,  topic: 'probdata', skill: 'Median',                                               skillIds: ['median'], kind: 'mastery', visual: false, desc: 'explain why a stated median is wrong' },
    { id: '5a',   label: '5(a)',   marks: 2,  topic: 'probdata', skill: 'Pie Charts',                                           skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'total from one pie chart sector and its frequency' },
    { id: '5b',   label: '5(b)',   marks: 2,  topic: 'probdata', skill: 'Pie Charts + Ratio',                                   skillIds: ['pie_charts', 'ratio'], kind: 'exam', visual: true, desc: 'complete a pie chart, splitting the remainder in a given ratio' },
    { id: '6a',   label: '6(a)',   marks: 2,  topic: 'ratio',    skill: 'Ratio + Measuring Lines and Angles',                   skillIds: ['ratio', 'measuring_lines_and_angles'], kind: 'exam', visual: false, desc: 'actual distance from a scale drawing' },
    { id: '6b',   label: '6(b)',   marks: 2,  topic: 'shape',    skill: 'Bearings + Ratio',                                     skillIds: ['bearings', 'ratio'], kind: 'exam', visual: true, desc: 'mark a point at a given bearing and distance on a scale drawing' },
    { id: '7ai',  label: '7(ai)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                  skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'index law for a repeated product of one letter' },
    { id: '7aii', label: '7(aii)', marks: 2,  topic: 'number',   skill: 'Simplifying Indices',                                  skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'multiply two monomials carrying powers' },
    { id: '7b',   label: '7(b)',   marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                             skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a two-step linear equation' },
    { id: '8a',   label: '8(a)',   marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'missing addend giving a negative total' },
    { id: '8b',   label: '8(b)',   marks: 1,  topic: 'number',   skill: 'Multiplying Fractions',                                skillIds: ['multiplying_fractions'], kind: 'mastery', visual: false, desc: 'missing denominator making a doubling statement true' },
    { id: '9ai',  label: '9(ai)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'identify a number from its complete list of factors' },
    { id: '9aii', label: '9(aii)', marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'HCF from a factor list and a prime factorisation' },
    { id: '9b',   label: '9(b)',   marks: 2,  topic: 'number',   skill: 'Factors and Multiples',                                skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'number in a range divisible by two given factors' },
    { id: '10',   label: '10',     marks: 2,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'order mixed fractions, decimals and percentages by size' },
    { id: '11',   label: '11',     marks: 3,  topic: 'probdata', skill: 'Mean',                                                 skillIds: ['mean'], kind: 'mastery', visual: false, desc: 'missing value from a known mean of four numbers' },
    { id: '12a',  label: '12(a)',  marks: 2,  topic: 'algebra',  skill: 'Substitution',                                         skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'substitute three values into a given formula' },
    { id: '12b',  label: '12(b)',  marks: 2,  topic: 'algebra',  skill: 'Substitution + Solving Linear Equations',              skillIds: ['substitution', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'substitute into a formula and solve for a variable that is not the subject' },
    { id: '13a',  label: '13(a)',  marks: 4,  topic: 'probdata', skill: 'Frequency Trees + Fractions of Amounts',               skillIds: ['frequency_trees', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'complete a frequency tree from a fraction of the total' },
    { id: '13b',  label: '13(b)',  marks: 2,  topic: 'probdata', skill: 'Frequency Trees + Fractions Decimals and Percentages', skillIds: ['frequency_trees', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'show a combined branch total is a stated percentage of the whole' },
    { id: '14',   label: '14',     marks: 5,  topic: 'number',   skill: 'Simple Arithmetic + Converting Measurements',          skillIds: ['simple_arithmetic', 'converting_measurements'], kind: 'exam', visual: false, desc: 'budget-limited whole purchases, then daily consumption with a litres-to-millilitres conversion' },
    { id: '15',   label: '15',     marks: 2,  topic: 'algebra',  skill: 'Sketching Functions',                                  skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'match sketched graphs to their equations from a list' },
    { id: '16',   label: '16',     marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                         skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'write the inequality shown on a number line' },
    { id: '17a',  label: '17(a)',  marks: 2,  topic: 'shape',    skill: 'Vectors',                                              skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'write a drawn vector as a column vector' },
    { id: '17b',  label: '17(b)',  marks: 1,  topic: 'shape',    skill: 'Vectors',                                              skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'add two column vectors' },
    { id: '17c',  label: '17(c)',  marks: 1,  topic: 'shape',    skill: 'Vectors',                                              skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'scalar multiple of a column vector' },
    { id: '18',   label: '18',     marks: 2,  topic: 'number',   skill: 'Exact Calculations + Significant Figures',             skillIds: ['exact_calculations', 'significant_figures'], kind: 'exam', visual: false, desc: 'calculator evaluation of a compound expression, answer to 3 significant figures' },
    { id: '19',   label: '19',     marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Converting Measurements',          skillIds: ['simplifying_ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'express a ratio of two metric units in the form 1 : n' },
    { id: '20a',  label: '20(a)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                  skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'missing power in a power raised to a power' },
    { id: '20b',  label: '20(b)',  marks: 1,  topic: 'number',   skill: 'Fractional and Negative Indices',                      skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'missing power expressing a reciprocal' },
    { id: '21a',  label: '21(a)',  marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe the correlation shown by each of three scatter diagrams' },
    { id: '21b',  label: '21(b)',  marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'draw a line of best fit and estimate from it' },
    { id: '22',   label: '22',     marks: 4,  topic: 'number',   skill: 'Percentage Change',                                    skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'simple interest rate from the final value after several years' },
    { id: '23a',  label: '23(a)',  marks: 1,  topic: 'algebra',  skill: 'Expanding Double Brackets',                            skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'decide whether each algebraic statement is an equation or an identity' },
    { id: '23b',  label: '23(b)',  marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a line parallel to a given line through a given point' },
    { id: '24',   label: '24',     marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing angles)',                        skillIds: ['trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'angle in a right-angled triangle from two given sides' },
    { id: '25',   label: '25',     marks: 3,  topic: 'probdata', skill: 'Sampling',                                             skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'three criticisms of a sampling method' },
    { id: '26',   label: '26',     marks: 4,  topic: 'ratio',    skill: 'Ratio',                                                skillIds: ['ratio'], kind: 'exam', visual: false, desc: 'chain two ratios sharing a term to find one part of a known total' },
    { id: '27',   label: '27',     marks: 4,  topic: 'ratio',    skill: 'Inverse Proportion + Time Calculations',               skillIds: ['inverse_proportion', 'time_calculations'], kind: 'exam', visual: false, desc: 'inverse proportion between workers and time, answer in hours and minutes' },
    { id: '28',   label: '28',     marks: 6,  topic: 'shape',    skill: 'Pythagoras\' Theorem + Circumfrence of a Circle',      skillIds: ['pythagoras_theorem', 'circumfrence_of_a_circle'], kind: 'exam', visual: false, desc: 'perimeter of a shape made from a right-angled triangle and a semicircle' },
    { id: '29a',  label: '29(a)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                        skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'write a small decimal in standard form' },
    { id: '29b',  label: '29(b)',  marks: 4,  topic: 'number',   skill: 'Standard Form + Compound Units',                       skillIds: ['standard_form', 'compound_units'], kind: 'exam', visual: false, desc: 'population density from populations and areas given in standard form' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
