import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/06 — Higher Tier Paper 6 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/OCR-JUN25-H-P6.json by
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
export const OCR_J560_06_JUN25: PaperConfig = {
  id: 'ocr-j560-06-jun25',
  title: 'OCR GCSE Mathematics J560/06',
  subtitle: 'Higher Tier Paper 6 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'probdata', skill: 'Probability Spaces',                                                   skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'complete a sample space table for the product of two dice' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                   skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'probability of a multiple from a completed sample space' },
    { id: '2',   label: '2',     marks: 2,  topic: 'shape',    skill: 'Translations',                                                         skillIds: ['translations'], kind: 'mastery', visual: true, desc: 'translate a shape by a given column vector' },
    { id: '3a',  label: '3(a)',  marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                    skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage reduction between two prices' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                                        skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'explain why a graph with a truncated vertical axis is misleading' },
    { id: '4',   label: '4',     marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                                 skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'draw an accurate plan view of a triangular prism' },
    { id: '5',   label: '5',     marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                      skillIds: ['fractional_and_negative_indices'], kind: 'exam', visual: false, desc: 'identify the smallest of three negative powers and explain the error in a base-size argument' },
    { id: '6a',  label: '6(a)',  marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                               skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'error interval for a length given to the nearest centimetre' },
    { id: '6b',  label: '6(b)',  marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                               skillIds: ['upper_and_lower_bounds'], kind: 'exam', visual: false, desc: 'compare two error intervals to show an object may not fit' },
    { id: '7',   label: '7',     marks: 6,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'total membership from a percentage for one group, a ratio between the other two and a difference' },
    { id: '8',   label: '8',     marks: 2,  topic: 'shape',    skill: 'Constructions',                                                        skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'construct the perpendicular from a point to a line' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations',                                             skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a linear equation with the unknown on both sides' },
    { id: '9b',  label: '9(b)',  marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                            skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'solve a quadratic equation by factorising' },
    { id: '10',  label: '10',    marks: 5,  topic: 'shape',    skill: 'Surface Area of a Sphere + Areas of Squares and Rectangles',           skillIds: ['surface_area_of_a_sphere', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'side of a cube whose surface area equals that of a given sphere' },
    { id: '11',  label: '11',    marks: 4,  topic: 'ratio',    skill: 'Growth and Decay + Reverse Percentage',                                skillIds: ['growth_and_decay', 'reverse_percentage'], kind: 'exam', visual: false, desc: 'initial investment from its value after two years of compound interest' },
    { id: '12',  label: '12',    marks: 4,  topic: 'algebra',  skill: 'Substitution + Solving Linear Equations',                              skillIds: ['substitution', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'distance from two supplied kinematics formulae, the acceleration found first' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                            skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'missing length in a pair of nested similar triangles' },
    { id: '14',  label: '14',    marks: 3,  topic: 'number',   skill: 'Prime Factor Decomposition + Indices',                                 skillIds: ['prime_factor_decomposition', 'indices'], kind: 'exam', visual: false, desc: 'write a large number as a product of prime powers, given one factorisation' },
    { id: '15a', label: '15(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                        skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'complete a two-stage tree diagram without replacement' },
    { id: '15b', label: '15(b)', marks: 3,  topic: 'probdata', skill: 'Tree Diagrams',                                                        skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of two matching selections without replacement' },
    { id: '16a', label: '16(a)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                  skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'sketch a negative quadratic on unlabelled axes' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                 skillIds: ['trig_graphs'], kind: 'mastery', visual: false, desc: 'give a possible equation for a sketched trigonometric graph' },
    { id: '17a', label: '17(a)', marks: 1,  topic: 'probdata', skill: 'Box Plots',                                                            skillIds: ['box_plots'], kind: 'mastery', visual: false, desc: 'percentage above the upper quartile of a box plot' },
    { id: '17b', label: '17(b)', marks: 2,  topic: 'probdata', skill: 'Box Plots',                                                            skillIds: ['box_plots'], kind: 'exam', visual: false, desc: 'compare two distributions on average, citing values from their box plots' },
    { id: '18',  label: '18',    marks: 4,  topic: 'probdata', skill: 'Counting Without Listing',                                             skillIds: ['counting_without_listing'], kind: 'exam', visual: false, desc: 'count even four-digit codes with no repeated digit' },
    { id: '19',  label: '19',    marks: 3,  topic: 'shape',    skill: 'Fractional and Negative Enlargements',                                 skillIds: ['fractional_enlargements'], kind: 'mastery', visual: true, desc: 'enlarge a shape by a negative scale factor about a given centre' },
    { id: '20a', label: '20(a)', marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                     skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'show a volume from the area under a constant section of a rate-of-flow graph' },
    { id: '20b', label: '20(b)', marks: 4,  topic: 'algebra',  skill: 'Kinematic Graphs + Compound Units',                                    skillIds: ['kinematic_graphs', 'compound_units'], kind: 'exam', visual: false, desc: 'average rate of flow over the whole period from the total area under the graph' },
    { id: '21',  label: '21',    marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations (Linear and Quadratic) + Equation of a Circle', skillIds: ['simultaneous_equations_quadratic', 'equation_of_a_circle'], kind: 'exam', visual: false, desc: 'exact intersections of a line through the origin with a circle centred on the origin' },
    { id: '22',  label: '22',    marks: 6,  topic: 'shape',    skill: '3D Trigonometry',                                                      skillIds: ['trigonometry_3d'], kind: 'exam', visual: false, desc: 'sloping edge of a square-based pyramid from the base length and the angle to the base' },
    { id: '23',  label: '23',    marks: 3,  topic: 'algebra',  skill: 'Exponential Graphs',                                                   skillIds: ['exponential_graphs'], kind: 'exam', visual: false, desc: 'initial value and multiplier of an exponential model from two points on its curve' },
    { id: '24a', label: '24(a)', marks: 3,  topic: 'algebra',  skill: 'Iteration',                                                            skillIds: ['iteration'], kind: 'mastery', visual: false, desc: 'show a quartic equation has a root between two integers, by sign change' },
    { id: '24b', label: '24(b)', marks: 4,  topic: 'algebra',  skill: 'Iteration',                                                            skillIds: ['iteration'], kind: 'exam', visual: false, desc: 'locate that root to one decimal place by trial and improvement' },
    { id: '25',  label: '25',    marks: 6,  topic: 'ratio',    skill: 'Ratio + Fractions Decimals and Percentages',                           skillIds: ['ratio', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'compare two conditional proportions built from a ratio and two percentages of the whole' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
