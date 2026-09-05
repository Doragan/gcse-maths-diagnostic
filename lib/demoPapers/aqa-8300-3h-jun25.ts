import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3H — Higher Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-H-P3.json by
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
 *
 * KNOWN GAPS in this paper, carried here so they survive regeneration:
 *   • item 2 is untagged by design — filed under Probability and Data, contributing 1 mark(s) with no skill evidence. Check coding_notes says why.
 */
export const AQA_8300_3H_JUN25: PaperConfig = {
  id: 'aqa-8300-3h-jun25',
  title: 'AQA GCSE Mathematics 8300/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'probdata', skill: 'Untagged',                                                                             skillIds: [], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 3,  topic: 'shape',    skill: 'Parts of a Circle',                                                                    skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'label-to-diagram matching; needs a pairing input' },
    { id: '4',   label: '4',     marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters', skillIds: ['forming_expressions_and_formulae', 'solving_linear_equations', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '5',   label: '5',     marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                           skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '6a',  label: '6(a)',  marks: 4,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'length measured off a grid, so the answer is accepted over a range' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'shape',    skill: 'Bearings',                                                                             skillIds: ['bearings'], kind: 'mastery', visual: false, desc: '' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'number',   skill: 'Simplifying Fractions + Converting Measurements',                                      skillIds: ['simplifying_fractions', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; mixed numbers not credited' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'ratio',    skill: 'Simplifying Ratio + Converting Measurements',                                          skillIds: ['simplifying_ratio', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '7c',  label: '7(c)',  marks: 2,  topic: 'ratio',    skill: 'Ratio + Dividing Fractions',                                                           skillIds: ['ratio', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '8',   label: '8',     marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term',                                                                 skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '9',   label: '9',     marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '10',  label: '10',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                       skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'open-ended answer: any line with the same gradient; needs form-equivalence plus a not-identical check' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '12',  label: '12',    marks: 4,  topic: 'probdata', skill: 'Grouped Frequency Tables + Mean + Percentage Change',                                  skillIds: ['grouped_frequency_tables', 'mean', 'percentage_change'], kind: 'exam', visual: false, desc: '' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'probdata', skill: 'Cumulative Frequency',                                                                 skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'multi-blank table, credited as a single all-or-nothing mark' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                                 skillIds: ['cumulative_frequency'], kind: 'mastery', visual: true, desc: 'requires point-plotting and curve drawing at upper class bounds' },
    { id: '13c', label: '13(c)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                                 skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'read-off from the student\'s own graph; accepted over a range' },
    { id: '14a', label: '14(a)', marks: 4,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                               skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'tick credited only with three bounds and their total evidenced' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs + Compound Units',                                                    skillIds: ['kinematic_graphs', 'compound_units'], kind: 'exam', visual: true, desc: 'requires drawing and labelling both axes as well as the line' },
    { id: '15',  label: '15',    marks: 3,  topic: 'probdata', skill: 'Counting Without Listing',                                                             skillIds: ['counting_without_listing'], kind: 'mastery', visual: false, desc: '' },
    { id: '16',  label: '16',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Algebraic Proof',                                                       skillIds: ['substitution', 'algebraic_proof'], kind: 'mastery', visual: false, desc: 'explain-why answer: three cases each credited separately' },
    { id: '17',  label: '17',    marks: 2,  topic: 'shape',    skill: 'Sine Rule',                                                                            skillIds: ['sine_rule'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '18',  label: '18',    marks: 3,  topic: 'algebra',  skill: 'Nth Term of Quadratic Sequences',                                                      skillIds: ['nth_term_quadratic_sequences'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '19',  label: '19',    marks: 4,  topic: 'algebra',  skill: 'Inequalities + Plotting Straight Line Graphs',                                         skillIds: ['inequalities', 'plotting_straight_line_graphs'], kind: 'exam', visual: true, desc: 'requires drawing three boundary lines and identifying a region' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                                               skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '20b', label: '20(b)', marks: 1,  topic: 'algebra',  skill: 'Factorising Quadratics + Factors and Multiples',                                       skillIds: ['factorising_quadratics', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'tick + worded reason drawing on the factorisation; not markable' },
    { id: '21',  label: '21',    marks: 4,  topic: 'shape',    skill: 'Volume of a Sphere + Volume of a prism',                                               skillIds: ['volume_of_a_sphere', 'volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'fraction answer from an algebraic derivation; needs equivalence checker' },
    { id: '22',  label: '22',    marks: 4,  topic: 'algebra',  skill: 'Quadratic Inequalities + Solving Quadratic Equations (Factorising)',                   skillIds: ['quadratic_inequalities', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'double-inequality answer needs an inequality-equivalence checker' },
    { id: '23',  label: '23',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                  skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors + Area of a Triangle (½ab sinC)',                        skillIds: ['area_and_volume_scale_factors', 'area_of_triangle_sine'], kind: 'exam', visual: false, desc: 'range-tolerance answer; static diagram supported' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
