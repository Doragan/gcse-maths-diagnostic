import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/03 — Foundation Tier Paper 3 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/OCR-JUN23-F-P3.json by
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
export const OCR_J560_03_JUN23: PaperConfig = {
  id: 'ocr-j560-03-jun23',
  title: 'OCR GCSE Mathematics J560/03',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',    label: '1(a)',    marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                                       skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'pick the solid that is not a prism from four' },
    { id: '1b',    label: '1(b)',    marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                       skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: false, desc: 'pick the right-angled isosceles triangle from four' },
    { id: '1c',    label: '1(c)',    marks: 2,  topic: 'shape',    skill: 'Properties of 2D Shapes + Symmetry (Line and Rotational)',      skillIds: ['properties_of_2d_shapes', 'symmetry'], kind: 'exam', visual: true, desc: 'draw a quadrilateral with exactly one line of symmetry and no right angle, about a given mirror line' },
    { id: '2ai',   label: '2(ai)',   marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                         skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'compare how many factors two numbers have' },
    { id: '2aii',  label: '2(aii)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                         skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'compare the lowest factor of two numbers' },
    { id: '2b',    label: '2(b)',    marks: 1,  topic: 'number',   skill: 'Highest Common Factor',                                         skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two single-digit numbers' },
    { id: '3a',    label: '3(a)',    marks: 1,  topic: 'number',   skill: 'Prime Factor Decomposition',                                    skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'complete a part-finished prime factorisation' },
    { id: '3b',    label: '3(b)',    marks: 1,  topic: 'number',   skill: 'Indices',                                                       skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'the number whose cube root is given' },
    { id: '3c',    label: '3(c)',    marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                            skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'a hundredths fraction written as a percentage' },
    { id: '4a',    label: '4(a)',    marks: 2,  topic: 'ratio',    skill: 'Proportion',                                                    skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'reverse a stated multiplier rule to recover the count' },
    { id: '4b',    label: '4(b)',    marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Compound Units',                            skillIds: ['simple_arithmetic', 'compound_units'], kind: 'mastery', visual: false, desc: 'annual saving from two costs per mile and a stated mileage' },
    { id: '5a',    label: '5(a)',    marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                   skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'plot a point in the second quadrant' },
    { id: '5b',    label: '5(b)',    marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                   skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'length of a horizontal line between two plotted points' },
    { id: '5c',    label: '5(c)',    marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                            skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: true, desc: 'draw a vertical line from its equation' },
    { id: '5d',    label: '5(d)',    marks: 2,  topic: 'shape',    skill: 'Coordinates + Properties of 2D Shapes',                         skillIds: ['coordinates', 'properties_of_2d_shapes'], kind: 'exam', visual: false, desc: 'the fourth vertex of a square from two vertices and a constraint on the third' },
    { id: '6ai',   label: '6(ai)',   marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                       skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'multiply a term by a number' },
    { id: '6aii',  label: '6(aii)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                           skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'a repeated product of one letter written as a power' },
    { id: '6aiii', label: '6(aiii)', marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                           skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'multiply two powers of the same letter' },
    { id: '6b',    label: '6(b)',    marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                   skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise a two-term expression with a numerical common factor' },
    { id: '7',     label: '7',       marks: 3,  topic: 'probdata', skill: 'Mean + Fractions of Amounts',                                   skillIds: ['mean', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'the second test mark needed for a stated mean percentage across two equally weighted tests' },
    { id: '8a',    label: '8(a)',    marks: 2,  topic: 'shape',    skill: 'Area of a Trapezium',                                           skillIds: ['area_of_a_trapezium'], kind: 'mastery', visual: false, desc: 'area of a trapezium from its two parallel sides and height, with a distractor length given' },
    { id: '8b',    label: '8(b)',    marks: 2,  topic: 'shape',    skill: 'Circumfrence of a Circle',                                      skillIds: ['circumfrence_of_a_circle'], kind: 'mastery', visual: false, desc: 'radius from a circumference given in terms of pi' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams',                                                 skillIds: ['venn_diagrams'], kind: 'mastery', visual: true, desc: 'place every element of a universal set into a two-set Venn diagram' },
    { id: '9b',    label: '9(b)',    marks: 1,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability of being in the intersection of two sets' },
    { id: '9c',    label: '9(c)',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Mutually Exclusive Events',                     skillIds: ['venn_diagrams', 'mutually_exclusive_events'], kind: 'mastery', visual: false, desc: 'explain that adding two set probabilities double-counts the intersection, and give the correct value' },
    { id: '10a',   label: '10(a)',   marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio',                                             skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'write a two-part ratio in its simplest form' },
    { id: '10b',   label: '10(b)',   marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Ratio',                                     skillIds: ['simplifying_ratio', 'ratio'], kind: 'mastery', visual: false, desc: 'express a part-to-part ratio in the form 1 : n, given one part as a fraction of the whole' },
    { id: '10c',   label: '10(c)',   marks: 3,  topic: 'ratio',    skill: 'Inverse Proportion',                                            skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'how many machines finish a job in fewer days, an inverse relationship' },
    { id: '11',    label: '11',      marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                     skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'decide for each of four pairs of triangles whether they are mathematically similar' },
    { id: '12a',   label: '12(a)',   marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                    skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'frequency for one sector of a pie chart from its angle and the overall total' },
    { id: '12b',   label: '12(b)',   marks: 3,  topic: 'probdata', skill: 'Pie Charts + Ratio',                                            skillIds: ['pie_charts', 'ratio'], kind: 'exam', visual: false, desc: 'the sector angle for one of two categories whose counts are in a stated ratio, from the remaining angle' },
    { id: '13a',   label: '13(a)',   marks: 2,  topic: 'number',   skill: 'Indices',                                                       skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'the positive integer whose square root falls in a stated range' },
    { id: '13b',   label: '13(b)',   marks: 1,  topic: 'number',   skill: 'Indices',                                                       skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'say whether allowing negative values changes that answer, given the root symbol takes the positive root' },
    { id: '14a',   label: '14(a)',   marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                              skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'decide whether three stated fractions of an amount can all be given away' },
    { id: '14b',   label: '14(b)',   marks: 2,  topic: 'number',   skill: 'Fractions of Amounts',                                          skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'one person\'s share, from another\'s share and both fractions of the same total' },
    { id: '15',    label: '15',      marks: 1,  topic: 'probdata', skill: 'Grouped Frequency Tables',                                      skillIds: ['grouped_frequency_tables'], kind: 'mastery', visual: false, desc: 'criticise a bar chart whose class intervals overlap' },
    { id: '16a',   label: '16(a)',   marks: 1,  topic: 'number',   skill: 'Standard Form',                                                 skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'order four standard-form values across positive and negative indices' },
    { id: '16b',   label: '16(b)',   marks: 2,  topic: 'number',   skill: 'Standard Form',                                                 skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'add two standard-form values with different indices, answer in standard form' },
    { id: '17a',   label: '17(a)',   marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds',                                        skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'the lower bound of a value rounded to the nearest thousand' },
    { id: '17b',   label: '17(b)',   marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                        skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show two quantities rounded to different accuracies can be the other way round, by comparing their intervals' },
    { id: '18',    label: '18',      marks: 2,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                   skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'change the subject of a formula with the new subject inside a root' },
    { id: '19a',   label: '19(a)',   marks: 3,  topic: 'probdata', skill: 'Relative Frequency + Expected Outcomes',                        skillIds: ['relative_frequency', 'expected_outcomes'], kind: 'exam', visual: false, desc: 'expected count in a population, from a small sample\'s relative frequency' },
    { id: '19b',   label: '19(b)',   marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                            skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'estimate a probability from a larger sample, as a simplified fraction' },
    { id: '19c',   label: '19(c)',   marks: 1,  topic: 'probdata', skill: 'Relative Frequency + Sampling',                                 skillIds: ['relative_frequency', 'sampling'], kind: 'mastery', visual: false, desc: 'explain why the larger sample gives the better estimate' },
    { id: '20',    label: '20',      marks: 4,  topic: 'ratio',    skill: 'Growth and Decay',                                              skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'show two successive percentage decreases do not equal their sum' },
    { id: '21',    label: '21',      marks: 5,  topic: 'algebra',  skill: 'Solving Linear Equations + Fractions Decimals and Percentages', skillIds: ['solving_linear_equations', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'one category\'s percentage, from three algebraic percentages that must total 100' },
    { id: '22',    label: '22',      marks: 5,  topic: 'shape',    skill: 'Constructions + Loci',                                          skillIds: ['constructions', 'loci'], kind: 'mastery', visual: true, desc: 'construct a perpendicular bisector and an angle bisector and mark where the two loci meet' },
    { id: '23a',   label: '23(a)',   marks: 1,  topic: 'ratio',    skill: 'Reverse Percentage',                                            skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'explain why reducing by a percentage does not undo an increase by that percentage' },
    { id: '23b',   label: '23(b)',   marks: 4,  topic: 'ratio',    skill: 'Reverse Percentage + Percentage Change',                        skillIds: ['reverse_percentage', 'percentage_change'], kind: 'mastery', visual: false, desc: 'a middle year\'s value, from a later year\'s value and both years\' percentage increases over a common base' },
    { id: '24a',   label: '24(a)',   marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                            skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'show the coefficient of a drawn quadratic, by substituting a point read off the curve' },
    { id: '24b',   label: '24(b)',   marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                           skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read both solutions of that quadratic equal to a constant off the curve, to 1 decimal place' },
    { id: '25',    label: '25',      marks: 4,  topic: 'shape',    skill: 'Symmetry (Line and Rotational) + Trigonometry (Missing Sides)', skillIds: ['symmetry', 'trigonometry_missing_sides'], kind: 'exam', visual: false, desc: 'height of one isosceles triangle in a design whose rotational symmetry order fixes its apex angle' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
