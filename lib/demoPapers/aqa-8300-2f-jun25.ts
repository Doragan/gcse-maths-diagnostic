import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P2.json by
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
export const AQA_8300_2F_JUN25: PaperConfig = {
  id: 'aqa-8300-2f-jun25',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                      skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'ratio',    skill: 'Ratio + Simple Arithmetic',                                  skillIds: ['ratio', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'shape',    skill: 'Bearings',                                                   skillIds: ['bearings'], kind: 'mastery', visual: false, desc: 'compass-word or bearing answer; needs synonym/format equivalence' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Lengths and Perimeters',                        skillIds: ['proportion', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'scale drawing on a grid; static diagram supported' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                    skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                    skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '4c',  label: '4(c)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                        skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'index-notation answer needs equivalence checker' },
    { id: '4d',  label: '4(d)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                        skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'index-notation answer needs equivalence checker' },
    { id: '5',   label: '5',     marks: 2,  topic: 'number',   skill: 'Converting Measurements + Simple Arithmetic',                skillIds: ['converting_measurements', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show-that requires both the total and the comparison to be evidenced' },
    { id: '6',   label: '6',     marks: 4,  topic: 'probdata', skill: 'Simple Charts',                                              skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing a bar to scale with width/gap conventions marked' },
    { id: '7',   label: '7',     marks: 2,  topic: 'number',   skill: 'Simplifying Fractions + Converting Measurements',            skillIds: ['simplifying_fractions', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; decimal/percent not credited' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'number',   skill: 'Time Calculations',                                          skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: '' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                    skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '8c',  label: '8(c)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                       skillIds: ['proportion', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'number',   skill: 'Time Calculations',                                          skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'clock-time answer; needs time-format equivalence (2:30pm / 14:30)' },
    { id: '9b',  label: '9(b)',  marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Converting Measurements',             skillIds: ['fractions_of_amounts', 'converting_measurements'], kind: 'exam', visual: false, desc: 'tick + supporting calculation; the choice alone earns nothing' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '11',  label: '11',    marks: 3,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Expressions',               skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'show-equivalence requires both expressions simplified and shown' },
    { id: '12',  label: '12',    marks: 2,  topic: 'ratio',    skill: 'Proportion',                                                 skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'probdata', skill: 'Range',                                                      skillIds: ['range'], kind: 'mastery', visual: false, desc: '' },
    { id: '13b', label: '13(b)', marks: 3,  topic: 'probdata', skill: 'Mean',                                                       skillIds: ['mean'], kind: 'mastery', visual: false, desc: '' },
    { id: '14',  label: '14',    marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Simplifying Expressions', skillIds: ['forming_expressions_and_formulae', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'description-to-expression matching; needs a pairing input' },
    { id: '15',  label: '15',    marks: 1,  topic: 'shape',    skill: 'Lengths and Perimeters + Areas of Squares and Rectangles',   skillIds: ['lengths_and_perimeters', 'areas_of_squares_and_rectangles'], kind: 'mastery', visual: false, desc: 'tick credited only with supporting working' },
    { id: '16',  label: '16',    marks: 1,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '17',  label: '17',    marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                 skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'best-buy choice credited only with two comparable values shown' },
    { id: '18a', label: '18(a)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                      skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '18b', label: '18(b)', marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio',                                          skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '18c', label: '18(c)', marks: 1,  topic: 'ratio',    skill: 'Ratio + Proportion',                                         skillIds: ['ratio', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                              skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-diagram multi-cell entry' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                            skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'probdata', skill: 'Time Series',                                                skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires point-plotting and line-drawing input' },
    { id: '20b', label: '20(b)', marks: 3,  topic: 'probdata', skill: 'Time Series + Proportion',                                   skillIds: ['time_series', 'proportion'], kind: 'exam', visual: false, desc: 'answer accepted over a range because the trend estimate is open' },
    { id: '21',  label: '21',    marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages + Proportion',            skillIds: ['fractions_decimals_and_percentages', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Proportion',                             skillIds: ['simple_arithmetic', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                     skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval; needs inequality-form entry' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                     skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that on a strict inequality; needs the bound and the total evidenced' },
    { id: '24',  label: '24',    marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '25a', label: '25(a)', marks: 3,  topic: 'shape',    skill: 'Circumfrence of a Circle + Sector Calculations',             skillIds: ['circumfrence_of_a_circle', 'sector_calculations'], kind: 'mastery', visual: false, desc: 'range-tolerance decimal answer; static diagram supported' },
    { id: '25b', label: '25(b)', marks: 1,  topic: 'shape',    skill: 'Sector Calculations',                                        skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '26',  label: '26',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                               skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
