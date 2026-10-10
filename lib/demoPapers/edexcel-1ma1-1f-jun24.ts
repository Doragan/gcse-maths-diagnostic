import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1F — Foundation Tier Paper 1 Non-calculator — June 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN24-F-P1.json by
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
export const EDEXCEL_1MA1_1F_JUN24: PaperConfig = {
  id: 'edexcel-1ma1-1f-jun24',
  title: 'Edexcel GCSE Mathematics 1MA1/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Rounding',                                              skillIds: ['rounding'], kind: 'mastery', visual: false, desc: 'round a five-digit number to the nearest thousand' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                    skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'decimal to percentage conversion' },
    { id: '3',   label: '3',     marks: 1,  topic: 'shape',    skill: 'Angles on Lines and Circles',                           skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'name an angle by type, where the answer is reflex' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Decimals',                                              skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'order five decimals of differing lengths' },
    { id: '5',   label: '5',     marks: 1,  topic: 'number',   skill: 'Indices',                                               skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'square root of a two-digit square number' },
    { id: '6',   label: '6',     marks: 4,  topic: 'number',   skill: 'Simple Arithmetic',                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'unit price of one of two identical items, from a total payment, the change and another item\'s price' },
    { id: '7',   label: '7',     marks: 4,  topic: 'probdata', skill: 'Simple Charts',                                         skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'choose and draw a suitable chart for two people\'s data across four days, including scale, labels and a key' },
    { id: '8i',  label: '8(i)',  marks: 2,  topic: 'shape',    skill: 'Angles on Lines and Circles',                           skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'missing angle at a point, from two given angles' },
    { id: '8ii', label: '8(ii)', marks: 1,  topic: 'shape',    skill: 'Angles on Lines and Circles',                           skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'give the angle reason for that calculation' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                     skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'output of a two-step function machine' },
    { id: '9b',  label: '9(b)',  marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                     skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'input of a two-step function machine from its output' },
    { id: '9c',  label: '9(c)',  marks: 2,  topic: 'algebra',  skill: 'Function Machines + Solving Linear Equations',          skillIds: ['function_machines', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'show a machine has a fixed point, by trial or by forming an equation' },
    { id: '10',  label: '10',    marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio',                                     skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'write two counts as a ratio in its simplest form' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'divide one negative number by another' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'number',   skill: 'Indices',                                               skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'evaluate a small power of 2' },
    { id: '11c', label: '11(c)', marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'insert one pair of brackets to make a stated order-of-operations result true' },
    { id: '12',  label: '12',    marks: 4,  topic: 'shape',    skill: 'Lengths and Perimeters',                                skillIds: ['lengths_and_perimeters'], kind: 'mastery', visual: false, desc: 'a rectangle\'s missing length, its perimeter given as a fraction of a triangle\'s' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability of a certain event' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability + Ratio',                skillIds: ['calculating_simple_probability', 'ratio'], kind: 'exam', visual: false, desc: 'probability of picking one coin type, where the two denominations hold equal total value' },
    { id: '14',  label: '14',    marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                     skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'non-calculator long multiplication of a three-digit by a two-digit number' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'probdata', skill: 'Median',                                                skillIds: ['median'], kind: 'mastery', visual: false, desc: 'median from a stem and leaf diagram' },
    { id: '15b', label: '15(b)', marks: 2,  topic: 'probdata', skill: 'Range',                                                 skillIds: ['range'], kind: 'mastery', visual: false, desc: 'range from a stem and leaf diagram' },
    { id: '15c', label: '15(c)', marks: 1,  topic: 'probdata', skill: 'Median',                                                skillIds: ['median'], kind: 'mastery', visual: false, desc: 'compare two distributions on the median alone, the second given only by its median' },
    { id: '16',  label: '16',    marks: 3,  topic: 'ratio',    skill: 'Proportion',                                            skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'best value among three pack sizes, all three needing comparable figures' },
    { id: '17',  label: '17',    marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations + Expanding Brackets',         skillIds: ['solving_linear_equations', 'expanding_brackets'], kind: 'mastery', visual: false, desc: 'solve a linear equation with a bracket, non-integer solution' },
    { id: '18',  label: '18',    marks: 1,  topic: 'number',   skill: 'Indices',                                               skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'value of a number raised to the power zero' },
    { id: '19',  label: '19',    marks: 2,  topic: 'shape',    skill: 'Translations',                                          skillIds: ['translations'], kind: 'mastery', visual: false, desc: 'describe fully a single translation, naming it and giving the column vector' },
    { id: '20',  label: '20',    marks: 2,  topic: 'algebra',  skill: 'Finding the nth Term',                                  skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'nth term of an arithmetic sequence' },
    { id: '21a', label: '21(a)', marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                      skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract two mixed numbers with unrelated denominators' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions + Dividing Fractions', skillIds: ['irregular_and_improper_fractions', 'dividing_fractions'], kind: 'mastery', visual: false, desc: 'identify that a correct improper-fraction result was converted to a mixed number wrongly' },
    { id: '22a', label: '22(a)', marks: 4,  topic: 'shape',    skill: 'Areas of Compound Shapes + Proportion',                 skillIds: ['areas_of_compound_shapes', 'proportion'], kind: 'exam', visual: false, desc: 'decide whether a stated quantity of paint covers an L-shaped floor, at a stated coverage rate' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'ratio',    skill: 'Proportion',                                            skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'say whether a larger coverage rate changes that conclusion, with a reason' },
    { id: '23a', label: '23(a)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                         skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'list the members of one set from a completed Venn diagram' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',        skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability of a set operation read off a Venn diagram' },
    { id: '24a', label: '24(a)', marks: 3,  topic: 'number',   skill: 'Estimating',                                            skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'estimate a total cost from a distance and a rate per fixed distance, by rounding first' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'number',   skill: 'Estimating',                                            skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'decide whether that estimate is an under- or overestimate, with a reason' },
    { id: '25a', label: '25(a)', marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                    skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a line drawn on a grid, fractional gradient' },
    { id: '25b', label: '25(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                    skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'any line parallel to a given one' },
    { id: '26',  label: '26',    marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                          skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'percentage of a whole taken by one part, from a fraction of the total then two chained ratios sharing a term' },
    { id: '27',  label: '27',    marks: 2,  topic: 'ratio',    skill: 'Reverse Percentage',                                    skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'original price from a sale price and the percentage reduction' },
    { id: '28',  label: '28',    marks: 3,  topic: 'algebra',  skill: 'Inequalities',                                          skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'solve a linear inequality with the unknown on both sides and a fractional coefficient' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
