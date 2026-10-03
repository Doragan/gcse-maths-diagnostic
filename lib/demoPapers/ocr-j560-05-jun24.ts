import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/05 — Higher Tier Paper 5 Non-calculator — June 2024.
 *
 * GENERATED from data/exam-audit/OCR-JUN24-H-P5.json by
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
export const OCR_J560_05_JUN24: PaperConfig = {
  id: 'ocr-j560-05-jun24',
  title: 'OCR GCSE Mathematics J560/05',
  subtitle: 'Higher Tier Paper 5 Non-calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'number',   skill: 'Decimals',                                                                                  skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'non-calculator division by a two-decimal-place number' },
    { id: '2a',  label: '2(a)',  marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                                        skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'complete a difference table for two cards drawn without replacement' },
    { id: '2b',  label: '2(b)',  marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                                        skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'probability of a union of two overlapping conditions read off a difference table' },
    { id: '3a',  label: '3(a)',  marks: 6,  topic: 'ratio',    skill: 'Compound Units + Time Calculations + Fractions of Amounts',                                 skillIds: ['compound_units', 'time_calculations', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'arrival time for a journey split into three stages, two of them a fraction and a percentage of the distance at stated speeds and the third given as a duration' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'ratio',    skill: 'Compound Units',                                                                            skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'state an assumption behind treating a speed limit as the speed travelled' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe the type of correlation on a scatter diagram' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'circle the point that does not follow the trend, given a reason it would not' },
    { id: '4c',  label: '4(c)',  marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'draw a line of best fit and read an estimate off it' },
    { id: '4d',  label: '4(d)',  marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                                            skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'explain why an estimate beyond the range of the data is unreliable' },
    { id: '4e',  label: '4(e)',  marks: 3,  topic: 'probdata', skill: 'Scatter Graphs + Fractions Decimals and Percentages',                                       skillIds: ['scatter_graphs', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'percentage of plotted points meeting a condition on both axes' },
    { id: '5',   label: '5',     marks: 3,  topic: 'shape',    skill: 'Loci + Constructions',                                                                      skillIds: ['loci', 'constructions'], kind: 'mastery', visual: true, desc: 'construct an angle bisector and shade the region nearer one arm than the other' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Estimating + Compound Units',                                                               skillIds: ['estimating', 'compound_units'], kind: 'exam', visual: false, desc: 'estimate a mass from a volume and a density, both rounded to 1 significant figure first' },
    { id: '7',   label: '7',     marks: 6,  topic: 'number',   skill: 'Dividing Fractions + Ratio',                                                                skillIds: ['dividing_fractions', 'ratio'], kind: 'exam', visual: false, desc: 'how many fixed-fraction cups a mixed-number volume fills once diluted in a stated ratio' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'ratio',    skill: 'Direct Proportion',                                                                         skillIds: ['direct_proportion'], kind: 'mastery', visual: false, desc: 'percentage change in a directly proportional variable when its partner doubles' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion',                                                                        skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'percentage change in an inversely proportional variable when its partner doubles' },
    { id: '9',   label: '9',     marks: 4,  topic: 'algebra',  skill: 'Substitution',                                                                              skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'distance travelled under uniform acceleration, using two of three printed kinematics formulas in turn' },
    { id: '10',  label: '10',    marks: 4,  topic: 'shape',    skill: 'Lengths and Perimeters + Solving Linear Equations',                                         skillIds: ['lengths_and_perimeters', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'letter value from equating a rectangle\'s algebraic perimeter with an equilateral triangle\'s numerical one' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'shape',    skill: 'Vectors',                                                                                   skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'write a vector drawn on a grid as a column vector, one component negative' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'shape',    skill: 'Vectors',                                                                                   skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'a column vector of the same length as a given one but a different direction' },
    { id: '11c', label: '11(c)', marks: 3,  topic: 'shape',    skill: 'Vectors',                                                                                   skillIds: ['vectors'], kind: 'mastery', visual: true, desc: 'draw a difference of two vectors on a grid, with a direction arrow, where only twice the second is given' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'ratio',    skill: 'Growth and Decay',                                                                          skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'reject a claim that treats compound interest as the same cash amount each year' },
    { id: '12b', label: '12(b)', marks: 4,  topic: 'ratio',    skill: 'Growth and Decay + Exponential Graphs',                                                     skillIds: ['growth_and_decay', 'exponential_graphs'], kind: 'exam', visual: false, desc: 'both constants of an exponential depreciation formula, from its intercept and its value after one year' },
    { id: '13',  label: '13',    marks: 3,  topic: 'algebra',  skill: 'Quadratic Inequalities',                                                                    skillIds: ['quadratic_inequalities'], kind: 'mastery', visual: false, desc: 'solve a quadratic inequality whose solution is two separate regions' },
    { id: '14',  label: '14',    marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term + Algebraic Fractions',                                                skillIds: ['finding_the_nth_term', 'algebraic_fractions'], kind: 'exam', visual: false, desc: 'nth term of a sequence of fractions, numerator and denominator each linear in n' },
    { id: '15',  label: '15',    marks: 3,  topic: 'algebra',  skill: 'Expanding Double Brackets',                                                                 skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'expand and simplify a product of three linear brackets, one non-monic' },
    { id: '16',  label: '16',    marks: 3,  topic: 'shape',    skill: 'Area and Volume Scale Factors',                                                             skillIds: ['area_and_volume_scale_factors'], kind: 'mastery', visual: false, desc: 'height of a similar prism from a volume ratio and the other\'s height' },
    { id: '17',  label: '17',    marks: 5,  topic: 'number',   skill: 'Recurring Decimals to Fractions + Adding and Subtracting Fractions',                        skillIds: ['recurring_decimals_to_fractions', 'adding_and_subtracting_fractions'], kind: 'exam', visual: false, desc: 'the far end of a number line from a recurring-decimal start, a mixed-number midpoint, answer as a simplified mixed number' },
    { id: '18',  label: '18',    marks: 4,  topic: 'shape',    skill: 'Volume of a Sphere + Volume of a Pyramid and Cone',                                         skillIds: ['volume_of_a_sphere', 'volume_of_a_pyramid_and_cone'], kind: 'exam', visual: false, desc: 'a cone\'s radius in terms of a sphere\'s, their volumes equal and the cone\'s height twice its radius' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'shape',    skill: 'Rotations',                                                                                 skillIds: ['rotations'], kind: 'mastery', visual: false, desc: 'the single rotation equivalent to two rotations about the origin in opposite senses' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'shape',    skill: 'Reflections',                                                                               skillIds: ['reflections'], kind: 'mastery', visual: false, desc: 'which vertices of a rectangle are invariant under reflection in a line through one of its sides' },
    { id: '20',  label: '20',    marks: 7,  topic: 'shape',    skill: 'Sector Calculations + Exact Trigonometric Values + Simplifying Surds',                      skillIds: ['sector_calculations', 'exact_trig_values', 'surds_simplifying'], kind: 'exam', visual: false, desc: 'perimeter of a major sector plus its chord, in exact a√b + kπ form, from a radius and the angle between chord and radius' },
    { id: '21',  label: '21',    marks: 6,  topic: 'algebra',  skill: 'Simultaneous Equations (Linear and Quadratic) + Solving Quadratic Equations (Factorising)', skillIds: ['simultaneous_equations_quadratic', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'both intersection points of a line and a quadratic through the origin, one coordinate pair fractional' },
    { id: '22a', label: '22(a)', marks: 2,  topic: 'algebra',  skill: 'Exponential Graphs',                                                                        skillIds: ['exponential_graphs'], kind: 'mastery', visual: true, desc: 'sketch an exponential curve, its y-intercept indicated' },
    { id: '22b', label: '22(b)', marks: 2,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                                      skillIds: ['trig_graphs'], kind: 'mastery', visual: true, desc: 'sketch the cosine curve over one period, its x-intercepts indicated' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'probdata', skill: 'Conditional Probability + Venn Diagrams',                                                   skillIds: ['conditional_probability', 'venn_diagrams'], kind: 'mastery', visual: false, desc: 'conditional probability from a three-set Venn diagram, conditioned on one set' },
    { id: '23b', label: '23(b)', marks: 3,  topic: 'probdata', skill: 'Conditional Probability + Venn Diagrams',                                                   skillIds: ['conditional_probability', 'venn_diagrams'], kind: 'mastery', visual: false, desc: 'show a without-replacement probability of two specified single-set regions equals a stated fraction, both orders counted' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
