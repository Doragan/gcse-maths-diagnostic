import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/2F — Foundation Tier Paper 2 Calculator — November 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-NOV24-F-P2.json by
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
export const EDEXCEL_1MA1_2F_NOV24: PaperConfig = {
  id: 'edexcel-1ma1-2f-nov24',
  title: 'Edexcel GCSE Mathematics 1MA1/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'percentage to fraction conversion' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Time Calculations',                                                    skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'minutes written as hours and minutes' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Decimals',                                                             skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'order four decimals of differing lengths' },
    { id: '4',   label: '4',     marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                              skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: false, desc: 'name a polygon from its diagram' },
    { id: '5',   label: '5',     marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'the number halfway between a negative and a positive value' },
    { id: '6',   label: '6',     marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'how many items can be made from two stocks used in a fixed combination, limited by the scarcer one' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'probdata', skill: 'Mean',                                                                 skillIds: ['mean'], kind: 'mastery', visual: false, desc: 'mean of a list of eight values' },
    { id: '7b',  label: '7(b)',  marks: 2,  topic: 'probdata', skill: 'Range',                                                                skillIds: ['range'], kind: 'mastery', visual: false, desc: 'range of a list of eight values' },
    { id: '7c',  label: '7(c)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                       skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: true, desc: 'mark a probability from a list of data on a 0-to-1 probability scale' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'reject a claim that confuses squaring with doubling' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'give a counterexample to a claim about dividing even numbers' },
    { id: '9',   label: '9',     marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio',                                                    skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'write a two-part count as a ratio in its simplest form' },
    { id: '10',  label: '10',    marks: 3,  topic: 'shape',    skill: 'Lengths and Perimeters',                                               skillIds: ['lengths_and_perimeters'], kind: 'mastery', visual: false, desc: 'perimeter of a shape built from five squares, given only one square\'s perimeter' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                              skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'multiply two single-letter terms' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'algebra',  skill: 'Simplifying Expressions',                                              skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'collect like terms in two letters, one pair with mixed signs' },
    { id: '12',  label: '12',    marks: 4,  topic: 'number',   skill: 'Fractions of Amounts + Simple Arithmetic',                             skillIds: ['fractions_of_amounts', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'unit price of the remaining group, from a percentage split, one known unit price and an overall total' },
    { id: '13',  label: '13',    marks: 4,  topic: 'shape',    skill: 'Angles on Lines and Circles',                                          skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'show a triangle is isosceles from a reflex angle and an exterior angle, with a reason at every stage' },
    { id: '14a', label: '14(a)', marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                     skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'distance remaining, read off a distance-time graph with a stationary section' },
    { id: '14b', label: '14(b)', marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                     skillIds: ['kinematic_graphs'], kind: 'mastery', visual: true, desc: 'complete a distance-time graph with a stated wait and a stated return duration' },
    { id: '15',  label: '15',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Converting Measurements',                                      skillIds: ['ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'real length in kilometres from a map scale and a length in centimetres' },
    { id: '16',  label: '16',    marks: 3,  topic: 'probdata', skill: 'Calculating Simple Probability',                                       skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'decide which of two differently sized collections gives the greater probability, with comparable figures shown' },
    { id: '17a', label: '17(a)', marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                    skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage decrease of a money amount' },
    { id: '17b', label: '17(b)', marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage',                                                   skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'total value from a pay packet made of a fixed sum plus a percentage commission' },
    { id: '18',  label: '18',    marks: 2,  topic: 'shape',    skill: 'Enlargements',                                                         skillIds: ['enlargements'], kind: 'mastery', visual: false, desc: 'describe fully a single enlargement mapping one triangle onto another, scale factor and centre' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'algebra',  skill: 'Factorising',                                                          skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise fully where the common factor is a number and a letter' },
    { id: '19b', label: '19(b)', marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                         skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'show a double inequality on a number line, one end strict and one inclusive' },
    { id: '20',  label: '20',    marks: 2,  topic: 'number',   skill: 'Exact Calculations',                                                   skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate a fraction with a two-term numerator and a product denominator on a calculator, all digits given' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'name the type of correlation on a scatter graph' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'draw a line of best fit' },
    { id: '21c', label: '21(c)', marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'estimate a value from a line of best fit' },
    { id: '22',  label: '22',    marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                           skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'better value for money across two currencies and two pack sizes, with an exchange rate given' },
    { id: '23',  label: '23',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams',                                                        skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'identify two faults in someone else\'s Venn diagram — a duplicated element and a missing element of the universal set' },
    { id: '24a', label: '24(a)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                   skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '24b', label: '24(b)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                  skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve from a table of values' },
    { id: '25',  label: '25',    marks: 4,  topic: 'number',   skill: 'Percentage Change',                                                    skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'test a claim comparing two percentage increases by a stated multiple' },
    { id: '26',  label: '26',    marks: 5,  topic: 'shape',    skill: 'Areas of Triangles + Solving Linear Equations + Pythagoras\' Theorem', skillIds: ['areas_of_triangles', 'solving_linear_equations', 'pythagoras_theorem'], kind: 'exam', visual: false, desc: 'area of an isosceles triangle whose three algebraic side lengths are fixed by a stated perimeter' },
    { id: '27',  label: '27',    marks: 2,  topic: 'number',   skill: 'Standard Form',                                                        skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'divide two standard-form values with negative indices, answer in standard form' },
    { id: '28',  label: '28',    marks: 3,  topic: 'ratio',    skill: 'Compound Units + Volume of a Prism',                                   skillIds: ['compound_units', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'density of a cylinder from its mass and its dimensions, to 3 significant figures' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
