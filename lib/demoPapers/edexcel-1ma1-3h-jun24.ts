import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/3H — Higher Tier Paper 3 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN24-H-P3.json by
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
export const EDEXCEL_1MA1_3H_JUN24: PaperConfig = {
  id: 'edexcel-1ma1-3h-jun24',
  title: 'Edexcel GCSE Mathematics 1MA1/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',    label: '1',      marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                     skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two two- and three-digit numbers' },
    { id: '2ai',  label: '2(ai)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                             skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard form to an ordinary number, positive index' },
    { id: '2aii', label: '2(aii)', marks: 1,  topic: 'number',   skill: 'Standard Form',                                             skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard form to an ordinary number, negative index' },
    { id: '2b',   label: '2(b)',   marks: 2,  topic: 'number',   skill: 'Standard Form',                                             skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'add two standard-form values with different indices, answer in standard form' },
    { id: '3a',   label: '3(a)',   marks: 1,  topic: 'shape',    skill: 'Plans and Elevations',                                      skillIds: ['plans_and_elevations'], kind: 'mastery', visual: false, desc: 'explain why a side elevation drawn with the slant height rather than the perpendicular height is wrong' },
    { id: '3b',   label: '3(b)',   marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                      skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'draw the plan of a triangular prism on a centimetre grid' },
    { id: '4',    label: '4',      marks: 4,  topic: 'ratio',    skill: 'Growth and Decay',                                          skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'population after three years of a stated compound percentage increase' },
    { id: '5',    label: '5',      marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                            skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'density of a second substance, its volume found from an identical tin\'s capacity less an unfilled space' },
    { id: '6a',   label: '6(a)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                             skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage probability tree for two differently biased coins' },
    { id: '6b',   label: '6(b)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                             skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of both events from a completed tree' },
    { id: '7',    label: '7',      marks: 4,  topic: 'shape',    skill: 'Volume of a Prism + Compound Units',                        skillIds: ['volume_of_a_prism', 'compound_units'], kind: 'exam', visual: false, desc: 'minutes to fill a cylinder at a stated volume rate, to the nearest minute' },
    { id: '8',    label: '8',      marks: 3,  topic: 'shape',    skill: 'Vectors',                                                   skillIds: ['vectors'], kind: 'mastery', visual: true, desc: 'draw and label a linear combination of two given column vectors, direction arrow required' },
    { id: '9',    label: '9',      marks: 3,  topic: 'shape',    skill: 'Volume of a Pyramid and Cone + Volume of a Prism',          skillIds: ['volume_of_a_pyramid_and_cone', 'volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'perpendicular height of a square-based pyramid whose volume equals that of a given cube' },
    { id: '10',   label: '10',     marks: 3,  topic: 'algebra',  skill: 'Algebraic Proof + Ratio',                                   skillIds: ['algebraic_proof', 'ratio'], kind: 'exam', visual: false, desc: 'show algebraically that two bags total a stated multiple of one part, one bag split by ratio and the other half its size' },
    { id: '11a',  label: '11(a)',  marks: 3,  topic: 'probdata', skill: 'Box Plots + Interquartile Range',                           skillIds: ['box_plots', 'interquartile_range'], kind: 'mastery', visual: true, desc: 'draw a box plot where the upper quartile and greatest value must first be derived from an IQR and a range' },
    { id: '11b',  label: '11(b)',  marks: 2,  topic: 'probdata', skill: 'Box Plots + Median',                                        skillIds: ['box_plots', 'median'], kind: 'mastery', visual: false, desc: 'compare two box plots on an average and on spread, at least one comparison in context' },
    { id: '12',   label: '12',     marks: 2,  topic: 'shape',    skill: 'Fractional and Negative Enlargements',                      skillIds: ['fractional_enlargements'], kind: 'mastery', visual: true, desc: 'enlarge a triangle by a negative scale factor about the origin' },
    { id: '13',   label: '13',     marks: 2,  topic: 'probdata', skill: 'Counting Without Listing',                                  skillIds: ['counting_without_listing'], kind: 'mastery', visual: false, desc: 'number of unordered pairs that can be chosen from a group' },
    { id: '14',   label: '14',     marks: 4,  topic: 'ratio',    skill: 'Growth and Decay + Solving Linear Equations',               skillIds: ['growth_and_decay', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the original investment, worked back through two years of compound interest each followed by a withdrawal' },
    { id: '15a',  label: '15(a)',  marks: 1,  topic: 'algebra',  skill: 'Algebraic Fractions',                                       skillIds: ['algebraic_fractions'], kind: 'mastery', visual: false, desc: 'cancel a repeated bracket in an algebraic fraction' },
    { id: '15b',  label: '15(b)',  marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                    skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'factorise a non-monic quadratic with a negative constant' },
    { id: '15c',  label: '15(c)',  marks: 3,  topic: 'algebra',  skill: 'Algebraic Fractions + Difference of Two Squares',           skillIds: ['algebraic_fractions', 'difference_of_two_squares'], kind: 'exam', visual: false, desc: 'divide two algebraic fractions, one numerator a difference of two squares' },
    { id: '16a',  label: '16(a)',  marks: 1,  topic: 'algebra',  skill: 'Functions Notation',                                        skillIds: ['functions_notation'], kind: 'mastery', visual: false, desc: 'evaluate a reciprocal function at a negative value' },
    { id: '16b',  label: '16(b)',  marks: 2,  topic: 'algebra',  skill: 'Composite Functions',                                       skillIds: ['composite_functions'], kind: 'mastery', visual: false, desc: 'value of a composite of a linear and a reciprocal function' },
    { id: '16c',  label: '16(c)',  marks: 2,  topic: 'algebra',  skill: 'Inverse Functions',                                         skillIds: ['inverse_functions'], kind: 'mastery', visual: false, desc: 'value of an inverse function at a point' },
    { id: '17',   label: '17',     marks: 3,  topic: 'algebra',  skill: 'Sequences',                                                 skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'a later term of a geometric recurrence given its rule and one term' },
    { id: '18',   label: '18',     marks: 5,  topic: 'shape',    skill: 'Area of a Triangle (½ab sinC) + Sine Rule',                 skillIds: ['area_of_triangle_sine', 'sine_rule'], kind: 'mastery', visual: false, desc: 'area of the second triangle in a quadrilateral, the shared diagonal recovered from the first triangle\'s area' },
    { id: '19',   label: '19',     marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds + Standard Form',                    skillIds: ['upper_and_lower_bounds', 'standard_form'], kind: 'exam', visual: false, desc: 'lower bound of a quotient of two standard-form values given to different accuracies' },
    { id: '20a',  label: '20(a)',  marks: 2,  topic: 'algebra',  skill: 'Sequences + Solving Linear Equations',                      skillIds: ['sequences', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the letter making three algebraic expressions consecutive terms of an arithmetic sequence' },
    { id: '20b',  label: '20(b)',  marks: 5,  topic: 'algebra',  skill: 'Sequences + Simultaneous Equations (Linear and Quadratic)', skillIds: ['sequences', 'simultaneous_equations_quadratic'], kind: 'exam', visual: false, desc: 'both letters making the same three expressions consecutive terms of a geometric sequence' },
    { id: '21',   label: '21',     marks: 4,  topic: 'shape',    skill: 'Exact Trigonometric Values + Circumfrence of a Circle',     skillIds: ['exact_trig_values', 'circumfrence_of_a_circle'], kind: 'exam', visual: false, desc: 'bound pi between two exact surds, by comparing a circle\'s circumference with the perimeters of an inscribed and a circumscribed hexagon' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
