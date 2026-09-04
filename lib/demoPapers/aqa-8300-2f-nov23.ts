import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator — November 2023.
 *
 * GENERATED from data/exam-audit/NOV23-F-P2.json by
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
export const AQA_8300_2F_NOV23: PaperConfig = {
  id: 'aqa-8300-2f-nov23',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — November 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Converting Measurements',                               skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                    skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                    skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                              skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                              skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '5',   label: '5',     marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                      skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'multi-blank table with a running total' },
    { id: '7',   label: '7',     marks: 3,  topic: 'number',   skill: 'Factors and Multiples + Simple Arithmetic',             skillIds: ['factors_and_multiples', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'grid puzzle graded against simultaneous row and column products' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Proportion',       skillIds: ['understanding_straight_line_graphs', 'proportion'], kind: 'mastery', visual: false, desc: 'range-tolerance read-off; exact-match insufficient' },
    { id: '8b',  label: '8(b)',  marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Proportion',       skillIds: ['understanding_straight_line_graphs', 'proportion'], kind: 'mastery', visual: false, desc: 'read-off beyond the graph range, so the answer is accepted over a range' },
    { id: '9a',  label: '9(a)',  marks: 2,  topic: 'number',   skill: 'Estimating + Rounding',                                 skillIds: ['estimating', 'rounding'], kind: 'mastery', visual: false, desc: '' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Estimating',                                            skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'worded reason; not markable' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'probdata', skill: 'Mean',                                                  skillIds: ['mean'], kind: 'mastery', visual: false, desc: '' },
    { id: '10b', label: '10(b)', marks: 1,  topic: 'probdata', skill: 'Mean + Median',                                         skillIds: ['mean', 'median'], kind: 'mastery', visual: false, desc: 'worded reason about the outlier; not markable' },
    { id: '11',  label: '11',    marks: 3,  topic: 'number',   skill: 'Converting Measurements + Proportion',                  skillIds: ['converting_measurements', 'proportion'], kind: 'exam', visual: false, desc: 'two-blank stones-and-pounds answer' },
    { id: '12a', label: '12(a)', marks: 2,  topic: 'ratio',    skill: 'Ratio',                                                 skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '12b', label: '12(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                 skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                      skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '13b', label: '13(b)', marks: 1,  topic: 'algebra',  skill: 'Substitution',                                          skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'disprove-by-substitution; both sides must be evidenced' },
    { id: '14',  label: '14',    marks: 5,  topic: 'number',   skill: 'Simple Arithmetic + Proportion',                        skillIds: ['simple_arithmetic', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '15',  label: '15',    marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '16',  label: '16',    marks: 1,  topic: 'ratio',    skill: 'Ratio + Indices',                                       skillIds: ['ratio', 'indices'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '17a', label: '17(a)', marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                             skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: true, desc: 'requires drawing a shape on a grid' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                             skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: true, desc: 'requires drawing a shape on a grid' },
    { id: '18a', label: '18(a)', marks: 4,  topic: 'number',   skill: 'Fractions of Amounts + Ratio',                          skillIds: ['fractions_of_amounts', 'ratio'], kind: 'mastery', visual: false, desc: 'two-way-table multi-cell entry' },
    { id: '18b', label: '18(b)', marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '18c', label: '18(c)', marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '19',  label: '19',    marks: 3,  topic: 'shape',    skill: 'Rotations + Enlargements',                              skillIds: ['rotations', 'enlargements'], kind: 'exam', visual: false, desc: 'describe-fully answer combines a name, a parameter and a centre in free text' },
    { id: '20',  label: '20',    marks: 3,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                  skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '21',  label: '21',    marks: 2,  topic: 'shape',    skill: 'Bearings',                                              skillIds: ['bearings'], kind: 'mastery', visual: false, desc: 'static diagram supported; three-figure format required' },
    { id: '22',  label: '22',    marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                               skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: '' },
    { id: '23',  label: '23',    marks: 5,  topic: 'ratio',    skill: 'Proportion + Percentage Change + Fractions of Amounts', skillIds: ['proportion', 'percentage_change', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'shop choice plus a total; credited only with comparable costs shown' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Area of a Trapezium + Compound Units',                  skillIds: ['area_of_a_trapezium', 'compound_units'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '25a', label: '25(a)', marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                                  skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '25b', label: '25(b)', marks: 1,  topic: 'probdata', skill: 'Pie Charts + Fractions Decimals and Percentages',       skillIds: ['pie_charts', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; not markable' },
    { id: '26',  label: '26',    marks: 3,  topic: 'shape',    skill: 'Volume of a prism',                                     skillIds: ['volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'static isometric diagram supported' },
    { id: '27',  label: '27',    marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                        skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '28',  label: '28',    marks: 3,  topic: 'algebra',  skill: 'Sequences + Simplifying Expressions',                   skillIds: ['sequences', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'algebraic show-that; the multiple must be made explicit' },
    { id: '29',  label: '29',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Coordinates',      skillIds: ['understanding_straight_line_graphs', 'coordinates'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
