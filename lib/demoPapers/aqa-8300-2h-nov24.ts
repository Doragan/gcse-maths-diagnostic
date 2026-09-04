import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2H — Higher Tier Paper 2 Calculator — November 2024.
 *
 * GENERATED from data/exam-audit/NOV24-H-P2.json by
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
export const AQA_8300_2H_NOV24: PaperConfig = {
  id: 'aqa-8300-2h-nov24',
  title: 'AQA GCSE Mathematics 8300/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                     skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'word-from-list vocabulary against a diagram image' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                     skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'word-from-list vocabulary' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                     skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'word-from-list vocabulary' },
    { id: '2',   label: '2',     marks: 3,  topic: 'probdata', skill: 'Mean + Grouped Frequency Tables',                                       skillIds: ['mean', 'grouped_frequency_tables'], kind: 'mastery', visual: false, desc: 'single numeric estimated mean' },
    { id: '3',   label: '3',     marks: 2,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                                        skillIds: ['symmetry'], kind: 'mastery', visual: true, desc: 'shading grid squares needs a clickable-grid input' },
    { id: '4',   label: '4',     marks: 3,  topic: 'ratio',    skill: 'Proportion + Compound Units',                                           skillIds: ['proportion', 'compound_units'], kind: 'exam', visual: false, desc: 'deliverable is a computed value plus a justified yes/no decision' },
    { id: '5',   label: '5',     marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion + Direct Proportion',                                skillIds: ['inverse_proportion', 'direct_proportion'], kind: 'mastery', visual: false, desc: 'circle-the-statement; the choice is the whole answer' },
    { id: '6',   label: '6',     marks: 2,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                  skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'show-that requires marking the Pythagoras working, not a single value' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability',                                        skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'single numeric difference' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability + Relative Frequency',                   skillIds: ['calculating_simple_probability', 'relative_frequency'], kind: 'mastery', visual: false, desc: 'worded justification about trial count; not markable by answer-matching' },
    { id: '8',   label: '8',     marks: 2,  topic: 'number',   skill: 'Standard Form',                                                         skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '9',   label: '9',     marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two numeric bound boxes (the inequality frame is preprinted)' },
    { id: '10',  label: '10',    marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage',                                                    skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'single numeric original amount' },
    { id: '11',  label: '11',    marks: 3,  topic: 'number',   skill: 'Simplifying Indices + Simplifying Expressions',                         skillIds: ['simplifying_indices', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'three algebraic answers need an algebraic-equivalence checker' },
    { id: '12',  label: '12',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                          skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '13',  label: '13',    marks: 4,  topic: 'shape',    skill: 'Trigonometry (missing sides) + Trigonometry (missing angles)',          skillIds: ['trigonometry_missing_sides', 'trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'single numeric angle' },
    { id: '14',  label: '14',    marks: 1,  topic: 'number',   skill: 'Percentage Change',                                                     skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'worded justification (successive percentages of different amounts) not markable' },
    { id: '15',  label: '15',    marks: 4,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Solving Linear Equations',         skillIds: ['alternate_and_corresponding_angles', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'single numeric value of x' },
    { id: '16',  label: '16',    marks: 4,  topic: 'algebra',  skill: 'Expanding Double Brackets + Solving Quadratic Equations (Factorising)', skillIds: ['expanding_double_brackets', 'solving_quadratic_equations_factorising'], kind: 'mastery', visual: false, desc: 'two numeric roots' },
    { id: '17',  label: '17',    marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Perpendicular Gradients',          skillIds: ['understanding_straight_line_graphs', 'perpendicular_gradients'], kind: 'mastery', visual: false, desc: 'perpendicularity decision plus a worded gradient justification' },
    { id: '18a', label: '18(a)', marks: 3,  topic: 'probdata', skill: 'Cumulative Frequency',                                                  skillIds: ['cumulative_frequency'], kind: 'mastery', visual: true, desc: 'drawing a cumulative-frequency curve needs a plotting input' },
    { id: '18b', label: '18(b)', marks: 4,  topic: 'probdata', skill: 'Cumulative Frequency + Interquartile Range + Median',                   skillIds: ['cumulative_frequency', 'interquartile_range', 'median'], kind: 'exam', visual: false, desc: 'read medians/IQR from a drawn graph then give contextual comparison statements' },
    { id: '19',  label: '19',    marks: 5,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Standard Form + Proportion',          skillIds: ['areas_of_squares_and_rectangles', 'standard_form', 'proportion'], kind: 'exam', visual: false, desc: 'single numeric cost' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Iteration + Substitution',                                              skillIds: ['iteration', 'substitution'], kind: 'mastery', visual: false, desc: 'two numeric terms' },
    { id: '21a', label: '21(a)', marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                      skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'half the credit is for drawing a tangent on the curve' },
    { id: '21b', label: '21(b)', marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                      skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'single numeric distance (range-tolerant)' },
    { id: '21c', label: '21(c)', marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                                      skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'tick plus a worded reason about the area approximation' },
    { id: '22',  label: '22',    marks: 3,  topic: 'algebra',  skill: 'Completing the Square + Nth Term of Quadratic Sequences',               skillIds: ['completing_the_square', 'nth_term_quadratic_sequences'], kind: 'exam', visual: false, desc: 'least-term proof via completing the square requires marking the argument' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre',                                       skillIds: ['circle_theorem_angle_at_centre'], kind: 'mastery', visual: false, desc: 'single numeric angle (diagram shown as image)' },
    { id: '23b', label: '23(b)', marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Cyclic Quadrilateral',                                  skillIds: ['circle_theorem_cyclic_quadrilateral'], kind: 'mastery', visual: false, desc: 'ratio answer needs a ratio-equivalence checker' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Alternate Segment + Algebraic Proof',                   skillIds: ['circle_theorem_alternate_segment', 'algebraic_proof'], kind: 'exam', visual: false, desc: 'geometric bisection proof requires marking a chain of reasoned statements' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
