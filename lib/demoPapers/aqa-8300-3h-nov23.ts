import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3H — Higher Tier Paper 3 Calculator — November 2023.
 *
 * GENERATED from data/exam-audit/NOV23-H-P3.json by
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
export const AQA_8300_3H_NOV23: PaperConfig = {
  id: 'aqa-8300-3h-nov23',
  title: 'AQA GCSE Mathematics 8300/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — November 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'algebra',  skill: 'Finding the nth Term',                                                          skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '2',   label: '2',     marks: 1,  topic: 'shape',    skill: 'Fractional and Negative Enlargements + Enlargements',                           skillIds: ['fractional_enlargements', 'enlargements'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; static diagram supported' },
    { id: '3',   label: '3',     marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                        skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval; needs inequality-form entry' },
    { id: '4',   label: '4',     marks: 1,  topic: 'algebra',  skill: 'Sketching Functions + Coordinates',                                             skillIds: ['sketching_functions', 'coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '5',   label: '5',     marks: 4,  topic: 'number',   skill: 'Percentage Change',                                                             skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'answer combines a percentage with an increase-or-decrease label' },
    { id: '6',   label: '6',     marks: 4,  topic: 'number',   skill: 'Fractions of Amounts + Compound Units',                                         skillIds: ['fractions_of_amounts', 'compound_units'], kind: 'exam', visual: false, desc: '' },
    { id: '7',   label: '7',     marks: 3,  topic: 'number',   skill: 'Indices + Factors and Multiples',                                               skillIds: ['indices', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'three-blank calculation graded against several simultaneous conditions' },
    { id: '8',   label: '8',     marks: 1,  topic: 'number',   skill: 'Decimals + Recurring Decimals to Fractions',                                    skillIds: ['decimals', 'recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '9',   label: '9',     marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing angles)',                                                 skillIds: ['trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                 skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-diagram multi-cell entry' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                               skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '11',  label: '11',    marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                        skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two-value answer needs a multi-blank response' },
    { id: '12',  label: '12',    marks: 3,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Solving Linear Equations',                 skillIds: ['alternate_and_corresponding_angles', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'probdata', skill: 'Grouped Frequency Tables',                                                      skillIds: ['grouped_frequency_tables'], kind: 'mastery', visual: false, desc: '' },
    { id: '13b', label: '13(b)', marks: 1,  topic: 'probdata', skill: 'Grouped Frequency Tables + Calculating Simple Probability',                     skillIds: ['grouped_frequency_tables', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '13c', label: '13(c)', marks: 3,  topic: 'probdata', skill: 'Histograms',                                                                    skillIds: ['histograms'], kind: 'mastery', visual: true, desc: 'requires drawing a histogram with frequency-density heights' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'shape',    skill: 'Volume of a Pyramid and Cone',                                                  skillIds: ['volume_of_a_pyramid_and_cone'], kind: 'mastery', visual: false, desc: 'show-that to a given value; the subtraction must be evidenced' },
    { id: '14b', label: '14(b)', marks: 2,  topic: 'ratio',    skill: 'Compound Units + Volume of a Pyramid and Cone',                                 skillIds: ['compound_units', 'volume_of_a_pyramid_and_cone'], kind: 'exam', visual: false, desc: '' },
    { id: '15',  label: '15',    marks: 4,  topic: 'shape',    skill: 'Vectors',                                                                       skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'two-blank answer; static diagram supported' },
    { id: '16',  label: '16',    marks: 3,  topic: 'shape',    skill: 'Circle Theorem: Tangent and Radius + Pythagoras\' Theorem',                     skillIds: ['circle_theorem_tangent', 'pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '17',  label: '17',    marks: 1,  topic: 'algebra',  skill: 'Quadratic Functions + Completing the Square',                                   skillIds: ['quadratic_functions', 'completing_the_square'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '18',  label: '18',    marks: 3,  topic: 'algebra',  skill: 'Algebraic Fractions + Expanding Double Brackets',                               skillIds: ['algebraic_fractions', 'expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '19',  label: '19',    marks: 4,  topic: 'shape',    skill: 'Congruence and Similarity + Circle Theorem: Angle at Centre + Algebraic Proof', skillIds: ['congruence_and_similarity', 'circle_theorem_angle_at_centre', 'algebraic_proof'], kind: 'exam', visual: false, desc: 'geometric proof: each reason is worded and must name a theorem' },
    { id: '20',  label: '20',    marks: 4,  topic: 'algebra',  skill: 'Expanding Brackets + Solving Quadratic Equations (Quadratic Equation)',         skillIds: ['expanding_brackets', 'solving_quadratic_equations_quadratic_equation'], kind: 'mastery', visual: false, desc: 'two-root answer needs a multi-blank response' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                              skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '21b', label: '21(b)', marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                              skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'the mark requires a tangent to be drawn, so the value alone is not markable' },
    { id: '22',  label: '22',    marks: 2,  topic: 'algebra',  skill: 'Algebraic Fractions + Simplifying Indices',                                     skillIds: ['algebraic_fractions', 'simplifying_indices'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '23',  label: '23',    marks: 4,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Properties of 3D Solids + Inequalities',      skillIds: ['areas_of_squares_and_rectangles', 'properties_of_3d_solids', 'inequalities'], kind: 'exam', visual: false, desc: '' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Cosine Rule + Area of a Triangle (½ab sinC)',                                   skillIds: ['cosine_rule', 'area_of_triangle_sine'], kind: 'exam', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '25',  label: '25',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Simplifying Ratio + Rearranging Formulae (Changing the Subject)',       skillIds: ['ratio', 'simplifying_ratio', 'rearranging_formulae'], kind: 'exam', visual: false, desc: 'three-term ratio answer needs simplest-form equivalence check' },
    { id: '26',  label: '26',    marks: 4,  topic: 'probdata', skill: 'Conditional Probability + Systematic Listing + Combined Events',                skillIds: ['conditional_probability', 'systematic_listing', 'combined_events'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '27a', label: '27(a)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations + Vectors',                                               skillIds: ['graph_transformations', 'vectors'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '27b', label: '27(b)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                         skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
