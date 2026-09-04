import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P1.json by
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
export const AQA_8300_1F_JUN25: PaperConfig = {
  id: 'aqa-8300-1f-jun25',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '1d',  label: '1(d)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'select from a displayed set of numbers; static diagram supported' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: '' },
    { id: '2c',  label: '2(c)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: '' },
    { id: '2d',  label: '2(d)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 3,  topic: 'probdata', skill: 'Simple Charts + Proportion',                                                                              skillIds: ['simple_charts', 'proportion'], kind: 'exam', visual: false, desc: 'pictogram rendered as static diagram' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Proportion',                                                         skillIds: ['understanding_straight_line_graphs', 'proportion'], kind: 'mastery', visual: false, desc: 'range-tolerance read-off; exact-match insufficient' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Proportion',                                                         skillIds: ['understanding_straight_line_graphs', 'proportion'], kind: 'mastery', visual: false, desc: 'range-tolerance read-off feeding a total' },
    { id: '5',   label: '5',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '7a',  label: '7(a)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Fractions of Amounts',                                                                skillIds: ['simple_arithmetic', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '8',   label: '8',     marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                                                              skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'ratio',    skill: 'Ratio + Simplifying Ratio',                                                                               skillIds: ['ratio', 'simplifying_ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs simplest-form equivalence check' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                                          skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '10',  label: '10',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Indices',                                                                                  skillIds: ['substitution', 'indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 1,  topic: 'shape',    skill: 'Constructions',                                                                                           skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'requires compass construction on a diagram' },
    { id: '12a', label: '12(a)', marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Simple Arithmetic',                                                                skillIds: ['fractions_of_amounts', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                                                   skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Angles on lines and Circles + Solving Linear Equations',                                                  skillIds: ['angles_on_lines_and_circles', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '14a', label: '14(a)', marks: 3,  topic: 'number',   skill: 'Estimating + Significant Figures',                                                                        skillIds: ['estimating', 'significant_figures'], kind: 'mastery', visual: false, desc: '' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'number',   skill: 'Estimating',                                                                                              skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                                                       skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'show-that reasoning not markable' },
    { id: '15b', label: '15(b)', marks: 2,  topic: 'shape',    skill: 'Volume of a Sphere',                                                                                      skillIds: ['volume_of_a_sphere'], kind: 'mastery', visual: false, desc: 'answer in terms of pi; needs symbolic-equivalence checker' },
    { id: '16a', label: '16(a)', marks: 3,  topic: 'algebra',  skill: 'Substitution + Rearranging Formulae (Changing the Subject)',                                              skillIds: ['substitution', 'rearranging_formulae'], kind: 'mastery', visual: false, desc: '' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion',                                                                                      skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '17',  label: '17',    marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                                                       skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '18',  label: '18',    marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '19',  label: '19',    marks: 3,  topic: 'probdata', skill: 'Mean + Range',                                                                                            skillIds: ['mean', 'range'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '21',  label: '21',    marks: 2,  topic: 'shape',    skill: 'Properties of 3D Solids',                                                                                 skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: true, desc: 'requires net drawing on a grid' },
    { id: '22',  label: '22',    marks: 4,  topic: 'probdata', skill: 'Frequency Trees + Ratio',                                                                                 skillIds: ['frequency_trees', 'ratio'], kind: 'exam', visual: false, desc: 'frequency-tree multi-cell entry' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Dividing Fractions',                                                   skillIds: ['adding_and_subtracting_fractions', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '24',  label: '24',    marks: 1,  topic: 'number',   skill: 'Reciprocals',                                                                                             skillIds: ['reciprocals'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '25',  label: '25',    marks: 1,  topic: 'shape',    skill: 'Exact Trigonometric Values',                                                                              skillIds: ['exact_trig_values'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '26',  label: '26',    marks: 4,  topic: 'algebra',  skill: 'Expanding Double Brackets + Solving Quadratic Equations (Factorising) + Areas of Squares and Rectangles', skillIds: ['expanding_double_brackets', 'solving_quadratic_equations_factorising', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'static diagram supported; single positive root' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
