import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/04 — Higher Tier Paper 4 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/OCR-JUN25-H-P4.json by
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
export const OCR_J560_04_JUN25: PaperConfig = {
  id: 'ocr-j560-04-jun25',
  title: 'OCR GCSE Mathematics J560/04',
  subtitle: 'Higher Tier Paper 4 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 2,  topic: 'number',   skill: 'Exact Calculations + Significant Figures',           skillIds: ['exact_calculations', 'significant_figures'], kind: 'exam', visual: false, desc: 'calculator evaluation of a compound expression, answer to 3 significant figures' },
    { id: '2',     label: '2',       marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Converting Measurements',        skillIds: ['simplifying_ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'express a ratio of two metric units in the form 1 : n' },
    { id: '3',     label: '3',       marks: 4,  topic: 'shape',    skill: 'Lengths and Perimeters + Circumfrence of a Circle',  skillIds: ['lengths_and_perimeters', 'circumfrence_of_a_circle'], kind: 'exam', visual: false, desc: 'perimeter of a rectangle with a semicircle removed from one side' },
    { id: '4a',    label: '4(a)',    marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe the correlation shown by each of three scatter diagrams' },
    { id: '4b',    label: '4(b)',    marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                     skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'draw a line of best fit and estimate from it' },
    { id: '5a',    label: '5(a)',    marks: 1,  topic: 'algebra',  skill: 'Expanding Double Brackets',                          skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'decide whether each algebraic statement is an equation or an identity' },
    { id: '5b',    label: '5(b)',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                 skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a line parallel to a given line through a given point' },
    { id: '6',     label: '6',       marks: 5,  topic: 'ratio',    skill: 'Compound Units',                                     skillIds: ['compound_units'], kind: 'exam', visual: false, desc: 'average speed over two legs at different speeds, compared with a stated bound' },
    { id: '7a',    label: '7(a)',    marks: 2,  topic: 'shape',    skill: 'Angles in Polygons',                                 skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'show the interior angle of a regular pentagon' },
    { id: '7b',    label: '7(b)',    marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Exterior Angles',               skillIds: ['angles_in_polygons', 'exterior_angles'], kind: 'exam', visual: false, desc: 'number of sides of a regular polygon from angles meeting at a point' },
    { id: '8',     label: '8',       marks: 3,  topic: 'probdata', skill: 'Sampling',                                           skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'three criticisms of a sampling method' },
    { id: '9a',    label: '9(a)',    marks: 1,  topic: 'number',   skill: 'Standard Form',                                      skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'write a small decimal in standard form' },
    { id: '9b',    label: '9(b)',    marks: 4,  topic: 'number',   skill: 'Standard Form + Compound Units',                     skillIds: ['standard_form', 'compound_units'], kind: 'exam', visual: false, desc: 'population density from populations and areas given in standard form' },
    { id: '10',    label: '10',      marks: 3,  topic: 'number',   skill: 'Simplifying Indices',                                skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'unknown power from an index-law equation over a common base' },
    { id: '11',    label: '11',      marks: 5,  topic: 'algebra',  skill: 'Simultaneous Equations + Function Machines',         skillIds: ['simultaneous_equations', 'function_machines'], kind: 'exam', visual: false, desc: 'two unknown machine parameters from two conditions relating the outputs' },
    { id: '12',    label: '12',      marks: 5,  topic: 'shape',    skill: 'Area of a Trapezium + Pythagoras\' Theorem',         skillIds: ['area_of_a_trapezium', 'pythagoras_theorem'], kind: 'exam', visual: false, desc: 'area of an isosceles trapezium whose height must first be found from the slant sides' },
    { id: '13a',   label: '13(a)',   marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                  skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'explain why a quadrilateral with the centre as a vertex is not cyclic' },
    { id: '13b',   label: '13(b)',   marks: 2,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre',                    skillIds: ['circle_theorem_angle_at_centre'], kind: 'mastery', visual: false, desc: 'angle at the circumference from a reflex angle at the centre' },
    { id: '14a',   label: '14(a)',   marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                               skillIds: ['cumulative_frequency'], kind: 'exam', visual: false, desc: 'test a claim about being above the median using a cumulative frequency curve' },
    { id: '14b',   label: '14(b)',   marks: 3,  topic: 'probdata', skill: 'Cumulative Frequency',                               skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'minimum score for the top decile from a cumulative frequency curve' },
    { id: '15',    label: '15',      marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers',                             skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'formula for a variable inversely proportional to the square of another' },
    { id: '16a',   label: '16(a)',   marks: 1,  topic: 'ratio',    skill: 'Growth and Decay',                                   skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'initial value read off an exponential growth formula' },
    { id: '16b',   label: '16(b)',   marks: 1,  topic: 'ratio',    skill: 'Growth and Decay',                                   skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'annual percentage increase read off an exponential growth formula' },
    { id: '16ci',  label: '16(ci)',  marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                   skillIds: ['growth_and_decay'], kind: 'exam', visual: false, desc: 'show an exponential model crosses a threshold between two consecutive years' },
    { id: '16cii', label: '16(cii)', marks: 1,  topic: 'ratio',    skill: 'Growth and Decay',                                   skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'give a reason an exponential model might not hold' },
    { id: '17a',   label: '17(a)',   marks: 2,  topic: 'algebra',  skill: 'Equation of a Circle',                               skillIds: ['equation_of_a_circle'], kind: 'mastery', visual: false, desc: 'equation of a circle centred on the origin, read off a diagram' },
    { id: '17b',   label: '17(b)',   marks: 3,  topic: 'algebra',  skill: 'Equation of a Circle',                               skillIds: ['equation_of_a_circle'], kind: 'exam', visual: false, desc: 'decide whether a point lies inside or outside a circle, with a reason' },
    { id: '18a',   label: '18(a)',   marks: 3,  topic: 'algebra',  skill: 'Sequences + Solving Linear Equations',               skillIds: ['sequences', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'unknown multiplier in a recurrence relation from two consecutive terms' },
    { id: '18bi',  label: '18(bi)',  marks: 2,  topic: 'algebra',  skill: 'Sequences + Solving Linear Equations',               skillIds: ['sequences', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'first term of a recurrence relation given a ratio between the first two terms' },
    { id: '18bii', label: '18(bii)', marks: 1,  topic: 'algebra',  skill: 'Sequences',                                          skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'describe the behaviour of a recurrence relation at its fixed point' },
    { id: '19',    label: '19',      marks: 3,  topic: 'number',   skill: 'Expanding and Rationalising Surds',                  skillIds: ['surds_expanding_and_rationalising'], kind: 'mastery', visual: false, desc: 'expand a product of two surd brackets and simplify to a single surd multiple' },
    { id: '20',    label: '20',      marks: 3,  topic: 'shape',    skill: 'Sine Rule',                                          skillIds: ['sine_rule'], kind: 'mastery', visual: false, desc: 'a side of a non-right-angled triangle from two angles and a side' },
    { id: '21a',   label: '21(a)',   marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs',                                   skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'average rate of change of a plotted function between two x values' },
    { id: '21b',   label: '21(b)',   marks: 4,  topic: 'algebra',  skill: 'Kinematic Graphs',                                   skillIds: ['kinematic_graphs'], kind: 'exam', visual: false, desc: 'estimate the gradient of a curve at a point by drawing a tangent' },
    { id: '22',    label: '22',      marks: 5,  topic: 'probdata', skill: 'Conditional Probability',                            skillIds: ['conditional_probability'], kind: 'exam', visual: false, desc: 'conditional probability from three overlapping group totals' },
    { id: '23a',   label: '23(a)',   marks: 6,  topic: 'algebra',  skill: 'Expanding Double Brackets + Factorising Quadratics', skillIds: ['expanding_double_brackets', 'factorising_quadratics'], kind: 'exam', visual: false, desc: 'expand a triple-bracket difference and refactorise the result' },
    { id: '23b',   label: '23(b)',   marks: 1,  topic: 'algebra',  skill: 'Completing the Square',                              skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'value of x minimising an expression in completed-square form' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
