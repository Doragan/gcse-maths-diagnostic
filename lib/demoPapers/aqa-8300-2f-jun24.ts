import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/JUN24-F-P2.json by
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
export const AQA_8300_2F_JUN24: PaperConfig = {
  id: 'aqa-8300-2f-jun24',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Converting Decimals to Fractions',                    skillIds: ['converting_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                    skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                  skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                             skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                             skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '2c',  label: '2(c)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                 skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '2d',  label: '2(d)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                 skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                          skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'identify-from-diagram; static diagram supported' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                          skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: '' },
    { id: '3c',  label: '3(c)',  marks: 1,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                      skillIds: ['symmetry'], kind: 'mastery', visual: false, desc: '' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                   skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                   skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                       skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'static pictogram supported' },
    { id: '5b',  label: '5(b)',  marks: 3,  topic: 'probdata', skill: 'Simple Charts',                                       skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: '' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'ratio',    skill: 'Ratio',                                               skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'identify-from-grid; static diagram supported' },
    { id: '6b',  label: '6(b)',  marks: 2,  topic: 'shape',    skill: 'Areas of Squares and Rectangles',                     skillIds: ['areas_of_squares_and_rectangles'], kind: 'mastery', visual: true, desc: 'requires drawing a shape on a grid' },
    { id: '7',   label: '7',     marks: 3,  topic: 'shape',    skill: 'Measuring Lines and Angles',                          skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'requires physical ruler measurement of printed diagram' },
    { id: '8a',  label: '8(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                   skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '8b',  label: '8(b)',  marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                                skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '9',   label: '9',     marks: 3,  topic: 'ratio',    skill: 'Proportion',                                          skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '10a', label: '10(a)', marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Proportion',                      skillIds: ['simple_arithmetic', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'number',   skill: 'Fractions of Amounts',                                skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'tick yes/no + supporting value; decision not markable' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'algebra',  skill: 'Plotting Straight Line Graphs',                       skillIds: ['plotting_straight_line_graphs'], kind: 'mastery', visual: true, desc: 'requires plotting line on grid' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                        skillIds: ['substitution'], kind: 'mastery', visual: false, desc: '' },
    { id: '12',  label: '12',    marks: 3,  topic: 'probdata', skill: 'Systematic Listing + Indices',                        skillIds: ['systematic_listing', 'indices'], kind: 'exam', visual: false, desc: 'full answer exact-matchable but constraint-graded partial credit not capturable' },
    { id: '13',  label: '13',    marks: 3,  topic: 'probdata', skill: 'Mean',                                                skillIds: ['mean'], kind: 'mastery', visual: false, desc: '' },
    { id: '14a', label: '14(a)', marks: 1,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                    skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                   skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '15',  label: '15',    marks: 2,  topic: 'algebra',  skill: 'Finding the nth Term',                                skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'nth-term expression needs equivalence checker' },
    { id: '16',  label: '16',    marks: 2,  topic: 'shape',    skill: 'Parts of a Circle',                                   skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'free-recall vocab word; no node and free-text matching' },
    { id: '17',  label: '17',    marks: 1,  topic: 'shape',    skill: 'Vectors',                                             skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '18a', label: '18(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                       skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-branch probability entry' },
    { id: '18b', label: '18(b)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                     skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '19',  label: '19',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                        skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '20',  label: '20',    marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage + Standard Form',                  skillIds: ['reverse_percentage', 'standard_form'], kind: 'exam', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion',                                  skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'genuine tick-box interpretation' },
    { id: '21b', label: '21(b)', marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion',                                  skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'multi-cell table entry' },
    { id: '22a', label: '22(a)', marks: 3,  topic: 'probdata', skill: 'Calculating Simple Probability + Probability Spaces', skillIds: ['calculating_simple_probability', 'probability_spaces'], kind: 'mastery', visual: false, desc: 'requires constructing a spinner/list to satisfy constraints' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'probdata', skill: 'Probability Spaces',                                  skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'worded reason not markable' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'shape',    skill: 'Coordinates',                                         skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                 skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: '' },
    { id: '24',  label: '24',    marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability + Relative Frequency', skillIds: ['calculating_simple_probability', 'relative_frequency'], kind: 'mastery', visual: false, desc: 'value markable but reason free-text; relative-frequency reasoning gap' },
    { id: '25',  label: '25',    marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs',                                    skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'requires reading change/interval off a distance-time graph' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
