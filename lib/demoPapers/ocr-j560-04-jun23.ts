import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/04 — Higher Tier Paper 4 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/OCR-JUN23-H-P4.json by
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
 *
 * KNOWN GAPS in this paper, carried here so they survive regeneration:
 *   • item 13(b) is untagged by design — filed under Algebra, contributing 1 mark(s) with no skill evidence. Check coding_notes says why.
 */
export const OCR_J560_04_JUN23: PaperConfig = {
  id: 'ocr-j560-04-jun23',
  title: 'OCR GCSE Mathematics J560/04',
  subtitle: 'Higher Tier Paper 4 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 2,  topic: 'number',   skill: 'Exact Calculations',                                                                      skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate an expression with a square and a negative product on a calculator, to 3 significant figures' },
    { id: '2',     label: '2',       marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                                       skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'percentage decrease between two money amounts' },
    { id: '3a',    label: '3(a)',    marks: 2,  topic: 'ratio',    skill: 'Ratio',                                                                                   skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'one share of a three-part ratio from another share\'s value' },
    { id: '3b',    label: '3(b)',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Solving Linear Equations',                                                        skillIds: ['ratio', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the unknown term of a three-part ratio, given that its share is a stated fraction of the total' },
    { id: '4a',    label: '4(a)',    marks: 3,  topic: 'number',   skill: 'Percentage Change',                                                                       skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'value after four years of simple interest' },
    { id: '4b',    label: '4(b)',    marks: 3,  topic: 'number',   skill: 'Percentage Change + Solving Linear Equations',                                            skillIds: ['percentage_change', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the first whole year a simple-interest investment passes a stated value' },
    { id: '5a',    label: '5(a)',    marks: 1,  topic: 'number',   skill: 'Standard Form',                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'a small decimal written in standard form' },
    { id: '5b',    label: '5(b)',    marks: 2,  topic: 'number',   skill: 'Standard Form + Compound Units + Time Calculations',                                      skillIds: ['standard_form', 'compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'distance travelled in a day at a speed given in standard form per second' },
    { id: '5c',    label: '5(c)',    marks: 3,  topic: 'number',   skill: 'Standard Form + Indices + Compound Units',                                                skillIds: ['standard_form', 'indices', 'compound_units'], kind: 'exam', visual: false, desc: 'smallest integer satisfying a cubed-multiple speed condition over a standard-form distance and time' },
    { id: '6',     label: '6',       marks: 4,  topic: 'probdata', skill: 'Mean + Solving Linear Equations',                                                         skillIds: ['mean', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'two unknowns in a frequency table — a missing frequency and a missing score — fixed by the total and the mean' },
    { id: '7a',    label: '7(a)',    marks: 3,  topic: 'algebra',  skill: 'Sketching Functions',                                                                     skillIds: ['sketching_functions'], kind: 'mastery', visual: true, desc: 'draw a two-branch curve from a table of values, the curve not touching the y-axis' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'algebra',  skill: 'Sketching Functions',                                                                     skillIds: ['sketching_functions'], kind: 'mastery', visual: false, desc: 'read the positive root off the drawn curve, to 1 decimal place' },
    { id: '8',     label: '8',       marks: 6,  topic: 'shape',    skill: 'Area of a Circle + Areas of Squares and Rectangles + Fractions Decimals and Percentages', skillIds: ['area_of_a_circle', 'areas_of_squares_and_rectangles', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'percentage of a square left shaded by a quarter-circle inscribed in it' },
    { id: '9a',    label: '9(a)',    marks: 5,  topic: 'shape',    skill: 'Lengths and Perimeters + Solving Linear Equations',                                       skillIds: ['lengths_and_perimeters', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'all three sides of a triangle whose algebraic perimeter is given' },
    { id: '9b',    label: '9(b)',    marks: 3,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                                    skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'decide whether the triangle just found is right-angled, by calculation' },
    { id: '10a',   label: '10(a)',   marks: 3,  topic: 'probdata', skill: 'Venn Diagrams',                                                                           skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'complete a two-set Venn diagram from two set totals, an overall total and a count outside both' },
    { id: '10bi',  label: '10(bi)',  marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                          skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability of being in exactly one of two sets' },
    { id: '10bii', label: '10(bii)', marks: 2,  topic: 'probdata', skill: 'Conditional Probability + Venn Diagrams',                                                 skillIds: ['conditional_probability', 'venn_diagrams'], kind: 'mastery', visual: false, desc: 'conditional probability read off a completed Venn diagram' },
    { id: '11',    label: '11',      marks: 3,  topic: 'shape',    skill: 'Rotations + Translations',                                                                skillIds: ['rotations', 'translations'], kind: 'exam', visual: false, desc: 'the single transformation equivalent to a half-turn rotation followed by a translation' },
    { id: '12a',   label: '12(a)',   marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                       skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'algebraic output of a two-step function machine' },
    { id: '12b',   label: '12(b)',   marks: 5,  topic: 'algebra',  skill: 'Composite Functions + Solving Linear Equations',                                          skillIds: ['composite_functions', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the input making a composite of two machines equal a given algebraic output' },
    { id: '13a',   label: '13(a)',   marks: 1,  topic: 'algebra',  skill: 'Algebraic Fractions',                                                                     skillIds: ['algebraic_fractions'], kind: 'mastery', visual: false, desc: 'identify the error in the numerators when two algebraic fractions are combined' },
    { id: '13b',   label: '13(b)',   marks: 1,  topic: 'algebra',  skill: 'Untagged',                                                                                skillIds: [], kind: 'mastery', visual: false, desc: 'DISCOUNTED by OCR — all candidates awarded the mark; the item was a \'spot the error\' on a quadratic formula substitution' },
    { id: '14',    label: '14',      marks: 5,  topic: 'probdata', skill: 'Counting Without Listing + Calculating Simple Probability',                               skillIds: ['counting_without_listing', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'proportion of all combinations across three option blocks that include at least one of a flagged subset' },
    { id: '15',    label: '15',      marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers + Inverse Proportion',                                             skillIds: ['proportion_with_powers', 'inverse_proportion'], kind: 'exam', visual: false, desc: 'value of a variable inversely proportional to a square root, from one given pair' },
    { id: '16a',   label: '16(a)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                           skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage tree where the second stage\'s probabilities depend on the first outcome' },
    { id: '16b',   label: '16(b)',   marks: 3,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                                         skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'probability of an outcome two stages on, summed over both intermediate branches' },
    { id: '17ai',  label: '17(ai)',  marks: 2,  topic: 'shape',    skill: 'Circle Theorem: Alternate Segment',                                                       skillIds: ['circle_theorem_alternate_segment'], kind: 'mastery', visual: false, desc: 'angle between a tangent and a chord, with the theorem named' },
    { id: '17aii', label: '17(aii)', marks: 2,  topic: 'shape',    skill: 'Circle Theorem: Tangent and Radius',                                                      skillIds: ['circle_theorem_tangent'], kind: 'mastery', visual: false, desc: 'the remaining angle at the point of contact, from the tangent-radius right angle, with the reason named' },
    { id: '17bi',  label: '17(bi)',  marks: 3,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre',                                                         skillIds: ['circle_theorem_angle_at_centre'], kind: 'mastery', visual: false, desc: 'obtuse and reflex angles at the centre and the opposite circumference angle, all in terms of one letter' },
    { id: '17bii', label: '17(bii)', marks: 1,  topic: 'shape',    skill: 'Circle Theorem: Cyclic Quadrilateral',                                                    skillIds: ['circle_theorem_cyclic_quadrilateral'], kind: 'mastery', visual: false, desc: 'state which circle theorem the preceding algebra has just proved' },
    { id: '18a',   label: '18(a)',   marks: 3,  topic: 'algebra',  skill: 'Iteration',                                                                               skillIds: ['iteration'], kind: 'mastery', visual: false, desc: 'show a cubic has a root in a stated interval, by a sign change' },
    { id: '18b',   label: '18(b)',   marks: 4,  topic: 'algebra',  skill: 'Iteration',                                                                               skillIds: ['iteration'], kind: 'mastery', visual: false, desc: 'find that root to 1 decimal place, with supporting trials' },
    { id: '19',    label: '19',      marks: 5,  topic: 'algebra',  skill: 'Kinematic Graphs + Solving Linear Equations',                                             skillIds: ['kinematic_graphs', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'the plateau velocity of a trapezium-shaped velocity-time graph, from a stated average velocity' },
    { id: '20a',   label: '20(a)',   marks: 3,  topic: 'shape',    skill: 'Cosine Rule',                                                                             skillIds: ['cosine_rule'], kind: 'mastery', visual: false, desc: 'show an angle of a triangle given all three sides, to 1 decimal place' },
    { id: '20b',   label: '20(b)',   marks: 2,  topic: 'shape',    skill: 'Area of a Triangle (½ab sinC)',                                                           skillIds: ['area_of_triangle_sine'], kind: 'mastery', visual: false, desc: 'area of that triangle from two sides and the included angle' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
