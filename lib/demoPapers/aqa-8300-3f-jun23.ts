import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/JUN23-F-P3.json by
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
export const AQA_8300_3F_JUN23: PaperConfig = {
  id: 'aqa-8300-3f-jun23',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                                              skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                                              skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                                              skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'probdata', skill: 'Mode',                                                                                  skillIds: ['mode'], kind: 'mastery', visual: false, desc: '' },
    { id: '2b',  label: '2(b)',  marks: 2,  topic: 'probdata', skill: 'Median',                                                                                skillIds: ['median'], kind: 'mastery', visual: false, desc: '' },
    { id: '2c',  label: '2(c)',  marks: 1,  topic: 'probdata', skill: 'Range',                                                                                 skillIds: ['range'], kind: 'mastery', visual: false, desc: '' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'two blanks referring to a static spinner diagram' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                                    skillIds: ['systematic_listing'], kind: 'mastery', visual: true, desc: 'requires labelling two spinner diagrams to fit a given outcome list' },
    { id: '4',   label: '4',     marks: 3,  topic: 'number',   skill: 'Converting Measurements + Simple Arithmetic',                                           skillIds: ['converting_measurements', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'the unit is part of the answer and must be stated' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                                             skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                                             skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                                      skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'static distance-time graph supported' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs + Time Calculations',                                                  skillIds: ['kinematic_graphs', 'time_calculations'], kind: 'mastery', visual: false, desc: '' },
    { id: '6c',  label: '6(c)',  marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                                      skillIds: ['kinematic_graphs'], kind: 'mastery', visual: true, desc: 'requires drawing the return leg on a distance-time graph' },
    { id: '7',   label: '7',     marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Time Calculations',                                                 skillIds: ['simple_arithmetic', 'time_calculations'], kind: 'mastery', visual: false, desc: '' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Converting Measurements',                                        skillIds: ['fractions_of_amounts', 'converting_measurements'], kind: 'exam', visual: false, desc: 'show-that between two bounds; all three comparable values must be evidenced' },
    { id: '9',   label: '9',     marks: 3,  topic: 'shape',    skill: 'Angles in Polygons',                                                                    skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                                                   skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'index-notation answer needs equivalence checker' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'algebra',  skill: 'Simplifying Expressions',                                                               skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '11',  label: '11',    marks: 2,  topic: 'ratio',    skill: 'Ratio + Angles on lines and Circles',                                                   skillIds: ['ratio', 'angles_on_lines_and_circles'], kind: 'exam', visual: false, desc: 'show-that: the target is given so only the working scores' },
    { id: '12a', label: '12(a)', marks: 2,  topic: 'algebra',  skill: 'Inequalities + Simple Arithmetic',                                                      skillIds: ['inequalities', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'open answer set graded against several simultaneous conditions' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'algebra',  skill: 'Inequalities + Decimals',                                                               skillIds: ['inequalities', 'decimals'], kind: 'mastery', visual: false, desc: 'open answer set graded against several simultaneous conditions' },
    { id: '13',  label: '13',    marks: 2,  topic: 'shape',    skill: 'Alternate and Corresponding Angles',                                                    skillIds: ['alternate_and_corresponding_angles'], kind: 'mastery', visual: false, desc: 'tick credited only with a correct supporting angle shown on the diagram' },
    { id: '14',  label: '14',    marks: 3,  topic: 'algebra',  skill: 'Simplifying Expressions + Forming Expressions and Formulae',                            skillIds: ['simplifying_expressions', 'forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'algebra-to-description matching; needs a pairing input' },
    { id: '15',  label: '15',    marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations + Simple Arithmetic',                                            skillIds: ['simultaneous_equations', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '16',  label: '16',    marks: 3,  topic: 'shape',    skill: 'Areas of Triangles + Areas of Squares and Rectangles',                                  skillIds: ['areas_of_triangles', 'areas_of_squares_and_rectangles'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '17',  label: '17',    marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                                             skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'name-to-sequence matching; needs a pairing input' },
    { id: '18',  label: '18',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                      skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '19',  label: '19',    marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity + Areas of Squares and Rectangles + Properties of 3D Solids', skillIds: ['congruence_and_similarity', 'areas_of_squares_and_rectangles', 'properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'tick + worded reason about joined faces; not markable' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                                    skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'multi-blank table entry' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                   skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'requires point-plotting and smooth-curve drawing' },
    { id: '21',  label: '21',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Simple Arithmetic',                                                             skillIds: ['ratio', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'yes-no decision credited only with the per-brother amount shown' },
    { id: '22',  label: '22',    marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                            skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '23',  label: '23',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                                                          skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '24a', label: '24(a)', marks: 2,  topic: 'number',   skill: 'Estimating + Significant Figures',                                                      skillIds: ['estimating', 'significant_figures'], kind: 'mastery', visual: false, desc: '' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'number',   skill: 'Estimating',                                                                            skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'worded reason; not markable' },
    { id: '25a', label: '25(a)', marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                                                skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '25b', label: '25(b)', marks: 1,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising)',                                             skillIds: ['solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'two-root answer needs a multi-blank response' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
