import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/03 — Foundation Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/OCR-JUN25-F-P3.json by
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
export const OCR_J560_03_JUN25: PaperConfig = {
  id: 'ocr-j560-03-jun25',
  title: 'OCR GCSE Mathematics J560/03',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1ai',   label: '1(ai)',   marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                          skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'name a straight line drawn across a circle' },
    { id: '1aii',  label: '1(aii)',  marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                          skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'name the perimeter of a circle' },
    { id: '1b',    label: '1(b)',    marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                          skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: true, desc: 'draw a diameter on a circle' },
    { id: '2ai',   label: '2(ai)',   marks: 1,  topic: 'number',   skill: 'Rounding',                                                   skillIds: ['rounding'], kind: 'mastery', visual: false, desc: 'round an integer to the nearest hundred' },
    { id: '2aii',  label: '2(aii)',  marks: 1,  topic: 'number',   skill: 'Rounding',                                                   skillIds: ['rounding'], kind: 'mastery', visual: false, desc: 'round an amount of money to the nearest penny' },
    { id: '2b',    label: '2(b)',    marks: 2,  topic: 'number',   skill: 'Rounding + Simple Arithmetic',                               skillIds: ['rounding', 'simple_arithmetic'], kind: 'exam', visual: false, desc: 'round an area up to the next multiple, then charge per unit' },
    { id: '3a',    label: '3(a)',    marks: 1,  topic: 'number',   skill: 'Indices',                                                    skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'write a repeated product as a power' },
    { id: '3b',    label: '3(b)',    marks: 1,  topic: 'number',   skill: 'Indices',                                                    skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'value of one raised to a power' },
    { id: '3c',    label: '3(c)',    marks: 2,  topic: 'number',   skill: 'Indices',                                                    skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'evaluate a difference of two cubes written in different forms' },
    { id: '4a',    label: '4(a)',    marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                         skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'write a percentage as a decimal' },
    { id: '4b',    label: '4(b)',    marks: 2,  topic: 'number',   skill: 'Fractions Decimals and Percentages + Simplifying Fractions', skillIds: ['fractions_decimals_and_percentages', 'simplifying_fractions'], kind: 'exam', visual: false, desc: 'write a percentage as a fraction in its simplest form' },
    { id: '4c',    label: '4(c)',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Converting Measurements',             skillIds: ['fractions_of_amounts', 'converting_measurements'], kind: 'exam', visual: false, desc: 'percentage of a volume, answer converted from litres to millilitres' },
    { id: '5',     label: '5',       marks: 2,  topic: 'shape',    skill: 'Enlargements',                                               skillIds: ['enlargements'], kind: 'mastery', visual: true, desc: 'enlarge a shape by a positive integer scale factor about a given centre' },
    { id: '6a',    label: '6(a)',    marks: 2,  topic: 'shape',    skill: 'Angles on lines and Circles',                                skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'exterior angle of a triangle from the two given interior angles' },
    { id: '6b',    label: '6(b)',    marks: 1,  topic: 'shape',    skill: 'Angles on lines and Circles',                                skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'complete a general statement about the two smallest angles of a triangle' },
    { id: '7',     label: '7',       marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                          skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'hourly pay from a weekly total, hours per day and days worked' },
    { id: '8a',    label: '8(a)',    marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                          skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'reverse a subtract-then-divide chain to find the starting number' },
    { id: '8b',    label: '8(b)',    marks: 2,  topic: 'ratio',    skill: 'Reverse Percentage',                                         skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'original amount given a percentage over 100% of it' },
    { id: '9',     label: '9',       marks: 2,  topic: 'ratio',    skill: 'Proportion',                                                 skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'convert a price using an exchange rate and compare with a budget' },
    { id: '10ai',  label: '10(ai)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                          skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'output of a two-step function machine' },
    { id: '10aii', label: '10(aii)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                          skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'input of a two-step function machine from its output' },
    { id: '10b',   label: '10(b)',   marks: 3,  topic: 'algebra',  skill: 'Function Machines + Factors and Multiples',                  skillIds: ['function_machines', 'factors_and_multiples'], kind: 'exam', visual: false, desc: 'another pair of integer parameters for a two-step machine with a fixed input and output' },
    { id: '11a',   label: '11(a)',   marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                         skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'read a relative frequency off a marked scale' },
    { id: '11bi',  label: '11(bi)',  marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                         skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'use a calculation to explain why a set of relative frequencies cannot be right' },
    { id: '11bii', label: '11(bii)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                         skillIds: ['relative_frequency'], kind: 'mastery', visual: true, desc: 'mark the corrected relative frequency on a scale' },
    { id: '11c',   label: '11(c)',   marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                         skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'state the assumption behind predicting the next spin from relative frequency' },
    { id: '12a',   label: '12(a)',   marks: 2,  topic: 'ratio',    skill: 'Ratio',                                                      skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'select the correct part-to-part and part-to-whole statements for a divided shape' },
    { id: '12b',   label: '12(b)',   marks: 2,  topic: 'ratio',    skill: 'Ratio + Simplifying Expressions',                            skillIds: ['ratio', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'algebraic area of the other part of a shape from a given part and the share ratio' },
    { id: '13',    label: '13',      marks: 3,  topic: 'probdata', skill: 'Venn Diagrams',                                              skillIds: ['venn_diagrams'], kind: 'exam', visual: false, desc: 'complete a two-set Venn diagram from a total, one set size and an equality between two regions' },
    { id: '14ai',  label: '14(ai)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                  skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'missing term of a square number sequence' },
    { id: '14aii', label: '14(aii)', marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                  skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'name a familiar number sequence' },
    { id: '14bi',  label: '14(bi)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                  skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'explain why a set of dot patterns does not show triangular numbers' },
    { id: '14bii', label: '14(bii)', marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                  skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'draw the dot pattern for the fifth triangular number' },
    { id: '15a',   label: '15(a)',   marks: 2,  topic: 'number',   skill: 'Converting Fractions to Decimals',                           skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'compare a fraction of an amount with a decimal of the same amount, with a reason' },
    { id: '15b',   label: '15(b)',   marks: 2,  topic: 'shape',    skill: 'Area of a Circle + Rounding',                                skillIds: ['area_of_a_circle', 'rounding'], kind: 'exam', visual: false, desc: 'show how two correct areas of the same circle can differ, through the value used for pi' },
    { id: '16a',   label: '16(a)',   marks: 1,  topic: 'probdata', skill: 'Probability Spaces',                                         skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'complete a sample space table for the product of two dice' },
    { id: '16b',   label: '16(b)',   marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                         skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'probability of a multiple from a completed sample space' },
    { id: '17',    label: '17',      marks: 2,  topic: 'shape',    skill: 'Translations',                                               skillIds: ['translations'], kind: 'mastery', visual: true, desc: 'translate a shape by a given column vector' },
    { id: '18a',   label: '18(a)',   marks: 3,  topic: 'number',   skill: 'Percentage Change',                                          skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage reduction between two prices' },
    { id: '18b',   label: '18(b)',   marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                              skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'explain why a graph with a truncated vertical axis is misleading' },
    { id: '19',    label: '19',      marks: 4,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'exam', visual: false, desc: 'height of a similar cuboid from the two base areas' },
    { id: '20a',   label: '20(a)',   marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                           skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'remaining fraction after two fractions are taken from a whole' },
    { id: '20b',   label: '20(b)',   marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                               skillIds: ['ratio', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'total items from one ingredient\'s mass, a two-part mixing ratio and a fixed portion size' },
    { id: '21',    label: '21',      marks: 4,  topic: 'shape',    skill: 'Surface Area of a Sphere + Circumfrence of a Circle',        skillIds: ['surface_area_of_a_sphere', 'circumfrence_of_a_circle'], kind: 'exam', visual: false, desc: 'surface area of a sphere whose great-circle circumference is given' },
    { id: '22',    label: '22',      marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations',                                     skillIds: ['simultaneous_equations'], kind: 'exam', visual: false, desc: 'two item values from two totals, by simultaneous equations' },
    { id: '23',    label: '23',      marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                       skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'draw an accurate plan view of a triangular prism' },
    { id: '24a',   label: '24(a)',   marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                     skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'error interval for a length given to the nearest centimetre' },
    { id: '24b',   label: '24(b)',   marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                     skillIds: ['upper_and_lower_bounds'], kind: 'exam', visual: false, desc: 'compare two error intervals to show an object may not fit' },
    { id: '25',    label: '25',      marks: 2,  topic: 'shape',    skill: 'Constructions',                                              skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'construct the perpendicular from a point to a line' },
    { id: '26a',   label: '26(a)',   marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a linear equation with the unknown on both sides' },
    { id: '26b',   label: '26(b)',   marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                  skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'solve a quadratic equation by factorising' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
