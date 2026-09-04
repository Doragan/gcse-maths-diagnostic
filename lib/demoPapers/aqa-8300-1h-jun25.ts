import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1H — Higher Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-H-P1.json by
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
export const AQA_8300_1H_JUN25: PaperConfig = {
  id: 'aqa-8300-1h-jun25',
  title: 'AQA GCSE Mathematics 8300/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                                                  skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two-value answer needs a multi-blank response' },
    { id: '2',   label: '2',     marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                                                            skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '4',   label: '4',     marks: 2,  topic: 'probdata', skill: 'Interquartile Range',                                                                                     skillIds: ['interquartile_range'], kind: 'mastery', visual: false, desc: '' },
    { id: '5',   label: '5',     marks: 3,  topic: 'probdata', skill: 'Mean + Range',                                                                                            skillIds: ['mean', 'range'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '6a',  label: '6(a)',  marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '6b',  label: '6(b)',  marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '7',   label: '7',     marks: 4,  topic: 'probdata', skill: 'Frequency Trees + Ratio',                                                                                 skillIds: ['frequency_trees', 'ratio'], kind: 'exam', visual: false, desc: 'frequency-tree multi-cell entry' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Dividing Fractions',                                                   skillIds: ['adding_and_subtracting_fractions', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '9',   label: '9',     marks: 1,  topic: 'number',   skill: 'Reciprocals',                                                                                             skillIds: ['reciprocals'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '10',  label: '10',    marks: 4,  topic: 'algebra',  skill: 'Expanding Double Brackets + Solving Quadratic Equations (Factorising) + Areas of Squares and Rectangles', skillIds: ['expanding_double_brackets', 'solving_quadratic_equations_factorising', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'static diagram supported; single positive root' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'shape',    skill: 'Translations + Vectors',                                                                                  skillIds: ['translations', 'vectors'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'shape',    skill: 'Rotations',                                                                                               skillIds: ['rotations'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines angle, direction and centre in free text' },
    { id: '12',  label: '12',    marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                                                   skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 2,  topic: 'number',   skill: 'Indices',                                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'algebra',  skill: 'Sketching Functions + Indices',                                                                           skillIds: ['sketching_functions', 'indices'], kind: 'mastery', visual: false, desc: 'multi-blank table entry' },
    { id: '14b', label: '14(b)', marks: 2,  topic: 'algebra',  skill: 'Sketching Functions',                                                                                     skillIds: ['sketching_functions'], kind: 'mastery', visual: true, desc: 'requires point-plotting and smooth-curve drawing' },
    { id: '15',  label: '15',    marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre + Angles on lines and Circles',                                           skillIds: ['circle_theorem_angle_at_centre', 'angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '16',  label: '16',    marks: 3,  topic: 'probdata', skill: 'Venn Diagrams',                                                                                           skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'notation-to-diagram matching; needs a pairing input' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                                           skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-diagram multi-cell entry' },
    { id: '17b', label: '17(b)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                                                         skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '18',  label: '18',    marks: 3,  topic: 'shape',    skill: 'Exact Trigonometric Values + Expanding and Rationalising Surds',                                          skillIds: ['exact_trig_values', 'surds_expanding_and_rationalising'], kind: 'exam', visual: false, desc: 'show-that requires all three exact values to be evidenced' },
    { id: '19a', label: '19(a)', marks: 3,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                                         skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '19b', label: '19(b)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                                         skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'number',   skill: 'Simplifying Surds',                                                                                       skillIds: ['surds_simplifying'], kind: 'mastery', visual: false, desc: 'surd answer needs symbolic-equivalence checker' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                                                   skillIds: ['graph_transformations'], kind: 'mastery', visual: true, desc: 'requires drawing a transformed curve on a grid' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                                                   skillIds: ['graph_transformations'], kind: 'mastery', visual: true, desc: 'requires drawing a transformed curve on a grid' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Coordinates + Ratio',                                                                                     skillIds: ['coordinates', 'ratio'], kind: 'exam', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square',                                                                                   skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square + Quadratic Functions',                                                             skillIds: ['completing_the_square', 'quadratic_functions'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '24',  label: '24',    marks: 4,  topic: 'algebra',  skill: 'Algebraic Fractions + Algebraic Proof + Difference of Two Squares',                                       skillIds: ['algebraic_fractions', 'algebraic_proof', 'difference_of_two_squares'], kind: 'exam', visual: false, desc: 'proof: the final explanation is worded, not an answer value' },
    { id: '25',  label: '25',    marks: 5,  topic: 'probdata', skill: 'Conditional Probability + Solving Quadratic Equations (Factorising) + Algebraic Fractions',               skillIds: ['conditional_probability', 'solving_quadratic_equations_factorising', 'algebraic_fractions'], kind: 'exam', visual: false, desc: 'the correct value alone scores only a special case; the algebra must be evidenced' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
