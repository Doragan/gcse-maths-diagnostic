import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P3.json by
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
export const AQA_8300_3F_JUN25: PaperConfig = {
  id: 'aqa-8300-3f-jun25',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                            skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'requires drawing the next pattern on a grid' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                                            skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'static pattern diagram supported' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                                   skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'requires structured listing with set-equality marking' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability + Systematic Listing',                                  skillIds: ['calculating_simple_probability', 'systematic_listing'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '4c',  label: '4(c)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'operation entered into a machine box; needs operation-equivalence check' },
    { id: '5a',  label: '5(a)',  marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'multi-blank table; each cell must be in the column\'s form' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Converting Measurements',                                                              skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'genuine unit-select per row' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show-that requires the intermediate product to be evidenced' },
    { id: '7b',  label: '7(b)',  marks: 3,  topic: 'number',   skill: 'Percentage Change + Simple Arithmetic',                                                skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'choice credited only with comparable totals shown' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Solving Linear Equations',                                         skillIds: ['simple_arithmetic', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'number',   skill: 'Indices',                                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'two answers in one part; needs a two-blank response' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Indices + Decimals',                                                                   skillIds: ['indices', 'decimals'], kind: 'mastery', visual: false, desc: 'tick credited only with comparable values or a worded reason' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'probdata', skill: 'Mode + Simple Arithmetic',                                                             skillIds: ['mode', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'units are part of the answer and the coin set must be evidenced' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'probdata', skill: 'Median',                                                                               skillIds: ['median'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 3,  topic: 'number',   skill: 'Percentage Change + Simple Arithmetic',                                                skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '12',  label: '12',    marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Areas of Triangles + Ratio',                         skillIds: ['areas_of_squares_and_rectangles', 'areas_of_triangles', 'ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence check; static grid diagram supported' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                                   skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'two-cell table entry' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Probability Spaces',                                               skillIds: ['expected_outcomes', 'probability_spaces'], kind: 'exam', visual: false, desc: '' },
    { id: '15',  label: '15',    marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                                            skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '16',  label: '16',    marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters', skillIds: ['forming_expressions_and_formulae', 'solving_linear_equations', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'recurring decimal or equivalent fraction accepted' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '18',  label: '18',    marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                           skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '19a', label: '19(a)', marks: 4,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'length measured off a grid, so the answer is accepted over a range' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'shape',    skill: 'Bearings',                                                                             skillIds: ['bearings'], kind: 'mastery', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term',                                                                 skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '21',  label: '21',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                       skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '23',  label: '23',    marks: 4,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                                 skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'show-that over two Pythagoras steps; intermediate working must be evidenced' },
    { id: '24a', label: '24(a)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'open-ended answer: any line with the same gradient; needs form-equivalence plus a not-identical check' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
