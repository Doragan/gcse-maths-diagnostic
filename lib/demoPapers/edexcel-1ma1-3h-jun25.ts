import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/3H — Higher Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-H-P3.json by
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
export const EDEXCEL_1MA1_3H_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-3h-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'probdata', skill: 'Frequency Diagrams + Grouped Frequency Tables',                          skillIds: ['frequency_diagrams', 'grouped_frequency_tables'], kind: 'mastery', visual: true, desc: 'draw a frequency polygon from a grouped frequency table' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                            skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'identify the error in a worked change of subject' },
    { id: '2b',  label: '2(b)',  marks: 2,  topic: 'algebra',  skill: 'Factorising',                                                            skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise fully a two-term expression in two letters' },
    { id: '3',   label: '3',     marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                      skillIds: ['percentage_change'], kind: 'exam', visual: false, desc: 'percentage profit from a bulk cost and a per-unit selling price' },
    { id: '4',   label: '4',     marks: 4,  topic: 'ratio',    skill: 'Compound Units + Converting Measurements',                               skillIds: ['compound_units', 'converting_measurements'], kind: 'exam', visual: false, desc: 'compare unit prices across two currencies and two mass units' },
    { id: '5',   label: '5',     marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                 skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'error interval for a value rounded to one decimal place' },
    { id: '6',   label: '6',     marks: 3,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',                                     skillIds: ['compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'average speed from a distance and a time given in hours and minutes' },
    { id: '7',   label: '7',     marks: 3,  topic: 'shape',    skill: 'Coordinates',                                                            skillIds: ['coordinates'], kind: 'exam', visual: false, desc: 'coordinates of a point extending a line segment by a fraction of its length' },
    { id: '8',   label: '8',     marks: 5,  topic: 'shape',    skill: 'Area of a Trapezium + Pythagoras\' Theorem',                             skillIds: ['area_of_a_trapezium', 'pythagoras_theorem'], kind: 'exam', visual: false, desc: 'perimeter of a trapezium from its area and two of its sides' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                                          skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'write a number given in standard form as an ordinary number' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                                          skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'write a small decimal in standard form' },
    { id: '10',  label: '10',    marks: 2,  topic: 'number',   skill: 'Exact Calculations + Significant Figures',                               skillIds: ['exact_calculations', 'significant_figures'], kind: 'mastery', visual: false, desc: 'evaluate a compound expression on a calculator and round to three significant figures' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'number',   skill: 'Simplifying Indices',                                                    skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'unknown index from an equation written in powers of one base' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                        skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'evaluate a fractional power of a numerical coefficient and a letter' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'ratio',    skill: 'Reverse Percentage',                                                     skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'judge a claimed method for reversing a percentage increase' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage',                                                     skillIds: ['reverse_percentage'], kind: 'exam', visual: false, desc: 'work back through a percentage fall followed by a percentage rise' },
    { id: '13',  label: '13',    marks: 3,  topic: 'algebra',  skill: 'Sketching Functions',                                                    skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'match four equations to the shapes of their graphs' },
    { id: '14',  label: '14',    marks: 2,  topic: 'shape',    skill: 'Area of a Triangle (½ab sinC)',                                          skillIds: ['area_of_triangle_sine'], kind: 'mastery', visual: false, desc: 'area of a triangle from two sides and the included angle' },
    { id: '15',  label: '15',    marks: 4,  topic: 'probdata', skill: 'Combined Events + Systematic Listing',                                   skillIds: ['combined_events', 'systematic_listing'], kind: 'exam', visual: false, desc: 'probability of at least two successes in three trials with replacement' },
    { id: '16',  label: '16',    marks: 4,  topic: 'shape',    skill: 'Volume of a Pyramid and Cone + Volume of a prism',                       skillIds: ['volume_of_a_pyramid_and_cone', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'height of a cone from the total volume of a cone-and-cylinder solid' },
    { id: '17',  label: '17',    marks: 3,  topic: 'algebra',  skill: 'Algebraic Fractions + Solving Linear Equations',                         skillIds: ['algebraic_fractions', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'solve an equation carrying two algebraic fractions' },
    { id: '18a', label: '18(a)', marks: 4,  topic: 'probdata', skill: 'Venn Diagrams',                                                          skillIds: ['venn_diagrams'], kind: 'exam', visual: true, desc: 'complete a three-set Venn diagram from overlapping totals' },
    { id: '18b', label: '18(b)', marks: 2,  topic: 'probdata', skill: 'Conditional Probability',                                                skillIds: ['conditional_probability'], kind: 'mastery', visual: false, desc: 'conditional probability read off a completed Venn diagram' },
    { id: '19',  label: '19',    marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                 skillIds: ['upper_and_lower_bounds'], kind: 'exam', visual: false, desc: 'upper bound of a count from two rounded measurements' },
    { id: '20',  label: '20',    marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre + Circle Theorem: Cyclic Quadrilateral', skillIds: ['circle_theorem_angle_at_centre', 'circle_theorem_cyclic_quadrilateral'], kind: 'exam', visual: false, desc: 'angle in a circle, quoting the circle theorems used' },
    { id: '21',  label: '21',    marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations (Linear and Quadratic)',                          skillIds: ['simultaneous_equations_quadratic'], kind: 'exam', visual: false, desc: 'solve a linear and a quadratic pair of simultaneous equations' },
    { id: '22',  label: '22',    marks: 4,  topic: 'algebra',  skill: 'Equation of a Circle + Perpendicular Gradients',                         skillIds: ['equation_of_a_circle', 'perpendicular_gradients'], kind: 'exam', visual: false, desc: 'point of tangency between a given line and a circle centred at the origin' },
    { id: '23',  label: '23',    marks: 5,  topic: 'shape',    skill: 'Vector Proof',                                                           skillIds: ['vector_proof'], kind: 'exam', visual: false, desc: 'scalar in a vector expression from a collinearity condition' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
