import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/06 — Higher Tier Paper 6 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/OCR-JUN24-H-P6.json by
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
export const OCR_J560_06_JUN24: PaperConfig = {
  id: 'ocr-j560-06-jun24',
  title: 'OCR GCSE Mathematics J560/06',
  subtitle: 'Higher Tier Paper 6 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',    label: '1',      marks: 3,  topic: 'algebra',  skill: 'Sketching Functions',                                         skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'match three described real-world relationships to three of six sketched graph shapes' },
    { id: '2',    label: '2',      marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'give two distinct reasons a graph is misleading, from an uneven horizontal scale and a truncated or missing vertical scale' },
    { id: '3',    label: '3',      marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Calculating Simple Probability',          skillIds: ['expected_outcomes', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'expected count of one letter over 99 draws with replacement from the letters of a word' },
    { id: '4ai',  label: '4(ai)',  marks: 4,  topic: 'ratio',    skill: 'Ratio + Compound Units',                                      skillIds: ['ratio', 'compound_units'], kind: 'exam', visual: false, desc: 'days needed for a walk, from a measured map distance, a map scale, a speed and hours walked per day' },
    { id: '4aii', label: '4(aii)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                       skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'explain why a straight-line map distance makes the answer an underestimate' },
    { id: '4b',   label: '4(b)',   marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Converting Measurements',                 skillIds: ['simplifying_ratio', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'explain why a scale stated in two different units is not the ratio given, and write it correctly as 1 : n' },
    { id: '5a',   label: '5(a)',   marks: 6,  topic: 'shape',    skill: 'Areas of Triangles + Trigonometry (Missing Sides)',           skillIds: ['areas_of_triangles', 'trigonometry_missing_sides'], kind: 'exam', visual: false, desc: 'show a regular pentagon\'s area to 2 decimal places, built from ten congruent right-angled triangles' },
    { id: '5b',   label: '5(b)',   marks: 3,  topic: 'shape',    skill: 'Volume of a Pyramid and Cone',                                skillIds: ['volume_of_a_pyramid_and_cone'], kind: 'mastery', visual: false, desc: 'perpendicular height of a pyramid from its volume and the base area just derived' },
    { id: '6a',   label: '6(a)',   marks: 2,  topic: 'number',   skill: 'Lowest Common Multiple',                                      skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: 'lowest common multiple of two numbers given as products of prime factors' },
    { id: '6b',   label: '6(b)',   marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                       skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'the unknown prime in one factorisation, deduced from a stated highest common factor' },
    { id: '7a',   label: '7(a)',   marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions Decimals and Percentages',                  skillIds: ['ratio', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'decide whether a claim about two bags is certain, possible or impossible, when one is described by a ratio and the other by a fraction and neither total is given' },
    { id: '7b',   label: '7(b)',   marks: 3,  topic: 'ratio',    skill: 'Ratio + Solving Linear Equations',                            skillIds: ['ratio', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'size of the unchanged part, from a ratio before and after a stated number is added to the other part' },
    { id: '8a',   label: '8(a)',   marks: 2,  topic: 'algebra',  skill: 'Substitution + Sketching Functions',                          skillIds: ['substitution', 'sketching_functions'], kind: 'mastery', visual: false, desc: 'complete a table of values for a cubic' },
    { id: '8b',   label: '8(b)',   marks: 3,  topic: 'algebra',  skill: 'Sketching Functions',                                         skillIds: ['sketching_functions'], kind: 'mastery', visual: true, desc: 'draw a cubic curve with a maximum and a minimum from a table of values' },
    { id: '8c',   label: '8(c)',   marks: 1,  topic: 'algebra',  skill: 'Sketching Functions',                                         skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'solve a cubic equal to a constant by reading off the drawn curve, to 1 decimal place' },
    { id: '9a',   label: '9(a)',   marks: 3,  topic: 'shape',    skill: 'Sector Calculations',                                         skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'show a sector\'s area to 3 significant figures from its radius and angle' },
    { id: '9b',   label: '9(b)',   marks: 4,  topic: 'shape',    skill: 'Area of Parallelograms + Fractions Decimals and Percentages', skillIds: ['area_of_parallelograms', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'percentage of a parallelogram left unshaded once a sector is removed, the parallelogram\'s base and perpendicular height given among three lengths' },
    { id: '10a',  label: '10(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show a stated difference between two halves of a filled number grid' },
    { id: '10b',  label: '10(b)',  marks: 5,  topic: 'algebra',  skill: 'Algebraic Proof',                                             skillIds: ['algebraic_proof'], kind: 'mastery', visual: false, desc: 'prove algebraically that the difference between the two halves of the grid is the same for any eight consecutive numbers' },
    { id: '11a',  label: '11(a)',  marks: 2,  topic: 'probdata', skill: 'Relative Frequency + Frequency Trees',                        skillIds: ['relative_frequency', 'frequency_trees'], kind: 'exam', visual: false, desc: 'relative frequency of one second-stage outcome across a whole frequency tree' },
    { id: '11b',  label: '11(b)',  marks: 3,  topic: 'probdata', skill: 'Relative Frequency + Frequency Trees',                        skillIds: ['relative_frequency', 'frequency_trees'], kind: 'exam', visual: false, desc: 'test a claim by comparing two conditional relative frequencies from a frequency tree, converted to a common form' },
    { id: '12',   label: '12',     marks: 3,  topic: 'algebra',  skill: 'Inequalities + Understanding Straight Line Graphs',           skillIds: ['inequalities', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'complete one inequality\'s direction and write down the third, for a region shaded on a grid' },
    { id: '13a',  label: '13(a)',  marks: 4,  topic: 'probdata', skill: 'Histograms',                                                  skillIds: ['histograms'], kind: 'mastery', visual: false, desc: 'cumulative count below a value on an unlabelled-axis histogram, the scale fixed by one stated frequency' },
    { id: '13b',  label: '13(b)',  marks: 2,  topic: 'probdata', skill: 'Histograms',                                                  skillIds: ['histograms'], kind: 'mastery', visual: true, desc: 'add a bar to that histogram for a stated frequency over an unequal class width' },
    { id: '14',   label: '14',     marks: 5,  topic: 'shape',    skill: 'Pythagoras\' Theorem + Coordinates',                          skillIds: ['pythagoras_theorem', 'coordinates'], kind: 'exam', visual: false, desc: 'both possible second coordinates of a point a stated distance from a point on the y-axis' },
    { id: '15',   label: '15',     marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers + Inverse Proportion',                 skillIds: ['proportion_with_powers', 'inverse_proportion'], kind: 'exam', visual: false, desc: 'formula for a variable inversely proportional to a cube, from one given pair' },
    { id: '16',   label: '16',     marks: 4,  topic: 'number',   skill: 'Fractional and Negative Indices + Simplifying Indices',       skillIds: ['fractional_and_negative_indices', 'simplifying_indices'], kind: 'mastery', visual: false, desc: 'simplify a quotient of index terms including a square root, answer in the form kx to a fractional power' },
    { id: '17a',  label: '17(a)',  marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions',                             skillIds: ['recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'show a two-digit recurring decimal equals a given fraction, every step shown, without a calculator' },
    { id: '17b',  label: '17(b)',  marks: 2,  topic: 'number',   skill: 'Recurring Decimals to Fractions',                             skillIds: ['recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'use the fraction just proved to write a related fraction as a recurring decimal, explaining the step' },
    { id: '18',   label: '18',     marks: 6,  topic: 'shape',    skill: 'Sine Rule + Cosine Rule',                                     skillIds: ['sine_rule', 'cosine_rule'], kind: 'exam', visual: false, desc: 'a length in the second of two joined triangles, the shared side found first by the sine rule' },
    { id: '19',   label: '19',     marks: 5,  topic: 'algebra',  skill: 'Equation of a Circle + Perpendicular Gradients',              skillIds: ['equation_of_a_circle', 'perpendicular_gradients'], kind: 'exam', visual: false, desc: 'exact x-intercept of the tangent to a circle at a given point on it' },
    { id: '20',   label: '20',     marks: 5,  topic: 'algebra',  skill: 'Algebraic Fractions + Difference of Two Squares',             skillIds: ['algebraic_fractions', 'difference_of_two_squares'], kind: 'exam', visual: false, desc: 'add two algebraic fractions as a single fraction in lowest terms, one numerator a difference of two squares sharing a factor with the denominator' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
