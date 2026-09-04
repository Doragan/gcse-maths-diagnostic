import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/2F — Foundation Tier Paper 2 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-F-P2.json by
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
export const EDEXCEL_1MA1_2F_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-2f-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Time Calculations',                                                skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'convert a number of weeks into days' },
    { id: '2',   label: '2',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                          skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'simplify a product of a number and an algebraic term' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                               skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'write a decimal as a percentage' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'order a mix of positive and negative values' },
    { id: '5i',  label: '5(i)',  marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                          skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'choose a sensible metric unit for a very large length' },
    { id: '5ii', label: '5(ii)', marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                          skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'choose a sensible metric unit for a very small mass' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'find three equal unknowns from a total and one known value' },
    { id: '7',   label: '7',     marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                     skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'use a given cost rule in reverse to find its input' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'probdata', skill: 'Mode',                                                             skillIds: ['mode'], kind: 'mastery', visual: false, desc: 'mode of a list of values' },
    { id: '8b',  label: '8(b)',  marks: 2,  topic: 'probdata', skill: 'Range',                                                            skillIds: ['range'], kind: 'mastery', visual: false, desc: 'range of a list of values' },
    { id: '9i',  label: '9(i)',  marks: 2,  topic: 'shape',    skill: 'Angles on lines and Circles',                                      skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'missing angle where several angles meet on a straight line' },
    { id: '9ii', label: '9(ii)', marks: 1,  topic: 'shape',    skill: 'Angles on lines and Circles',                                      skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'give the angle fact that justifies the previous part' },
    { id: '10',  label: '10',    marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Fractions Decimals and Percentages',           skillIds: ['simplifying_ratio', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'turn a percentage into a simplified ratio of the two parts' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'number',   skill: 'Time Calculations',                                                skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'compare a total of two durations in minutes against a bound in hours' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                   skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'distance from a steady speed and a time' },
    { id: '12',  label: '12',    marks: 3,  topic: 'probdata', skill: 'Gathering and Organising Data',                                    skillIds: ['gathering_and_organising_data'], kind: 'exam', visual: false, desc: 'complete a two-way table from partial totals' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'number',   skill: 'Indices',                                                          skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'write a repeated product in index form' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                                         skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a two-step linear equation' },
    { id: '14a', label: '14(a)', marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                       skillIds: ['pie_charts'], kind: 'mastery', visual: true, desc: 'draw an accurate pie chart from a frequency table' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'probdata', skill: 'Pie Charts',                                                       skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'judge a claim that compares sector angles across two different pie charts' },
    { id: '15',  label: '15',    marks: 4,  topic: 'probdata', skill: 'Calculating Simple Probability',                                   skillIds: ['calculating_simple_probability'], kind: 'exam', visual: false, desc: 'how many of one colour were added, given the resulting probability' },
    { id: '16a', label: '16(a)', marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs + Compound Units',                                skillIds: ['kinematic_graphs', 'compound_units'], kind: 'exam', visual: false, desc: 'speed in a different time unit read off a distance-time graph' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                 skillIds: ['kinematic_graphs'], kind: 'mastery', visual: true, desc: 'add a stationary period to a distance-time graph' },
    { id: '17',  label: '17',    marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'the remaining share of a cost once a percentage of it is met elsewhere' },
    { id: '18',  label: '18',    marks: 3,  topic: 'shape',    skill: 'Volume of a prism + Areas of Squares and Rectangles',              skillIds: ['volume_of_a_prism', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'surface area of a cube worked back from its volume' },
    { id: '19a', label: '19(a)', marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                                     skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'largest integer satisfying an inequality shown on a number line' },
    { id: '19b', label: '19(b)', marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                     skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'show a double-ended inequality on a number line' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'number',   skill: 'Prime Factor Decomposition',                                       skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'write a number as a product of its prime factors' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'number',   skill: 'Lowest Common Multiple',                                           skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: 'lowest common multiple of two numbers' },
    { id: '21',  label: '21',    marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'share an amount in a three-part ratio' },
    { id: '22a', label: '22(a)', marks: 4,  topic: 'shape',    skill: 'Areas of Compound Shapes + Area of a Circle + Areas of Triangles', skillIds: ['areas_of_compound_shapes', 'area_of_a_circle', 'areas_of_triangles'], kind: 'exam', visual: false, desc: 'bags needed to cover a triangle with a circle removed, rounding up' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'shape',    skill: 'Areas of Compound Shapes',                                         skillIds: ['areas_of_compound_shapes'], kind: 'mastery', visual: false, desc: 'effect on the number of bags when each bag covers less' },
    { id: '23',  label: '23',    marks: 1,  topic: 'shape',    skill: 'Loci',                                                             skillIds: ['loci'], kind: 'mastery', visual: false, desc: 'explain a mistake in shading the region at least a fixed distance from a point' },
    { id: '24',  label: '24',    marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage',                                               skillIds: ['reverse_percentage'], kind: 'exam', visual: false, desc: 'original amount from a fractional decrease and the new amount' },
    { id: '25',  label: '25',    marks: 5,  topic: 'probdata', skill: 'Mean + Ratio',                                                     skillIds: ['mean', 'ratio'], kind: 'exam', visual: false, desc: 'unknown value in one list, given the ratio between two lists\' means' },
    { id: '26',  label: '26',    marks: 2,  topic: 'shape',    skill: 'Trigonometry (missing angles)',                                    skillIds: ['trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'angle in a right-angled triangle from two given sides' },
    { id: '27',  label: '27',    marks: 3,  topic: 'ratio',    skill: 'Compound Units',                                                   skillIds: ['compound_units'], kind: 'exam', visual: false, desc: 'how many items of known density and volume fit under a mass limit' },
    { id: '28',  label: '28',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                              skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'sketch a vertically translated quadratic' },
    { id: '29',  label: '29',    marks: 3,  topic: 'algebra',  skill: 'Sequences + Solving Linear Equations',                             skillIds: ['sequences', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'unknown multiplier in a Fibonacci-style sequence from a later term' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
