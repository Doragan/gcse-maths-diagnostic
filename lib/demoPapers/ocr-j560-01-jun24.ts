import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/01 — Foundation Tier Paper 1 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/OCR-JUN24-F-P1.json by
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
export const OCR_J560_01_JUN24: PaperConfig = {
  id: 'ocr-j560-01-jun24',
  title: 'OCR GCSE Mathematics J560/01',
  subtitle: 'Foundation Tier Paper 1 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',    label: '1(a)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                             skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'give an example of an even number' },
    { id: '1b',    label: '1(b)',    marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                         skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'give an example of a multiple of a given number' },
    { id: '1c',    label: '1(c)',    marks: 1,  topic: 'number',   skill: 'Indices',                                                       skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'a cube number inside a stated range' },
    { id: '1d',    label: '1(d)',    marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                         skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'a prime number below a stated value' },
    { id: '2a',    label: '2(a)',    marks: 1,  topic: 'probdata', skill: 'Median',                                                        skillIds: ['median'], kind: 'mastery', visual: false, desc: 'median of an unordered list of five values' },
    { id: '2b',    label: '2(b)',    marks: 2,  topic: 'probdata', skill: 'Range',                                                         skillIds: ['range'], kind: 'mastery', visual: false, desc: 'a possible extra value that would give a list a stated range — two valid answers' },
    { id: '3a',    label: '3(a)',    marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                    skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'measure an angle with a protractor' },
    { id: '3b',    label: '3(b)',    marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                       skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: false, desc: 'justify that a triangle is isosceles from its three angles, arguing about angles not sides' },
    { id: '3ci',   label: '3(ci)',   marks: 2,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                       skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: true, desc: 'complete a parallelogram on a grid and add notation showing it is one' },
    { id: '3cii',  label: '3(cii)',  marks: 2,  topic: 'shape',    skill: 'Area of Parallelograms',                                        skillIds: ['area_of_parallelograms'], kind: 'mastery', visual: false, desc: 'area of a parallelogram drawn on a grid, where the slant side is not the height' },
    { id: '4a',    label: '4(a)',    marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                     skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'draw the next pattern in a growing dot sequence' },
    { id: '4b',    label: '4(b)',    marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                     skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'the tenth term of a pattern sequence without drawing it, with the method explained' },
    { id: '5',     label: '5',       marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                                      skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'recover a starting number from two operations and the result' },
    { id: '6a',    label: '6(a)',    marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                            skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'list every pair of two different items from four, no repeats' },
    { id: '6b',    label: '6(b)',    marks: 1,  topic: 'probdata', skill: 'Systematic Listing',                                            skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'the fraction of a listed set of pairs that include one named item' },
    { id: '7ai',   label: '7(ai)',   marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                   skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'read coordinates in the third quadrant off a grid' },
    { id: '7aii',  label: '7(aii)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                   skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'plot a point with a negative coordinate' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                            skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a vertical line through a plotted point' },
    { id: '8a',    label: '8(a)',    marks: 1,  topic: 'algebra',  skill: 'Substitution',                                                  skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'substitute three values into a formula with a bracket' },
    { id: '8b',    label: '8(b)',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Solving Linear Equations',                       skillIds: ['substitution', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'find a letter inside the bracket of a formula from the subject and the other two letters' },
    { id: '9',     label: '9',       marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                  skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'complete a table with the complementary fraction and the other group\'s count, given one fraction and one count' },
    { id: '10a',   label: '10(a)',   marks: 1,  topic: 'ratio',    skill: 'Simplifying Ratio',                                             skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'write a two-part ratio in its simplest form' },
    { id: '10b',   label: '10(b)',   marks: 3,  topic: 'ratio',    skill: 'Ratio + Converting Measurements',                               skillIds: ['ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'map distance in centimetres from a real distance in kilometres and a map scale' },
    { id: '11',    label: '11',      marks: 5,  topic: 'number',   skill: 'Fractions of Amounts',                                          skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'how many smaller packs are needed for a week, where the daily amount is a percentage of a larger pack and the count must round up' },
    { id: '12',    label: '12',      marks: 3,  topic: 'number',   skill: 'Percentage Change',                                             skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage increase of a money amount' },
    { id: '13',    label: '13',      marks: 3,  topic: 'probdata', skill: 'Mean',                                                          skillIds: ['mean'], kind: 'mastery', visual: false, desc: 'mean from an ungrouped frequency table' },
    { id: '14',    label: '14',      marks: 4,  topic: 'ratio',    skill: 'Proportion + Time Calculations',                                skillIds: ['proportion', 'time_calculations'], kind: 'exam', visual: false, desc: 'output over seven hours from a rate given per twelve minutes' },
    { id: '15',    label: '15',      marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'population density from a population and an area' },
    { id: '16',    label: '16',      marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                  skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'percentage of a total taken by one part, where a fraction is removed first and the remainder split in a ratio' },
    { id: '17',    label: '17',      marks: 3,  topic: 'shape',    skill: 'Fractional and Negative Enlargements',                          skillIds: ['fractional_enlargements'], kind: 'mastery', visual: true, desc: 'enlarge a triangle by a fractional scale factor about the origin' },
    { id: '18',    label: '18',      marks: 4,  topic: 'algebra',  skill: 'Inequalities',                                                  skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'solve a two-step inequality and show the solution set on a number line' },
    { id: '19',    label: '19',      marks: 3,  topic: 'number',   skill: 'Exact Calculations',                                            skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate a rooted expression over a decimal divisor on a calculator, to 4 significant figures' },
    { id: '20',    label: '20',      marks: 3,  topic: 'shape',    skill: 'Areas of Triangles + Area of a Trapezium',                      skillIds: ['areas_of_triangles', 'area_of_a_trapezium'], kind: 'exam', visual: false, desc: 'show a triangle and a trapezium have equal areas, both areas to be worked out' },
    { id: '21ai',  label: '21(ai)',  marks: 2,  topic: 'probdata', skill: 'Pie Charts + Ratio',                                            skillIds: ['pie_charts', 'ratio'], kind: 'exam', visual: false, desc: 'show one pie-chart sector angle follows from a given sector and two doubling relations' },
    { id: '21aii', label: '21(aii)', marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                    skillIds: ['pie_charts'], kind: 'mastery', visual: true, desc: 'complete and label a pie chart from three derived sector angles' },
    { id: '21b',   label: '21(b)',   marks: 2,  topic: 'probdata', skill: 'Pie Charts',                                                    skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'total population from one sector\'s angle and its frequency' },
    { id: '21ci',  label: '21(ci)',  marks: 1,  topic: 'probdata', skill: 'Pie Charts',                                                    skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'an advantage of a pie chart over a bar chart for the same data' },
    { id: '21cii', label: '21(cii)', marks: 1,  topic: 'probdata', skill: 'Pie Charts',                                                    skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'a disadvantage of a pie chart over a bar chart for the same data' },
    { id: '22',    label: '22',      marks: 3,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                          skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'best value among three pack sizes, two priced per kilogram and one per gram' },
    { id: '23',    label: '23',      marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                        skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show one object may not fit inside another, by comparing two error intervals' },
    { id: '24',    label: '24',      marks: 5,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Solving Linear Equations', skillIds: ['alternate_and_corresponding_angles', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'angle on a transversal of two parallel lines, where two angles are algebraic and sum to a straight line' },
    { id: '25',    label: '25',      marks: 4,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                          skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'slant side of a trapezium, its horizontal projection recovered from the two parallel sides first' },
    { id: '26',    label: '26',      marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations',                                        skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'solve simultaneous linear equations with integer solutions' },
    { id: '27',    label: '27',      marks: 3,  topic: 'number',   skill: 'Fractional and Negative Indices + Standard Form',               skillIds: ['fractional_and_negative_indices', 'standard_form'], kind: 'exam', visual: false, desc: 'order a decimal, a negative power of two and a standard-form value, with the comparison shown' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
