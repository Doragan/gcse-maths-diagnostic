import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-calculator — June 2023.
 *
 * GENERATED from data/exam-audit/JUN23-F-P1.json by
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
export const AQA_8300_1F_JUN23: PaperConfig = {
  id: 'aqa-8300-1f-jun23',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'select from a displayed list of numbers' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'two values in one part; needs a two-blank order-insensitive response' },
    { id: '1d',  label: '1(d)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                           skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'requires measuring a printed length with a ruler; on-screen scale is not guaranteed' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                           skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'requires measuring a printed angle with a protractor' },
    { id: '2c',  label: '2(c)',  marks: 1,  topic: 'shape',    skill: 'Areas of Compound Shapes',                                             skillIds: ['areas_of_compound_shapes'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '2d',  label: '2(d)',  marks: 1,  topic: 'shape',    skill: 'Lengths and Perimeters',                                               skillIds: ['lengths_and_perimeters'], kind: 'mastery', visual: true, desc: 'requires completing a rectangle on a grid' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3c',  label: '3(c)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '3d',  label: '3(d)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '4',   label: '4',     marks: 2,  topic: 'number',   skill: 'Simplifying Fractions',                                                skillIds: ['simplifying_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker with a simplest-form requirement' },
    { id: '5',   label: '5',     marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Converting Measurements',                          skillIds: ['simple_arithmetic', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions',                                     skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'number',   skill: 'Converting Decimals to Fractions',                                     skillIds: ['converting_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '7',   label: '7',     marks: 4,  topic: 'probdata', skill: 'Simple Charts + Simple Arithmetic',                                    skillIds: ['simple_charts', 'simple_arithmetic'], kind: 'mastery', visual: true, desc: 'requires drawing part-symbols on a pictogram' },
    { id: '8a',  label: '8(a)',  marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                         skillIds: ['substitution'], kind: 'mastery', visual: false, desc: '' },
    { id: '8b',  label: '8(b)',  marks: 3,  topic: 'algebra',  skill: 'Substitution + Rearranging Formulae (Changing the Subject)',           skillIds: ['substitution', 'rearranging_formulae'], kind: 'mastery', visual: false, desc: '' },
    { id: '9',   label: '9',     marks: 3,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                     skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'fraction-to-decimal matching; needs a pairing input' },
    { id: '10',  label: '10',    marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                 skillIds: ['proportion', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '12',  label: '12',    marks: 1,  topic: 'number',   skill: 'Percentage Change',                                                    skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Simple Charts',                                                skillIds: ['ratio', 'simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing a bar to scale on a grid' },
    { id: '14',  label: '14',    marks: 3,  topic: 'probdata', skill: 'Mean + Range',                                                         skillIds: ['mean', 'range'], kind: 'mastery', visual: false, desc: 'three worded comparisons, one per statistic; not markable' },
    { id: '15',  label: '15',    marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Fractions Decimals and Percentages', skillIds: ['areas_of_squares_and_rectangles', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '16',  label: '16',    marks: 3,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',                                   skillIds: ['compound_units', 'time_calculations'], kind: 'mastery', visual: false, desc: '' },
    { id: '17',  label: '17',    marks: 3,  topic: 'shape',    skill: 'Angles on lines and Circles + Solving Linear Equations',               skillIds: ['angles_on_lines_and_circles', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Prime Factor Decomposition + Factors and Multiples',                   skillIds: ['prime_factor_decomposition', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'three-blank calculation graded against several simultaneous conditions' },
    { id: '19',  label: '19',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '20a', label: '20(a)', marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '20b', label: '20(b)', marks: 3,  topic: 'probdata', skill: 'Scatter Graphs + Proportion',                                          skillIds: ['scatter_graphs', 'proportion'], kind: 'exam', visual: false, desc: 'the first mark is for drawing a line of best fit, so the answer alone is not markable' },
    { id: '21',  label: '21',    marks: 3,  topic: 'number',   skill: 'Indices + Prime Factor Decomposition',                                 skillIds: ['indices', 'prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'working is required; the value alone scores zero' },
    { id: '22',  label: '22',    marks: 2,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Expressions',                         skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '23',  label: '23',    marks: 2,  topic: 'algebra',  skill: 'Sketching Functions',                                                  skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '24',  label: '24',    marks: 5,  topic: 'probdata', skill: 'Mean + Forming Expressions and Formulae + Solving Linear Equations',   skillIds: ['mean', 'forming_expressions_and_formulae', 'solving_linear_equations'], kind: 'exam', visual: false, desc: '' },
    { id: '25',  label: '25',    marks: 4,  topic: 'number',   skill: 'Dividing Fractions + Irregular and Improper Fractions',                skillIds: ['dividing_fractions', 'irregular_and_improper_fractions'], kind: 'exam', visual: false, desc: 'mixed-number answer; needs equivalence checking that distinguishes mixed from improper form' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
