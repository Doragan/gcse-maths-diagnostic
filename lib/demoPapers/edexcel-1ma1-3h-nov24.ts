import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/3H — Higher Tier Paper 3 Calculator — November 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-NOV24-H-P3.json by
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
export const EDEXCEL_1MA1_3H_NOV24: PaperConfig = {
  id: 'edexcel-1ma1-3h-nov24',
  title: 'Edexcel GCSE Mathematics 1MA1/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'probdata', skill: 'Frequency Diagrams + Grouped Frequency Tables',                                                    skillIds: ['frequency_diagrams', 'grouped_frequency_tables'], kind: 'mastery', visual: true, desc: 'draw a frequency polygon from a grouped frequency table, plotting at midpoints' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                                                                    skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard form to an ordinary number' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                                                                    skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'a number below 1 written in standard form' },
    { id: '3',   label: '3',     marks: 2,  topic: 'shape',    skill: 'Constructions',                                                                                    skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'construct an angle bisector with ruler and compasses, arcs shown' },
    { id: '4a',  label: '4(a)',  marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                                    skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage probability tree from one given probability' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                                    skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of the same outcome twice from a completed tree' },
    { id: '5',   label: '5',     marks: 5,  topic: 'ratio',    skill: 'Ratio + Percentage Change',                                                                        skillIds: ['ratio', 'percentage_change'], kind: 'exam', visual: false, desc: 'percentage profit on a mixed stock split by ratio, with a buy and a sell price for each kind' },
    { id: '6',   label: '6',     marks: 4,  topic: 'probdata', skill: 'Median + Range',                                                                                   skillIds: ['median', 'range'], kind: 'mastery', visual: false, desc: 'compare a stem and leaf distribution with a second one described only by its median and range' },
    { id: '7',   label: '7',     marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                                           skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval for a truncated calculator display' },
    { id: '8',   label: '8',     marks: 2,  topic: 'shape',    skill: 'Trigonometry (Missing Sides)',                                                                     skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'missing side of a right-angled triangle from one angle and the adjacent side' },
    { id: '9a',  label: '9(a)',  marks: 2,  topic: 'number',   skill: 'Simplifying Indices',                                                                              skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'multiply two terms in two letters with numerical coefficients' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                                                              skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'raise a power to a negative power' },
    { id: '10',  label: '10',    marks: 2,  topic: 'ratio',    skill: 'Reverse Percentage',                                                                               skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'original price from a sale price and the percentage reduction' },
    { id: '11',  label: '11',    marks: 3,  topic: 'shape',    skill: 'Sector Calculations',                                                                              skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'reflex angle of a sector from its radius and its whole perimeter, arc length not given' },
    { id: '12a', label: '12(a)', marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                                 skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'value after three years where the first year\'s interest rate differs from the later ones' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                                 skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'annual depreciation rate from a start value, an end value and two years' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity + Area of a Trapezium',                                                  skillIds: ['congruence_and_similarity', 'area_of_a_trapezium'], kind: 'exam', visual: false, desc: 'area of the trapezium between two similar triangles, from the two parallel sides and one whole length' },
    { id: '14',  label: '14',    marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions',                                                                  skillIds: ['recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'prove algebraically that a decimal with a non-recurring leading digit equals a given fraction' },
    { id: '15',  label: '15',    marks: 4,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject) + Factorising',                                        skillIds: ['rearranging_formulae', 'factorising'], kind: 'mastery', visual: false, desc: 'change the subject where the new subject appears on both sides and must be factorised out' },
    { id: '16',  label: '16',    marks: 5,  topic: 'algebra',  skill: 'Perpendicular Gradients + Coordinates',                                                            skillIds: ['perpendicular_gradients', 'coordinates'], kind: 'mastery', visual: false, desc: 'fourth vertex of a rectangle from two given points, one of them outside it on an extended side' },
    { id: '17',  label: '17',    marks: 4,  topic: 'shape',    skill: 'Cosine Rule + Area of a Triangle (½ab sinC)',                                                      skillIds: ['cosine_rule', 'area_of_triangle_sine'], kind: 'exam', visual: false, desc: 'area of a triangle given all three sides, to 3 significant figures' },
    { id: '18a', label: '18(a)', marks: 3,  topic: 'ratio',    skill: 'Proportion + Sampling',                                                                            skillIds: ['proportion', 'sampling'], kind: 'mastery', visual: false, desc: 'population estimate by capture-recapture' },
    { id: '18b', label: '18(b)', marks: 1,  topic: 'probdata', skill: 'Sampling',                                                                                         skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'state an assumption behind a capture-recapture estimate' },
    { id: '19',  label: '19',    marks: 4,  topic: 'shape',    skill: 'Surface Area of a Cone + Pythagoras\' Theorem',                                                    skillIds: ['surface_area_of_a_cone', 'pythagoras_theorem'], kind: 'exam', visual: false, desc: 'height of a cone from its total surface area, with the radius given as a fraction of the height' },
    { id: '20',  label: '20',    marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations (Linear and Quadratic) + Solving Quadratic Equations (Quadratic Equation)', skillIds: ['simultaneous_equations_quadratic', 'solving_quadratic_equations_quadratic_equation'], kind: 'exam', visual: false, desc: 'simultaneous linear and quadratic equations with irrational solutions, to 3 significant figures' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                                            skillIds: ['graph_transformations'], kind: 'mastery', visual: true, desc: 'draw the reflection of an unnamed curve in the x-axis' },
    { id: '21b', label: '21(b)', marks: 3,  topic: 'algebra',  skill: 'Graph Transformations + Trigonometric Graphs',                                                     skillIds: ['graph_transformations', 'trig_graphs'], kind: 'exam', visual: false, desc: 'image of a turning point of the sine curve under a combined horizontal and vertical translation' },
    { id: '22',  label: '22',    marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                                                 skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'estimate the area under a velocity-time curve using a stated number of equal strips' },
    { id: '23',  label: '23',    marks: 5,  topic: 'algebra',  skill: 'Completing the Square + Sketching Functions',                                                      skillIds: ['completing_the_square', 'sketching_functions'], kind: 'exam', visual: true, desc: 'sketch a quadratic with a letter coefficient, turning point and intercept both in terms of that letter' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
