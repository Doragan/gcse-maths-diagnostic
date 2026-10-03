import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1H — Higher Tier Paper 1 Non-calculator — June 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN24-H-P1.json by
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
export const EDEXCEL_1MA1_1H_JUN24: PaperConfig = {
  id: 'edexcel-1ma1-1h-jun24',
  title: 'Edexcel GCSE Mathematics 1MA1/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 2,  topic: 'algebra',  skill: 'Finding the nth Term',                                                                            skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'nth term of an arithmetic sequence' },
    { id: '2a',    label: '2(a)',    marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                                                                skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract two mixed numbers with unrelated denominators' },
    { id: '2b',    label: '2(b)',    marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions + Dividing Fractions',                                           skillIds: ['irregular_and_improper_fractions', 'dividing_fractions'], kind: 'mastery', visual: false, desc: 'identify that a correct improper-fraction result was converted to a mixed number wrongly' },
    { id: '3a',    label: '3(a)',    marks: 4,  topic: 'shape',    skill: 'Areas of Compound Shapes + Proportion',                                                           skillIds: ['areas_of_compound_shapes', 'proportion'], kind: 'exam', visual: false, desc: 'decide whether a stated quantity of paint covers an L-shaped floor, at a stated coverage rate' },
    { id: '3b',    label: '3(b)',    marks: 1,  topic: 'ratio',    skill: 'Proportion',                                                                                      skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'say whether a larger coverage rate changes that conclusion, with a reason' },
    { id: '4a',    label: '4(a)',    marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                                                                   skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'list the members of one set from a completed Venn diagram' },
    { id: '4b',    label: '4(b)',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                                  skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability of a set operation read off a Venn diagram' },
    { id: '5a',    label: '5(a)',    marks: 3,  topic: 'number',   skill: 'Estimating',                                                                                      skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'estimate a total cost from a distance and a rate per fixed distance, by rounding first' },
    { id: '5b',    label: '5(b)',    marks: 1,  topic: 'number',   skill: 'Estimating',                                                                                      skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'decide whether that estimate is an under- or overestimate, with a reason' },
    { id: '6a',    label: '6(a)',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                              skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a line drawn on a grid, fractional gradient' },
    { id: '6b',    label: '6(b)',    marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                              skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'any line parallel to a given one' },
    { id: '7',     label: '7',       marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                                    skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'percentage of a whole taken by one part, from a fraction of the total then two chained ratios sharing a term' },
    { id: '8',     label: '8',       marks: 3,  topic: 'probdata', skill: 'Mean',                                                                                            skillIds: ['mean'], kind: 'mastery', visual: false, desc: 'mean of the remaining items, from the mean of the whole set and the mean of a subset' },
    { id: '9',     label: '9',       marks: 1,  topic: 'number',   skill: 'Percentage Change',                                                                               skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage reduction behind a stated decimal multiplier' },
    { id: '10',    label: '10',      marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                                          skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'solve simultaneous linear equations algebraically, one solution negative' },
    { id: '11',    label: '11',      marks: 3,  topic: 'shape',    skill: 'Rotations + Translations',                                                                        skillIds: ['rotations', 'translations'], kind: 'exam', visual: false, desc: 'the single transformation equivalent to a translation followed by a rotation about a given point' },
    { id: '12i',   label: '12(i)',   marks: 1,  topic: 'algebra',  skill: 'Sketching Functions',                                                                             skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'match a translated quadratic to its sketched graph' },
    { id: '12ii',  label: '12(ii)',  marks: 1,  topic: 'algebra',  skill: 'Sketching Functions',                                                                             skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'match a negated cubic to its sketched graph' },
    { id: '12iii', label: '12(iii)', marks: 1,  topic: 'algebra',  skill: 'Sketching Functions',                                                                             skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'match a negative reciprocal to its sketched graph' },
    { id: '13a',   label: '13(a)',   marks: 3,  topic: 'probdata', skill: 'Histograms + Grouped Frequency Tables',                                                           skillIds: ['histograms', 'grouped_frequency_tables'], kind: 'mastery', visual: true, desc: 'draw a histogram from a grouped frequency table with five unequal class widths' },
    { id: '13b',   label: '13(b)',   marks: 2,  topic: 'probdata', skill: 'Histograms',                                                                                      skillIds: ['histograms'], kind: 'mastery', visual: false, desc: 'estimate the fraction of a population inside an interval that cuts across two class boundaries' },
    { id: '14',    label: '14',      marks: 3,  topic: 'algebra',  skill: 'Expanding Double Brackets',                                                                       skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'expand and simplify a product of three linear brackets, one non-monic' },
    { id: '15',    label: '15',      marks: 4,  topic: 'shape',    skill: 'Sector Calculations',                                                                             skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'area of a sector in terms of pi, its angle recovered from the arc length and radius' },
    { id: '16',    label: '16',      marks: 2,  topic: 'probdata', skill: 'Conditional Probability',                                                                         skillIds: ['conditional_probability'], kind: 'mastery', visual: false, desc: 'show an algebraic without-replacement probability simplifies to a given expression' },
    { id: '17a',   label: '17(a)',   marks: 1,  topic: 'number',   skill: 'Expanding and Rationalising Surds',                                                               skillIds: ['surds_expanding_and_rationalising'], kind: 'mastery', visual: false, desc: 'rationalise a single-surd denominator' },
    { id: '17b',   label: '17(b)',   marks: 2,  topic: 'number',   skill: 'Simplifying Surds',                                                                               skillIds: ['surds_simplifying'], kind: 'mastery', visual: false, desc: 'divide two surds and simplify the result' },
    { id: '18',    label: '18',      marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions + Adding and Subtracting Fractions',                              skillIds: ['recurring_decimals_to_fractions', 'adding_and_subtracting_fractions'], kind: 'exam', visual: false, desc: 'show the sum of two recurring decimals, with different recurring blocks, has a stated denominator' },
    { id: '19',    label: '19',      marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                                                       skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'ratio of two sides across a pair of similar isosceles triangles, from a ratio of two others' },
    { id: '20',    label: '20',      marks: 3,  topic: 'number',   skill: 'Simplifying Indices',                                                                             skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'an index from a product of powers equated to a quotient, given only the sum of two other indices' },
    { id: '21',    label: '21',      marks: 5,  topic: 'shape',    skill: 'Volume of a Prism + Areas of Squares and Rectangles + Solving Quadratic Equations (Factorising)', skillIds: ['volume_of_a_prism', 'areas_of_squares_and_rectangles', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'height of a cuboid from its volume, its total surface area and its length, with the width constrained to be the larger' },
    { id: '22a',   label: '22(a)',   marks: 2,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                                            skillIds: ['trig_graphs'], kind: 'mastery', visual: true, desc: 'sketch the sine curve over one period, with its maximum and minimum labelled' },
    { id: '22b',   label: '22(b)',   marks: 2,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                                            skillIds: ['trig_graphs'], kind: 'mastery', visual: false, desc: 'both solutions of a scaled sine equation in a stated range' },
    { id: '23',    label: '23',      marks: 5,  topic: 'algebra',  skill: 'Equation of a Circle + Understanding Straight Line Graphs',                                       skillIds: ['equation_of_a_circle', 'understanding_straight_line_graphs'], kind: 'exam', visual: false, desc: 'y-intercept of a chord of a circle centred on the origin, from one endpoint and the other\'s x coordinate' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
