import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — November 2024.
 *
 * ⚠ HYBRID FILE. DO NOT REGENERATE — you would delete 31 hand-authored retry
 * questions, 10 challenge questions and the sample class. The script refuses to
 * overwrite without --force; do not reach for --force here.
 *
 *   • The `questions` list came from data/exam-audit/NOV24-F-P3.json via
 *     scripts/generate-paper-from-audit.ts.
 *   • Everything from `retrySet` down is hand-authored and cannot be derived,
 *     because the audit transcribes no exam text.
 *
 * WHY IT WAS REBUILT (2026-09-04). This file previously held only 21 of the
 * paper's 41 items and 35 of its 80 marks — it stopped after question 12,
 * because it began life as hardcoded constants in the demo marking page rather
 * than as a coding of the whole paper. Since it is DEFAULT_PAPER_ID, a teacher
 * marking the real 3F would have seen half its questions and scored their class
 * out of 35. The audit's coding supplied the missing 20 items; the retry
 * questions for them were written to match.
 *
 * TWO THINGS TO KNOW BEFORE EDITING:
 *
 *   • `visual` on items 5(a), 5(b), 11(a), 11(b) and 11(c) is HAND-SET and
 *     deliberately disagrees with what the generator would produce. It derives
 *     `visual` from an answer_form of "draw…", which catches only DRAWING a
 *     diagram; PaperQuestion.visual means the wider "depends on a diagram in
 *     the original paper — a chart to read, a number pattern to complete".
 *     Reading a composite bar chart is visual and the heuristic misses it.
 *
 *   • retrySet must stay ALL-OR-NOTHING — every non-visual item or none, which
 *     papers.test.ts enforces. Adding an item means adding its retry question.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const AQA_8300_3F_NOV24: PaperConfig = {
  id: 'aqa-8300-3f-nov24',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                                        skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                     skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                     skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Simple Arithmetic',                              skillIds: ['proportion', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '4a',  label: '4(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'ordering; exact sequence checkable' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                          skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'ordering; exact sequence checkable' },
    { id: '5a',  label: '5(a)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'static composite bar chart supported' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'identify category from chart' },
    { id: '5c',  label: '5(c)',  marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing/shading a composite bar' },
    { id: '6',   label: '6',     marks: 1,  topic: 'number',   skill: 'Time Calculations',                                           skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'tick + worded reason not markable' },
    { id: '7',   label: '7',     marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                           skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                           skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '9',   label: '9',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                    skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '10b', label: '10(b)', marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations',                                    skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: true, desc: 'number-diagram cell entry' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                           skillIds: ['function_machines'], kind: 'mastery', visual: true, desc: 'number-diagram cell entry' },
    { id: '11c', label: '11(c)', marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations + Forming Expressions and Formulae', skillIds: ['solving_linear_equations', 'forming_expressions_and_formulae'], kind: 'exam', visual: true, desc: '' },
    { id: '12',  label: '12',    marks: 2,  topic: 'probdata', skill: 'Median',                                                      skillIds: ['median'], kind: 'mastery', visual: false, desc: '' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                              skillIds: ['symmetry'], kind: 'mastery', visual: true, desc: 'requires drawing lines of symmetry' },
    { id: '13b', label: '13(b)', marks: 1,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                              skillIds: ['symmetry'], kind: 'mastery', visual: true, desc: 'requires shading/completing a symmetric pattern' },
    { id: '14a', label: '14(a)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                               skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                               skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: '' },
    { id: '14c', label: '14(c)', marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',              skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '15',  label: '15',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Ratio',                                skillIds: ['fractions_of_amounts', 'ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '16',  label: '16',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                            skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '17',  label: '17',    marks: 3,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Simplifying Expressions',  skillIds: ['forming_expressions_and_formulae', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'line-matching input not supported' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                          skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'probdata', skill: 'Time Series',                                                 skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires plotting line graph' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'probdata', skill: 'Time Series',                                                 skillIds: ['time_series'], kind: 'mastery', visual: false, desc: 'range-tolerance answer; exact-match insufficient' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                        skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'requires drawing plan view on a grid' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                        skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'requires drawing front elevation on a grid' },
    { id: '21',  label: '21',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Areas of Squares and Rectangles',                     skillIds: ['ratio', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence checker' },
    { id: '22',  label: '22',    marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                      skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that justification with bounds not markable' },
    { id: '23',  label: '23',    marks: 2,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                            skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'formula expression needs equivalence checker' },
    { id: '24a', label: '24(a)', marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                       skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence checker' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                       skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'explain-the-error worded answer not markable' },
    { id: '25',  label: '25',    marks: 4,  topic: 'shape',    skill: 'Coordinates + Understanding Straight Line Graphs',            skillIds: ['coordinates', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'multiple coordinate answers need pair-equivalence checker' },
    { id: '26',  label: '26',    marks: 2,  topic: 'shape',    skill: 'Volume of a Sphere',                                          skillIds: ['volume_of_a_sphere'], kind: 'mastery', visual: false, desc: 'identify-mistakes worded answers not markable' },
  ],

  // ── Hand-authored below this line ─────────────────────────────────────────
  // The questions above come from the audit; everything below does not, and a
  // regeneration would wipe it. See the file header.
  //
  // Rebuilt 2026-09-11 against the question paper: every retry carries its
  // answer and working, a multi-part question shares its setup (and figure)
  // across its parts, and a figure is drawn wherever the paper draws one.
  retrySet: {
    '1a': { skill: 'Fractions of Amounts', question: 'Work out <frac>3/4</frac> of 912', answer: '684', working: '912 ÷ 4 = 228, then × 3.' },
    '1b': { skill: 'Indices', question: 'Work out the value of 23²', answer: '529' },
    '2': { skill: 'Simplifying Expressions', question: 'Simplify fully p + p + p + p + p', answer: '5p' },
    '3a': { skill: 'Proportion + Simple Arithmetic', question: '5 oranges cost 85p\nWork out the cost, in pounds (£), of 20 of these oranges.', answer: '£3.40', working: '20 is 4 lots of 5, and 4 × 85p = 340p.' },
    '3b': { skill: 'Simple Arithmetic', question: 'In total, the cost of 30 bottles of water and 60 bottles of lemonade is £47.40\nWork out the cost of\n3 bottles of water and 6 bottles of lemonade.', answer: '£4.74', working: 'It is one tenth of the order, so £47.40 ÷ 10.' },
    '4a': { skill: 'Simple Arithmetic', question: 'Write these numbers in order of size.\nStart with the smallest number.\n−3     0.5     −0.7     2', answer: '−3, −0.7, 0.5, 2' },
    '4b': { skill: 'Fractions Decimals and Percentages', question: 'Write these numbers in order of size.\nStart with the smallest number.\n<frac>1/3</frac>     <frac>5/6</frac>     <frac>1/12</frac>     <frac>1/4</frac>', answer: '<frac>1/12</frac>, <frac>1/4</frac>, <frac>1/3</frac>, <frac>5/6</frac>', working: 'In twelfths they are 4, 10, 1 and 3.' },
    '6': { skill: 'Time Calculations', question: 'Amina leaves home at 8.25 am\nShe travels to school in 25 minutes.\nDoes Amina arrive at school by 8.45 am?\nTick a box.\n[   ] Yes\n[   ] No\nGive a reason for your answer.', answer: 'No', working: '8.25 am + 25 minutes = 8.50 am, which is after 8.45 am.' },
    '7': { skill: 'Simple Arithmetic', question: 'Priya has £30\nA notebook costs £1.70\nWork out the greatest number of notebooks she can buy.', answer: '17', working: '30 ÷ 1.70 = 17.6…, and she cannot buy part of a notebook.' },

    // 8(a) and (b) share one machine, drawn as the paper draws it.
    '8a': {
      skill: 'Function Machines',
      question: 'Here is a number machine.\nWork out the output when the input is 8',
      answer: '29',
      working: '8 × 3 = 24, then + 5.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<ellipse cx="1.2" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" /><polyline points="2.2,1.5 3.2,1.5" stroke="#333" fill="none" /><polyline points="2.95,1.68 3.18,1.5 2.95,1.32" stroke="#333" fill="none" /><polyline points="3.2,1 5.2,1 5.2,2 3.2,2 3.2,1" stroke="#333" fill="none" /><polyline points="5.2,1.5 6.8,1.5" stroke="#333" fill="none" /><polyline points="6.55,1.68 6.78,1.5 6.55,1.32" stroke="#333" fill="none" /><polyline points="6.8,1 8.8,1 8.8,2 6.8,2 6.8,1" stroke="#333" fill="none" /><polyline points="8.8,1.5 9.8,1.5" stroke="#333" fill="none" /><polyline points="9.55,1.68 9.78,1.5 9.55,1.32" stroke="#333" fill="none" /><ellipse cx="10.8" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" />',
        labels: [
          { x: 1.2, y: 2.55, text: 'Input' },
          { x: 10.8, y: 2.55, text: 'Output' },
          { x: 4.2, y: 1.5, text: '× 3' },
          { x: 7.8, y: 1.5, text: '+ 5' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '8b': {
      skill: 'Function Machines',
      question: 'Here is a number machine.\nWork out the input when the output is 20',
      answer: '5',
      working: 'Work backwards: 20 − 5 = 15, then 15 ÷ 3.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<ellipse cx="1.2" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" /><polyline points="2.2,1.5 3.2,1.5" stroke="#333" fill="none" /><polyline points="2.95,1.68 3.18,1.5 2.95,1.32" stroke="#333" fill="none" /><polyline points="3.2,1 5.2,1 5.2,2 3.2,2 3.2,1" stroke="#333" fill="none" /><polyline points="5.2,1.5 6.8,1.5" stroke="#333" fill="none" /><polyline points="6.55,1.68 6.78,1.5 6.55,1.32" stroke="#333" fill="none" /><polyline points="6.8,1 8.8,1 8.8,2 6.8,2 6.8,1" stroke="#333" fill="none" /><polyline points="8.8,1.5 9.8,1.5" stroke="#333" fill="none" /><polyline points="9.55,1.68 9.78,1.5 9.55,1.32" stroke="#333" fill="none" /><ellipse cx="10.8" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" />',
        labels: [
          { x: 1.2, y: 2.55, text: 'Input' },
          { x: 10.8, y: 2.55, text: 'Output' },
          { x: 4.2, y: 1.5, text: '× 3' },
          { x: 7.8, y: 1.5, text: '+ 5' },
        ],
        elements: [], tolerance: 0,
      },
    },

    // The paper draws the loaf with a double-headed arrow along its length;
    // the retry draws its row of books the same way.
    '9': {
      skill: 'Simple Arithmetic',
      question: 'A row of books has\n8 books each 25 mm thick\nand\n2 bookends each 18 mm thick.\nWork out the total length of the row.\nGive your answer in centimetres.\nNot drawn accurately.',
      answer: '23.6 cm',
      working: '8 × 25 + 2 × 18 = 236 mm, and 10 mm = 1 cm.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polyline points="1,1 1.5,1 1.5,4.4 1,4.4 1,1" stroke="#333" fill="none" /><polyline points="1.5,1 7.9,1 7.9,3.8 1.5,3.8" stroke="#333" fill="none" /><polyline points="2.3,1 2.3,3.8" stroke="#333" fill="none" /><polyline points="3.1,1 3.1,3.8" stroke="#333" fill="none" /><polyline points="3.9,1 3.9,3.8" stroke="#333" fill="none" /><polyline points="4.7,1 4.7,3.8" stroke="#333" fill="none" /><polyline points="5.5,1 5.5,3.8" stroke="#333" fill="none" /><polyline points="6.3,1 6.3,3.8" stroke="#333" fill="none" /><polyline points="7.1,1 7.1,3.8" stroke="#333" fill="none" /><polyline points="7.9,1 8.4,1 8.4,4.4 7.9,4.4 7.9,1" stroke="#333" fill="none" /><polyline points="1,0.4 8.4,0.4" stroke="#333" fill="none" /><polyline points="1.3,0.58 1,0.4 1.3,0.22" stroke="#333" fill="none" /><polyline points="8.1,0.58 8.4,0.4 8.1,0.22" stroke="#333" fill="none" />',
        elements: [], tolerance: 0,
      },
    },
    '10a': { skill: 'Solving Linear Equations', question: 'Solve <frac>c/5</frac> = 12', answer: 'c = 60', working: 'Multiply both sides by 5.' },
    '10b': { skill: 'Solving Linear Equations', question: 'Solve 3(4e − 2) = 42', answer: 'e = 4', working: '4e − 2 = 14, so 4e = 16.' },
    '12': { skill: 'Median', question: 'Here are some numbers.\n15     3     9     7     11     4     7     20     6\nWork out the median.', answer: '7', working: 'In order: 3, 4, 6, 7, 7, 9, 11, 15, 20 — the 5th value.' },

    // 14(a)-(c) share one Venn diagram, with its numbers in it, as on the
    // paper. Each part reads a different region.
    '14a': {
      skill: 'Venn Diagrams',
      question: 'The Venn diagram shows information about people who work at a leisure centre.\nL = people who can work as a lifeguard\nC = people who can work in the café\nHow many people can work as a lifeguard and in the café?',
      answer: '6',
      working: 'The overlap of the two circles.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="1,1 9,1 9,7 1,7 1,1" stroke="#333" fill="none" /><circle cx="4.1" cy="4.1" r="2.1" stroke="#333" fill="none" /><circle cx="5.9" cy="4.1" r="2.1" stroke="#333" fill="none" />',
        labels: [
          { x: 2.5, y: 6.2, text: 'L' },
          { x: 7.5, y: 6.2, text: 'C' },
          { x: 3.1, y: 4.1, text: '14' },
          { x: 5, y: 4.1, text: '6' },
          { x: 6.9, y: 4.1, text: '9' },
          { x: 8.3, y: 1.7, text: '4' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '14b': {
      skill: 'Venn Diagrams',
      question: 'The Venn diagram shows information about people who work at a leisure centre.\nL = people who can work as a lifeguard\nC = people who can work in the café\nHow many people can work in the café but not as a lifeguard?',
      answer: '9',
      working: 'The part of C outside L.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="1,1 9,1 9,7 1,7 1,1" stroke="#333" fill="none" /><circle cx="4.1" cy="4.1" r="2.1" stroke="#333" fill="none" /><circle cx="5.9" cy="4.1" r="2.1" stroke="#333" fill="none" />',
        labels: [
          { x: 2.5, y: 6.2, text: 'L' },
          { x: 7.5, y: 6.2, text: 'C' },
          { x: 3.1, y: 4.1, text: '14' },
          { x: 5, y: 4.1, text: '6' },
          { x: 6.9, y: 4.1, text: '9' },
          { x: 8.3, y: 1.7, text: '4' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '14c': {
      skill: 'Venn Diagrams + Calculating Simple Probability',
      question: 'The Venn diagram shows information about people who work at a leisure centre.\nL = people who can work as a lifeguard\nC = people who can work in the café\nWhat fraction of all the people can work as a lifeguard?',
      answer: '<frac>20/33</frac>',
      working: '14 + 6 = 20 can work as a lifeguard, out of 14 + 6 + 9 + 4 = 33 people.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="1,1 9,1 9,7 1,7 1,1" stroke="#333" fill="none" /><circle cx="4.1" cy="4.1" r="2.1" stroke="#333" fill="none" /><circle cx="5.9" cy="4.1" r="2.1" stroke="#333" fill="none" />',
        labels: [
          { x: 2.5, y: 6.2, text: 'L' },
          { x: 7.5, y: 6.2, text: 'C' },
          { x: 3.1, y: 4.1, text: '14' },
          { x: 5, y: 4.1, text: '6' },
          { x: 6.9, y: 4.1, text: '9' },
          { x: 8.3, y: 1.7, text: '4' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '15': { skill: 'Fractions of Amounts + Ratio', question: 'To get to work, 180 people either take the bus, take the train or cycle.\n<frac>2/9</frac> of the people take the bus.\npeople who take the train : people who cycle = 2 : 3\nHow many people cycle?', answer: '84', working: '<frac>2/9</frac> of 180 = 40 take the bus, and the other 140 split 2 : 3 as 56 and 84.' },
    '16': { skill: 'Growth and Decay', question: 'The original value of a laptop is £750\nThe value of the laptop decreases by 20% in the first year\nthen 5% in the second year.\nWork out the value of the laptop after these two years.', answer: '£570', working: '750 × 0.8 = 600, then 600 × 0.95 = 570.' },

    // The paper matches boxes with lines; on a sheet the student writes the
    // description beside each piece of algebra instead. One is done.
    '17': { skill: 'Forming Expressions and Formulae + Simplifying Expressions', question: 'Match the algebra to the correct description.\nOne has been done for you.\n<table>Algebra | Description\n4x − 3 = 2x + 7 | \n5(a + 3) ≡ 5a + 15 | \nV = 3h + 2w | Formula\n6p − 2q | \n3k + 1 > 10 | </table>\nChoose from:     Equation     Expression     Identity     Inequality', answer: '4x − 3 = 2x + 7 is an equation; 5(a + 3) ≡ 5a + 15 is an identity; 6p − 2q is an expression; 3k + 1 > 10 is an inequality', working: 'An identity is true for every value, which ≡ shows; an expression has no equals or inequality sign.' },
    '18': { skill: 'Fractions Decimals and Percentages', question: 'Maya has £40 to spend on books.\nShe buys 6 books, each costing £4.60\nWhat percentage of the £40 does she spend?', answer: '69%', working: '6 × £4.60 = £27.60, and 27.60 ÷ 40 = 0.69.' },

    // 19(a) is `visual: true` and gets the graph, started as the paper starts
    // it: the first three years plotted, the rest for the student. 19(b)
    // reads the same graph.
    '19a': {
      skill: 'Time Series',
      question: 'The table shows the number of electric car charging points in a town.\n<table>Year | 2017 | 2018 | 2019 | 2020 | 2021 | 2022\nNumber of charging points | 30 | 45 | 80 | 140 | 200 | 265</table>\nThe graph shows some of this information.\nComplete the graph.',
      answer: 'Points at (2020, 140), (2021, 200) and (2022, 265), joined with straight lines',
      working: 'Plot each year above its label and join to the point before.',
      diagram: {
        mode: 'polyline',
        x: { min: 2016, max: 2023, step: 1, label: 'Year' },
        y: { min: 0, max: 350, step: 50, label: 'Number of charging points' },
        background: '<polyline points="2017,30 2018,45" stroke="#333" stroke-width="0.248" /><polyline points="2018,45 2019,80" stroke="#333" stroke-width="0.1245" /><polyline points="2016.88,24 2017.12,36" stroke="#333" stroke-width="0.101" /><polyline points="2016.88,36 2017.12,24" stroke="#333" stroke-width="0.101" /><polyline points="2017.88,39 2018.12,51" stroke="#333" stroke-width="0.101" /><polyline points="2017.88,51 2018.12,39" stroke="#333" stroke-width="0.101" /><polyline points="2018.88,74 2019.12,86" stroke="#333" stroke-width="0.101" /><polyline points="2018.88,86 2019.12,74" stroke="#333" stroke-width="0.101" />',
        elements: [{ x: 2020, y: 140, marks: 1 }, { x: 2021, y: 200, marks: 1 }, { x: 2022, y: 265, marks: 1 }],
        tolerance: 0,
      },
    },
    '19b': {
      skill: 'Time Series',
      question: 'The table shows the number of electric car charging points in a town.\n<table>Year | 2017 | 2018 | 2019 | 2020 | 2021 | 2022\nNumber of charging points | 30 | 45 | 80 | 140 | 200 | 265</table>\nThe graph shows some of this information.\nUse the graph to estimate the number of charging points in 2023',
      answer: 'About 330 (accept 320 to 345)',
      working: 'The graph has been rising by about 60 to 65 a year, so continue the trend on from 265.',
      diagram: {
        mode: 'polyline',
        x: { min: 2016, max: 2023, step: 1, label: 'Year' },
        y: { min: 0, max: 350, step: 50, label: 'Number of charging points' },
        background: '<polyline points="2017,30 2018,45" stroke="#333" stroke-width="0.248" /><polyline points="2018,45 2019,80" stroke="#333" stroke-width="0.1245" /><polyline points="2016.88,24 2017.12,36" stroke="#333" stroke-width="0.101" /><polyline points="2016.88,36 2017.12,24" stroke="#333" stroke-width="0.101" /><polyline points="2017.88,39 2018.12,51" stroke="#333" stroke-width="0.101" /><polyline points="2017.88,51 2018.12,39" stroke="#333" stroke-width="0.101" /><polyline points="2018.88,74 2019.12,86" stroke="#333" stroke-width="0.101" /><polyline points="2018.88,86 2019.12,74" stroke="#333" stroke-width="0.101" />',
        elements: [],
        tolerance: 0,
      },
    },
    '21': {
      skill: 'Ratio + Areas of Squares and Rectangles',
      question: 'These two rectangles have the same area.\nWork out the ratio perimeter A : perimeter B\nNot drawn accurately.',
      answer: '5 : 4',
      working: 'A has area 12 × 3 = 36, so B is 36 ÷ 6 = 6 cm tall; the perimeters are 30 cm and 24 cm.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 13, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polygon points="1,1 7,1 7,2.5 1,2.5" stroke="#333" fill="none" /><polygon points="9,1 12,1 12,4 9,4" stroke="#333" fill="none" />',
        labels: [
          { x: 4, y: 1.75, text: 'A' },
          { x: 10.5, y: 2.5, text: 'B' },
          { x: 4, y: 1, text: '12 cm', dy: 14 },
          { x: 1, y: 1.75, text: '3 cm', dx: -16 },
          { x: 10.5, y: 1, text: '6 cm', dy: 14 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '22': { skill: 'Upper and Lower Bounds', question: 'To the nearest pound, Tom has £20\nHe wants to buy 7 tickets.\nEach ticket costs £2.75\nShow that Tom definitely has enough money to buy the 7 tickets.', answer: 'The least Tom can have is £19.50, and 7 × £2.75 = £19.25, which is less than £19.50', working: 'To the nearest pound, £20 could be as little as £19.50.' },
    '23': { skill: 'Forming Expressions and Formulae', question: 'The total cost of hiring a bike is calculated by adding a fixed charge of £6 and a charge of £3 per hour.\nWrite a formula to work out the total cost, £T, of hiring a bike for h hours.', answer: 'T = 3h + 6' },
    '24a': { skill: 'Ratio', question: 'At a college\n• there are 720 students\n• the ratio of students to teachers is 14.4 : 1\nThe number of students stays the same.\nThe number of teachers increases by 4\nWork out the new ratio of students to teachers.\nGive your answer in the form n : 1', answer: '13.3 : 1 (13.33… : 1)', working: '720 ÷ 14.4 = 50 teachers, so 54 now, and 720 ÷ 54 = 13.33…' },
    '24b': { skill: 'Ratio', question: 'On a trip, one minibus is needed for every group of 14 or fewer people.\n100 people want to go on the trip.\nJo tries to work out how many minibuses are needed.\n100 ÷ 14 = 7.14…\n7 minibuses are needed.\nWhat is wrong with her answer?', answer: 'She should have rounded up: 7 minibuses carry only 98 people, so 8 are needed', working: 'Any part of a group still needs its own minibus.' },

    // The paper prints a blank coordinate grid beside the three lines.
    '25': {
      skill: 'Coordinates + Understanding Straight Line Graphs',
      question: 'A triangle is drawn using the lines\ny = x\nx = 3\ny = −1\nWork out the coordinates of the three vertices of the triangle.',
      answer: '(−1, −1), (3, −1) and (3, 3)',
      working: 'Each vertex is where two of the lines cross: y = x meets y = −1 at (−1, −1) and x = 3 at (3, 3); x = 3 meets y = −1 at (3, −1).',
      diagram: {
        mode: 'polygon',
        x: { min: -6, max: 6, step: 1, label: 'x' },
        y: { min: -6, max: 6, step: 1, label: 'y' },
        background: '',
        elements: [], tolerance: 0,
      },
    },

    // Drawn as the paper draws the hemisphere, with the length marked across
    // the top. The retry marks the DIAMETER, so using it as the radius is one
    // of the two mistakes to spot.
    // Drawn as the paper draws the hemisphere, with the radius marked from the
    // centre to the edge. Kai's two slips mirror the paper's kind — a power
    // written wrongly, and one step of the formula done the wrong way round.
    '26': {
      skill: 'Volume of a Sphere',
      question: 'Volume of a sphere = <frac>4/3</frac> × π × r³ where r is the radius\nKai works out the volume of this hemisphere in terms of π\nHere is his work.\nVolume of a hemisphere = <frac>4/3</frac> × π × 6² × 2 = 96π\nWrite down two mistakes he has made.',
      answer: '1: he squared the radius instead of cubing it. 2: he multiplied by 2 instead of dividing by 2',
      working: 'The correct volume is <frac>4/3</frac> × π × 6³ ÷ 2 = 144π cm³.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 7, step: 1, label: '' },
        background: '<ellipse cx="5" cy="5" rx="4" ry="0.9" stroke="#333" fill="none" /><path d="M 1,5 A 4,4 0 0,1 9,5" stroke="#333" fill="none" /><polyline points="5,5 8.75,5" stroke="#333" fill="none" /><polyline points="5.3,5.18 5,5 5.3,4.82" stroke="#333" fill="none" /><polyline points="8.45,5.18 8.75,5 8.45,4.82" stroke="#333" fill="none" />',
        labels: [
          { x: 6.9, y: 5.45, text: '6 cm' },
        ],
        elements: [], tolerance: 0,
      },
    },
  },

  challengeQuestions: [
    { topic: 'number', skill: 'Reverse Percentages', question: 'A laptop costs £612 after a 15% discount. What was the original price?', answer: '£720', working: '£612 is 85% of the original price.' },
    { topic: 'number', skill: 'Standard Form', question: 'Write 0.00047 in standard form.', answer: '4.7 × 10⁻⁴' },
    { topic: 'number', skill: 'Surds', question: 'Simplify √72 + √18. Give your answer in the form a√b.', answer: '9√2', working: '√72 = 6√2 and √18 = 3√2.' },
    { topic: 'algebra', skill: 'Simultaneous Equations', question: '3x + 2y = 16 and 5x − 2y = 24. Find the values of x and y.', answer: 'x = 5, y = 0.5', working: 'Adding the equations eliminates y: 8x = 40.' },
    { topic: 'algebra', skill: 'Quadratic Factorising', question: 'Factorise x² + 5x − 14.', answer: '(x + 7)(x − 2)' },
    { topic: 'algebra', skill: 'Sequences (nth term)', question: 'Find the nth term of the sequence 7, 11, 15, 19, ...', answer: '4n + 3', working: 'The common difference is 4, and 7 − 4 = 3.' },
    { topic: 'ratio', skill: 'Compound Measures', question: 'A car travels 156 miles in 2 hours 24 minutes. Work out the average speed in mph.', answer: '65 mph', working: '2 hours 24 minutes is 2.4 hours.' },
    { topic: 'ratio', skill: 'Direct Proportion', question: 'y is directly proportional to x. When x = 5, y = 35. Find y when x = 9.', answer: 'y = 63', working: 'y = 7x.' },
    { topic: 'probdata', skill: 'Probability', question: 'A bag contains 4 red, 3 blue and 5 green counters. Two counters are drawn without replacement. Work out the probability that both are red.', answer: '<frac>1/11</frac>', working: '<frac>4/12</frac> × <frac>3/11</frac> = <frac>12/132</frac>.' },
    { topic: 'probdata', skill: 'Cumulative Frequency', question: 'The median of a set of 60 values is estimated from a cumulative frequency graph. Which value on the vertical axis should you read across from?', answer: '30', working: 'Half of 60.' },
  ],

  sampleStudents: ['Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim', 'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson'],

  // Marks for the original 21 items are the originals; the rest are generated
  // (deterministic, seed 42) around each student's demonstrated ability so the
  // sample class keeps its characters.
  sampleMarks: {
    'Amira Patel': { '1a': 1, '1b': 1, '2': 1, '3a': 2, '3b': 2, '4a': 2, '4b': 2, '5a': 1, '5b': 1, '5c': 2, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 3, '10a': 1, '10b': 3, '11a': 1, '11b': 2, '11c': 3, '12': 2, '13a': 2, '13b': 1, '14a': 1, '14b': 1, '14c': 2, '15': 3, '16': 3, '17': 3, '18': 3, '19a': 2, '19b': 1, '20a': 2, '20b': 2, '21': 4, '22': 3, '23': 2, '24a': 3, '24b': 1, '25': 3, '26': 2 },
    'Ben Okonkwo': { '1a': 1, '1b': 1, '2': 1, '3a': 2, '3b': 1, '4a': 2, '4b': 1, '5a': 1, '5b': 0, '5c': 1, '6': 1, '7': 2, '8a': 1, '8b': 0, '9': 2, '10a': 1, '10b': 1, '11a': 1, '11b': 1, '11c': 0, '12': 2, '13a': 2, '13b': 1, '14a': 1, '14b': 0, '14c': 1, '15': 2, '16': 2, '17': 2, '18': 2, '19a': 1, '19b': 1, '20a': 2, '20b': 1, '21': 3, '22': 2, '23': 1, '24a': 1, '24b': 1, '25': 3, '26': 1 },
    'Charlotte Evans': { '1a': 1, '1b': 1, '2': 0, '3a': 1, '3b': 2, '4a': 2, '4b': 1, '5a': 1, '5b': 1, '5c': 1, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 1, '10a': 1, '10b': 2, '11a': 0, '11b': 1, '11c': 1, '12': 1, '13a': 1, '13b': 1, '14a': 1, '14b': 1, '14c': 1, '15': 2, '16': 2, '17': 2, '18': 2, '19a': 1, '19b': 1, '20a': 1, '20b': 1, '21': 3, '22': 2, '23': 1, '24a': 2, '24b': 1, '25': 3, '26': 1 },
    'Daniel Kim': { '1a': 1, '1b': 0, '2': 1, '3a': 2, '3b': 0, '4a': 1, '4b': 0, '5a': 1, '5b': 1, '5c': 2, '6': 0, '7': 1, '8a': 1, '8b': 1, '9': 2, '10a': 1, '10b': 2, '11a': 1, '11b': 0, '11c': 0, '12': 2, '13a': 1, '13b': 0, '14a': 1, '14b': 1, '14c': 1, '15': 2, '16': 1, '17': 2, '18': 2, '19a': 1, '19b': 1, '20a': 1, '20b': 1, '21': 3, '22': 1, '23': 1, '24a': 2, '24b': 1, '25': 2, '26': 1 },
    'Emily Zhang': { '1a': 1, '1b': 1, '2': 1, '3a': 0, '3b': 0, '4a': 2, '4b': 2, '5a': 0, '5b': 0, '5c': 0, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 3, '10a': 1, '10b': 3, '11a': 1, '11b': 2, '11c': 2, '12': 0, '13a': 1, '13b': 1, '14a': 1, '14b': 1, '14c': 1, '15': 2, '16': 2, '17': 2, '18': 3, '19a': 2, '19b': 1, '20a': 1, '20b': 1, '21': 2, '22': 2, '23': 1, '24a': 2, '24b': 1, '25': 2, '26': 1 },
    'Finn McCarthy': { '1a': 0, '1b': 1, '2': 0, '3a': 1, '3b': 0, '4a': 1, '4b': 0, '5a': 1, '5b': 0, '5c': 0, '6': 0, '7': 1, '8a': 1, '8b': 0, '9': 1, '10a': 1, '10b': 0, '11a': 0, '11b': 0, '11c': 0, '12': 1, '13a': 1, '13b': 0, '14a': 0, '14b': 0, '14c': 1, '15': 1, '16': 0, '17': 1, '18': 0, '19a': 1, '19b': 0, '20a': 0, '20b': 1, '21': 2, '22': 1, '23': 1, '24a': 1, '24b': 0, '25': 2, '26': 0 },
    'Grace Adeyemi': { '1a': 1, '1b': 0, '2': 1, '3a': 0, '3b': 0, '4a': 1, '4b': 1, '5a': 0, '5b': 1, '5c': 0, '6': 1, '7': 0, '8a': 0, '8b': 0, '9': 0, '10a': 0, '10b': 1, '11a': 0, '11b': 0, '11c': 0, '12': 1, '13a': 0, '13b': 0, '14a': 0, '14b': 0, '14c': 1, '15': 0, '16': 1, '17': 1, '18': 0, '19a': 0, '19b': 0, '20a': 1, '20b': 0, '21': 1, '22': 1, '23': 0, '24a': 0, '24b': 0, '25': 1, '26': 1 },
    'Harry Wilson': { '1a': 1, '1b': 1, '2': 1, '3a': 2, '3b': 2, '4a': 2, '4b': 2, '5a': 1, '5b': 1, '5c': 2, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 3, '10a': 1, '10b': 3, '11a': 1, '11b': 2, '11c': 2, '12': 2, '13a': 2, '13b': 1, '14a': 1, '14b': 1, '14c': 2, '15': 3, '16': 3, '17': 3, '18': 3, '19a': 2, '19b': 1, '20a': 2, '20b': 2, '21': 4, '22': 3, '23': 2, '24a': 3, '24b': 1, '25': 4, '26': 2 },
  },
}
