import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3H — Higher Tier Paper 3 Calculator — November 2024.
 *
 * GENERATED from data/exam-audit/NOV24-H-P3.json by
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
export const AQA_8300_3H_NOV24: PaperConfig = {
  id: 'aqa-8300-3h-nov24',
  title: 'AQA GCSE Mathematics 8300/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'number',   skill: 'Reciprocals',                                                                               skillIds: ['reciprocals'], kind: 'mastery', visual: false, desc: 'single numeric (decimal) answer' },
    { id: '2a',  label: '2(a)',  marks: 2,  topic: 'probdata', skill: 'Time Series',                                                                               skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'plotting and joining points needs a graph-plotting input' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'probdata', skill: 'Time Series',                                                                               skillIds: ['time_series'], kind: 'mastery', visual: false, desc: 'single numeric estimate (range-tolerant)' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                                                      skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'drawing a plan view on a grid needs a drawing input' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                                                      skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'drawing a front elevation on a grid needs a drawing input' },
    { id: '4',   label: '4',     marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                                    skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that with a bounds comparison and conclusion is not single-answer markable' },
    { id: '5',   label: '5',     marks: 2,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                                                          skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'formula answer needs an algebraic-equivalence checker' },
    { id: '6',   label: '6',     marks: 5,  topic: 'number',   skill: 'Percentage Change + Proportion',                                                            skillIds: ['percentage_change', 'proportion'], kind: 'exam', visual: false, desc: 'deliverable is a justified cheapest-shop decision backed by three computed totals' },
    { id: '7a',  label: '7(a)',  marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                                     skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs a ratio-equivalence checker' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'number',   skill: 'Rounding',                                                                                  skillIds: ['rounding'], kind: 'mastery', visual: false, desc: 'worded reason about rounding up in context is not markable by answer-matching' },
    { id: '8',   label: '8',     marks: 4,  topic: 'shape',    skill: 'Coordinates + Understanding Straight Line Graphs',                                          skillIds: ['coordinates', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'three coordinate-pair answers need a coordinate-equivalence checker' },
    { id: '9',   label: '9',     marks: 2,  topic: 'number',   skill: 'Lowest Common Multiple + Factors and Multiples',                                            skillIds: ['lowest_common_multiple', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'open-ended \'give two values that are 1 more than a multiple of 12\'; a family of correct answers cannot be exact-matched' },
    { id: '10',  label: '10',    marks: 3,  topic: 'ratio',    skill: 'Inverse Proportion',                                                                        skillIds: ['inverse_proportion'], kind: 'mastery', visual: true, desc: 'drawing a reciprocal curve needs a graph-plotting input' },
    { id: '11',  label: '11',    marks: 2,  topic: 'algebra',  skill: 'Factorising',                                                                               skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorised expression needs an algebraic-equivalence checker' },
    { id: '12',  label: '12',    marks: 4,  topic: 'ratio',    skill: 'Growth and Decay',                                                                          skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'single numeric population' },
    { id: '13',  label: '13',    marks: 2,  topic: 'probdata', skill: 'Systematic Listing + Combined Events',                                                      skillIds: ['systematic_listing', 'combined_events'], kind: 'exam', visual: false, desc: 'single fraction answer' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                             skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'entering probabilities into specific tree branches needs a tree-structure input' },
    { id: '14b', label: '14(b)', marks: 4,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                                           skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'single numeric count' },
    { id: '15',  label: '15',    marks: 3,  topic: 'algebra',  skill: 'Graph Transformations + Quadratic Functions',                                               skillIds: ['graph_transformations', 'quadratic_functions'], kind: 'mastery', visual: false, desc: 'matching equations to transformation statements needs a match/connect UI' },
    { id: '16',  label: '16',    marks: 3,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                                               skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'rearranged subject needs an algebraic-equivalence checker' },
    { id: '17',  label: '17',    marks: 4,  topic: 'ratio',    skill: 'Proportion with Powers',                                                                    skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'single numeric time' },
    { id: '18',  label: '18',    marks: 4,  topic: 'probdata', skill: 'Histograms',                                                                                skillIds: ['histograms'], kind: 'mastery', visual: true, desc: 'drawing a histogram with frequency-density bars needs a charting input' },
    { id: '19',  label: '19',    marks: 3,  topic: 'shape',    skill: 'Sine Rule',                                                                                 skillIds: ['sine_rule'], kind: 'mastery', visual: false, desc: 'single numeric side length' },
    { id: '20',  label: '20',    marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                                                    skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'factorised expression needs an algebraic-equivalence checker' },
    { id: '21',  label: '21',    marks: 3,  topic: 'probdata', skill: 'Conditional Probability + Combined Events',                                                 skillIds: ['conditional_probability', 'combined_events'], kind: 'mastery', visual: false, desc: 'single fraction answer' },
    { id: '22',  label: '22',    marks: 4,  topic: 'shape',    skill: 'Volume of a Sphere + Compound Units',                                                       skillIds: ['volume_of_a_sphere', 'compound_units'], kind: 'mastery', visual: false, desc: 'single numeric radius' },
    { id: '23',  label: '23',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                          skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'two numeric values (a and b)' },
    { id: '24',  label: '24',    marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations (Linear and Quadratic) + Solving Quadratic Equations (Factorising)', skillIds: ['simultaneous_equations_quadratic', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'two intersection-point coordinates need a coordinate-equivalence checker' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
