import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1H — Higher Tier Paper 1 Non-calculator — November 2023.
 *
 * GENERATED from data/exam-audit/NOV23-H-P1.json by
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
export const AQA_8300_1H_NOV23: PaperConfig = {
  id: 'aqa-8300-1h-nov23',
  title: 'AQA GCSE Mathematics 8300/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — November 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Lowest Common Multiple',                                                              skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'shape',    skill: 'Angles in Polygons',                                                                  skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                         skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '4',   label: '4',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                                             skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '5',   label: '5',     marks: 3,  topic: 'number',   skill: 'Simplifying Indices + Indices',                                                       skillIds: ['simplifying_indices', 'indices'], kind: 'mastery', visual: false, desc: 'decimal answer required; index form not credited' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'probdata', skill: 'Scatter Graphs',                                                                      skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'worded description of a relationship; not markable' },
    { id: '6b',  label: '6(b)',  marks: 3,  topic: 'probdata', skill: 'Scatter Graphs + Proportion',                                                         skillIds: ['scatter_graphs', 'proportion'], kind: 'exam', visual: false, desc: 'answer accepted over a range because the read-off is open' },
    { id: '7',   label: '7',     marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage + Fractions Decimals and Percentages',                             skillIds: ['reverse_percentage', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '8',   label: '8',     marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Areas of Triangles + Simplifying Ratio',            skillIds: ['areas_of_squares_and_rectangles', 'areas_of_triangles', 'simplifying_ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs simplest-form equivalence check; static diagram supported' },
    { id: '9',   label: '9',     marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                 skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'two range-tolerance roots read off a graph; needs a two-blank response' },
    { id: '10',  label: '10',    marks: 5,  topic: 'shape',    skill: 'Area of a Circle + Sector Calculations',                                              skillIds: ['area_of_a_circle', 'sector_calculations'], kind: 'mastery', visual: false, desc: 'choice credited only with two comparable areas shown' },
    { id: '11',  label: '11',    marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                                              skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'number',   skill: 'Standard Form',                                                                       skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: '' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'number',   skill: 'Standard Form + Simplifying Ratio',                                                   skillIds: ['standard_form', 'simplifying_ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '13',  label: '13',    marks: 3,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Expressions',                                        skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'two-blank answer; values must be evaluated' },
    { id: '14',  label: '14',    marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                               skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'probdata', skill: 'Box Plots',                                                                           skillIds: ['box_plots'], kind: 'mastery', visual: false, desc: 'static box plot supported' },
    { id: '15b', label: '15(b)', marks: 4,  topic: 'probdata', skill: 'Box Plots + Median + Interquartile Range',                                            skillIds: ['box_plots', 'median', 'interquartile_range'], kind: 'mastery', visual: false, desc: 'two worded comparisons each needing a supporting statistic; not markable' },
    { id: '16a', label: '16(a)', marks: 3,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                      skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; static Venn supported' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'probdata', skill: 'Conditional Probability + Venn Diagrams',                                             skillIds: ['conditional_probability', 'venn_diagrams'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '17',  label: '17',    marks: 3,  topic: 'algebra',  skill: 'Inequalities',                                                                        skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: '' },
    { id: '18a', label: '18(a)', marks: 2,  topic: 'shape',    skill: 'Rotations + Translations',                                                            skillIds: ['rotations', 'translations'], kind: 'mastery', visual: false, desc: 'two-blank description combining an angle and a vector' },
    { id: '18b', label: '18(b)', marks: 1,  topic: 'shape',    skill: 'Reflections + Coordinates',                                                           skillIds: ['reflections', 'coordinates'], kind: 'mastery', visual: false, desc: 'open answer: several coordinate pairs satisfy the invariance condition' },
    { id: '19',  label: '19',    marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions + Adding and Subtracting Fractions',                  skillIds: ['recurring_decimals_to_fractions', 'adding_and_subtracting_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '20',  label: '20',    marks: 3,  topic: 'shape',    skill: 'Exact Trigonometric Values',                                                          skillIds: ['exact_trig_values'], kind: 'mastery', visual: false, desc: '' },
    { id: '21',  label: '21',    marks: 5,  topic: 'algebra',  skill: 'Inverse Functions + Composite Functions + Solving Quadratic Equations (Factorising)', skillIds: ['inverse_functions', 'composite_functions', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'two-root answer needs a multi-blank response' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Circle Theorem: Cyclic Quadrilateral + Ratio',                                        skillIds: ['circle_theorem_cyclic_quadrilateral', 'ratio'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Dividing Fractions + Simplifying Surds',                                              skillIds: ['dividing_fractions', 'surds_simplifying'], kind: 'exam', visual: false, desc: 'surd answer in a prescribed form; needs symbolic-equivalence checker' },
    { id: '24',  label: '24',    marks: 1,  topic: 'algebra',  skill: 'Perpendicular Gradients',                                                             skillIds: ['perpendicular_gradients'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '25',  label: '25',    marks: 2,  topic: 'algebra',  skill: 'Sequences + Fractional and Negative Indices',                                         skillIds: ['sequences', 'fractional_and_negative_indices'], kind: 'exam', visual: false, desc: 'answer in a prescribed surd form; needs symbolic-equivalence checker' },
    { id: '26a', label: '26(a)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                     skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '26b', label: '26(b)', marks: 2,  topic: 'number',   skill: 'Simplifying Indices + Fractional and Negative Indices',                               skillIds: ['simplifying_indices', 'fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'index-notation answer needs equivalence checker' },
    { id: '27',  label: '27',    marks: 1,  topic: 'algebra',  skill: 'Quadratic Inequalities',                                                              skillIds: ['quadratic_inequalities'], kind: 'mastery', visual: false, desc: 'double-inequality answer needs an inequality-equivalence checker' },
    { id: '28',  label: '28',    marks: 3,  topic: 'shape',    skill: 'Vector Proof + Vectors + Ratio',                                                      skillIds: ['vector_proof', 'vectors', 'ratio'], kind: 'exam', visual: false, desc: 'vector proof; the parallel conclusion is worded, not a value' },
    { id: '29a', label: '29(a)', marks: 1,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                                skillIds: ['trig_graphs'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '29b', label: '29(b)', marks: 1,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                                skillIds: ['trig_graphs'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
