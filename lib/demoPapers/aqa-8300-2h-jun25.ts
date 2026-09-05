import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2H — Higher Tier Paper 2 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-H-P2.json by
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
export const AQA_8300_2H_JUN25: PaperConfig = {
  id: 'aqa-8300-2h-jun25',
  title: 'AQA GCSE Mathematics 8300/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Highest Common Factor',                                                                             skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Lowest Common Multiple',                                                                            skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'number',   skill: 'Prime Factor Decomposition',                                                                        skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'product-of-primes answer needs order-insensitive equivalence' },
    { id: '2',   label: '2',     marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                                skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'two blanks of different kinds (an equation and a gradient) in one part' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'probdata', skill: 'Time Series',                                                                                       skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires point-plotting and line-drawing input' },
    { id: '3b',  label: '3(b)',  marks: 3,  topic: 'probdata', skill: 'Time Series + Proportion',                                                                          skillIds: ['time_series', 'proportion'], kind: 'exam', visual: false, desc: 'answer accepted over a range because the trend estimate is open' },
    { id: '4',   label: '4',     marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages + Proportion',                                                   skillIds: ['fractions_decimals_and_percentages', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                                            skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval; needs inequality-form entry' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                                            skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that on a strict inequality; needs the bound and the total evidenced' },
    { id: '6',   label: '6',     marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                                                       skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '7',   label: '7',     marks: 3,  topic: 'probdata', skill: 'Probability Spaces',                                                                                skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: '' },
    { id: '8a',  label: '8(a)',  marks: 3,  topic: 'shape',    skill: 'Circumfrence of a Circle + Sector Calculations',                                                    skillIds: ['circumfrence_of_a_circle', 'sector_calculations'], kind: 'mastery', visual: false, desc: 'range-tolerance decimal answer; static diagram supported' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'shape',    skill: 'Sector Calculations',                                                                               skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '9',   label: '9',     marks: 1,  topic: 'number',   skill: 'Percentage Change',                                                                                 skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '10',  label: '10',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                                                                      skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '11',  label: '11',    marks: 3,  topic: 'shape',    skill: 'Angles in Polygons',                                                                                skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'probdata', skill: 'Sampling',                                                                                          skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'worded criticism of a sample; not markable' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage + Fractions Decimals and Percentages',                                           skillIds: ['reverse_percentage', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                                                                    skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'choice credited only with two comparable times shown' },
    { id: '14',  label: '14',    marks: 3,  topic: 'algebra',  skill: 'Equations and Identities',                                                                          skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'open answer: any triple satisfying the identity is valid, so exact-match fails' },
    { id: '15',  label: '15',    marks: 2,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Quadratic Equation)',                                                  skillIds: ['solving_quadratic_equations_quadratic_equation'], kind: 'mastery', visual: false, desc: 'two-root answer needs a multi-blank response' },
    { id: '16',  label: '16',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                                  skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '17',  label: '17',    marks: 3,  topic: 'probdata', skill: 'Combined Events + Ratio',                                                                           skillIds: ['combined_events', 'ratio'], kind: 'exam', visual: false, desc: '' },
    { id: '18',  label: '18',    marks: 4,  topic: 'shape',    skill: 'Cosine Rule + Angles on lines and Circles',                                                         skillIds: ['cosine_rule', 'angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '19',  label: '19',    marks: 4,  topic: 'probdata', skill: 'Histograms',                                                                                        skillIds: ['histograms'], kind: 'mastery', visual: false, desc: 'static histogram supported' },
    { id: '20',  label: '20',    marks: 1,  topic: 'algebra',  skill: 'Quadratic Inequalities',                                                                            skillIds: ['quadratic_inequalities'], kind: 'mastery', visual: false, desc: 'spot-the-error free text on a number-line representation' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Equation of a Circle',                                                                              skillIds: ['equation_of_a_circle'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '21b', label: '21(b)', marks: 4,  topic: 'algebra',  skill: 'Perpendicular Gradients + Circle Theorem: Tangent and Radius + Understanding Straight Line Graphs', skillIds: ['perpendicular_gradients', 'circle_theorem_tangent', 'understanding_straight_line_graphs'], kind: 'exam', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Fractional and Negative Enlargements + Enlargements',                                               skillIds: ['fractional_enlargements', 'enlargements'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines a name, a scale factor and a centre in free text' },
    { id: '23',  label: '23',    marks: 5,  topic: 'shape',    skill: 'Vector Proof + Vectors + Ratio',                                                                    skillIds: ['vector_proof', 'vectors', 'ratio'], kind: 'exam', visual: false, desc: 'banded marks depend on which intermediate vectors are shown, not on the value alone' },
    { id: '24',  label: '24',    marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers',                                                                            skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'range-tolerance percentage answer' },
    { id: '25',  label: '25',    marks: 4,  topic: 'algebra',  skill: 'Composite Functions + Inverse Functions + Algebraic Proof',                                         skillIds: ['composite_functions', 'inverse_functions', 'algebraic_proof'], kind: 'exam', visual: false, desc: 'proof: the conclusion is worded, and each stage is credited separately' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
