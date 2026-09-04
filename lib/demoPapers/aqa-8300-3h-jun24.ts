import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3H — Higher Tier Paper 3 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/JUN24-H-P3.json by
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
export const AQA_8300_3H_JUN24: PaperConfig = {
  id: 'aqa-8300-3h-jun24',
  title: 'AQA GCSE Mathematics 8300/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                  skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'draw next pattern on a grid — visual/grid input unsupported' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'algebra',  skill: 'Substitution + Inequalities',                                                                skillIds: ['substitution', 'inequalities'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 3,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                                       skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'figure supplied via image_url (supported); two-stage Pythagoras' },
    { id: '3',   label: '3',     marks: 1,  topic: 'probdata', skill: 'Sampling',                                                                                   skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'open worded justification — needs marking judgement' },
    { id: '4',   label: '4',     marks: 1,  topic: 'algebra',  skill: 'Expanding Brackets',                                                                         skillIds: ['expanding_brackets'], kind: 'mastery', visual: false, desc: 'clean explicit-MC fit (all/some/no values)' },
    { id: '5',   label: '5',     marks: 2,  topic: 'shape',    skill: 'Plans and Elevations + Volume of a prism',                                                   skillIds: ['plans_and_elevations', 'volume_of_a_prism'], kind: 'exam', visual: true, desc: 'deduce depth from volume then draw elevation on grid' },
    { id: '6a',  label: '6(a)',  marks: 5,  topic: 'ratio',    skill: 'Compound Units + Converting Measurements',                                                   skillIds: ['compound_units', 'converting_measurements'], kind: 'exam', visual: false, desc: '' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'ratio',    skill: 'Compound Units',                                                                             skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'MC options reference \'answer to part (a)\' — expressible as explicit MC' },
    { id: '7',   label: '7',     marks: 3,  topic: 'algebra',  skill: 'Plotting Straight Line Graphs',                                                              skillIds: ['plotting_straight_line_graphs'], kind: 'mastery', visual: true, desc: 'plot a straight line on axes — graph plotting unsupported' },
    { id: '8',   label: '8',     marks: 4,  topic: 'probdata', skill: 'Mean + Pie Charts',                                                                          skillIds: ['mean', 'pie_charts'], kind: 'exam', visual: false, desc: 'pie chart supplied via image_url (supported)' },
    { id: '9',   label: '9',     marks: 3,  topic: 'ratio',    skill: 'Compound Units + Converting Measurements + Proportion',                                      skillIds: ['compound_units', 'converting_measurements', 'proportion'], kind: 'exam', visual: false, desc: 'Town A/B tick is incidental; the 3 marks are the comparative density working — a numeric-only variant (e.g. \'find Town A density\') would be serveable' },
    { id: '10',  label: '10',    marks: 3,  topic: 'probdata', skill: 'Expected Outcomes',                                                                          skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 2,  topic: 'number',   skill: 'Indices + Solving Linear Equations',                                                         skillIds: ['indices', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'two separate box inputs incl. pi-exact value; non-standard answer entry' },
    { id: '12a', label: '12(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                              skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'fill probabilities into a given tree diagram structure' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                                            skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'answer accepts equivalent fraction/decimal (39/400 = 0.0975)' },
    { id: '13',  label: '13',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                        skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'graph supplied via image_url (supported); two-root answer entry' },
    { id: '14',  label: '14',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Proportion',                                                                         skillIds: ['ratio', 'proportion'], kind: 'mastery', visual: false, desc: 'show-that — requires graded chain of working' },
    { id: '15a', label: '15(a)', marks: 3,  topic: 'ratio',    skill: 'Ratio + Coordinates',                                                                        skillIds: ['ratio', 'coordinates'], kind: 'exam', visual: false, desc: 'coordinate-pair answer entry' },
    { id: '15b', label: '15(b)', marks: 4,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Perpendicular Gradients',                               skillIds: ['understanding_straight_line_graphs', 'perpendicular_gradients'], kind: 'mastery', visual: false, desc: 'linear-equation answer with multiple equivalent forms (y=1/2x-8.5 vs 2y=x-17)' },
    { id: '16',  label: '16',    marks: 3,  topic: 'probdata', skill: 'Calculating Simple Probability + Relative Frequency',                                        skillIds: ['calculating_simple_probability', 'relative_frequency'], kind: 'mastery', visual: false, desc: 'Yes/No tick is incidental; the 3 marks are computing relative freq vs theoretical prob in comparable form — working-gated' },
    { id: '17a', label: '17(a)', marks: 3,  topic: 'number',   skill: 'Prime Factor Decomposition + Indices',                                                       skillIds: ['prime_factor_decomposition', 'indices'], kind: 'exam', visual: false, desc: '' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'number',   skill: 'Indices + Prime Factor Decomposition',                                                       skillIds: ['indices', 'prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'explicit-MC fit with expression options (e=cd, e=c^2d, ...)' },
    { id: '18a', label: '18(a)', marks: 3,  topic: 'shape',    skill: 'Sine Rule',                                                                                  skillIds: ['sine_rule'], kind: 'mastery', visual: false, desc: 'show-that with diagram — circular use of x=64 scores M0' },
    { id: '18b', label: '18(b)', marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                                                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'Yes/No tick is incidental; the mark is in the worded reason (fine SSA-vs-SAS distinctions B1 vs B0)' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'algebra',  skill: 'Composite Functions + Functions Notation',                                                   skillIds: ['composite_functions', 'functions_notation'], kind: 'mastery', visual: false, desc: '' },
    { id: '19b', label: '19(b)', marks: 4,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Factorising) + Functions Notation + Expanding Double Brackets', skillIds: ['solving_quadratic_equations_factorising', 'functions_notation', 'expanding_double_brackets'], kind: 'exam', visual: false, desc: 'two-solution answer (x=2 and x=8)' },
    { id: '20',  label: '20',    marks: 5,  topic: 'ratio',    skill: 'Direct Proportion + Inverse Proportion + Proportion with Powers',                            skillIds: ['direct_proportion', 'inverse_proportion', 'proportion_with_powers'], kind: 'exam', visual: false, desc: '' },
    { id: '21a', label: '21(a)', marks: 3,  topic: 'shape',    skill: 'Volume of a prism + Volume of a Sphere + Ratio',                                             skillIds: ['volume_of_a_prism', 'volume_of_a_sphere', 'ratio'], kind: 'exam', visual: false, desc: 'ratio answer entry / equivalence (3:4 = 3/4 = 1.33)' },
    { id: '21b', label: '21(b)', marks: 2,  topic: 'shape',    skill: 'Volume of a prism + Proportion with Powers',                                                 skillIds: ['volume_of_a_prism', 'proportion_with_powers'], kind: 'exam', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                                         skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: '' },
    { id: '23',  label: '23',    marks: 1,  topic: 'shape',    skill: 'Reflections + Symmetry (Line and Rotational)',                                               skillIds: ['reflections', 'symmetry'], kind: 'mastery', visual: false, desc: 'diagram supplied via image_url (supported); clean circle-one MC' },
    { id: '24',  label: '24',    marks: 3,  topic: 'algebra',  skill: 'Completing the Square',                                                                      skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'completed-square expression — equivalence checking of d(x+e)^2+f form' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
