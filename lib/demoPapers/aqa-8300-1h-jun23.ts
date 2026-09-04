import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1H — Higher Tier Paper 1 Non-calculator — June 2023.
 *
 * GENERATED from data/exam-audit/JUN23-H-P1.json by
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
export const AQA_8300_1H_JUN23: PaperConfig = {
  id: 'aqa-8300-1h-jun23',
  title: 'AQA GCSE Mathematics 8300/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Decimals',                                                                   skillIds: ['decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Dividing Fractions',                                                         skillIds: ['dividing_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'number',   skill: 'Decimals',                                                                   skillIds: ['decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                                               skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'inequality answer needs equivalence checker' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Indices + Irregular and Improper Fractions',                                 skillIds: ['indices', 'irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'mixed-number answer; improper form not credited' },
    { id: '4',   label: '4',     marks: 3,  topic: 'shape',    skill: 'Angles on lines and Circles + Solving Linear Equations',                     skillIds: ['angles_on_lines_and_circles', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '5',   label: '5',     marks: 3,  topic: 'number',   skill: 'Prime Factor Decomposition + Factors and Multiples',                         skillIds: ['prime_factor_decomposition', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'three-blank calculation graded against several simultaneous conditions' },
    { id: '6',   label: '6',     marks: 4,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                               skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '7',   label: '7',     marks: 3,  topic: 'number',   skill: 'Indices + Prime Factor Decomposition',                                       skillIds: ['indices', 'prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'working is required; the value alone scores zero' },
    { id: '8',   label: '8',     marks: 2,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Expressions',                               skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '9',   label: '9',     marks: 2,  topic: 'algebra',  skill: 'Sketching Functions',                                                        skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '10',  label: '10',    marks: 5,  topic: 'probdata', skill: 'Mean + Forming Expressions and Formulae + Solving Linear Equations',         skillIds: ['mean', 'forming_expressions_and_formulae', 'solving_linear_equations'], kind: 'exam', visual: false, desc: '' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                             skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; static Venn supported' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                             skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '11c', label: '11(c)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                             skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'number',   skill: 'Standard Form',                                                              skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'two-blank inequality on the mantissa range' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'number',   skill: 'Standard Form',                                                              skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'ordinary-number answer; standard form not credited' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'algebra',  skill: 'Function Machines + Forming Expressions and Formulae',                       skillIds: ['function_machines', 'forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'algebraic show-that; the target is given so only the working scores' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'algebra',  skill: 'Functions Notation',                                                         skillIds: ['functions_notation'], kind: 'mastery', visual: false, desc: 'disprove-the-claim reasoning; the choice alone earns nothing' },
    { id: '14',  label: '14',    marks: 2,  topic: 'probdata', skill: 'Interquartile Range + Median',                                               skillIds: ['interquartile_range', 'median'], kind: 'mastery', visual: false, desc: 'four-blank completion constrained by three simultaneous relations' },
    { id: '15',  label: '15',    marks: 4,  topic: 'shape',    skill: 'Congruence and Similarity + Areas of Triangles',                             skillIds: ['congruence_and_similarity', 'areas_of_triangles'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row; static diagram supported' },
    { id: '16',  label: '16',    marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                     skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two-value answer needs a multi-blank response' },
    { id: '17',  label: '17',    marks: 3,  topic: 'shape',    skill: 'Surface Area of a Sphere + Surface Area of a Cylinder + Simplifying Ratio',  skillIds: ['surface_area_of_a_sphere', 'surface_area_of_a_cylinder', 'simplifying_ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs simplest-form equivalence check' },
    { id: '18',  label: '18',    marks: 1,  topic: 'number',   skill: 'Fractional and Negative Indices',                                            skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '19',  label: '19',    marks: 2,  topic: 'probdata', skill: 'Counting Without Listing',                                                   skillIds: ['counting_without_listing'], kind: 'mastery', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations + Ratio',                                             skillIds: ['simultaneous_equations', 'ratio'], kind: 'exam', visual: false, desc: 'static balance diagram supported' },
    { id: '21',  label: '21',    marks: 2,  topic: 'algebra',  skill: 'Completing the Square',                                                      skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '22',  label: '22',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Simplifying Surds',                                           skillIds: ['substitution', 'surds_simplifying'], kind: 'mastery', visual: false, desc: 'expression-to-value matching; needs a pairing input' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions',                                            skillIds: ['recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker with a simplest-form requirement' },
    { id: '24',  label: '24',    marks: 5,  topic: 'shape',    skill: 'Coordinates + Perpendicular Gradients + Understanding Straight Line Graphs', skillIds: ['coordinates', 'perpendicular_gradients', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '25',  label: '25',    marks: 4,  topic: 'shape',    skill: 'Exact Trigonometric Values + Expanding and Rationalising Surds',             skillIds: ['exact_trig_values', 'surds_expanding_and_rationalising'], kind: 'exam', visual: false, desc: 'show-that requires the exact values and the final angle to be evidenced' },
    { id: '26',  label: '26',    marks: 4,  topic: 'shape',    skill: 'Circumfrence of a Circle + Pythagoras\' Theorem + Simplifying Surds',        skillIds: ['circumfrence_of_a_circle', 'pythagoras_theorem', 'surds_simplifying'], kind: 'exam', visual: false, desc: 'surd answer needs symbolic-equivalence checker; working required' },
    { id: '27',  label: '27',    marks: 3,  topic: 'ratio',    skill: 'Compound Units + Algebraic Fractions',                                       skillIds: ['compound_units', 'algebraic_fractions'], kind: 'exam', visual: false, desc: 'algebraic show-that; the target expression is given so only the working scores' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
