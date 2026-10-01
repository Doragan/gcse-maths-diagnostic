import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/2H — Higher Tier Paper 2 Calculator — November 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-NOV24-H-P2.json by
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
export const EDEXCEL_1MA1_2H_NOV24: PaperConfig = {
  id: 'edexcel-1ma1-2h-nov24',
  title: 'Edexcel GCSE Mathematics 1MA1/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 2,  topic: 'number',   skill: 'Exact Calculations',                                                   skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate a fraction with a two-term numerator and a product denominator on a calculator, all digits given' },
    { id: '2a',    label: '2(a)',    marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'name the type of correlation on a scatter graph' },
    { id: '2b',    label: '2(b)',    marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'draw a line of best fit' },
    { id: '2c',    label: '2(c)',    marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'estimate a value from a line of best fit' },
    { id: '3',     label: '3',       marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                           skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'better value for money across two currencies and two pack sizes, with an exchange rate given' },
    { id: '4',     label: '4',       marks: 2,  topic: 'probdata', skill: 'Venn Diagrams',                                                        skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'identify two faults in someone else\'s Venn diagram — a duplicated element and a missing element of the universal set' },
    { id: '5a',    label: '5(a)',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                   skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '5b',    label: '5(b)',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                  skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve from a table of values' },
    { id: '6',     label: '6',       marks: 4,  topic: 'number',   skill: 'Percentage Change',                                                    skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'test a claim comparing two percentage increases by a stated multiple' },
    { id: '7',     label: '7',       marks: 5,  topic: 'shape',    skill: 'Areas of Triangles + Solving Linear Equations + Pythagoras\' Theorem', skillIds: ['areas_of_triangles', 'solving_linear_equations', 'pythagoras_theorem'], kind: 'exam', visual: false, desc: 'area of an isosceles triangle whose three algebraic side lengths are fixed by a stated perimeter' },
    { id: '8',     label: '8',       marks: 2,  topic: 'number',   skill: 'Standard Form',                                                        skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'divide two standard-form values with negative indices, answer in standard form' },
    { id: '9',     label: '9',       marks: 3,  topic: 'shape',    skill: 'Angles in Polygons + Properties of 2D Shapes',                         skillIds: ['angles_in_polygons', 'properties_of_2d_shapes'], kind: 'exam', visual: false, desc: 'show a quadrilateral formed between two congruent regular nonagons cannot be a square' },
    { id: '10',    label: '10',      marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations',                                               skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'solve simultaneous linear equations algebraically, both solutions negative and one non-integer' },
    { id: '11',    label: '11',      marks: 2,  topic: 'shape',    skill: 'Fractional and Negative Enlargements',                                 skillIds: ['fractional_enlargements'], kind: 'mastery', visual: false, desc: 'describe fully a single enlargement with a fractional scale factor, scale factor and centre' },
    { id: '12',    label: '12',      marks: 5,  topic: 'ratio',    skill: 'Compound Units + Volume of a Prism',                                   skillIds: ['compound_units', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'side length of a cube of equal mass to a cylinder, from the two densities' },
    { id: '13a',   label: '13(a)',   marks: 1,  topic: 'ratio',    skill: 'Direct Proportion',                                                    skillIds: ['direct_proportion'], kind: 'mastery', visual: false, desc: 'reject a claim that a constant first difference means direct proportion' },
    { id: '13bi',  label: '13(bi)',  marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers',                                               skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'value of a variable proportional to a square root, from one given pair' },
    { id: '13bii', label: '13(bii)', marks: 1,  topic: 'ratio',    skill: 'Proportion with Powers + Sketching Functions',                         skillIds: ['proportion_with_powers', 'sketching_functions'], kind: 'mastery', visual: true, desc: 'sketch the shape of a square-root proportional relationship' },
    { id: '14',    label: '14',      marks: 2,  topic: 'probdata', skill: 'Counting Without Listing',                                             skillIds: ['counting_without_listing'], kind: 'mastery', visual: false, desc: 'total fixtures where ten teams each play every other team a fixed number of times' },
    { id: '15a',   label: '15(a)',   marks: 3,  topic: 'algebra',  skill: 'Nth Term of Quadratic Sequences',                                      skillIds: ['nth_term_quadratic_sequences'], kind: 'mastery', visual: false, desc: 'nth term of a quadratic sequence with a non-unit leading coefficient' },
    { id: '15b',   label: '15(b)',   marks: 3,  topic: 'algebra',  skill: 'Sequences + Solving Linear Equations',                                 skillIds: ['sequences', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'fourth term of a recurrence whose constant must first be found from the first two terms' },
    { id: '16',    label: '16',      marks: 4,  topic: 'probdata', skill: 'Histograms',                                                           skillIds: ['histograms'], kind: 'mastery', visual: true, desc: 'complete a histogram where two missing frequencies are equal and the overall total is given' },
    { id: '17',    label: '17',      marks: 3,  topic: 'algebra',  skill: 'Algebraic Fractions',                                                  skillIds: ['algebraic_fractions'], kind: 'mastery', visual: false, desc: 'show a sum and difference of three algebraic fractions simplifies to a single term' },
    { id: '18',    label: '18',      marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                            skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'prove a radius bisects the angle between two equal chords, by congruent triangles with reasons' },
    { id: '19',    label: '19',      marks: 5,  topic: 'number',   skill: 'Upper and Lower Bounds',                                               skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'value of a three-variable expression to a justified degree of accuracy, by comparing its bounds' },
    { id: '20',    label: '20',      marks: 3,  topic: 'shape',    skill: '3D Trigonometry',                                                      skillIds: ['trigonometry_3d'], kind: 'mastery', visual: false, desc: 'base edge of a pyramid on an equilateral triangle, from the apex height above an internally divided median and one angle' },
    { id: '21',    label: '21',      marks: 5,  topic: 'algebra',  skill: 'Perpendicular Gradients + Solving Quadratic Equations (Factorising)',  skillIds: ['perpendicular_gradients', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'both positions of a third point making a right angle with two fixed points, its coordinates given in terms of one letter' },
    { id: '22',    label: '22',      marks: 5,  topic: 'probdata', skill: 'Conditional Probability + Solving Quadratic Equations (Factorising)',  skillIds: ['conditional_probability', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'population size from a without-replacement same-colour probability and a known fraction of one colour' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
