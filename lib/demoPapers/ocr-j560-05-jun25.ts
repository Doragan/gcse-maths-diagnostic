import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/05 — Higher Tier Paper 5 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/OCR-JUN25-H-P5.json by
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
export const OCR_J560_05_JUN25: PaperConfig = {
  id: 'ocr-j560-05-jun25',
  title: 'OCR GCSE Mathematics J560/05',
  subtitle: 'Higher Tier Paper 5 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Decimals',                                                                 skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'multiply two negative decimals' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Decimals',                                                                 skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'divide one decimal by another' },
    { id: '2',   label: '2',     marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                       skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'combine two scores out of different totals and compare with a percentage threshold' },
    { id: '3',   label: '3',     marks: 3,  topic: 'shape',    skill: 'Rotations',                                                                skillIds: ['rotations'], kind: 'mastery', visual: false, desc: 'describe a rotation fully from two positions of a triangle on a grid' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                                             skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'solve a one-step linear inequality' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                             skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'show an inequality solution on a number line' },
    { id: '5',   label: '5',     marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Solving Linear Equations',              skillIds: ['adding_and_subtracting_fractions', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'find an unknown denominator in a mixed-number fraction equation' },
    { id: '6a',  label: '6(a)',  marks: 4,  topic: 'algebra',  skill: 'Sequences + Lowest Common Multiple',                                       skillIds: ['sequences', 'lowest_common_multiple'], kind: 'exam', visual: false, desc: 'how many terms two arithmetic sequences share below a limit' },
    { id: '6b',  label: '6(b)',  marks: 2,  topic: 'algebra',  skill: 'Finding the nth Term',                                                     skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'nth term of an arithmetic sequence' },
    { id: '7a',  label: '7(a)',  marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations + Plotting Straight Line Graphs',                   skillIds: ['simultaneous_equations', 'plotting_straight_line_graphs'], kind: 'exam', visual: true, desc: 'draw a second line on a grid and read off the solution of a pair of simultaneous equations' },
    { id: '7b',  label: '7(b)',  marks: 2,  topic: 'algebra',  skill: 'Simultaneous Equations + Understanding Straight Line Graphs',              skillIds: ['simultaneous_equations', 'understanding_straight_line_graphs'], kind: 'exam', visual: false, desc: 'decide whether a pair of simultaneous equations has no solution, by comparing gradients' },
    { id: '8',   label: '8',     marks: 5,  topic: 'ratio',    skill: 'Ratio',                                                                    skillIds: ['ratio'], kind: 'exam', visual: false, desc: 'test a claim about the total of a three-part ratio given one difference, with working' },
    { id: '9',   label: '9',     marks: 6,  topic: 'probdata', skill: 'Gathering and Organising Data + Percentage Change + Fractions of Amounts', skillIds: ['gathering_and_organising_data', 'percentage_change', 'fractions_of_amounts'], kind: 'exam', visual: true, desc: 'design and complete a two-way table, with entries derived by a fraction, a percentage increase and an addition' },
    { id: '10',  label: '10',    marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Simplifying Expressions',               skillIds: ['forming_expressions_and_formulae', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'form and simplify an expression for a total of three chained ages' },
    { id: '11',  label: '11',    marks: 5,  topic: 'ratio',    skill: 'Compound Units + Estimating + Volume of a prism',                          skillIds: ['compound_units', 'estimating', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'use estimation and a density to test a claim about the side length of a solid cube' },
    { id: '12',  label: '12',    marks: 4,  topic: 'shape',    skill: 'Congruence and Similarity',                                                skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'prove two triangles congruent inside an equilateral triangle with a perpendicular' },
    { id: '13',  label: '13',    marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers',                                                   skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'value of a variable directly proportional to the square root of another' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                          skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'evaluate a number raised to a fractional power' },
    { id: '14b', label: '14(b)', marks: 4,  topic: 'number',   skill: 'Fractional and Negative Indices',                                          skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'simplify a product involving a bracket raised to a negative power' },
    { id: '15a', label: '15(a)', marks: 3,  topic: 'algebra',  skill: 'Completing the Square',                                                    skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'write a quadratic in completed-square form' },
    { id: '15b', label: '15(b)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square',                                                    skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'turning point read off a completed square' },
    { id: '16',  label: '16',    marks: 4,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                              skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'change the subject where the new subject appears on both sides of a fraction' },
    { id: '17a', label: '17(a)', marks: 4,  topic: 'probdata', skill: 'Histograms',                                                               skillIds: ['histograms'], kind: 'exam', visual: true, desc: 'complete a grouped frequency table and its histogram from partial information' },
    { id: '17b', label: '17(b)', marks: 2,  topic: 'probdata', skill: 'Range + Upper and Lower Bounds',                                           skillIds: ['range', 'upper_and_lower_bounds'], kind: 'exam', visual: false, desc: 'error interval for the range of a grouped distribution given the largest value' },
    { id: '18',  label: '18',    marks: 5,  topic: 'number',   skill: 'Recurring Decimals to Fractions + Dividing Fractions',                     skillIds: ['recurring_decimals_to_fractions', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'divide one recurring decimal by another, answer as a mixed number' },
    { id: '19',  label: '19',    marks: 5,  topic: 'shape',    skill: 'Sector Calculations + Area of a Circle',                                   skillIds: ['sector_calculations', 'area_of_a_circle'], kind: 'exam', visual: false, desc: 'total area of a sector joined to a semicircle, given the sector\'s area, in terms of pi' },
    { id: '20',  label: '20',    marks: 4,  topic: 'algebra',  skill: 'Algebraic Fractions',                                                      skillIds: ['algebraic_fractions'], kind: 'mastery', visual: false, desc: 'simplify an algebraic fraction by factorising both quadratics' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'probdata', skill: 'Combined Events',                                                          skillIds: ['combined_events'], kind: 'mastery', visual: false, desc: 'state the assumption behind multiplying two unchanged probabilities' },
    { id: '21b', label: '21(b)', marks: 5,  topic: 'probdata', skill: 'Tree Diagrams',                                                            skillIds: ['tree_diagrams'], kind: 'exam', visual: false, desc: 'probability about the remaining contents of a bag after two items are removed without replacement' },
    { id: '22',  label: '22',    marks: 6,  topic: 'shape',    skill: 'Cosine Rule + Area of a Triangle (½ab sinC)',                              skillIds: ['cosine_rule', 'area_of_triangle_sine'], kind: 'exam', visual: false, desc: 'area of one triangle in a quadrilateral, the shared diagonal coming from the cosine rule' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
