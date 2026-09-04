import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3H — Higher Tier Paper 3 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/JUN23-H-P3.json by
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
export const AQA_8300_3H_JUN23: PaperConfig = {
  id: 'aqa-8300-3h-jun23',
  title: 'AQA GCSE Mathematics 8300/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Coordinates',                                      skillIds: ['understanding_straight_line_graphs', 'coordinates'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Converting Decimals to Fractions',                                                      skillIds: ['converting_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'open answer: any equivalent fraction is accepted, so exact-match fails' },
    { id: '3',   label: '3',     marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                                                              skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '4',   label: '4',     marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                  skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: '' },
    { id: '5',   label: '5',     marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                      skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '6',   label: '6',     marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity + Areas of Squares and Rectangles + Properties of 3D Solids', skillIds: ['congruence_and_similarity', 'areas_of_squares_and_rectangles', 'properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'tick + worded reason about joined faces; not markable' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                                    skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'multi-blank table entry' },
    { id: '7b',  label: '7(b)',  marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                   skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'requires point-plotting and smooth-curve drawing' },
    { id: '8',   label: '8',     marks: 4,  topic: 'ratio',    skill: 'Ratio + Simple Arithmetic',                                                             skillIds: ['ratio', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'yes-no decision credited only with the per-brother amount shown' },
    { id: '9',   label: '9',     marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                            skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '10',  label: '10',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                                                          skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'number',   skill: 'Estimating + Significant Figures',                                                      skillIds: ['estimating', 'significant_figures'], kind: 'mastery', visual: false, desc: '' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'number',   skill: 'Estimating',                                                                            skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'worded reason; not markable' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                                                    skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'choice + worded reason; not markable' },
    { id: '12b', label: '12(b)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                                                    skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'worded reason about attainable relative frequencies; not markable' },
    { id: '12c', label: '12(c)', marks: 2,  topic: 'probdata', skill: 'Relative Frequency + Expected Outcomes',                                                skillIds: ['relative_frequency', 'expected_outcomes'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 4,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',                                                    skillIds: ['compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'yes-no decision credited only with the total time shown' },
    { id: '14',  label: '14',    marks: 4,  topic: 'ratio',    skill: 'Reverse Percentage + Percentage Change',                                                skillIds: ['reverse_percentage', 'percentage_change'], kind: 'mastery', visual: false, desc: '' },
    { id: '15a', label: '15(a)', marks: 3,  topic: 'probdata', skill: 'Histograms',                                                                            skillIds: ['histograms'], kind: 'mastery', visual: false, desc: 'static histogram supported' },
    { id: '15b', label: '15(b)', marks: 3,  topic: 'probdata', skill: 'Box Plots',                                                                             skillIds: ['box_plots'], kind: 'mastery', visual: true, desc: 'requires drawing a box plot to scale' },
    { id: '16',  label: '16',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Pythagoras\' Theorem + Areas of Triangles',                                     skillIds: ['ratio', 'pythagoras_theorem', 'areas_of_triangles'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '17',  label: '17',    marks: 4,  topic: 'algebra',  skill: 'Algebraic Fractions + Solving Linear Equations',                                        skillIds: ['algebraic_fractions', 'solving_linear_equations'], kind: 'exam', visual: false, desc: '' },
    { id: '18a', label: '18(a)', marks: 3,  topic: 'algebra',  skill: 'Composite Functions + Expanding Double Brackets',                                       skillIds: ['composite_functions', 'expanding_double_brackets'], kind: 'exam', visual: false, desc: 'algebraic show-that; the target is given so only the working scores' },
    { id: '18b', label: '18(b)', marks: 3,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Quadratic Equation)',                                      skillIds: ['solving_quadratic_equations_quadratic_equation'], kind: 'mastery', visual: false, desc: 'two-root answer needs a multi-blank response' },
    { id: '19',  label: '19',    marks: 3,  topic: 'algebra',  skill: 'Algebraic Proof + Expanding Double Brackets',                                           skillIds: ['algebraic_proof', 'expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'algebraic proof; the conclusion must be reached as a squared bracket' },
    { id: '20a', label: '20(a)', marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion + Substitution',                                                     skillIds: ['inverse_proportion', 'substitution'], kind: 'mastery', visual: false, desc: 'choose-your-own-point verification; the substitution must be evidenced' },
    { id: '20b', label: '20(b)', marks: 4,  topic: 'ratio',    skill: 'Proportion with Powers + Simplifying Ratio',                                            skillIds: ['proportion_with_powers', 'simplifying_ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs simplest-form equivalence check' },
    { id: '21',  label: '21',    marks: 3,  topic: 'shape',    skill: 'Plans and Elevations + Volume of a prism',                                              skillIds: ['plans_and_elevations', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'two answers in one part; needs a two-blank response' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Fractional and Negative Enlargements + Enlargements',                                   skillIds: ['fractional_enlargements', 'enlargements'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines a name, a scale factor and a centre in free text' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'shape',    skill: 'Cosine Rule',                                                                           skillIds: ['cosine_rule'], kind: 'mastery', visual: false, desc: 'show-that to a rounded target; the unrounded value must be evidenced' },
    { id: '23b', label: '23(b)', marks: 4,  topic: 'shape',    skill: 'Sine Rule + Bearings',                                                                  skillIds: ['sine_rule', 'bearings'], kind: 'exam', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
