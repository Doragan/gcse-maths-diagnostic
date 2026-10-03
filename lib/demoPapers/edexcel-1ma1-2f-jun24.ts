import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/2F — Foundation Tier Paper 2 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN24-F-P2.json by
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
export const EDEXCEL_1MA1_2F_JUN24: PaperConfig = {
  id: 'edexcel-1ma1-2f-jun24',
  title: 'Edexcel GCSE Mathematics 1MA1/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                                  skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'order five directed numbers' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                                            skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'metric capacity conversion' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                                   skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'a hundredths fraction written as a decimal' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                              skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'a multiple of a given number inside a stated range' },
    { id: '5',   label: '5',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                                            skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'complete an identity between a repeated term and its collected form' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                                                      skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'read a whole-symbol value off a pictogram' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                                                      skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'add a value to a pictogram needing part symbols' },
    { id: '6c',  label: '6(c)',  marks: 3,  topic: 'probdata', skill: 'Simple Charts',                                                                      skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'the missing month\'s value, from a pictogram of three months, one added month and an overall total' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                                         skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'measure a line in centimetres' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                                         skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'measure an angle with a protractor' },
    { id: '7c',  label: '7(c)',  marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                                            skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: true, desc: 'draw a hexagon' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                        skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'read coordinates off a grid' },
    { id: '8b',  label: '8(b)',  marks: 2,  topic: 'shape',    skill: 'Coordinates',                                                                        skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'midpoint of two plotted points across two quadrants' },
    { id: '8c',  label: '8(c)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                        skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'plot and label a point with a negative coordinate' },
    { id: '9',   label: '9',     marks: 4,  topic: 'number',   skill: 'Simple Arithmetic',                                                                  skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'total pay from two odometer readings, a rate in pence per mile and a fixed expense in pounds' },
    { id: '10',  label: '10',    marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                                 skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'list all eight outcomes of three successive two-way events' },
    { id: '11',  label: '11',    marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                     skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'reject a claim that three unequal sectors give equally likely outcomes' },
    { id: '12',  label: '12',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                                                               skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'total weight of the complementary group, from a fraction of a count and a unit weight' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                                            skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'multiply two terms with numerical coefficients and different letters' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                                       skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'substitute a positive and a negative value into a two-term formula' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                                     skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'average speed from a distance and a time' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',                                                 skillIds: ['compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'test a claim about a two-day total time, the second day\'s time found from a distance and a speed' },
    { id: '15',  label: '15',    marks: 2,  topic: 'number',   skill: 'Percentage Change',                                                                  skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'total simple interest over six years' },
    { id: '16a', label: '16(a)', marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                                            skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'read a conversion off a straight-line conversion graph' },
    { id: '16b', label: '16(b)', marks: 2,  topic: 'number',   skill: 'Converting Measurements',                                                            skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'convert a value beyond the graph\'s range, by scaling a reading taken from it' },
    { id: '17',  label: '17',    marks: 3,  topic: 'shape',    skill: 'Loci + Constructions',                                                               skillIds: ['loci', 'constructions'], kind: 'mastery', visual: true, desc: 'shade the region inside a triangle satisfying a distance condition and a nearer-to condition' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                                                               skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'each person\'s share of the part of a total not met by a percentage contribution' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'number',   skill: 'Exact Calculations',                                                                 skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate a quotient of two two-term expressions on a calculator, all digits given' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'number',   skill: 'Significant Figures',                                                                skillIds: ['significant_figures'], kind: 'mastery', visual: false, desc: 'round that result to 2 significant figures' },
    { id: '20',  label: '20',    marks: 2,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                               skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'shorter side of a right-angled triangle from the hypotenuse and the other side, to 3 significant figures' },
    { id: '21a', label: '21(a)', marks: 2,  topic: 'number',   skill: 'Prime Factor Decomposition',                                                         skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'write a two-digit number as a product of primes' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'number',   skill: 'Lowest Common Multiple',                                                             skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: 'lowest common multiple of two numbers given as products of prime factors' },
    { id: '22',  label: '22',    marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                                       skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'difference between two values of a formula, at two values of its variable' },
    { id: '23',  label: '23',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Calculating Simple Probability',                                             skillIds: ['ratio', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'count of one colour, from a third colour\'s count and probability and a ratio between the other two' },
    { id: '24a', label: '24(a)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                                 skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '24b', label: '24(b)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve from a table of values' },
    { id: '24c', label: '24(c)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read both solutions of a quadratic equal to a constant off the drawn curve' },
    { id: '25',  label: '25',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                       skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'test a claim that two transfers out of one share of a three-part ratio leave all three equal' },
    { id: '26',  label: '26',    marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Solving Linear Equations + Alternate and Corresponding Angles', skillIds: ['angles_in_polygons', 'solving_linear_equations', 'alternate_and_corresponding_angles'], kind: 'exam', visual: false, desc: 'show a quadrilateral with four algebraic angles has one pair of parallel sides' },
    { id: '27',  label: '27',    marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                                          skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'a side of the smaller of two similar isosceles triangles, from the two bases and one equal side' },
    { id: '28a', label: '28(a)', marks: 1,  topic: 'probdata', skill: 'Median + Grouped Frequency Tables',                                                  skillIds: ['median', 'grouped_frequency_tables'], kind: 'mastery', visual: false, desc: 'the class interval containing the median of a grouped distribution' },
    { id: '28b', label: '28(b)', marks: 3,  topic: 'probdata', skill: 'Mean + Grouped Frequency Tables',                                                    skillIds: ['mean', 'grouped_frequency_tables'], kind: 'exam', visual: false, desc: 'estimated mean of a grouped frequency table, to 3 significant figures' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
