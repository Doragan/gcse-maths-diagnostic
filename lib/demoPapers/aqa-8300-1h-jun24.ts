import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1H — Higher Tier Paper 1 Non-calculator — June 2024.
 *
 * GENERATED from data/exam-audit/JUN24-H-P1.json by
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
export const AQA_8300_1H_JUN24: PaperConfig = {
  id: 'aqa-8300-1h-jun24',
  title: 'AQA GCSE Mathematics 8300/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 3,  topic: 'number',   skill: 'Indices + Simple Arithmetic',                                                  skillIds: ['indices', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'shape',    skill: 'Measuring Lines and Angles',                                                   skillIds: ['measuring_lines_and_angles'], kind: 'mastery', visual: false, desc: 'physical ruler measurement off a printed line — unsupported' },
    { id: '3',   label: '3',     marks: 1,  topic: 'shape',    skill: 'Vectors + Translations',                                                       skillIds: ['vectors', 'translations'], kind: 'mastery', visual: false, desc: 'grid supplied via image_url (supported); column-vector answer entry, must distinguish from coordinate' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds + Rounding',                                            skillIds: ['upper_and_lower_bounds', 'rounding'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds + Rounding',                                            skillIds: ['upper_and_lower_bounds', 'rounding'], kind: 'mastery', visual: false, desc: '' },
    { id: '5a',  label: '5(a)',  marks: 3,  topic: 'probdata', skill: 'Venn Diagrams',                                                                skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'completing a Venn-diagram region structure — unsupported' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'probdata', skill: 'Conditional Probability',                                                      skillIds: ['conditional_probability'], kind: 'mastery', visual: false, desc: 'ft on part (a) lost — app would mark against true value' },
    { id: '6a',  label: '6(a)',  marks: 2,  topic: 'probdata', skill: 'Time Series',                                                                  skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'plotting points and joining on a time-series grid — unsupported' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'probdata', skill: 'Time Series',                                                                  skillIds: ['time_series'], kind: 'mastery', visual: false, desc: 'graph via image_url; open estimate accepted as numeric range [82,90]' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'shape',    skill: 'Surface Area of a Cone',                                                       skillIds: ['surface_area_of_a_cone'], kind: 'mastery', visual: false, desc: 'identify-the-error worded explanation — unsupported' },
    { id: '7b',  label: '7(b)',  marks: 2,  topic: 'shape',    skill: 'Area of a Circle',                                                             skillIds: ['area_of_a_circle'], kind: 'mastery', visual: false, desc: 'cone diagram via image_url (supported)' },
    { id: '7c',  label: '7(c)',  marks: 1,  topic: 'shape',    skill: 'Area of a Circle + Estimating',                                                skillIds: ['area_of_a_circle', 'estimating'], kind: 'exam', visual: false, desc: 'More/Less tick is incidental; mark is in the worded reason' },
    { id: '8',   label: '8',     marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations',                                                     skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '9',   label: '9',     marks: 3,  topic: 'number',   skill: 'Simplifying Fractions + Decimals',                                             skillIds: ['simplifying_fractions', 'decimals'], kind: 'exam', visual: false, desc: '' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                                                 skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'representing an inequality on a number line — drawing unsupported' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                                 skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'inequality answer (y >= -3/5) — sign + equivalent-form checking' },
    { id: '11',  label: '11',    marks: 3,  topic: 'shape',    skill: 'Enlargements',                                                                 skillIds: ['enlargements'], kind: 'mastery', visual: false, desc: '\'describe fully\' — 3 separate components (type/SF/centre) graded from prose' },
    { id: '12',  label: '12',    marks: 3,  topic: 'shape',    skill: 'Sector Calculations',                                                          skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'diagram via image_url; answer \'in terms of pi\' (4pi) — exact-symbolic checking' },
    { id: '13',  label: '13',    marks: 4,  topic: 'shape',    skill: 'Areas of Compound Shapes + Symmetry (Line and Rotational)',                    skillIds: ['areas_of_compound_shapes', 'symmetry'], kind: 'exam', visual: true, desc: 'construct a pentagon meeting 6 geometric constraints — drawing unsupported' },
    { id: '14',  label: '14',    marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                       skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two-value answer (bar 80p, mints 50p)' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'number',   skill: 'Estimating + Simplifying Surds',                                               skillIds: ['estimating', 'surds_simplifying'], kind: 'mastery', visual: false, desc: 'two consecutive integers (14 and 15)' },
    { id: '15b', label: '15(b)', marks: 3,  topic: 'number',   skill: 'Estimating + Indices',                                                         skillIds: ['estimating', 'indices'], kind: 'exam', visual: false, desc: 'show that A < B via approximation — graded working' },
    { id: '16',  label: '16',    marks: 2,  topic: 'probdata', skill: 'Median + Interquartile Range',                                                 skillIds: ['median', 'interquartile_range'], kind: 'mastery', visual: false, desc: 'two worded comparisons (average + consistency) — graded prose' },
    { id: '17',  label: '17',    marks: 4,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject) + Algebraic Fractions',            skillIds: ['rearranging_formulae', 'algebraic_fractions'], kind: 'exam', visual: false, desc: 'rearranged expression x = 7/(y-3) — multiple equivalent forms' },
    { id: '18',  label: '18',    marks: 1,  topic: 'algebra',  skill: 'Equation of a Circle',                                                         skillIds: ['equation_of_a_circle'], kind: 'mastery', visual: false, desc: 'equation answer (x^2+y^2=36) — equivalent-form checking; graph via image_url' },
    { id: '19',  label: '19',    marks: 4,  topic: 'number',   skill: 'Percentage Change + Ratio',                                                    skillIds: ['percentage_change', 'ratio'], kind: 'exam', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Equations and Identities',                                                     skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'three chained values a,b,c (each feeds the next)' },
    { id: '21',  label: '21',    marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions',                                              skillIds: ['recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'prove algebraically, but the assessable output is the fraction 56/55' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Circle Theorem: Tangent and Radius + Angles in Polygons',                      skillIds: ['circle_theorem_tangent', 'angles_in_polygons'], kind: 'mastery', visual: false, desc: 'angle in degrees; circle diagram via image_url' },
    { id: '23a', label: '23(a)', marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                    skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '23b', label: '23(b)', marks: 3,  topic: 'number',   skill: 'Expanding and Rationalising Surds + Expanding Double Brackets',                skillIds: ['surds_expanding_and_rationalising', 'expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'show that (2+sqrt3)^3 = 26+15sqrt3 — graded working (answer given)' },
    { id: '24a', label: '24(a)', marks: 5,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising) + Forming Expressions and Formulae', skillIds: ['solving_quadratic_equations_factorising', 'forming_expressions_and_formulae'], kind: 'exam', visual: false, desc: '' },
    { id: '24b', label: '24(b)', marks: 2,  topic: 'algebra',  skill: 'Algebraic Proof + Simplifying Surds',                                          skillIds: ['algebraic_proof', 'surds_simplifying'], kind: 'exam', visual: false, desc: 'show next square = x + 2sqrt(x) + 1 — algebraic proof (answer given)' },
    { id: '25',  label: '25',    marks: 4,  topic: 'shape',    skill: 'Exact Trigonometric Values',                                                   skillIds: ['exact_trig_values'], kind: 'mastery', visual: false, desc: 'exact trig values combined; clean integer result (7)' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
