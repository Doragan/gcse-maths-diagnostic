import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/02 — Foundation Tier Paper 2 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/OCR-JUN25-F-P2.json by
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
 *   • item 4(ai) is untagged by design — filed under Shape and Space, contributing 2 mark(s) with no skill evidence. Check coding_notes says why.
 */
export const OCR_J560_02_JUN25: PaperConfig = {
  id: 'ocr-j560-02-jun25',
  title: 'OCR GCSE Mathematics J560/02',
  subtitle: 'Foundation Tier Paper 2 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',    label: '1(a)',    marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                    skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'identify the prime number in a list' },
    { id: '1b',    label: '1(b)',    marks: 1,  topic: 'number',   skill: 'Indices',                                                                  skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'identify the square number in a list' },
    { id: '1c',    label: '1(c)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'find two numbers in a list with a given difference' },
    { id: '2',     label: '2',       marks: 2,  topic: 'shape',    skill: 'Areas of Triangles',                                                       skillIds: ['areas_of_triangles'], kind: 'mastery', visual: false, desc: 'area of a right-angled triangle from base and height' },
    { id: '3a',    label: '3(a)',    marks: 1,  topic: 'number',   skill: 'Multiplying Fractions',                                                    skillIds: ['multiplying_fractions'], kind: 'mastery', visual: false, desc: 'half of a unit fraction' },
    { id: '3b',    label: '3(b)',    marks: 1,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                                         skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'add two fractions with the same denominator' },
    { id: '4ai',   label: '4(ai)',   marks: 2,  topic: 'shape',    skill: 'Untagged',                                                                 skillIds: [], kind: 'mastery', visual: false, desc: 'name two 2D shapes from their pictures' },
    { id: '4aii',  label: '4(aii)',  marks: 1,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                                           skillIds: ['symmetry'], kind: 'mastery', visual: false, desc: 'order of rotational symmetry of a 2D shape' },
    { id: '4b',    label: '4(b)',    marks: 1,  topic: 'shape',    skill: 'Angles on lines and Circles',                                              skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: true, desc: 'add notation to a triangle to show it is isosceles' },
    { id: '5a',    label: '5(a)',    marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                                            skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'read one value off a bar chart' },
    { id: '5b',    label: '5(b)',    marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                                            skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'difference between two bars on a bar chart' },
    { id: '5c',    label: '5(c)',    marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                                            skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'complete a bar chart from a given figure' },
    { id: '5d',    label: '5(d)',    marks: 2,  topic: 'number',   skill: 'Percentage Change + Simple Charts',                                        skillIds: ['percentage_change', 'simple_charts'], kind: 'exam', visual: false, desc: 'test a percentage-decrease claim against two bars, with working' },
    { id: '6ai',   label: '6(ai)',   marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'order of operations with a product' },
    { id: '6aii',  label: '6(aii)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                                  skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'order of operations with a square and a negative' },
    { id: '6b',    label: '6(b)',    marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'insert one pair of brackets to make a calculation correct' },
    { id: '7a',    label: '7(a)',    marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                         skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'write an improper fraction as a decimal' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                       skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'write a decimal as a percentage' },
    { id: '7c',    label: '7(c)',    marks: 1,  topic: 'number',   skill: 'Irregular and Improper Fractions',                                         skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'write an improper fraction as a mixed number' },
    { id: '8',     label: '8',       marks: 3,  topic: 'number',   skill: 'Converting Measurements + Simple Arithmetic',                              skillIds: ['converting_measurements', 'simple_arithmetic'], kind: 'exam', visual: false, desc: 'equalise two volumes given in different metric units' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'algebra',  skill: 'Simplifying Expressions',                                                  skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'collect like terms in two letters' },
    { id: '9bi',   label: '9(bi)',   marks: 1,  topic: 'algebra',  skill: 'Expanding Brackets',                                                       skillIds: ['expanding_brackets'], kind: 'mastery', visual: false, desc: 'expand a single bracket with a numeric multiplier' },
    { id: '9bii',  label: '9(bii)',  marks: 2,  topic: 'algebra',  skill: 'Expanding Brackets',                                                       skillIds: ['expanding_brackets'], kind: 'mastery', visual: false, desc: 'expand a single bracket with an algebraic multiplier' },
    { id: '10',    label: '10',      marks: 3,  topic: 'number',   skill: 'Estimating + Significant Figures',                                         skillIds: ['estimating', 'significant_figures'], kind: 'exam', visual: false, desc: 'estimate a three-term calculation by rounding each value to 1 significant figure' },
    { id: '11',    label: '11',      marks: 3,  topic: 'number',   skill: 'Time Calculations + Simplifying Fractions',                                skillIds: ['time_calculations', 'simplifying_fractions'], kind: 'exam', visual: false, desc: 'one duration as a fraction of another, in its simplest form' },
    { id: '12ai',  label: '12(ai)',  marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                       skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'gradient from an equation in y = mx + c form' },
    { id: '12aii', label: '12(aii)', marks: 1,  topic: 'algebra',  skill: 'Substitution',                                                             skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'value of y for a given x from a linear equation' },
    { id: '12b',   label: '12(b)',   marks: 2,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                              skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'change the subject of a two-step linear formula' },
    { id: '13',    label: '13',      marks: 3,  topic: 'shape',    skill: 'Rotations',                                                                skillIds: ['rotations'], kind: 'mastery', visual: false, desc: 'coordinates of a vertex after a rotation about a given centre' },
    { id: '14a',   label: '14(a)',   marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'select three notes from a set of denominations making an exact total' },
    { id: '14b',   label: '14(b)',   marks: 5,  topic: 'ratio',    skill: 'Compound Units + Fractions of Amounts + Converting Measurements',          skillIds: ['compound_units', 'fractions_of_amounts', 'converting_measurements'], kind: 'exam', visual: false, desc: 'fraction of a fuel tank used, converted through a distance-per-litre rate and then between miles and kilometres' },
    { id: '15a',   label: '15(a)',   marks: 1,  topic: 'number',   skill: 'Decimals',                                                                 skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'multiply two negative decimals' },
    { id: '15b',   label: '15(b)',   marks: 1,  topic: 'number',   skill: 'Decimals',                                                                 skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'divide one decimal by another' },
    { id: '16',    label: '16',      marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                       skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'combine two scores out of different totals and compare with a percentage threshold' },
    { id: '17',    label: '17',      marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                             skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'solve a two-step linear inequality' },
    { id: '18',    label: '18',      marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Solving Linear Equations',              skillIds: ['adding_and_subtracting_fractions', 'solving_linear_equations'], kind: 'exam', visual: false, desc: 'find an unknown denominator in a mixed-number fraction equation' },
    { id: '19a',   label: '19(a)',   marks: 4,  topic: 'algebra',  skill: 'Sequences + Lowest Common Multiple',                                       skillIds: ['sequences', 'lowest_common_multiple'], kind: 'exam', visual: false, desc: 'how many terms two arithmetic sequences share below a limit' },
    { id: '19b',   label: '19(b)',   marks: 2,  topic: 'algebra',  skill: 'Finding the nth Term',                                                     skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'nth term of an arithmetic sequence' },
    { id: '20',    label: '20',      marks: 4,  topic: 'algebra',  skill: 'Simultaneous Equations + Plotting Straight Line Graphs',                   skillIds: ['simultaneous_equations', 'plotting_straight_line_graphs'], kind: 'exam', visual: true, desc: 'draw a second line on a grid and read off the solution of a pair of simultaneous equations' },
    { id: '21',    label: '21',      marks: 5,  topic: 'ratio',    skill: 'Ratio',                                                                    skillIds: ['ratio'], kind: 'exam', visual: false, desc: 'test a claim about the total of a three-part ratio given one difference, with working' },
    { id: '22',    label: '22',      marks: 4,  topic: 'shape',    skill: 'Congruence and Similarity',                                                skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'complete a congruence proof for two triangles formed by a rectangle\'s diagonal' },
    { id: '23',    label: '23',      marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                          skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'evaluate an integer raised to a negative power' },
    { id: '24',    label: '24',      marks: 6,  topic: 'probdata', skill: 'Gathering and Organising Data + Percentage Change + Fractions of Amounts', skillIds: ['gathering_and_organising_data', 'percentage_change', 'fractions_of_amounts'], kind: 'exam', visual: true, desc: 'design and complete a two-way table, with entries derived by a fraction, a percentage increase and an addition' },
    { id: '25a',   label: '25(a)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                            skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'complete a two-stage tree diagram with independent probabilities' },
    { id: '25b',   label: '25(b)',   marks: 3,  topic: 'probdata', skill: 'Tree Diagrams',                                                            skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of exactly one success across two independent trials' },
    { id: '26',    label: '26',      marks: 6,  topic: 'shape',    skill: 'Sector Calculations + Area of a Circle',                                   skillIds: ['sector_calculations', 'area_of_a_circle'], kind: 'exam', visual: false, desc: 'radius of a circle whose area is in a given ratio to the area of a sector' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
