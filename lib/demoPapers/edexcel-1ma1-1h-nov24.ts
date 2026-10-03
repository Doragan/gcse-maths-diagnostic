import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1H — Higher Tier Paper 1 Non-calculator — November 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-NOV24-H-P1.json by
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
export const EDEXCEL_1MA1_1H_NOV24: PaperConfig = {
  id: 'edexcel-1ma1-1h-nov24',
  title: 'Edexcel GCSE Mathematics 1MA1/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 3,  topic: 'number',   skill: 'Decimals',                                                                                  skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'non-calculator division of one decimal by another' },
    { id: '2a',  label: '2(a)',  marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Mutually Exclusive Events',                                             skillIds: ['expected_outcomes', 'mutually_exclusive_events'], kind: 'exam', visual: false, desc: 'expected frequency where the missing probability must first be recovered from the total of 1 and split equally' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'probdata', skill: 'Expected Outcomes',                                                                         skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: 'state the direction an expected frequency moves when an assumption is relaxed' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                                                          skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract two mixed numbers, answer as a mixed number' },
    { id: '3b',  label: '3(b)',  marks: 3,  topic: 'number',   skill: 'Dividing Fractions + Irregular and Improper Fractions',                                     skillIds: ['dividing_fractions', 'irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'show a division of two mixed numbers reaches a stated result, with every stage evidenced' },
    { id: '4',   label: '4',     marks: 3,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Forming Expressions and Formulae',                     skillIds: ['alternate_and_corresponding_angles', 'forming_expressions_and_formulae'], kind: 'exam', visual: false, desc: 'expression for an angle in a parallelogram in terms of a letter, with a parallel-line reason required' },
    { id: '5a',  label: '5(a)',  marks: 3,  topic: 'number',   skill: 'Estimating + Compound Units',                                                               skillIds: ['estimating', 'compound_units'], kind: 'exam', visual: false, desc: 'estimate a journey time in minutes from a distance and a speed, by rounding both first' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'number',   skill: 'Estimating',                                                                                skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'decide whether an estimate is an under- or overestimate, with a reason' },
    { id: '6',   label: '6',     marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Solving Linear Equations',                                             skillIds: ['angles_in_polygons', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'pentagon angle from an angle sum where four of the five angles are multiples of one unknown' },
    { id: '7',   label: '7',     marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                                          skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'interpret what the gradient of a volume-time graph represents' },
    { id: '8',   label: '8',     marks: 3,  topic: 'ratio',    skill: 'Compound Units',                                                                            skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'length of a prism\'s base from a pressure and a force, with the formula given' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'probdata', skill: 'Box Plots + Cumulative Frequency',                                                          skillIds: ['box_plots', 'cumulative_frequency'], kind: 'mastery', visual: true, desc: 'draw a box plot whose quartiles must first be read off a cumulative frequency graph' },
    { id: '9b',  label: '9(b)',  marks: 3,  topic: 'probdata', skill: 'Cumulative Frequency + Fractions of Amounts',                                               skillIds: ['cumulative_frequency', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'test a claim about the percentage of a population above a threshold, from a cumulative frequency graph' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                           skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'product of a square root and a cube root written as fractional powers' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                           skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'evaluate a unit fraction raised to a negative fractional power' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'algebra',  skill: 'Factorising Quadratics',                                                                    skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'explain that a stated rule has the sum and the product of the factor pair the wrong way round' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'algebra',  skill: 'Difference of Two Squares + Factorising',                                                   skillIds: ['difference_of_two_squares', 'factorising'], kind: 'exam', visual: false, desc: 'factorise fully where a common factor must be taken out before a difference of two squares appears' },
    { id: '11c', label: '11(c)', marks: 2,  topic: 'algebra',  skill: 'Factorising',                                                                               skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise a four-term expression by grouping' },
    { id: '12',  label: '12',    marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors',                                                             skillIds: ['area_and_volume_scale_factors'], kind: 'mastery', visual: false, desc: 'surface-area ratio of two spheres from two volumes and a halved radius' },
    { id: '13',  label: '13',    marks: 5,  topic: 'algebra',  skill: 'Expanding Double Brackets + Volume of a Prism + Solving Quadratic Equations (Factorising)', skillIds: ['expanding_double_brackets', 'volume_of_a_prism', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'value of a letter from a stated difference between two algebraic cuboid volumes' },
    { id: '14',  label: '14',    marks: 3,  topic: 'shape',    skill: 'Sine Rule + Exact Trigonometric Values',                                                    skillIds: ['sine_rule', 'exact_trig_values'], kind: 'exam', visual: false, desc: 'sine rule on a triangle whose given side is a surd and whose angles have exact sine values' },
    { id: '15',  label: '15',    marks: 4,  topic: 'shape',    skill: 'Vector Proof',                                                                              skillIds: ['vector_proof'], kind: 'mastery', visual: false, desc: 'ratio of two vectors in a parallelogram, from two internal division ratios' },
    { id: '16a', label: '16(a)', marks: 2,  topic: 'number',   skill: 'Expanding and Rationalising Surds',                                                         skillIds: ['surds_expanding_and_rationalising'], kind: 'mastery', visual: false, desc: 'rationalise a single-surd denominator and simplify' },
    { id: '16b', label: '16(b)', marks: 4,  topic: 'number',   skill: 'Expanding and Rationalising Surds + Simplifying Surds',                                     skillIds: ['surds_expanding_and_rationalising', 'surds_simplifying'], kind: 'mastery', visual: false, desc: 'rationalise a two-term surd denominator, having first simplified a surd in the numerator' },
    { id: '17',  label: '17',    marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Alternate Segment + Circle Theorem: Tangent and Radius',                    skillIds: ['circle_theorem_alternate_segment', 'circle_theorem_tangent'], kind: 'mastery', visual: false, desc: 'angle between a tangent and a chord, from a tangent-chord angle and a stated ratio between two radii-triangle angles, theorems to be named' },
    { id: '18a', label: '18(a)', marks: 2,  topic: 'algebra',  skill: 'Inverse Functions',                                                                         skillIds: ['inverse_functions'], kind: 'mastery', visual: false, desc: 'inverse of a two-step linear function' },
    { id: '18b', label: '18(b)', marks: 2,  topic: 'algebra',  skill: 'Composite Functions',                                                                       skillIds: ['composite_functions'], kind: 'mastery', visual: false, desc: 'value of a composite of a linear and a squared function' },
    { id: '19',  label: '19',    marks: 4,  topic: 'probdata', skill: 'Combined Events',                                                                           skillIds: ['combined_events'], kind: 'mastery', visual: false, desc: 'probability of winning a two-round knockout, summed over which of two opponents is met in the final' },
    { id: '20',  label: '20',    marks: 4,  topic: 'algebra',  skill: 'Equation of a Circle + Perpendicular Gradients',                                            skillIds: ['equation_of_a_circle', 'perpendicular_gradients'], kind: 'exam', visual: false, desc: 'equation of the tangent to a circle at a point whose first coordinate must be found from the circle\'s equation' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
