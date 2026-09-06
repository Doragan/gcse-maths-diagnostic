import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-calculator — November 2023.
 *
 * GENERATED from data/exam-audit/NOV23-F-P1.json by
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
export const AQA_8300_1F_NOV23: PaperConfig = {
  id: 'aqa-8300-1f-nov23',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — November 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                             skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'number',   skill: 'Decimals',                                                            skillIds: ['decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                          skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'requires measuring a printed length with a ruler; on-screen scale is not guaranteed' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                          skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'requires measuring a printed angle with a protractor' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Decimals + Inequalities',                                             skillIds: ['decimals', 'inequalities'], kind: 'mastery', visual: false, desc: 'open answer: any value greater than the bound is accepted, so exact-match fails' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'number',   skill: 'Decimals',                                                            skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'static number-line diagram supported' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                   skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '5',   label: '5',     marks: 1,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                                      skillIds: ['symmetry'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                             skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                         skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '6c',  label: '6(c)',  marks: 2,  topic: 'algebra',  skill: 'Expanding Brackets',                                                  skillIds: ['expanding_brackets'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'number',   skill: 'Time Calculations',                                                   skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'clock-time answer; needs time-format equivalence' },
    { id: '7b',  label: '7(b)',  marks: 3,  topic: 'number',   skill: 'Time Calculations',                                                   skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: '' },
    { id: '8a',  label: '8(a)',  marks: 2,  topic: 'probdata', skill: 'Simple Charts + Simple Arithmetic',                                   skillIds: ['simple_charts', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'choice credited only with both totals shown' },
    { id: '8b',  label: '8(b)',  marks: 3,  topic: 'probdata', skill: 'Simple Charts',                                                       skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing bars to scale with width/gap conventions marked' },
    { id: '9',   label: '9',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                   skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'twelve-blank puzzle graded against simultaneous constraints; several arrangements are valid' },
    { id: '10',  label: '10',    marks: 3,  topic: 'shape',    skill: 'Lengths and Perimeters',                                              skillIds: ['lengths_and_perimeters'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '11a', label: '11(a)', marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                          skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'ratio',    skill: 'Proportion + Simple Arithmetic',                                      skillIds: ['proportion', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'tick credited only with supporting working' },
    { id: '12',  label: '12',    marks: 3,  topic: 'probdata', skill: 'Mode + Median + Range',                                               skillIds: ['mode', 'median', 'range'], kind: 'exam', visual: false, desc: 'open answer set constrained by three simultaneous statistics' },
    { id: '13',  label: '13',    marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                             skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: false, desc: 'open answer: more than one shape name is valid' },
    { id: '14',  label: '14',    marks: 3,  topic: 'algebra',  skill: 'Plotting Straight Line Graphs',                                       skillIds: ['plotting_straight_line_graphs'], kind: 'mastery', visual: true, desc: 'requires point-plotting and line-drawing input' },
    { id: '15',  label: '15',    marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Irregular and Improper Fractions', skillIds: ['adding_and_subtracting_fractions', 'irregular_and_improper_fractions'], kind: 'exam', visual: false, desc: 'mixed-number answer; needs equivalence checking that distinguishes mixed from improper form' },
    { id: '16a', label: '16(a)', marks: 1,  topic: 'shape',    skill: 'Reflections + Coordinates',                                           skillIds: ['reflections', 'coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'shape',    skill: 'Reflections + Understanding Straight Line Graphs',                    skillIds: ['reflections', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '17',  label: '17',    marks: 4,  topic: 'number',   skill: 'Fractions of Amounts + Simplifying Fractions',                        skillIds: ['fractions_of_amounts', 'simplifying_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker with a simplest-form requirement' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Indices + Simple Arithmetic',                                         skillIds: ['indices', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '19',  label: '19',    marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                                       skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '20',  label: '20',    marks: 2,  topic: 'algebra',  skill: 'Plotting Straight Line Graphs + Proportion',                          skillIds: ['plotting_straight_line_graphs', 'proportion'], kind: 'mastery', visual: true, desc: 'requires drawing two related straight-line graphs' },
    { id: '21',  label: '21',    marks: 1,  topic: 'shape',    skill: 'Exact Trigonometric Values',                                          skillIds: ['exact_trig_values'], kind: 'mastery', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 3,  topic: 'number',   skill: 'Simplifying Indices + Indices',                                       skillIds: ['simplifying_indices', 'indices'], kind: 'mastery', visual: false, desc: 'decimal answer required; index form not credited' },
    { id: '23',  label: '23',    marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                  skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'open-ended answer: any line with the same gradient; needs form-equivalence plus a not-identical check' },
    { id: '24a', label: '24(a)', marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                      skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'worded description of a relationship; not markable' },
    { id: '24b', label: '24(b)', marks: 3,  topic: 'probdata', skill: 'Scatter Graphs + Proportion',                                         skillIds: ['scatter_graphs', 'proportion'], kind: 'exam', visual: false, desc: 'answer accepted over a range because the read-off is open' },
    { id: '25',  label: '25',    marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage + Fractions Decimals and Percentages',             skillIds: ['reverse_percentage', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '26',  label: '26',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                 skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'two range-tolerance roots read off a graph; needs a two-blank response' },
    { id: '27',  label: '27',    marks: 5,  topic: 'shape',    skill: 'Area of a Circle + Sector Calculations',                              skillIds: ['area_of_a_circle', 'sector_calculations'], kind: 'mastery', visual: false, desc: 'choice credited only with two comparable areas shown' },
    { id: '28',  label: '28',    marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                              skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '29a', label: '29(a)', marks: 1,  topic: 'number',   skill: 'Standard Form',                                                       skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: '' },
    { id: '29b', label: '29(b)', marks: 2,  topic: 'number',   skill: 'Standard Form + Simplifying Ratio',                                   skillIds: ['standard_form', 'simplifying_ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence check' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
