import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — November 2023.
 *
 * GENERATED from data/exam-audit/NOV23-F-P3.json by
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
export const AQA_8300_3F_NOV23: PaperConfig = {
  id: 'aqa-8300-3f-nov23',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — November 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                  skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Decimals',                                                            skillIds: ['decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'shape',    skill: 'Angles in Polygons',                                                  skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'single-word name; needs synonym matching' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                   skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'single-word name; needs synonym matching' },
    { id: '4',   label: '4',     marks: 2,  topic: 'number',   skill: 'Factors and Multiples',                                               skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'list answer; needs set-equality marking' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'algebra',  skill: 'Substitution + Indices',                                              skillIds: ['substitution', 'indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                         skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                         skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'shape',    skill: 'Areas of Triangles',                                                  skillIds: ['areas_of_triangles'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '7',   label: '7',     marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                          skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '8',   label: '8',     marks: 2,  topic: 'shape',    skill: 'Volume of a prism',                                                   skillIds: ['volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '9',   label: '9',     marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                                       skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '10',  label: '10',    marks: 4,  topic: 'ratio',    skill: 'Compound Units + Simple Arithmetic',                                  skillIds: ['compound_units', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '11a', label: '11(a)', marks: 3,  topic: 'algebra',  skill: 'Simplifying Expressions',                                             skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions + Indices',                                   skillIds: ['simplifying_expressions', 'indices'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '12',  label: '12',    marks: 3,  topic: 'probdata', skill: 'Systematic Listing',                                                  skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'requires structured listing against exclusion constraints with set-equality marking' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'probdata', skill: 'Expected Outcomes',                                                   skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: '' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                  skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'show-that on a probability total exceeding one; the reasoning must be evidenced' },
    { id: '14',  label: '14',    marks: 4,  topic: 'ratio',    skill: 'Proportion + Simple Arithmetic + Lengths and Perimeters',             skillIds: ['proportion', 'simple_arithmetic', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'distances measured off a scale drawing, so the answer is accepted over a range' },
    { id: '15',  label: '15',    marks: 4,  topic: 'algebra',  skill: 'Function Machines + Solving Linear Equations',                        skillIds: ['function_machines', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static machine diagram supported' },
    { id: '16',  label: '16',    marks: 3,  topic: 'number',   skill: 'Irregular and Improper Fractions + Converting Fractions to Decimals', skillIds: ['irregular_and_improper_fractions', 'converting_fractions_to_decimals'], kind: 'exam', visual: false, desc: 'choice credited only with both differences shown' },
    { id: '17',  label: '17',    marks: 4,  topic: 'algebra',  skill: 'Sequences + Simple Arithmetic',                                       skillIds: ['sequences', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '18',  label: '18',    marks: 4,  topic: 'probdata', skill: 'Venn Diagrams + Frequency Trees',                                     skillIds: ['venn_diagrams', 'frequency_trees'], kind: 'exam', visual: false, desc: 'Venn multi-cell entry translated from a frequency tree' },
    { id: '19',  label: '19',    marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                              skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval; needs inequality-form entry' },
    { id: '20',  label: '20',    marks: 1,  topic: 'probdata', skill: 'Grouped Frequency Tables + Mean',                                     skillIds: ['grouped_frequency_tables', 'mean'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '21',  label: '21',    marks: 4,  topic: 'number',   skill: 'Percentage Change',                                                   skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'answer combines a percentage with an increase-or-decrease label' },
    { id: '22',  label: '22',    marks: 3,  topic: 'number',   skill: 'Indices + Factors and Multiples',                                     skillIds: ['indices', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'three-blank calculation graded against several simultaneous conditions' },
    { id: '23',  label: '23',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing angles)',                                       skillIds: ['trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '24a', label: '24(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                       skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-diagram multi-cell entry' },
    { id: '24b', label: '24(b)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                     skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '25',  label: '25',    marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations',                                              skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two-value answer needs a multi-blank response' },
    { id: '26a', label: '26(a)', marks: 3,  topic: 'shape',    skill: 'Circumfrence of a Circle + Areas of Squares and Rectangles',          skillIds: ['circumfrence_of_a_circle', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '26b', label: '26(b)', marks: 1,  topic: 'shape',    skill: 'Areas of Squares and Rectangles',                                     skillIds: ['areas_of_squares_and_rectangles'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '26c', label: '26(c)', marks: 1,  topic: 'shape',    skill: 'Lengths and Perimeters',                                              skillIds: ['lengths_and_perimeters'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '27',  label: '27',    marks: 3,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Solving Linear Equations',       skillIds: ['alternate_and_corresponding_angles', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
