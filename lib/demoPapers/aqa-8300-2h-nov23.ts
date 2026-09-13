import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2H — Higher Tier Paper 2 Calculator — November 2023.
 *
 * GENERATED from data/exam-audit/NOV23-H-P2.json by
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
export const AQA_8300_2H_NOV23: PaperConfig = {
  id: 'aqa-8300-2h-nov23',
  title: 'AQA GCSE Mathematics 8300/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — November 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Indices',                                skillIds: ['expanding_brackets', 'simplifying_indices'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions + Simplifying Fractions',                skillIds: ['irregular_and_improper_fractions', 'simplifying_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker with a simplest-form requirement' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                      skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 3,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                    skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '4',   label: '4',     marks: 1,  topic: 'shape',    skill: 'Bearings',                                                                skillIds: ['bearings'], kind: 'mastery', visual: false, desc: 'static diagram supported; three-figure format required' },
    { id: '5',   label: '5',     marks: 5,  topic: 'ratio',    skill: 'Proportion + Percentage Change + Fractions of Amounts',                   skillIds: ['proportion', 'percentage_change', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'shop choice plus a total; credited only with comparable costs shown' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                                                    skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'probdata', skill: 'Pie Charts + Fractions Decimals and Percentages',                         skillIds: ['pie_charts', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; not markable' },
    { id: '7',   label: '7',     marks: 3,  topic: 'shape',    skill: 'Volume of a prism',                                                       skillIds: ['volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'static isometric diagram supported' },
    { id: '8',   label: '8',     marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '9',   label: '9',     marks: 3,  topic: 'algebra',  skill: 'Sequences + Simplifying Expressions',                                     skillIds: ['sequences', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'algebraic show-that; the multiple must be made explicit' },
    { id: '10',  label: '10',    marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                                           skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '11',  label: '11',    marks: 1,  topic: 'probdata', skill: 'Combined Events + Indices',                                               skillIds: ['combined_events', 'indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '12',  label: '12',    marks: 3,  topic: 'probdata', skill: 'Mean',                                                                    skillIds: ['mean'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Coordinates',                        skillIds: ['understanding_straight_line_graphs', 'coordinates'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '14',  label: '14',    marks: 4,  topic: 'shape',    skill: 'Constructions + Loci',                                                    skillIds: ['constructions', 'loci'], kind: 'mastery', visual: true, desc: 'requires compass constructions and a shaded region on a scale drawing' },
    { id: '15a', label: '15(a)', marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                                      skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: '' },
    { id: '15b', label: '15(b)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency + Expected Outcomes',                                  skillIds: ['relative_frequency', 'expected_outcomes'], kind: 'mastery', visual: false, desc: '' },
    { id: '16',  label: '16',    marks: 1,  topic: 'number',   skill: 'Indices + Simple Arithmetic',                                             skillIds: ['indices', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                    skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: '' },
    { id: '17b', label: '17(b)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                    skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '18',  label: '18',    marks: 3,  topic: 'algebra',  skill: 'Completing the Square + Algebraic Proof',                                 skillIds: ['completing_the_square', 'algebraic_proof'], kind: 'exam', visual: false, desc: 'proof: the positivity conclusion is worded, not a value' },
    { id: '19',  label: '19',    marks: 1,  topic: 'ratio',    skill: 'Proportion with Powers',                                                  skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'tick + worded reason; not markable' },
    { id: '20',  label: '20',    marks: 4,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject) + Algebraic Fractions',       skillIds: ['rearranging_formulae', 'algebraic_fractions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '21',  label: '21',    marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                  skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'yes-no decision credited only with both upper bounds and their total shown' },
    { id: '22',  label: '22',    marks: 1,  topic: 'algebra',  skill: 'Difference of Two Squares',                                               skillIds: ['difference_of_two_squares'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '23a', label: '23(a)', marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs + Area of a Trapezium',                                  skillIds: ['kinematic_graphs', 'area_of_a_trapezium'], kind: 'exam', visual: false, desc: 'estimate from a graph read-off, so the answer is accepted over a range' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'algebra',  skill: 'Kinematic Graphs + Compound Units',                                       skillIds: ['kinematic_graphs', 'compound_units'], kind: 'mastery', visual: false, desc: 'units form part of the answer' },
    { id: '24',  label: '24',    marks: 3,  topic: 'algebra',  skill: 'Algebraic Fractions + Factorising',                                       skillIds: ['algebraic_fractions', 'factorising'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker; working required' },
    { id: '25',  label: '25',    marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors + Volume of a prism',                       skillIds: ['area_and_volume_scale_factors', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '26',  label: '26',    marks: 3,  topic: 'algebra',  skill: 'Iteration + Growth and Decay',                                            skillIds: ['iteration', 'growth_and_decay'], kind: 'exam', visual: false, desc: '' },
    { id: '27',  label: '27',    marks: 4,  topic: 'ratio',    skill: 'Growth and Decay + Functions Notation + Fractional and Negative Indices', skillIds: ['growth_and_decay', 'functions_notation', 'fractional_and_negative_indices'], kind: 'exam', visual: false, desc: '' },
    { id: '28',  label: '28',    marks: 3,  topic: 'shape',    skill: '3D Trigonometry + Trigonometry (missing sides)',                          skillIds: ['trigonometry_3d', 'trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static 3D diagram supported' },
    { id: '29',  label: '29',    marks: 2,  topic: 'probdata', skill: 'Counting Without Listing',                                                skillIds: ['counting_without_listing'], kind: 'mastery', visual: false, desc: '' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
