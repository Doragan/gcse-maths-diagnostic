import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/3F — Foundation Tier Paper 3 Calculator — November 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-NOV24-F-P3.json by
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
export const EDEXCEL_1MA1_3F_NOV24: PaperConfig = {
  id: 'edexcel-1ma1-3f-nov24',
  title: 'Edexcel GCSE Mathematics 1MA1/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 1,  topic: 'number',   skill: 'Decimals',                                      skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'place value of a digit in a four-digit whole number' },
    { id: '2',     label: '2',       marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                          skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'unit fraction of a whole number' },
    { id: '3',     label: '3',       marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                         skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'two factors of a given number' },
    { id: '4',     label: '4',       marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                             skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'order five directed numbers' },
    { id: '5',     label: '5',       marks: 1,  topic: 'number',   skill: 'Indices',                                       skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'square root of a terminating decimal' },
    { id: '6a',    label: '6(a)',    marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                      skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve an equation whose left side is a repeated addition of the unknown' },
    { id: '6b',    label: '6(b)',    marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                      skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a one-step additive equation' },
    { id: '6c',    label: '6(c)',    marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                      skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a one-step equation with the unknown divided' },
    { id: '7a',    label: '7(a)',    marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                       skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: false, desc: 'name a quadrilateral from its diagram' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                       skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: true, desc: 'draw a right-angled triangle on a grid' },
    { id: '8a',    label: '8(a)',    marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                             skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'complete a bill: one line total, one missing quantity, and the overall total' },
    { id: '8b',    label: '8(b)',    marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                             skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'closing balance from three money movements, one of them a subtraction' },
    { id: '9',     label: '9',       marks: 5,  topic: 'number',   skill: 'Fractions of Amounts',                          skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'size of the complement of two overlapping percentage subgroups, split first by a fraction of the whole' },
    { id: '10a',   label: '10(a)',   marks: 1,  topic: 'number',   skill: 'Time Calculations',                             skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'journey duration in minutes from a timetable column' },
    { id: '10bi',  label: '10(bi)',  marks: 3,  topic: 'number',   skill: 'Time Calculations',                             skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'latest departure time from a timetable, working back through two walking times and a deadline' },
    { id: '10bii', label: '10(bii)', marks: 1,  topic: 'number',   skill: 'Time Calculations',                             skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'state the effect on a back-calculated departure time when the deadline moves' },
    { id: '11a',   label: '11(a)',   marks: 1,  topic: 'number',   skill: 'Converting Measurements',                       skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'read a conversion off a straight-line conversion graph' },
    { id: '11b',   label: '11(b)',   marks: 3,  topic: 'number',   skill: 'Converting Measurements',                       skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'total of two distances given in different units, converted using a conversion graph' },
    { id: '12',    label: '12',      marks: 2,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',              skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'expression in two letters for a total made of two fixed pack sizes' },
    { id: '13',    label: '13',      marks: 4,  topic: 'shape',    skill: 'Volume of a Prism + Converting Measurements',   skillIds: ['volume_of_a_prism', 'converting_measurements'], kind: 'exam', visual: false, desc: 'how many small boxes fill a crate, with the two sets of dimensions given in different units' },
    { id: '14',    label: '14',      marks: 4,  topic: 'number',   skill: 'Simple Arithmetic',                             skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'weekly pay from a table of daily hours, with a higher multiplier at the weekend' },
    { id: '15a',   label: '15(a)',   marks: 3,  topic: 'probdata', skill: 'Mean',                                          skillIds: ['mean'], kind: 'mastery', visual: false, desc: 'mean from an ungrouped frequency table, to 1 decimal place' },
    { id: '15b',   label: '15(b)',   marks: 1,  topic: 'probdata', skill: 'Mode',                                          skillIds: ['mode'], kind: 'mastery', visual: false, desc: 'reject an answer that reports the highest frequency instead of the modal value' },
    { id: '16a',   label: '16(a)',   marks: 2,  topic: 'number',   skill: 'Prime Factor Decomposition',                    skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'write a three-digit number as a product of primes' },
    { id: '16b',   label: '16(b)',   marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                         skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two three-digit numbers' },
    { id: '17',    label: '17',      marks: 2,  topic: 'probdata', skill: 'Frequency Diagrams + Grouped Frequency Tables', skillIds: ['frequency_diagrams', 'grouped_frequency_tables'], kind: 'mastery', visual: true, desc: 'draw a frequency polygon from a grouped frequency table, plotting at midpoints' },
    { id: '18a',   label: '18(a)',   marks: 1,  topic: 'number',   skill: 'Standard Form',                                 skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard form to an ordinary number' },
    { id: '18b',   label: '18(b)',   marks: 1,  topic: 'number',   skill: 'Standard Form',                                 skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'a number below 1 written in standard form' },
    { id: '19',    label: '19',      marks: 2,  topic: 'shape',    skill: 'Constructions',                                 skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'construct an angle bisector with ruler and compasses, arcs shown' },
    { id: '20a',   label: '20(a)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                 skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage probability tree from one given probability' },
    { id: '20b',   label: '20(b)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                 skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of the same outcome twice from a completed tree' },
    { id: '21',    label: '21',      marks: 5,  topic: 'ratio',    skill: 'Ratio + Percentage Change',                     skillIds: ['ratio', 'percentage_change'], kind: 'exam', visual: false, desc: 'percentage profit on a mixed stock split by ratio, with a buy and a sell price for each kind' },
    { id: '22',    label: '22',      marks: 4,  topic: 'probdata', skill: 'Median + Range',                                skillIds: ['median', 'range'], kind: 'mastery', visual: false, desc: 'compare a stem and leaf distribution with a second one described only by its median and range' },
    { id: '23',    label: '23',      marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                        skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval for a truncated calculator display' },
    { id: '24',    label: '24',      marks: 2,  topic: 'shape',    skill: 'Trigonometry (Missing Sides)',                  skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'missing side of a right-angled triangle from one angle and the adjacent side' },
    { id: '25a',   label: '25(a)',   marks: 2,  topic: 'number',   skill: 'Simplifying Indices',                           skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'multiply two terms in two letters with numerical coefficients' },
    { id: '25b',   label: '25(b)',   marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                           skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'raise a power to a negative power' },
    { id: '26',    label: '26',      marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                              skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'total interest only, after three years of compound interest' },
    { id: '27',    label: '27',      marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',            skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a line drawn on a grid, negative gradient' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
