import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/03 — Foundation Tier Paper 3 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/OCR-JUN24-F-P3.json by
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
export const OCR_J560_03_JUN24: PaperConfig = {
  id: 'ocr-j560-03-jun24',
  title: 'OCR GCSE Mathematics J560/03',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',    label: '1(a)',    marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                                        skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'name a solid from a given list' },
    { id: '1bi',   label: '1(bi)',   marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                                        skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'number of edges of a cuboid' },
    { id: '1bii',  label: '1(bii)',  marks: 2,  topic: 'shape',    skill: 'Volume of a Prism',                                              skillIds: ['volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'volume of a cuboid from its three dimensions' },
    { id: '2',     label: '2',       marks: 2,  topic: 'ratio',    skill: 'Proportion',                                                     skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'scale up two ingredient weights of a recipe from one total to another' },
    { id: '3ai',   label: '3(ai)',   marks: 1,  topic: 'number',   skill: 'Indices',                                                        skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'a fourth power on a calculator' },
    { id: '3aii',  label: '3(aii)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                        skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'a square root on a calculator' },
    { id: '3b',    label: '3(b)',    marks: 2,  topic: 'number',   skill: 'Indices',                                                        skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'the number whose cube root is given, answer as an ordinary number' },
    { id: '4',     label: '4',       marks: 2,  topic: 'ratio',    skill: 'Proportion',                                                     skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'currency conversion from pounds using a rate quoted per unit of the other currency' },
    { id: '5a',    label: '5(a)',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Rounding',                                skillIds: ['fractions_of_amounts', 'rounding'], kind: 'exam', visual: false, desc: 'a non-unit fraction of a whole number, answer to 1 decimal place' },
    { id: '5b',    label: '5(b)',    marks: 3,  topic: 'number',   skill: 'Simplifying Fractions + Converting Measurements',                skillIds: ['simplifying_fractions', 'converting_measurements'], kind: 'exam', visual: false, desc: 'one length as a fraction of another given in a different metric unit, simplified' },
    { id: '6a',    label: '6(a)',    marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                          skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'pick which of four calculations gives one share of a two-part ratio' },
    { id: '6b',    label: '6(b)',    marks: 2,  topic: 'ratio',    skill: 'Ratio',                                                          skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'the other share of a two-part ratio of a money amount' },
    { id: '7',     label: '7',       marks: 2,  topic: 'shape',    skill: 'Area of a Circle',                                               skillIds: ['area_of_a_circle'], kind: 'mastery', visual: false, desc: 'area of a circle from its radius' },
    { id: '8',     label: '8',       marks: 4,  topic: 'number',   skill: 'Simple Arithmetic',                                              skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'change in pence after buying as many items as a fixed sum allows, the count rounding down' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',                             skillIds: ['compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'arrival time when the speed is doubled and only the slower journey\'s duration is given' },
    { id: '9b',    label: '9(b)',    marks: 3,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',                             skillIds: ['compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'total time for a journey done half at one speed and half at double it' },
    { id: '10a',   label: '10(a)',   marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                            skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'a repeated product of one letter written as a power' },
    { id: '10b',   label: '10(b)',   marks: 2,  topic: 'algebra',  skill: 'Factorising',                                                    skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise fully where the common factor is a number and a letter' },
    { id: '11a',   label: '11(a)',   marks: 1,  topic: 'algebra',  skill: 'Equations and Identities',                                       skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'classify an algebraic statement as an expression' },
    { id: '11b',   label: '11(b)',   marks: 1,  topic: 'algebra',  skill: 'Equations and Identities',                                       skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'classify an algebraic statement as an identity' },
    { id: '12a',   label: '12(a)',   marks: 3,  topic: 'probdata', skill: 'Frequency Trees',                                                skillIds: ['frequency_trees'], kind: 'mastery', visual: true, desc: 'complete a three-stage frequency tree with several blank branches' },
    { id: '12b',   label: '12(b)',   marks: 3,  topic: 'probdata', skill: 'Frequency Trees',                                                skillIds: ['frequency_trees'], kind: 'mastery', visual: false, desc: 'which final-stage outcome is most popular, by totalling three branches of a frequency tree' },
    { id: '12c',   label: '12(c)',   marks: 2,  topic: 'probdata', skill: 'Frequency Trees + Calculating Simple Probability',               skillIds: ['frequency_trees', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'probability of a middle-stage outcome from a completed frequency tree' },
    { id: '12d',   label: '12(d)',   marks: 1,  topic: 'probdata', skill: 'Sampling',                                                       skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'name the assumption in treating one morning\'s visitors as representative' },
    { id: '13a',   label: '13(a)',   marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                             skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'decide which of a percentage and a fraction is the greater proportion, converting to a common form' },
    { id: '13b',   label: '13(b)',   marks: 2,  topic: 'number',   skill: 'Lowest Common Multiple + Fractions Decimals and Percentages',    skillIds: ['lowest_common_multiple', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'smallest total for which both a percentage and an eighths fraction of it are whole numbers' },
    { id: '14',    label: '14',      marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                         skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'error interval for a value truncated to 1 decimal place, one blank a number and one a symbol' },
    { id: '15a',   label: '15(a)',   marks: 1,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                               skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'state in words the relationship between two algebraic side lengths' },
    { id: '15b',   label: '15(b)',   marks: 2,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Simplifying Expressions',      skillIds: ['areas_of_squares_and_rectangles', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'area of a rectangle with a square corner removed, in two letters, simplified' },
    { id: '15ci',  label: '15(ci)',  marks: 3,  topic: 'shape',    skill: 'Lengths and Perimeters + Simplifying Expressions',               skillIds: ['lengths_and_perimeters', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'perimeter of that same shape, where the removed square\'s sides cancel out of the expression' },
    { id: '15cii', label: '15(cii)', marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                                       skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'letter value from setting the derived perimeter expression equal to a decimal' },
    { id: '16a',   label: '16(a)',   marks: 3,  topic: 'algebra',  skill: 'Quadratic Functions',                                            skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'draw a quadratic curve from a completed table of values' },
    { id: '16b',   label: '16(b)',   marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                            skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read both solutions of a quadratic equal to a constant off the drawn curve' },
    { id: '17',    label: '17',      marks: 5,  topic: 'number',   skill: 'Percentage Change',                                              skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'total value after five years of simple interest, given only the total interest earned' },
    { id: '18',    label: '18',      marks: 4,  topic: 'shape',    skill: 'Congruence and Similarity + Alternate and Corresponding Angles', skillIds: ['congruence_and_similarity', 'alternate_and_corresponding_angles'], kind: 'exam', visual: false, desc: 'complete a similarity argument for two triangles in a crossed figure, naming each angle pair and its reason' },
    { id: '19',    label: '19',      marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                                  skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'give two distinct reasons a graph is misleading, from an uneven horizontal scale and a truncated or missing vertical scale' },
    { id: '20',    label: '20',      marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Calculating Simple Probability',             skillIds: ['expected_outcomes', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'expected count of one letter over 99 draws with replacement from the letters of a word' },
    { id: '21ai',  label: '21(ai)',  marks: 4,  topic: 'ratio',    skill: 'Ratio + Compound Units',                                         skillIds: ['ratio', 'compound_units'], kind: 'exam', visual: false, desc: 'days needed for a walk, from a measured map distance, a map scale, a speed and hours walked per day' },
    { id: '21aii', label: '21(aii)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                          skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'explain why a straight-line map distance makes the answer an underestimate' },
    { id: '21b',   label: '21(b)',   marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Converting Measurements',                    skillIds: ['simplifying_ratio', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'explain why a scale stated in two different units is not the ratio given, and write it correctly as 1 : n' },
    { id: '22a',   label: '22(a)',   marks: 6,  topic: 'shape',    skill: 'Areas of Triangles + Trigonometry (Missing Sides)',              skillIds: ['areas_of_triangles', 'trigonometry_missing_sides'], kind: 'exam', visual: false, desc: 'show a regular pentagon\'s area to 2 decimal places, built from ten congruent right-angled triangles' },
    { id: '22b',   label: '22(b)',   marks: 3,  topic: 'shape',    skill: 'Volume of a Pyramid and Cone',                                   skillIds: ['volume_of_a_pyramid_and_cone'], kind: 'mastery', visual: false, desc: 'perpendicular height of a pyramid from its volume and the base area just derived' },
    { id: '23a',   label: '23(a)',   marks: 2,  topic: 'number',   skill: 'Lowest Common Multiple',                                         skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: 'lowest common multiple of two numbers given as products of prime factors' },
    { id: '23b',   label: '23(b)',   marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                          skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'the unknown prime in one factorisation, deduced from a stated highest common factor' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
