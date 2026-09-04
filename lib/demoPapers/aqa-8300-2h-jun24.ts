import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2H — Higher Tier Paper 2 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/JUN24-H-P2.json by
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
export const AQA_8300_2H_JUN24: PaperConfig = {
  id: 'aqa-8300-2h-jun24',
  title: 'AQA GCSE Mathematics 8300/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'shape',    skill: 'Parts of a Circle',                                      skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'word-from-list selection against a labelled diagram image; fully supported' },
    { id: '2',   label: '2',     marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage + Standard Form',                     skillIds: ['reverse_percentage', 'standard_form'], kind: 'mastery', visual: false, desc: 'single numeric answer (standard form)' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'ratio',    skill: 'Direct Proportion',                                      skillIds: ['direct_proportion'], kind: 'mastery', visual: false, desc: 'tick-box interpretation; the choice is the whole answer' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion + Direct Proportion',                 skillIds: ['inverse_proportion', 'direct_proportion'], kind: 'mastery', visual: false, desc: 'multi-cell table completion not supported as an input type' },
    { id: '4a',  label: '4(a)',  marks: 3,  topic: 'probdata', skill: 'Calculating Simple Probability',                         skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: '2 of 3 marks are for constructing a valid spinner/list; not capturable by a single answer box' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'probdata', skill: 'Probability Spaces',                                     skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'free-text justification (probabilities do not sum to 1) not markable' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                     skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'coordinate-pair entry needs a coordinate-equivalence checker' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Sketching Functions',              skillIds: ['quadratic_functions', 'sketching_functions'], kind: 'mastery', visual: false, desc: 'two numeric box answers' },
    { id: '6',   label: '6',     marks: 1,  topic: 'number',   skill: 'Standard Form + Fractional and Negative Indices',        skillIds: ['standard_form', 'fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'single numeric answer (standard form)' },
    { id: '7',   label: '7',     marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability + Relative Frequency',    skillIds: ['calculating_simple_probability', 'relative_frequency'], kind: 'mastery', visual: false, desc: 'half the credit is a worded justification about number of trials' },
    { id: '8',   label: '8',     marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs + Compound Units',                      skillIds: ['kinematic_graphs', 'compound_units'], kind: 'exam', visual: false, desc: 'graph is an image; answer is a single numeric speed' },
    { id: '9',   label: '9',     marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                          skillIds: ['venn_diagrams'], kind: 'mastery', visual: true, desc: 'shading a Venn region needs a click-region input' },
    { id: '10',  label: '10',    marks: 3,  topic: 'number',   skill: 'Percentage Change + Growth and Decay',                   skillIds: ['percentage_change', 'growth_and_decay'], kind: 'mastery', visual: false, desc: 'deliverable is a computed value plus a justified yes/no decision; decision statement not markable' },
    { id: '11',  label: '11',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Compound Units',                                 skillIds: ['ratio', 'compound_units'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '12',  label: '12',    marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                              skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'circle-the-reason; choice is the whole answer' },
    { id: '13',  label: '13',    marks: 3,  topic: 'probdata', skill: 'Mean + Grouped Frequency Tables',                        skillIds: ['mean', 'grouped_frequency_tables'], kind: 'mastery', visual: false, desc: 'single numeric estimated mean' },
    { id: '14a', label: '14(a)', marks: 3,  topic: 'algebra',  skill: 'Substitution + Quadratic Functions',                     skillIds: ['substitution', 'quadratic_functions'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                     skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'tick-one-box; the choice is the whole answer' },
    { id: '15',  label: '15',    marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                         skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'deliverable is a computed value plus a justified more/less decision' },
    { id: '16',  label: '16',    marks: 3,  topic: 'probdata', skill: 'Box Plots + Interquartile Range',                        skillIds: ['box_plots', 'interquartile_range'], kind: 'mastery', visual: true, desc: 'drawing a five-point box plot needs a plotting input' },
    { id: '17',  label: '17',    marks: 4,  topic: 'algebra',  skill: 'Solving Linear Equations + Angles on lines and Circles', skillIds: ['solving_linear_equations', 'angles_on_lines_and_circles'], kind: 'exam', visual: false, desc: 'ratio answer needs a ratio-equivalence checker (72:108 = 2:3)' },
    { id: '18',  label: '18',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                           skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'single numeric side length' },
    { id: '19a', label: '19(a)', marks: 3,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Expressions',           skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'show-that requires marking intermediate algebra, not a single answer' },
    { id: '19b', label: '19(b)', marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                 skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'factorised expression needs an algebraic-equivalence checker' },
    { id: '20',  label: '20',    marks: 4,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Quadratic Equation)',       skillIds: ['solving_quadratic_equations_quadratic_equation'], kind: 'mastery', visual: false, desc: 'answer is a (d, e, f) triple with a k-scaling family; needs surd-form / proportional-equivalence checking' },
    { id: '21',  label: '21',    marks: 4,  topic: 'number',   skill: 'Fractions of Amounts + Proportion',                      skillIds: ['fractions_of_amounts', 'proportion'], kind: 'mastery', visual: false, desc: 'single numeric total' },
    { id: '22',  label: '22',    marks: 3,  topic: 'algebra',  skill: 'Iteration',                                              skillIds: ['iteration'], kind: 'mastery', visual: false, desc: 'single numeric answer to 4 sf' },
    { id: '23',  label: '23',    marks: 4,  topic: 'shape',    skill: 'Vectors + Vector Proof',                                 skillIds: ['vectors', 'vector_proof'], kind: 'mastery', visual: false, desc: 'collinearity proof requires marking a chain of vector expressions plus a parallel/common-point statement' },
    { id: '24a', label: '24(a)', marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion',                                     skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '24b', label: '24(b)', marks: 2,  topic: 'ratio',    skill: 'Growth and Decay',                                       skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'compute value then justify a tick decision; the decision is the assessed deliverable' },
    { id: '25',  label: '25',    marks: 5,  topic: 'shape',    skill: 'Congruence and Similarity + Volume of a prism',          skillIds: ['congruence_and_similarity', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'single numeric total edge length' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
