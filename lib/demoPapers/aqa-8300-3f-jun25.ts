import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P3.json by
 * scripts/generate-paper-from-audit.ts. Regenerating overwrites this file, so
 * a hand correction should be noted here — the script refuses to overwrite
 * without --force precisely so corrections are not lost silently.
 *
 * HAND-AUTHORED SINCE GENERATION — do not regenerate without --force, and
 * re-apply this if you do:
 *
 *   • `retrySet` is complete: a rewritten practice question, with its answer,
 *     for every non-visual item. Written from the question paper as PARALLELS
 *     — same context, framing and step count, different numbers and settings —
 *     never as transcriptions. See docs/writing-retry-questions.md. The
 *     crossover questions shared with this paper's tier partner carry the SAME
 *     retries; the note above `retrySet` says which.
 *   • `challengeQuestions` stays empty ON PURPOSE. Challenges are pooled by
 *     topic and tier in lib/papers/challengePool.ts, and every paper draws
 *     from there; filling this in would override the pool for this paper only.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const AQA_8300_3F_JUN25: PaperConfig = {
  id: 'aqa-8300-3f-jun25',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                            skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'requires drawing the next pattern on a grid' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                                            skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'static pattern diagram supported' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                                   skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'requires structured listing with set-equality marking' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability + Systematic Listing',                                  skillIds: ['calculating_simple_probability', 'systematic_listing'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '4c',  label: '4(c)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'operation entered into a machine box; needs operation-equivalence check' },
    { id: '5a',  label: '5(a)',  marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'multi-blank table; each cell must be in the column\'s form' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Converting Measurements',                                                              skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'genuine unit-select per row' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show-that requires the intermediate product to be evidenced' },
    { id: '7b',  label: '7(b)',  marks: 3,  topic: 'number',   skill: 'Percentage Change + Simple Arithmetic',                                                skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'choice credited only with comparable totals shown' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Solving Linear Equations',                                         skillIds: ['simple_arithmetic', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'number',   skill: 'Indices',                                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'two answers in one part; needs a two-blank response' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Indices + Decimals',                                                                   skillIds: ['indices', 'decimals'], kind: 'mastery', visual: false, desc: 'tick credited only with comparable values or a worded reason' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'probdata', skill: 'Mode + Simple Arithmetic',                                                             skillIds: ['mode', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'units are part of the answer and the coin set must be evidenced' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'probdata', skill: 'Median',                                                                               skillIds: ['median'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 3,  topic: 'number',   skill: 'Percentage Change + Simple Arithmetic',                                                skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '12',  label: '12',    marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Areas of Triangles + Ratio',                         skillIds: ['areas_of_squares_and_rectangles', 'areas_of_triangles', 'ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence check; static grid diagram supported' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                                   skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'two-cell table entry' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Probability Spaces',                                               skillIds: ['expected_outcomes', 'probability_spaces'], kind: 'exam', visual: false, desc: '' },
    { id: '15',  label: '15',    marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                                            skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '16',  label: '16',    marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters', skillIds: ['forming_expressions_and_formulae', 'solving_linear_equations', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'recurring decimal or equivalent fraction accepted' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '18',  label: '18',    marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                           skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '19a', label: '19(a)', marks: 4,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'length measured off a grid, so the answer is accepted over a range' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'shape',    skill: 'Bearings',                                                                             skillIds: ['bearings'], kind: 'mastery', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term',                                                                 skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '21',  label: '21',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                       skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '23',  label: '23',    marks: 4,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                                 skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'show-that over two Pythagoras steps; intermediate working must be evidenced' },
    { id: '24a', label: '24(a)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'open-ended answer: any line with the same gradient; needs form-equivalence plus a not-identical check' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // 1(a) is the only `visual: true` item and has no retry: drawing the next
  // pattern needs the first three printed beside it, which is a picture, not a
  // grid to draw on.
  retrySet: {
    // 1(a) is `visual: true`, and it is the labels layer that makes it
    // possible: a "draw the next pattern" question is meaningless unless the
    // first three are shown AND named, and naming them is what a background
    // fragment could not do.
    //
    // Pattern n is a bottom row of n squares under a top row of n + 1, giving
    // 2n + 1 squares — the same rule 1(b) counts, so the two parts describe
    // one sequence.
    '1a': {
      skill: 'Sequences',
      question: 'Here are the first three patterns in a sequence.\nDraw Pattern 4 on the grid.',
      answer: 'A bottom row of 4 squares under a top row of 5 squares — 9 squares in total',
      working: 'Each pattern adds one square to each row.',
      diagram: {
        mode: 'cells', showAxes: false,
        x: { min: 0, max: 18, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background:
          '<rect x="0" y="1" width="1" height="1" stroke="#333" /><rect x="0" y="2" width="1" height="1" stroke="#333" /><rect x="1" y="2" width="1" height="1" stroke="#333" />' +
          '<rect x="3" y="1" width="2" height="1" stroke="#333" /><rect x="3" y="2" width="3" height="1" stroke="#333" /><rect x="4" y="1" width="1" height="1" stroke="#333" /><rect x="4" y="2" width="1" height="1" stroke="#333" /><rect x="5" y="2" width="1" height="1" stroke="#333" />' +
          '<rect x="7" y="1" width="3" height="1" stroke="#333" /><rect x="7" y="2" width="4" height="1" stroke="#333" /><rect x="8" y="1" width="1" height="1" stroke="#333" /><rect x="9" y="1" width="1" height="1" stroke="#333" /><rect x="8" y="2" width="1" height="1" stroke="#333" /><rect x="9" y="2" width="1" height="1" stroke="#333" /><rect x="10" y="2" width="1" height="1" stroke="#333" />',
        labels: [
          { x: 1, y: 1, text: 'Pattern 1', dy: 13 },
          { x: 4.5, y: 1, text: 'Pattern 2', dy: 13 },
          { x: 9, y: 1, text: 'Pattern 3', dy: 13 },
          { x: 14, y: 1, text: 'Pattern 4', dy: 13 },
        ],
        elements: [{ x: 12, y: 1, marks: 0.5 }, { x: 13, y: 1, marks: 0.5 }, { x: 14, y: 1, marks: 0.5 }, { x: 15, y: 1, marks: 0.5 }, { x: 12, y: 2, marks: 0.5 }, { x: 13, y: 2, marks: 0.5 }, { x: 14, y: 2, marks: 0.5 }, { x: 15, y: 2, marks: 0.5 }, { x: 16, y: 2, marks: 0.5 }], tolerance: 0,
      },
    },
    '1b': {
      // Shares 1(a)'s figure: it is one question about one sequence.
      skill: 'Sequences',
      question: 'Here are the first three patterns in a sequence.\nHow many squares would Pattern 6 have?',
      answer: '13',
      working: 'Each pattern adds 2, so the nth pattern has 2n + 1.',
      diagram: {
        mode: 'cells', showAxes: false,
        x: { min: 0, max: 18, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<rect x="0" y="1" width="1" height="1" stroke="#333" /><rect x="0" y="2" width="1" height="1" stroke="#333" /><rect x="1" y="2" width="1" height="1" stroke="#333" /><rect x="3" y="1" width="2" height="1" stroke="#333" /><rect x="3" y="2" width="3" height="1" stroke="#333" /><rect x="4" y="1" width="1" height="1" stroke="#333" /><rect x="4" y="2" width="1" height="1" stroke="#333" /><rect x="5" y="2" width="1" height="1" stroke="#333" /><rect x="7" y="1" width="3" height="1" stroke="#333" /><rect x="7" y="2" width="4" height="1" stroke="#333" /><rect x="8" y="1" width="1" height="1" stroke="#333" /><rect x="9" y="1" width="1" height="1" stroke="#333" /><rect x="8" y="2" width="1" height="1" stroke="#333" /><rect x="9" y="2" width="1" height="1" stroke="#333" /><rect x="10" y="2" width="1" height="1" stroke="#333" />',
        labels: [
          { x: 1, y: 1, text: 'Pattern 1', dy: 13 },
          { x: 4.5, y: 1, text: 'Pattern 2', dy: 13 },
          { x: 9, y: 1, text: 'Pattern 3', dy: 13 },
          { x: 14, y: 1, text: 'Pattern 4', dy: 13 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '2a': {
      skill: 'Coordinates',
      question: 'The diagram shows the line AB.\nWrite down the coordinates of B.',
      answer: '(7, 6)',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 9, step: 1, label: 'x' },
        y: { min: 0, max: 8, step: 1, label: 'y' },
        background: '<polyline points="1,2 7,6" stroke="#333" fill="none" /><circle cx="1" cy="2" r="0.13" fill="#333" /><circle cx="7" cy="6" r="0.13" fill="#333" />',
        labels: [
          { x: 1, y: 2, text: 'A', dx: -11, dy: 4 },
          { x: 7, y: 6, text: 'B', dx: 11, dy: -4 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '2b': {
      skill: 'Coordinates',
      question: 'The diagram shows the line AB.\nWrite down the coordinates of the midpoint of AB.',
      answer: '(4, 4)',
      working: 'Halfway along in each direction.',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 9, step: 1, label: 'x' },
        y: { min: 0, max: 8, step: 1, label: 'y' },
        background: '<polyline points="1,2 7,6" stroke="#333" fill="none" /><circle cx="1" cy="2" r="0.13" fill="#333" /><circle cx="7" cy="6" r="0.13" fill="#333" />',
        labels: [
          { x: 1, y: 2, text: 'A', dx: -11, dy: 4 },
          { x: 7, y: 6, text: 'B', dx: 11, dy: -4 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '3a': {
      skill: 'Systematic Listing',
      question: 'Kai makes a drink using one type of milk and one flavour.\nThe milk is dairy (D) or oat (O).\nThe flavour is vanilla (V), chocolate (C) or strawberry (S).\nList all 6 possible drinks.\nOne has been done for you: DV.',
      answer: 'DV, DC, DS, OV, OC, OS',
      working: 'Take each milk in turn with every flavour.',
    },
    '3b': {
      skill: 'Calculating Simple Probability',
      question: 'Kai makes a drink using one type of milk and one flavour.\nThe milk is dairy (D) or oat (O).\nThe flavour is vanilla (V), chocolate (C) or strawberry (S).\nWhat fraction of the 6 possible drinks use chocolate?',
      answer: '<frac>1/3</frac>',
      working: '2 out of 6.',
    },
    '4a': {
      skill: 'Function Machines',
      question: 'The diagram shows a number machine.\nWork out the output when the input is 4',
      answer: '7',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.8, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<polyline points="2.2,1 4.4,1 4.4,2 2.2,2 2.2,1" stroke="#333" fill="none" /><polyline points="5.9,1 8.1,1 8.1,2 5.9,2 5.9,1" stroke="#333" fill="none" /><polyline points="0.9,1.5 2.14,1.5" stroke="#333" fill="none" /><polyline points="1.92,1.68 2.17,1.5 1.92,1.32" stroke="#333" fill="none" /><polyline points="4.4,1.5 5.84,1.5" stroke="#333" fill="none" /><polyline points="5.62,1.68 5.87,1.5 5.62,1.32" stroke="#333" fill="none" /><polyline points="8.100000000000001,1.5 9.54,1.5" stroke="#333" fill="none" /><polyline points="9.32,1.68 9.57,1.5 9.32,1.32" stroke="#333" fill="none" />',
        labels: [
          { x: 0.5, y: 1.5, text: 'Input' },
          { x: 3.3, y: 1.5, text: '× 3' },
          { x: 7, y: 1.5, text: '− 5' },
          { x: 10, y: 1.5, text: 'Output' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '4b': {
      skill: 'Function Machines',
      question: 'The diagram shows a number machine.\nWork out the input when the output is 19',
      answer: '8',
      working: 'Work backwards: 19 + 5 = 24, then ÷ 3.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.8, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<polyline points="2.2,1 4.4,1 4.4,2 2.2,2 2.2,1" stroke="#333" fill="none" /><polyline points="5.9,1 8.1,1 8.1,2 5.9,2 5.9,1" stroke="#333" fill="none" /><polyline points="0.9,1.5 2.14,1.5" stroke="#333" fill="none" /><polyline points="1.92,1.68 2.17,1.5 1.92,1.32" stroke="#333" fill="none" /><polyline points="4.4,1.5 5.84,1.5" stroke="#333" fill="none" /><polyline points="5.62,1.68 5.87,1.5 5.62,1.32" stroke="#333" fill="none" /><polyline points="8.100000000000001,1.5 9.54,1.5" stroke="#333" fill="none" /><polyline points="9.32,1.68 9.57,1.5 9.32,1.32" stroke="#333" fill="none" />',
        labels: [
          { x: 0.5, y: 1.5, text: 'Input' },
          { x: 3.3, y: 1.5, text: '× 3' },
          { x: 7, y: 1.5, text: '− 5' },
          { x: 10, y: 1.5, text: 'Output' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '4c': {
      skill: 'Function Machines',
      question: 'The diagram shows a number machine.\nWrite down the missing step.',
      answer: '+ 9',
      working: '5 × 4 = 20, and 20 needs 9 adding to reach 29.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.8, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<polyline points="2.2,1 4.4,1 4.4,2 2.2,2 2.2,1" stroke="#333" fill="none" /><polyline points="5.9,1 8.1,1 8.1,2 5.9,2 5.9,1" stroke="#333" fill="none" /><polyline points="0.9,1.5 2.14,1.5" stroke="#333" fill="none" /><polyline points="1.92,1.68 2.17,1.5 1.92,1.32" stroke="#333" fill="none" /><polyline points="4.4,1.5 5.84,1.5" stroke="#333" fill="none" /><polyline points="5.62,1.68 5.87,1.5 5.62,1.32" stroke="#333" fill="none" /><polyline points="8.100000000000001,1.5 9.54,1.5" stroke="#333" fill="none" /><polyline points="9.32,1.68 9.57,1.5 9.32,1.32" stroke="#333" fill="none" />',
        labels: [
          { x: 0.5, y: 1.5, text: '5' },
          { x: 3.3, y: 1.5, text: '× 4' },
          { x: 7, y: 1.5, text: '' },
          { x: 10, y: 1.5, text: '29' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '5a': { skill: 'Fractions Decimals and Percentages', question: 'Complete the table of equivalent fractions, decimals and percentages.\n<table>Fraction | Decimal | Percentage\n<frac>1/4</frac> |  | \n | 0.2 | \n<frac>3/5</frac> |  | </table>', answer: '(i) 0.25 and 25%, (ii) <frac>1/5</frac> and 20%, (iii) 0.6 and 60%' },
    '5b': {
      skill: 'Fractions Decimals and Percentages',
      question: 'What percentage of the grid is shaded?',
      answer: '35%',
      working: '<frac>7/20</frac> = <frac>35/100</frac>.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 5, step: 1, label: '' },
        y: { min: 0, max: 4, step: 1, label: '' },
        background: '<rect x="0" y="0" width="1" height="1" fill="#999" stroke="#333" /><rect x="1" y="0" width="1" height="1" fill="#999" stroke="#333" /><rect x="2" y="0" width="1" height="1" fill="#999" stroke="#333" /><rect x="0" y="1" width="1" height="1" fill="#999" stroke="#333" /><rect x="1" y="1" width="1" height="1" fill="#999" stroke="#333" /><rect x="3" y="2" width="1" height="1" fill="#999" stroke="#333" /><rect x="4" y="3" width="1" height="1" fill="#999" stroke="#333" /><rect x="0" y="0" width="1" height="1" stroke="#333" fill="none" /><rect x="0" y="1" width="1" height="1" stroke="#333" fill="none" /><rect x="0" y="2" width="1" height="1" stroke="#333" fill="none" /><rect x="0" y="3" width="1" height="1" stroke="#333" fill="none" /><rect x="1" y="0" width="1" height="1" stroke="#333" fill="none" /><rect x="1" y="1" width="1" height="1" stroke="#333" fill="none" /><rect x="1" y="2" width="1" height="1" stroke="#333" fill="none" /><rect x="1" y="3" width="1" height="1" stroke="#333" fill="none" /><rect x="2" y="0" width="1" height="1" stroke="#333" fill="none" /><rect x="2" y="1" width="1" height="1" stroke="#333" fill="none" /><rect x="2" y="2" width="1" height="1" stroke="#333" fill="none" /><rect x="2" y="3" width="1" height="1" stroke="#333" fill="none" /><rect x="3" y="0" width="1" height="1" stroke="#333" fill="none" /><rect x="3" y="1" width="1" height="1" stroke="#333" fill="none" /><rect x="3" y="2" width="1" height="1" stroke="#333" fill="none" /><rect x="3" y="3" width="1" height="1" stroke="#333" fill="none" /><rect x="4" y="0" width="1" height="1" stroke="#333" fill="none" /><rect x="4" y="1" width="1" height="1" stroke="#333" fill="none" /><rect x="4" y="2" width="1" height="1" stroke="#333" fill="none" /><rect x="4" y="3" width="1" height="1" stroke="#333" fill="none" />',
        elements: [], tolerance: 0,
      },
    },
    '6': { skill: 'Converting Measurements', question: 'Which metric unit would be most suitable for each measurement? Choose millimetres, metres or kilometres for each.\n(i)   the thickness of a coin\n(ii)  the width of a classroom\n(iii) the distance between two cities', answer: '(i) millimetres, (ii) metres, (iii) kilometres' },
    // 7(a) and (b) share the two plans, set side by side as the paper sets
    // them.
    // The paper sets each plan in its own box — a heading, then the phone,
    // "plus", then the monthly charge, one line each. That is a picture, not
    // a table ("plus" is not a row), so the retry draws the two boxes and 7(a)
    // and (b) share them.
    '7a': {
      skill: 'Simple Arithmetic',
      question: 'A mobile phone company has two different plans.\nShow that the total cost of Plan A for 24 months is £732',
      answer: 'Monthly cost 13 × 24 = 312, then 420 + 312 = 732',
      working: 'A show-that earns nothing for quoting £732, which the question already gave. Both steps have to appear: the 24 months at £13, and that total added to the £420 for the phone.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 16, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polygon points="0.5,0.5 7.5,0.5 7.5,3.5 0.5,3.5" stroke="#333" fill="none" /><polygon points="8.5,0.5 15.5,0.5 15.5,3.5 8.5,3.5" stroke="#333" fill="none" />',
        labels: [
          { x: 4, y: 4.1, text: 'Plan A' },
          { x: 12, y: 4.1, text: 'Plan B' },
          { x: 4, y: 2.8, text: 'Phone £420' },
          { x: 12, y: 2.8, text: 'Phone is free' },
          { x: 4, y: 2, text: 'plus' },
          { x: 12, y: 2, text: 'plus' },
          { x: 4, y: 1.2, text: '£13 per month for 24 months' },
          { x: 12, y: 1.2, text: '£38 per month for 24 months' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '7b': {
      skill: 'Percentage Change',
      question: 'A mobile phone company has two different plans.\nDuring a sale, the total cost of Plan B is reduced by 15%\nWhich plan is cheaper for 24 months during the sale?\nTick a box.\n[   ] Plan A\n[   ] Plan B\nShow working to support your answer.',
      answer: 'Plan A',
      working: 'Plan A is £420 + 24 × £13 = £732. Plan B is 24 × £38 = £912 before the sale and £775.20 after it.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 16, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polygon points="0.5,0.5 7.5,0.5 7.5,3.5 0.5,3.5" stroke="#333" fill="none" /><polygon points="8.5,0.5 15.5,0.5 15.5,3.5 8.5,3.5" stroke="#333" fill="none" />',
        labels: [
          { x: 4, y: 4.1, text: 'Plan A' },
          { x: 12, y: 4.1, text: 'Plan B' },
          { x: 4, y: 2.8, text: 'Phone £420' },
          { x: 12, y: 2.8, text: 'Phone is free' },
          { x: 4, y: 2, text: 'plus' },
          { x: 12, y: 2, text: 'plus' },
          { x: 4, y: 1.2, text: '£13 per month for 24 months' },
          { x: 12, y: 1.2, text: '£38 per month for 24 months' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '8': { skill: 'Simple Arithmetic + Solving Linear Equations', question: 'One coffee costs £2.40. Three coffees and four teas cost £14.00 altogether. Work out the cost of one tea.', answer: '£1.70', working: 'The coffees cost £7.20, leaving £6.80 for four teas.' },
    '9a': {
      skill: 'Indices',
      question: 'The cube of a whole number is a two-digit number.\nWork out the smallest number that could have been cubed, and the largest number that could have been cubed.',
      answer: 'Smallest 3, largest 4',
      working: '2³ = 8 has one digit and 5³ = 125 has three, so only 3³ = 27 and 4³ = 64 are two-digit.',
    },
    '9b': {
      skill: 'Indices',
      question: 'Which has the smaller value, 0.6² or 0.6³?\nGive a reason for your answer.',
      answer: '0.6³',
      working: '0.216 against 0.36 — multiplying by a number below 1 makes the result smaller each time.',
    },
    '10a': { skill: 'Mode', question: '£5.53 is paid using the smallest possible number of coins.\nWhat is the modal value of the coins used?\nYou must show your working.', answer: '£2', working: 'Two £2, one £1, one 50p, one 2p and one 1p — six coins, and only £2 is used twice.' },
    '10b': { skill: 'Median', question: 'Here is a list of five numbers: 3, 11, 6, 14, 9.\nAn extra number is put into the list, and the median of the six numbers is now 8.\nWork out the extra number.', answer: '7', working: 'In order the six must have 3rd and 4th values adding to 16, which 7 and 9 do.' },
    '11': { skill: 'Percentage Change + Simple Arithmetic', question: 'A café has 15 tables.\nThe owner buys 8 glasses for each table, plus an extra 60% for spares.\nWork out how many glasses the owner buys in total.', answer: '192', working: '15 × 8 = 120, and 120 × 1.6.' },
    '12': {
      skill: 'Scatter Graphs',
      question: 'The scatter diagram shows the hours of revision and test scores of eight students.\nA line of best fit has been drawn.\nWrite down two things that are wrong with the line of best fit.\nMistake 1:\nMistake 2:',
      answer: '1: every point lies above the line, so it is not through the middle of the data. 2: it does not extend across the full range of the data',
      working: 'A line of best fit should run through the middle of the points, with roughly as many above it as below, and should span the data it describes.',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 9, step: 1, label: 'Hours of revision' },
        y: { min: 0, max: 10, step: 2, label: 'Test score' },
        background: '<polyline points="0.84,2.68 1.16,3.32" stroke="#333" fill="none" /><polyline points="0.84,3.32 1.16,2.68" stroke="#333" fill="none" /><polyline points="1.84,3.68 2.16,4.32" stroke="#333" fill="none" /><polyline points="1.84,4.32 2.16,3.68" stroke="#333" fill="none" /><polyline points="2.84,5.68 3.16,6.32" stroke="#333" fill="none" /><polyline points="2.84,6.32 3.16,5.68" stroke="#333" fill="none" /><polyline points="3.84,5.68 4.16,6.32" stroke="#333" fill="none" /><polyline points="3.84,6.32 4.16,5.68" stroke="#333" fill="none" /><polyline points="4.84,6.68 5.16,7.32" stroke="#333" fill="none" /><polyline points="4.84,7.32 5.16,6.68" stroke="#333" fill="none" /><polyline points="5.84,6.68 6.16,7.32" stroke="#333" fill="none" /><polyline points="5.84,7.32 6.16,6.68" stroke="#333" fill="none" /><polyline points="6.84,7.68 7.16,8.32" stroke="#333" fill="none" /><polyline points="6.84,8.32 7.16,7.68" stroke="#333" fill="none" /><polyline points="7.84,7.68 8.16,8.32" stroke="#333" fill="none" /><polyline points="7.84,8.32 8.16,7.68" stroke="#333" fill="none" /><polyline points="2,2 6,4" stroke="#333" fill="none" />',
        elements: [], tolerance: 0,
      },
    },
    '13': {
      skill: 'Areas of Squares and Rectangles + Areas of Triangles + Ratio',
      question: 'The diagram shows a rectangle and a triangle.\nWork out the ratio area of rectangle : area of triangle.\nGive your answer in its simplest form.',
      answer: '3 : 2',
      working: 'Areas of 30 and 20, both divided by 10.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 18, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,1 6,1 6,7 1,7" stroke="#333" fill="none" /><polygon points="8,1 18,1 12,5" stroke="#333" fill="none" /><polyline points="12,1 12,5" stroke="#333" fill="none" stroke-dasharray="0.3 0.25" /><polyline points="12,1.5 12.5,1.5 12.5,1" stroke="#333" fill="none" />',
        labels: [
          { x: 3.5, y: 1, text: '5 cm', dy: 14 },
          { x: 1, y: 4, text: '6 cm', dx: -17 },
          { x: 13, y: 1, text: '10 cm', dy: 14 },
          { x: 12, y: 3, text: '4 cm', dx: 18 },
        ],
        elements: [], tolerance: 0,
      },
    },
    // 14(a) and (b) share the probability table, as on the paper.
    '14a': { skill: 'Probability Spaces', question: 'A box contains cards that are either red, blue, green or yellow.\n<table>Colour | Red | Blue | Green | Yellow\nProbability | 0.15 | 0.29 |  | </table>\nP(green) = P(yellow)\nComplete the table.', answer: 'Green 0.28 and yellow 0.28', working: 'Red and blue take 0.44, leaving 0.56 to share equally.' },
    '14b': { skill: 'Expected Outcomes', question: 'A box contains cards that are either red, blue, green or yellow.\n<table>Colour | Red | Blue | Green | Yellow\nProbability | 0.15 | 0.29 |  | </table>\nThere are 400 cards in the box.\nHow many cards are not blue?', answer: '284', working: '1 − 0.29 = 0.71, and 400 × 0.71.' },
    '15': {
      skill: 'Congruence and Similarity',
      question: 'A and B are triangles.\nFor each statement, state whether A and B are always congruent, sometimes congruent, or never congruent.\n(i)   A and B have the same area\n(ii)  A and B have two sides and the angle between them equal\n(iii) A’s longest side is longer than B’s longest side',
      answer: '(i) Sometimes, (ii) Always, (iii) Never',
      working: 'Equal areas do not fix the shape; two sides and the included angle do; and a longer side means the triangles cannot match.',
    },
    '16': {
      skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters',
      question: 'The diagram shows a square.\nWork out the perimeter of the square.',
      answer: '52 cm',
      working: '3x + 4 = 5x − 2 gives x = 3, so each side is 13 cm and the perimeter is 4 × 13.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 13, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="2,1 8,1 8,7 2,7" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 1, text: '(3x + 4) cm', dy: 14 },
          { x: 8, y: 4, text: '(5x − 2) cm', dx: 40 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '17a': {
      skill: 'Relative Frequency',
      question: 'Ana and Ben each throw the same biased coin.\n<table> | Ana | Ben\nNumber of throws | 50 | 150\nNumber of heads | 30 | 78</table>\nWork out the relative frequency of heads for all 200 throws.',
      answer: '0.54',
      working: '30 + 78 = 108 heads out of 200 throws.',
    },
    '17b': {
      skill: 'Relative Frequency',
      question: 'Ana and Ben each throw the same biased coin.\n<table> | Ana | Ben\nNumber of throws | 50 | 150\nNumber of heads | 30 | 78</table>\nWhich results would give the best estimate of the probability of heads?\nGive a reason for your answer.\nTick one box.\n[   ] Ana’s 50 throws\n[   ] Ben’s 150 throws\n[   ] All 200 throws',
      answer: 'All 200 throws',
      working: 'The more trials there are, the more reliable the estimate.',
    },
    '18': {
      // The sector angles belong ON the chart, which is where the paper puts them.
      skill: 'Pie Charts',
      question: 'The pie chart represents the results of matches played by a team.\n36 matches were won.\nHow many matches were lost?',
      answer: '24',
      working: '144° is 36 matches, so each match is 4°.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<circle cx="5" cy="4" r="3" stroke="#333" fill="none" /><polyline points="5,4 5,7" stroke="#333" fill="none" /><polyline points="5,4 6.763,1.573" stroke="#333" fill="none" /><polyline points="5,4 2.402,2.5" stroke="#333" fill="none" />',
        labels: [
          { x: 6.769, y: 4.575, text: 'Won' },
          { x: 6.769, y: 3.955, text: '144°' },
          { x: 4.613, y: 2.181, text: 'Lost' },
          { x: 4.613, y: 1.561, text: '96°' },
          { x: 3.389, y: 4.93, text: 'Drawn' },
        ],
        elements: [], tolerance: 0,
      },
    },
    // Laid out differently from the paper: the distance asked for is a
    // DIAGONAL, measured with a ruler (3 across and 4 down, so 5 cm), and the
    // bearing is North East rather than the paper's South East.
    // Laid out differently from the paper: the distance asked for is a
    // DIAGONAL, measured with a ruler (3 across and 4 down, so 5 cm), and the
    // bearing is North East rather than the paper's South East.
    '19a': {
      skill: 'Proportion',
      question: 'The scale diagram shows towns A, B and C on a centimetre grid.\nScale 1 : 250 000\nWork out the actual distance from A to B.\nGive your answer in kilometres.',
      answer: '12.5 km (accept 12.25 km to 12.75 km)',
      working: 'A to B measures 5 cm (3 across and 4 down). 5 × 250 000 = 1 250 000 cm, and 100 000 cm = 1 km.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.6, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polyline points="0,0 0,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,0 10,0" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="1,0 1,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,1 10,1" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="2,0 2,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,2 10,2" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="3,0 3,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,3 10,3" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="4,0 4,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,4 10,4" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="5,0 5,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,5 10,5" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="6,0 6,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,6 10,6" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="7,0 7,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,7 10,7" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="8,0 8,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,8 10,8" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="9,0 9,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,9 10,9" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="10,0 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,10 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polygon points="0,0 10,0 10,10 0,10" stroke="#333" fill="none" /><polyline points="1.83,6.83 2.17,7.17" stroke="#333" fill="none" /><polyline points="1.83,7.17 2.17,6.83" stroke="#333" fill="none" /><polyline points="4.83,2.83 5.17,3.17" stroke="#333" fill="none" /><polyline points="4.83,3.17 5.17,2.83" stroke="#333" fill="none" /><polyline points="7.83,5.83 8.17,6.17" stroke="#333" fill="none" /><polyline points="7.83,6.17 8.17,5.83" stroke="#333" fill="none" /><polyline points="11,7.8 11,9.6" stroke="#333" fill="none" /><polyline points="10.82,9.3 11,9.6" stroke="#333" fill="none" /><polyline points="11.18,9.3 11,9.6" stroke="#333" fill="none" />',
        labels: [
          { x: 2, y: 7, text: 'A', dx: -12, dy: -10 },
          { x: 5, y: 3, text: 'B', dx: -12, dy: -10 },
          { x: 8, y: 6, text: 'C', dx: -12, dy: -10 },
          { x: 11, y: 9.6, text: 'N', dy: -8 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '19b': {
      skill: 'Bearings',
      question: 'The scale diagram shows towns A, B and C on a centimetre grid.\nScale 1 : 250 000\nC is North East of B.\nWrite down the bearing of C from B.',
      answer: '045°',
      working: 'North East is halfway between north (000°) and east (090°).',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.6, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polyline points="0,0 0,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,0 10,0" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="1,0 1,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,1 10,1" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="2,0 2,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,2 10,2" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="3,0 3,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,3 10,3" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="4,0 4,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,4 10,4" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="5,0 5,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,5 10,5" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="6,0 6,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,6 10,6" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="7,0 7,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,7 10,7" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="8,0 8,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,8 10,8" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="9,0 9,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,9 10,9" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="10,0 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,10 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polygon points="0,0 10,0 10,10 0,10" stroke="#333" fill="none" /><polyline points="1.83,6.83 2.17,7.17" stroke="#333" fill="none" /><polyline points="1.83,7.17 2.17,6.83" stroke="#333" fill="none" /><polyline points="4.83,2.83 5.17,3.17" stroke="#333" fill="none" /><polyline points="4.83,3.17 5.17,2.83" stroke="#333" fill="none" /><polyline points="7.83,5.83 8.17,6.17" stroke="#333" fill="none" /><polyline points="7.83,6.17 8.17,5.83" stroke="#333" fill="none" /><polyline points="11,7.8 11,9.6" stroke="#333" fill="none" /><polyline points="10.82,9.3 11,9.6" stroke="#333" fill="none" /><polyline points="11.18,9.3 11,9.6" stroke="#333" fill="none" />',
        labels: [
          { x: 2, y: 7, text: 'A', dx: -12, dy: -10 },
          { x: 5, y: 3, text: 'B', dx: -12, dy: -10 },
          { x: 8, y: 6, text: 'C', dx: -12, dy: -10 },
          { x: 11, y: 9.6, text: 'N', dy: -8 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '20': { skill: 'Finding the nth Term', question: 'A linear sequence has\n• 3rd term = 11\n• 7th term = 27\nWork out the nth term of the sequence.', answer: '4n − 1', working: '16 gained over 4 terms is 4 each time, and the 1st term is 3.' },
    '21': { skill: 'Ratio + Fractions of Amounts', question: 'Dan, Eve and Finn each have an amount of money.\n• Dan has £180\n• Dan\'s amount is <frac>3/4</frac> of Eve\'s amount\n• Finn\'s amount : Eve\'s amount = 2 : 5\nWork out how much money Finn has.', answer: '£96', working: 'Eve has £240, and Finn has two fifths of that.' },
    '22': {
      skill: 'Venn Diagrams + Calculating Simple Probability',
      question: 'The Venn diagram shows two sets A and B.\nThere are 30 items altogether and P(A) = <frac>1/2</frac>.\nWork out the value of x.',
      answer: 'x = 8',
      working: 'P(A) = <frac>1/2</frac> means A holds 15 items, and 15 − 7 = 8.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="1,1 9,1 9,7 1,7 1,1" stroke="#333" fill="none" /><circle cx="4.1" cy="4.1" r="2.1" stroke="#333" fill="none" /><circle cx="5.9" cy="4.1" r="2.1" stroke="#333" fill="none" />',
        labels: [
          { x: 2.5, y: 6.2, text: 'A' },
          { x: 7.5, y: 6.2, text: 'B' },
          { x: 3.1, y: 4.1, text: '7' },
          { x: 5, y: 4.1, text: 'x' },
          { x: 6.9, y: 4.1, text: '11' },
          { x: 8.3, y: 1.7, text: '4' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '23': {
      skill: 'Pythagoras\' Theorem',
      question: 'The diagram shows two right-angled triangles.\nUse Pythagoras’ theorem to show that x is between 10 and 11.',
      answer: 'x² = 110, and 10² = 100 while 11² = 121',
      working: 'The first hypotenuse squared is 36 + 49 = 85, then 85 + 25 = 110.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 14, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,7 1,1 8,1" stroke="#333" fill="none" /><polygon points="1,7 8,1 11.254,4.796" stroke="#333" fill="none" /><polyline points="1,1.6 1.6,1.6 1.6,1" stroke="#333" fill="none" /><polyline points="7.544,1.39 7.935,1.846 8.39,1.456" stroke="#333" fill="none" />',
        labels: [
          { x: 1, y: 4, text: '6 cm', dx: -17 },
          { x: 4.5, y: 1, text: '7 cm', dy: 14 },
          { x: 9.627, y: 2.898, text: '5 cm', dx: 20, dy: 5 },
          { x: 6.127, y: 5.898, text: 'x', dx: 6, dy: -8 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '24a': { skill: 'Understanding Straight Line Graphs', question: 'Write down the equation of a straight line parallel to y − 3x = 5', answer: 'Any line of the form y = 3x + c with c not equal to 5 — for example y = 3x + 1', working: 'Parallel lines share a gradient, here 3.' },
    '24b': { skill: 'Understanding Straight Line Graphs', question: 'A straight line has gradient 4 and passes through the point (2, 5). Circle the equation of the line.\ny = 2x + 1     y = 4x     y = 4x − 3     y = 4x + 5', answer: 'y = 4x − 3', working: '4 × 2 − 3 = 5, so the point fits.' },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
