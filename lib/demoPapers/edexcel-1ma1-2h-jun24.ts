import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/2H — Higher Tier Paper 2 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN24-H-P2.json by
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
export const EDEXCEL_1MA1_2H_JUN24: PaperConfig = {
  id: 'edexcel-1ma1-2h-jun24',
  title: 'Edexcel GCSE Mathematics 1MA1/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                               skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'shorter side of a right-angled triangle from the hypotenuse and the other side, to 3 significant figures' },
    { id: '2a',  label: '2(a)',  marks: 2,  topic: 'number',   skill: 'Prime Factor Decomposition',                                                         skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'write a two-digit number as a product of primes' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'number',   skill: 'Lowest Common Multiple',                                                             skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: 'lowest common multiple of two numbers given as products of prime factors' },
    { id: '3',   label: '3',     marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                                       skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'difference between two values of a formula, at two values of its variable' },
    { id: '4',   label: '4',     marks: 4,  topic: 'ratio',    skill: 'Ratio + Calculating Simple Probability',                                             skillIds: ['ratio', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'count of one colour, from a third colour\'s count and probability and a ratio between the other two' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                                 skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve from a table of values' },
    { id: '5c',  label: '5(c)',  marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read both solutions of a quadratic equal to a constant off the drawn curve' },
    { id: '6',   label: '6',     marks: 4,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                       skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'test a claim that two transfers out of one share of a three-part ratio leave all three equal' },
    { id: '7',   label: '7',     marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Solving Linear Equations + Alternate and Corresponding Angles', skillIds: ['angles_in_polygons', 'solving_linear_equations', 'alternate_and_corresponding_angles'], kind: 'exam', visual: false, desc: 'show a quadrilateral with four algebraic angles has one pair of parallel sides' },
    { id: '8',   label: '8',     marks: 3,  topic: 'shape',    skill: 'Area and Volume Scale Factors + Areas of Triangles',                                 skillIds: ['area_and_volume_scale_factors', 'areas_of_triangles'], kind: 'exam', visual: false, desc: 'a real length of a right-angled triangle, from its area on a scale drawing and one real side' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                             skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'least possible value of a number rounded to 2 significant figures' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                             skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'reject a claim that the upper bound is the largest value with a terminating decimal' },
    { id: '10',  label: '10',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (Missing Sides) + Solving Linear Equations',                            skillIds: ['trigonometry_missing_sides', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'value of a letter from equating a sine in one right-angled triangle with a tangent in another, both sides algebraic' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'probdata', skill: 'Cumulative Frequency',                                                               skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'complete a cumulative frequency table from a grouped frequency table' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                               skillIds: ['cumulative_frequency'], kind: 'mastery', visual: true, desc: 'draw a cumulative frequency graph, plotting at interval end points' },
    { id: '11c', label: '11(c)', marks: 2,  topic: 'probdata', skill: 'Interquartile Range + Cumulative Frequency',                                         skillIds: ['interquartile_range', 'cumulative_frequency'], kind: 'mastery', visual: false, desc: 'interquartile range read off a cumulative frequency graph' },
    { id: '11d', label: '11(d)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                               skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'how many lie above a stated value, from a cumulative frequency graph' },
    { id: '12a', label: '12(a)', marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion + Proportion with Powers',                                        skillIds: ['inverse_proportion', 'proportion_with_powers'], kind: 'mastery', visual: false, desc: 'equation for a variable inversely proportional to a square, from one given pair' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'ratio',    skill: 'Proportion with Powers',                                                             skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'the positive variable value giving a stated output, to 3 significant figures' },
    { id: '13',  label: '13',    marks: 3,  topic: 'algebra',  skill: 'Inequalities + Understanding Straight Line Graphs',                                  skillIds: ['inequalities', 'understanding_straight_line_graphs'], kind: 'exam', visual: true, desc: 'shade and label the region satisfying four inequalities, two of them sloping lines' },
    { id: '14a', label: '14(a)', marks: 3,  topic: 'algebra',  skill: 'Gradient of a Curve',                                                                skillIds: ['gradient_of_a_curve'], kind: 'mastery', visual: true, desc: 'acceleration at a stated time, by drawing a tangent to a velocity-time curve — the gradient is negative' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                                   skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'estimate the area under a velocity-time curve using a stated number of equal strips' },
    { id: '15',  label: '15',    marks: 2,  topic: 'number',   skill: 'Expanding and Rationalising Surds',                                                  skillIds: ['surds_expanding_and_rationalising'], kind: 'mastery', visual: false, desc: 'rationalise a two-term denominator where the surd is of an unspecified letter' },
    { id: '16',  label: '16',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Inequalities',                                                             skillIds: ['quadratic_inequalities'], kind: 'mastery', visual: false, desc: 'solve a factorised quadratic inequality, solution a single interval' },
    { id: '17',  label: '17',    marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors',                                                      skillIds: ['area_and_volume_scale_factors'], kind: 'mastery', visual: false, desc: 'three-part ratio of heights of similar cylinders, from two masses and two surface areas' },
    { id: '18',  label: '18',    marks: 5,  topic: 'probdata', skill: 'Conditional Probability + Systematic Listing',                                       skillIds: ['conditional_probability', 'systematic_listing'], kind: 'exam', visual: false, desc: 'probability that a without-replacement draw of three leaves one colour outnumbering another, summed over every qualifying selection' },
    { id: '19a', label: '19(a)', marks: 4,  topic: 'shape',    skill: 'Vectors',                                                                            skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'a vector across a quadrilateral in terms of two base vectors and a letter multiple, via a midpoint and an internal division ratio' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'shape',    skill: 'Vectors',                                                                            skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'decide whether that expression is parallel to one base vector, with a reason' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Completing the Square',                                                              skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'turning point of a quadratic with a non-unit leading coefficient' },
    { id: '21',  label: '21',    marks: 2,  topic: 'algebra',  skill: 'Graph Transformations',                                                              skillIds: ['graph_transformations'], kind: 'mastery', visual: true, desc: 'draw a combined reflection in the y-axis and vertical translation of an unnamed curve' },
    { id: '22',  label: '22',    marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Tangent and Radius + Congruence and Similarity',                     skillIds: ['circle_theorem_tangent', 'congruence_and_similarity'], kind: 'exam', visual: false, desc: 'prove the two tangents from an external point are equal, with a reason at every stage' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
