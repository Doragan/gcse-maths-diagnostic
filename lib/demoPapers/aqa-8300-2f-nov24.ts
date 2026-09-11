import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator, Nov 2024.
 *
 * Built the same way as aqa-8300-1f-nov24.ts — see that file's header for the
 * general approach (real QP/MS as source, audit JSON for marks/skill/topic,
 * `desc` a paraphrase not a transcription).
 *
 * Several questions here reference a diagram (angles on a line, a pie chart, a
 * right-angled triangle, a rectangle labelled with algebra) whose specific
 * given numbers the audit doesn't carry. Where the mark scheme's OWN worked
 * examples pin those numbers down exactly (eg Q6(c)'s "47 + 86 = 133" appears
 * in the MS's additional guidance; Q14's pie chart angles are forced by
 * "360 − 90 − 78 − 48"; Q19's triangle sides by "1.7² − 1.5² = 0.64"), the
 * real values are used and the question is retryable. Where they are not
 * recoverable at all (Q4's grid coordinates, depending on an unlabelled point
 * B the mark scheme never needs), the question is marked `visual: true` rather
 * than guessed.
 *
 * Two corrections versus the audit's skill tagging, both confirmed against the
 * real QP wording:
 *  - Q9 ("list all 3-topping combinations from H/S/O/M") has NO diagram at
 *    all — audit's `answer_form: table_complete` describes the answer BOXES,
 *    not a picture. Fully retryable as text.
 *  - Q12(b) is "Rearrange y = w − 1 to make w the subject" — genuinely
 *    `rearranging_formulae`, not `simplifying_expressions` as tagged.
 * Neither correction is folded back into the audit JSON here; out of scope.
 */
export const AQA_8300_2F_NOV24: PaperConfig = {
  id: 'aqa-8300-2f-nov24',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a', label: '1(a)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Next term: 4, 7, 10, 13, …', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '1b', label: '1(b)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Next term: 19, 14, 9, 4, …', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '1c', label: '1(c)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Term-to-term rule: 3, 6, 12, 24, …', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '2a', label: '2(a)', marks: 1, topic: 'number', skill: 'Simple Arithmetic', desc: 'Cost of three candles at £4.55 each', skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '2b', label: '2(b)', marks: 2, topic: 'number', skill: 'Simple Arithmetic', desc: '£7.50 — enough for soap (£2.00) + body cream (£3.80) + lip scrub (£1.75)?', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '3a', label: '3(a)', marks: 1, topic: 'algebra', skill: 'Solving Linear Equations', desc: 'Solve 5x = 30', skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false },
    { id: '3b', label: '3(b)', marks: 1, topic: 'algebra', skill: 'Solving Linear Equations', desc: 'Solve −2 + y = 10', skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false },
    { id: '3c', label: '3(c)', marks: 2, topic: 'number', skill: 'Simplifying Indices', desc: 'Simplify fully 20w ÷ 4w', skillIds: ['simplifying_indices'], kind: 'mastery', visual: false },
    { id: '4a', label: '4(a)', marks: 1, topic: 'shape', skill: 'Coordinates', desc: 'Coordinates of point C (from the grid)', skillIds: ['coordinates'], kind: 'mastery', visual: false },
    { id: '4b', label: '4(b)', marks: 1, topic: 'shape', skill: 'Coordinates', desc: 'Midpoint of A and C (from the grid)', skillIds: ['coordinates'], kind: 'mastery', visual: false },
    { id: '4c', label: '4(c)', marks: 1, topic: 'shape', skill: 'Coordinates', desc: 'Plot D on the grid so ABCD is a rhombus', skillIds: ['coordinates'], kind: 'mastery', visual: true },
    { id: '5a', label: '5(a)', marks: 1, topic: 'probdata', skill: 'Range', desc: 'Range of 14.2, 15.1, 16.5, 16.7, 18.0', skillIds: ['range'], kind: 'mastery', visual: false },
    { id: '5b', label: '5(b)', marks: 2, topic: 'probdata', skill: 'Mean', desc: 'Mean of 14.2, 15.1, 16.5, 16.7, 18.0', skillIds: ['mean'], kind: 'mastery', visual: false },
    { id: '6a', label: '6(a)', marks: 1, topic: 'shape', skill: 'Angles on Lines and Circles', desc: 'Angle x on a straight line (diagram)', skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false },
    { id: '6b', label: '6(b)', marks: 2, topic: 'shape', skill: 'Angles on Lines and Circles', desc: 'Angle y at an intersection (diagram)', skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false },
    { id: '6c', label: '6(c)', marks: 3, topic: 'shape', skill: 'Angles on Lines and Circles', desc: 'Three lines intersect, angles 47° and 86° marked — classify the triangle formed', skillIds: ['angles_on_lines_and_circles'], kind: 'exam', visual: false },
    { id: '7', label: '7', marks: 3, topic: 'ratio', skill: 'Proportion + Simple Arithmetic', desc: '5 packs of 8 cartons + 16 packs of 3 cartons; 4 cartons/day — how many days', skillIds: ['proportion', 'simple_arithmetic'], kind: 'exam', visual: false },
    { id: '8', label: '8', marks: 3, topic: 'probdata', skill: 'Simple Charts', desc: 'Complete a pictogram (100 voters, Jo/Kim/Liam)', skillIds: ['simple_charts'], kind: 'exam', visual: true },
    { id: '9', label: '9', marks: 2, topic: 'probdata', skill: 'Systematic Listing', desc: 'List all 3-topping pizza combinations from 4 choices', skillIds: ['systematic_listing'], kind: 'mastery', visual: false },
    { id: '10a', label: '10(a)', marks: 1, topic: 'number', skill: 'Fractions, Decimals and Percentages', desc: '3/8 as a percentage', skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false },
    { id: '10b', label: '10(b)', marks: 2, topic: 'number', skill: 'Converting Fractions to Decimals + Rounding', desc: '15/32 as a decimal, to 2dp', skillIds: ['converting_fractions_to_decimals', 'rounding'], kind: 'mastery', visual: false },
    { id: '11', label: '11', marks: 3, topic: 'number', skill: 'Simple Arithmetic', desc: 'True/May be true/Not true: three statements about number inequalities', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '12a', label: '12(a)', marks: 2, topic: 'algebra', skill: 'Substitution', desc: 'Work out x² + 7x when x = −4', skillIds: ['substitution'], kind: 'mastery', visual: false },
    { id: '12b', label: '12(b)', marks: 1, topic: 'algebra', skill: 'Rearranging Formulae', desc: 'Rearrange y = w − 1 to make w the subject', skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false },
    { id: '12c', label: '12(c)', marks: 2, topic: 'algebra', skill: 'Simplifying Expressions', desc: 'Simplify fully 4(a + 2) + a', skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '13', label: '13', marks: 2, topic: 'number', skill: 'Time Calculations', desc: '1 minute 28 seconds less than 2 hours, in h/m/s', skillIds: ['time_calculations'], kind: 'exam', visual: false },
    { id: '14', label: '14', marks: 4, topic: 'probdata', skill: 'Pie Charts', desc: 'Pie chart: Banana = 90°, two others 78° and 48°; 120 chose Banana — how many chose Apple?', skillIds: ['pie_charts'], kind: 'exam', visual: false },
    { id: '15a', label: '15(a)', marks: 2, topic: 'ratio', skill: 'Compound Units', desc: 'Bath graph: fills to 240 (litres) in 10 minutes — find the fill rate', skillIds: ['compound_units'], kind: 'mastery', visual: false },
    { id: '15b', label: '15(b)', marks: 2, topic: 'algebra', skill: 'Kinematic Graphs', desc: 'Draw the constant-then-emptying phase on the bath graph', skillIds: ['kinematic_graphs'], kind: 'mastery', visual: true },
    { id: '16', label: '16', marks: 2, topic: 'shape', skill: 'Symmetry', desc: 'Shade one quarter of a grid so it has exactly two lines of symmetry', skillIds: ['symmetry'], kind: 'exam', visual: true },
    { id: '17', label: '17', marks: 3, topic: 'ratio', skill: 'Proportion', desc: 'Map scale 1:4000, 7cm on the map — is the real distance more than 300m?', skillIds: ['proportion'], kind: 'exam', visual: false },
    { id: '18', label: '18', marks: 1, topic: 'ratio', skill: 'Inverse Proportion', desc: 'X inversely proportional to Y — circle the correct statement', skillIds: ['inverse_proportion'], kind: 'mastery', visual: false },
    { id: '19', label: '19', marks: 2, topic: 'shape', skill: "Pythagoras' Theorem", desc: 'Right-angled triangle: hypotenuse 1.7, one leg 1.5 — show the other leg is 0.8', skillIds: ['pythagoras_theorem'], kind: 'exam', visual: false },
    { id: '20a', label: '20(a)', marks: 2, topic: 'probdata', skill: 'Simple Charts', desc: 'Beth: 125 spins, 0.32 rel. freq.; Lynn: 80 spins, 0.35 — how many more heads did Beth spin', skillIds: ['simple_charts'], kind: 'mastery', visual: false },
    { id: '20b', label: '20(b)', marks: 1, topic: 'probdata', skill: 'Calculating Simple Probability + Relative Frequency', desc: "Lynn says her estimate (0.35) must be best since it's bigger than Beth's (0.32) — is she correct?", skillIds: ['calculating_simple_probability', 'relative_frequency'], kind: 'mastery', visual: false },
    { id: '21', label: '21', marks: 2, topic: 'number', skill: 'Decimals', desc: 'Oil: mass 537g, density 895,000 g/m³, 1m³=1000 litres — find the volume in litres', skillIds: ['decimals'], kind: 'exam', visual: false },
    { id: '22', label: '22', marks: 3, topic: 'shape', skill: 'Trigonometry (missing sides)', desc: 'Right-angled triangle: hypotenuse 21, angle 40° — find x (opposite side)', skillIds: ['trigonometry_missing_sides'], kind: 'exam', visual: false },
    { id: '23', label: '23', marks: 2, topic: 'number', skill: 'Upper and Lower Bounds', desc: 'Wall length 9m to the nearest metre — error interval', skillIds: ['upper_and_lower_bounds'], kind: 'exam', visual: false },
    { id: '24', label: '24', marks: 3, topic: 'ratio', skill: 'Reverse Percentage', desc: '384,000 cars sold this year is 20% more than last year — how many last year', skillIds: ['reverse_percentage'], kind: 'exam', visual: false },
    { id: '25', label: '25', marks: 3, topic: 'number', skill: 'Simplifying Indices', desc: 'Multiply pairs from xy, x², 5y² — three fully simplified products', skillIds: ['simplifying_indices'], kind: 'exam', visual: false },
    { id: '26', label: '26', marks: 5, topic: 'shape', skill: 'Solving Linear Equations + Areas of Squares and Rectangles', desc: 'Rectangle side labelled 4x+1 and 2x+17 (equal); AB:BC = 1:3 — find the area', skillIds: ['solving_linear_equations', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false },
  ],

  // Rebuilt 2026-09-11 against the question paper: every retry carries its
  // answer and working, a multi-part question shares its setup (and figure)
  // across its parts, and a figure is drawn wherever the paper draws one.
  retrySet: {
    '1a': { skill: 'Sequences', question: 'A linear sequence starts\n6     11     16     21\nWrite down the next number in this sequence.', answer: '26', working: 'It goes up by 5 each time.' },
    '1b': { skill: 'Sequences', question: 'A different linear sequence starts\n25     19     13     7\nWrite down the next number in this sequence.', answer: '1', working: 'It goes down by 6 each time.' },
    '1c': { skill: 'Sequences', question: 'Here is another sequence.\n2     8     32     128\nWrite down the term-to-term rule for this sequence.', answer: 'Multiply by 4' },

    // 2(a) and (b) share one price list, as on the paper.
    '2a': { skill: 'Simple Arithmetic', question: 'Here is a price list.\n<table>Notebook | £3.20\nPen | £1.90\nRuler | £1.35\nPencil case | £4.60</table>\nWork out the cost of three notebooks.', answer: '£9.60', working: '3 × £3.20' },
    '2b': { skill: 'Simple Arithmetic', question: 'Here is a price list.\n<table>Notebook | £3.20\nPen | £1.90\nRuler | £1.35\nPencil case | £4.60</table>\nRavi has £7.80\nHe wants to buy one pen and one pencil case.\nDoes he have enough money to also buy one ruler?\nTick a box.\n[   ] Yes\n[   ] No\nShow working to support your answer.', answer: 'No', working: '£1.90 + £4.60 + £1.35 = £7.85, which is more than £7.80.' },
    '3a': { skill: 'Solving Linear Equations', question: 'Solve 7x = 56', answer: 'x = 8' },
    '3b': { skill: 'Solving Linear Equations', question: 'Solve −6 + y = 11', answer: 'y = 17', working: 'Add 6 to both sides.' },
    '3c': { skill: 'Simplifying Indices', question: 'Simplify fully <frac>18p/3p</frac>', answer: '6', working: '18 ÷ 3 = 6, and the p on the top and the bottom cancel.' },

    // 4(a)-(c) share one grid, with the points lettered ON it as the paper
    // letters them. 4(c) is `visual: true`; its answer is the element.
    '4a': {
      skill: 'Coordinates',
      question: 'Points A, B and C are plotted on a grid.\nWrite down the coordinates of C.',
      answer: '(4, −1)',
      diagram: {
        mode: 'points',
        x: { min: -4, max: 6, step: 1, label: 'x' },
        y: { min: -6, max: 4, step: 1, label: 'y' },
        background: '<polyline points="-2.18,-1.18 -1.82,-0.82" stroke="#333" /><polyline points="-2.18,-0.82 -1.82,-1.18" stroke="#333" /><polyline points="0.82,2.82 1.18,3.18" stroke="#333" /><polyline points="0.82,3.18 1.18,2.82" stroke="#333" /><polyline points="3.82,-1.18 4.18,-0.82" stroke="#333" /><polyline points="3.82,-0.82 4.18,-1.18" stroke="#333" />',
        labels: [
          { x: -2, y: -1, text: 'A', dx: -10, dy: -9 },
          { x: 1, y: 3, text: 'B', dx: -10, dy: -9 },
          { x: 4, y: -1, text: 'C', dx: -10, dy: 12 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '4b': {
      skill: 'Coordinates',
      question: 'Points A, B and C are plotted on a grid.\nWrite down the coordinates of the midpoint of AC.',
      answer: '(1, −1)',
      working: 'A is (−2, −1) and C is (4, −1); halfway between −2 and 4 is 1.',
      diagram: {
        mode: 'points',
        x: { min: -4, max: 6, step: 1, label: 'x' },
        y: { min: -6, max: 4, step: 1, label: 'y' },
        background: '<polyline points="-2.18,-1.18 -1.82,-0.82" stroke="#333" /><polyline points="-2.18,-0.82 -1.82,-1.18" stroke="#333" /><polyline points="0.82,2.82 1.18,3.18" stroke="#333" /><polyline points="0.82,3.18 1.18,2.82" stroke="#333" /><polyline points="3.82,-1.18 4.18,-0.82" stroke="#333" /><polyline points="3.82,-0.82 4.18,-1.18" stroke="#333" />',
        labels: [
          { x: -2, y: -1, text: 'A', dx: -10, dy: -9 },
          { x: 1, y: 3, text: 'B', dx: -10, dy: -9 },
          { x: 4, y: -1, text: 'C', dx: -10, dy: 12 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '4c': {
      skill: 'Coordinates',
      question: 'Points A, B and C are plotted on a grid.\nPlot point D on the grid so that ABCD is a rhombus.',
      answer: 'D is at (1, −5).',
      working: 'AC is horizontal and B is 4 above it, so D is the reflection of B: 4 below, at (1, −5).',
      diagram: {
        mode: 'points',
        x: { min: -4, max: 6, step: 1, label: 'x' },
        y: { min: -6, max: 4, step: 1, label: 'y' },
        background: '<polyline points="-2.18,-1.18 -1.82,-0.82" stroke="#333" /><polyline points="-2.18,-0.82 -1.82,-1.18" stroke="#333" /><polyline points="0.82,2.82 1.18,3.18" stroke="#333" /><polyline points="0.82,3.18 1.18,2.82" stroke="#333" /><polyline points="3.82,-1.18 4.18,-0.82" stroke="#333" /><polyline points="3.82,-0.82 4.18,-1.18" stroke="#333" />',
        labels: [
          { x: -2, y: -1, text: 'A', dx: -10, dy: -9 },
          { x: 1, y: 3, text: 'B', dx: -10, dy: -9 },
          { x: 4, y: -1, text: 'C', dx: -10, dy: 12 },
        ],
        elements: [{ x: 1, y: -5, marks: 1 }],
        tolerance: 0,
      },
    },
    '5a': { skill: 'Range', question: 'Here are five numbers.\n12.5     13.1     15.8     16.0     19.2\nWork out the range.', answer: '6.7', working: '19.2 − 12.5' },
    '5b': { skill: 'Mean', question: 'Here are five numbers.\n12.5     13.1     15.8     16.0     19.2\nWork out the mean.', answer: '15.32', working: 'The total is 76.6, and 76.6 ÷ 5.' },
    '6a': {
      skill: 'Angles on Lines and Circles',
      question: 'PQ is a straight line.\nWork out the size of angle p.\nNot drawn accurately.',
      answer: '52°',
      working: 'Angles on a straight line add up to 180°, and 180 − 128 = 52.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 6, step: 1, label: '' },
        background: '<polyline points="1,2 9,2" stroke="#333" fill="none" /><polyline points="5,2 6.85,4.36" stroke="#333" fill="none" /><path d="M 5.9,2 A 0.9,0.9 0 0,1 5.555,2.708" stroke="#333" fill="none" /><path d="M 5.555,2.708 A 0.9,0.9 0 0,1 4.1,2" stroke="#333" fill="none" />',
        labels: [
          { x: 1, y: 2, text: 'P', dx: -9 },
          { x: 9, y: 2, text: 'Q', dx: 9 },
          { x: 3.9, y: 2.65, text: '128°' },
          { x: 6.17, y: 2.57, text: 'p' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '6b': {
      skill: 'Angles on Lines and Circles',
      question: 'Work out the size of angle q.\nNot drawn accurately.',
      answer: '58°',
      working: 'Angles on a straight line add up to 180°: 47 + 75 = 122, and 180 − 122 = 58.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 6, step: 1, label: '' },
        background: '<polyline points="1,2 9,2" stroke="#333" fill="none" /><polyline points="5,2 7.05,4.19" stroke="#333" fill="none" /><polyline points="5,2 3.41,4.54" stroke="#333" fill="none" /><path d="M 5.9,2 A 0.9,0.9 0 0,1 5.615,2.657" stroke="#333" fill="none" /><path d="M 5.615,2.657 A 0.9,0.9 0 0,1 4.523,2.763" stroke="#333" fill="none" /><path d="M 4.523,2.763 A 0.9,0.9 0 0,1 4.1,2" stroke="#333" fill="none" />',
        labels: [
          { x: 6.4, y: 2.5, text: '47°' },
          { x: 5.2, y: 3.45, text: '75°' },
          { x: 3.9, y: 2.5, text: 'q' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '6c': {
      skill: 'Angles on Lines and Circles',
      question: 'Three straight lines intersect as shown.\nWhat type of triangle is made?\nYou must show your working.\nNot drawn accurately.',
      answer: 'Isosceles — its angles are 50°, 80° and 50°',
      working: 'Vertically opposite angles are equal, so two of the triangle’s angles are 50° and 80°, and the third is 180 − 50 − 80 = 50°.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: -0.5, max: 10.5, step: 1, label: '' },
        y: { min: -1, max: 9, step: 1, label: '' },
        background: '<polyline points="0.5,1.5 9.5,1.5" stroke="#333" fill="none" /><polyline points="1.164,0.504 7.794,8.405" stroke="#333" fill="none" /><polyline points="8.226,0.22 6.732,8.689" stroke="#333" fill="none" /><path d="M 1.1,1.5 A 0.9,0.9 0 0,1 1.421,0.811" stroke="#333" fill="none" /><path d="M 8.156,0.614 A 0.9,0.9 0 0,1 8.9,1.5" stroke="#333" fill="none" />',
        labels: [
          { x: 0.686, y: 0.887, text: '50°' },
          { x: 9.111, y: 0.568, text: '80°' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '7': { skill: 'Proportion + Simple Arithmetic', question: 'The table shows information about the packs of yoghurts a family has.\n<table>Number of packs | Number of yoghurts in a pack\n5 | 6\n9 | 2</table>\nThe family eats 3 yoghurts each day.\nIn total, how many days will their packs last?', answer: '16 days', working: '5 × 6 + 9 × 2 = 48 yoghurts, and 48 ÷ 3 = 16.' },
    '9': { skill: 'Systematic Listing', question: 'Priya is making a salad.\nShe can choose three different toppings from\n• tomato (T)\n• cucumber (C)\n• pepper (P)\n• onion (O).\nList all the possible options for the three toppings.\nThe first one has been done for you: T C P', answer: 'T C P, T C O, T P O and C P O', working: 'Each option leaves out exactly one of the four toppings, so there are four.' },
    '10a': { skill: 'Fractions, Decimals and Percentages', question: 'Write <frac>5/8</frac> as a percentage.', answer: '62.5%', working: '5 ÷ 8 = 0.625' },
    '10b': { skill: 'Converting Fractions to Decimals + Rounding', question: 'Work out <frac>9/16</frac> as a decimal.\nGive your answer to 2 decimal places.', answer: '0.56', working: '9 ÷ 16 = 0.5625' },
    '11': { skill: 'Simple Arithmetic', question: 'Tick one box for each statement.\n<table>Statement | True | May be true | Not true\nIf a number is < 0 the number is negative |  |  | \nIf a number is ≥ 4 the number is 4 |  |  | \nIf a number is < 7 the largest possible value of the number is 7 |  |  | </table>', answer: 'True; May be true; Not true', working: 'Every number below zero is negative; 4 or more includes 4 but also 5, 6 and so on; a number less than 7 can never be 7.' },
    '12a': { skill: 'Substitution', question: 'Work out the value of x² + 5x when x = −3', answer: '−6', working: '(−3)² = 9 and 5 × (−3) = −15.' },
    '12b': { skill: 'Rearranging Formulae', question: 'Rearrange m = k − 6 to make k the subject.', answer: 'k = m + 6' },
    '12c': { skill: 'Simplifying Expressions', question: 'Simplify fully 3(b + 5) + b', answer: '4b + 15', working: '3b + 15 + b' },
    '13': { skill: 'Time Calculations', question: 'The time Priya takes to complete a walk is 2 minutes 45 seconds less than 3 hours.\nWork out her time in hours, minutes and seconds.', answer: '2 hours 57 minutes 15 seconds', working: '3 hours is 2 hours 60 minutes, and 60 minutes − 2 minutes 45 seconds = 57 minutes 15 seconds.' },

    // Drawn as the paper draws it: one sector is a marked RIGHT ANGLE the
    // student must recognise as 90°, two carry their angles, and the sector
    // asked about carries none.
    '14': {
      skill: 'Pie Charts',
      question: 'The pie chart shows information about the favourite pets of a group of people.\n72 people chose Dogs.\nHow many people chose Rabbits?\nNot drawn accurately.',
      answer: '128',
      working: 'The Rabbits angle is 360 − 90 − 60 − 50 = 160°. Dogs is 90° for 72 people, so each degree is 0.8 people, and 160 × 0.8 = 128.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<circle cx="5" cy="4" r="3" stroke="#333" fill="none" /><polyline points="5,4 8,4" stroke="#333" fill="none" /><polyline points="5,4 5,7" stroke="#333" fill="none" /><polyline points="5,4 2.402,5.5" stroke="#333" fill="none" /><polyline points="5,4 6.928,1.702" stroke="#333" fill="none" /><polyline points="5.35,4 5.35,4.35 5,4.35" stroke="#333" fill="none" /><path d="M 5,4.8 A 0.8,0.8 0 0,1 4.307,4.4" stroke="#333" fill="none" /><path d="M 5.514,3.387 A 0.8,0.8 0 0,1 5.8,4" stroke="#333" fill="none" />',
        labels: [
          { x: 6.344, y: 5.344, text: 'Dogs' },
          { x: 3.9, y: 5.905, text: 'Cats' },
          { x: 4.35, y: 5.126, text: '60°' },
          { x: 3.907, y: 2.698, text: 'Rabbits' },
          { x: 7.175, y: 2.986, text: 'Fish' },
          { x: 6.224, y: 3.429, text: '50°' },
        ],
        elements: [], tolerance: 0,
      },
    },

    // 15(a) and (b) share one graph, as on the paper. The filling phase is
    // GIVEN; (a) reads its rate and (b) draws the rest. Every point sits on
    // the lattice, so the answer is readable off the grid.
    '15a': {
      skill: 'Compound Units',
      question: 'The graph represents the volume of water in a bath.\nThe bath is full after 15 minutes.\nWork out the rate at which the bath is filled.\nState the units of your answer.',
      answer: '4 litres per minute',
      working: '60 litres in 15 minutes, and 60 ÷ 15 = 4.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 50, step: 5, label: 'Time (minutes)' },
        y: { min: 0, max: 80, step: 20, label: 'Volume (litres)' },
        background: '<polyline points="0,0 15,60" stroke="#333" />',
        elements: [],
        tolerance: 0,
      },
    },
    '15b': {
      skill: 'Kinematic Graphs',
      question: 'The graph represents the volume of water in a bath.\nThe bath is full after 15 minutes.\nAfter the bath is full, the volume of water stays constant for 10 minutes, then all the water empties out at a constant rate in 20 minutes.\nShow this information on the graph.',
      answer: 'A horizontal line from (15, 60) to (25, 60), then a straight line down to (45, 0).',
      working: 'Constant volume is a flat line; emptying at a constant rate is a straight line to zero.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 50, step: 5, label: 'Time (minutes)' },
        y: { min: 0, max: 80, step: 20, label: 'Volume (litres)' },
        background: '<polyline points="0,0 15,60" stroke="#333" />',
        elements: [{ x: 15, y: 60, marks: 1 }, { x: 25, y: 60, marks: 1 }, { x: 45, y: 0, marks: 1 }],
        tolerance: 0,
      },
    },
    // 16: same demand as the original — shade a fraction so the grid has
    // EXACTLY two lines of symmetry — on a different grid and a different
    // fraction, so it cannot be answered from memory of the original.
    '16': {
      skill: 'Symmetry',
      question: 'In the 6 by 6 grid, shade one third of the squares so that the grid has exactly two lines of symmetry. Shade complete squares only.',
      answer: 'Any valid arrangement of 12 squares — for example the two middle columns shaded in full.',
      working: 'Two middle columns give one vertical and one horizontal line of symmetry, and neither diagonal, which is exactly two.',
      diagram: {
        mode: 'cells',
        x: { min: 0, max: 6, step: 1, label: '' },
        y: { min: 0, max: 6, step: 1, label: '' },
        background: '',
        elements: [
          { x: 2, y: 0, marks: 1 }, { x: 2, y: 1, marks: 1 }, { x: 2, y: 2, marks: 1 },
          { x: 2, y: 3, marks: 1 }, { x: 2, y: 4, marks: 1 }, { x: 2, y: 5, marks: 1 },
          { x: 3, y: 0, marks: 1 }, { x: 3, y: 1, marks: 1 }, { x: 3, y: 2, marks: 1 },
          { x: 3, y: 3, marks: 1 }, { x: 3, y: 4, marks: 1 }, { x: 3, y: 5, marks: 1 },
        ],
        tolerance: 0,
      },
    },
    '17': { skill: 'Proportion', question: 'A map has a scale of 1 : 5000\nOn the map, the distance from a school to a park is 6 cm.\nIs the actual distance from the school to the park more than 350 m?\nTick a box.\n[   ] Yes\n[   ] No\nShow working to support your answer.', answer: 'No', working: '6 × 5000 = 30 000 cm, which is 300 m.' },
    '18': { skill: 'Inverse Proportion', question: 'P is inversely proportional to Q.\nCircle the correct statement.\nP is directly proportional to Q²\nP is directly proportional to 2Q\nP is directly proportional to <frac>1/Q</frac>\nP is directly proportional to Q', answer: 'P is directly proportional to <frac>1/Q</frac>', working: 'Inverse proportion means P = k ÷ Q, which is k × <frac>1/Q</frac>.' },
    '19': {
      skill: "Pythagoras' Theorem",
      question: 'Here is a right-angled triangle.\nUse Pythagoras\' theorem to show that x = 0.7\nNot drawn accurately.',
      answer: 'x² = 2.5² − 2.4² = 6.25 − 5.76 = 0.49, and √0.49 = 0.7',
      working: '2.5 cm is the hypotenuse, so subtract the squares.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polygon points="1,1 9,1 1,3.4" stroke="#333" fill="none" /><polyline points="1.4,1 1.4,1.4 1,1.4" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 1, text: '2.4 cm', dy: 14 },
          { x: 1, y: 2.2, text: 'x cm', dx: -20 },
          { x: 5, y: 2.2, text: '2.5 cm', dx: 12, dy: -10 },
        ],
        elements: [], tolerance: 0,
      },
    },

    // 20(a) and (b) share one table. (b) is the paper's claim turned round:
    // the student with FEWER spins and the bigger relative frequency says
    // theirs must be the better estimate.
    '20a': { skill: 'Simple Charts', question: 'Ali and Jade each spin the same biased coin a number of times.\nThe table shows information about the results.\n<table> | Ali | Jade\nNumber of spins | 150 | 90\nRelative frequency of Heads | 0.4 | 0.5</table>\nHow many more Heads did Ali spin than Jade?', answer: '15', working: '150 × 0.4 = 60 and 90 × 0.5 = 45.' },
    '20b': { skill: 'Calculating Simple Probability + Relative Frequency', question: 'Ali and Jade each spin the same biased coin a number of times.\nThe table shows information about the results.\n<table> | Ali | Jade\nNumber of spins | 150 | 90\nRelative frequency of Heads | 0.4 | 0.5</table>\nJade says,\n"0.5 is bigger than 0.4, so my estimate of the chance of Heads must be better than Ali\'s"\nIs she correct?\nTick a box.\n[   ] Yes\n[   ] No\nGive a reason for your answer.', answer: 'No', working: 'Ali spun the coin more times, so his estimate is the more reliable one; a bigger relative frequency is not a better estimate.' },
    '21': { skill: 'Decimals', question: 'Some metal has\n• a mass of 624 g\n• a density of 780 000 g/m³\n1 m³ = 1000 litres\nWork out the volume of the metal.\nGive your answer in litres.', answer: '0.8 litres', working: '624 ÷ 780 000 = 0.0008 m³, and 0.0008 × 1000 = 0.8.' },
    '22': {
      skill: 'Trigonometry (missing sides)',
      question: 'Use trigonometry to work out the value of x.\nGive your answer to 1 decimal place.\nNot drawn accurately.',
      answer: '9.2 cm',
      working: 'x is opposite the 35° angle and 16 cm is the hypotenuse, so x = 16 × sin 35° = 9.17…',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,1 9,1 9,7" stroke="#333" fill="none" /><polyline points="8.3,1 8.3,1.7 9,1.7" stroke="#333" fill="none" /><path d="M 3,1 A 2,2 0 0,1 2.6,2.2" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 4, text: '16 cm', dx: -12, dy: -4 },
          { x: 9, y: 4, text: 'x', dx: 11 },
          { x: 1, y: 1, text: '35°', dx: 34, dy: -6 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '23': { skill: 'Upper and Lower Bounds', question: 'The length of a fence is 14 metres to the nearest metre.\nComplete the error interval for the length of the fence.\n____ m ≤ length < ____ m', answer: '13.5 m ≤ length < 14.5 m', working: 'Half a metre either side of 14 m, with the upper bound not included.' },
    '24': { skill: 'Reverse Percentage', question: '276 000 tickets were sold this year.\nThis is 15% more than last year.\nHow many tickets were sold last year?', answer: '240 000', working: '276 000 is 115% of last year, so 276 000 ÷ 1.15.' },
    '25': { skill: 'Simplifying Indices', question: 'Here are three terms.\npq     2p²     q²\nSam multiplies two of these terms.\nWork out the three possible fully simplified answers.', answer: '2p³q, pq³ and 2p²q²', working: 'pq × 2p², pq × q² and 2p² × q².' },
    '26': {
      skill: 'Solving Linear Equations + Areas of Squares and Rectangles',
      question: 'Here is a rectangle.\nAll measurements are in centimetres.\nAB : BC = 1 : 4\nWork out the area of the rectangle.\nNot drawn accurately.',
      answer: '2704 cm²',
      working: 'Opposite sides are equal, so 3x + 5 = x + 19 and x = 7. AB = 26, so BC = 4 × 26 = 104, and 26 × 104 = 2704.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: -1, max: 11, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polygon points="1,1 9,1 9,4 1,4" stroke="#333" fill="none" />',
        labels: [
          { x: 1, y: 4, text: 'A', dx: -8, dy: -8 },
          { x: 1, y: 1, text: 'B', dx: -8, dy: 11 },
          { x: 9, y: 1, text: 'C', dx: 8, dy: 11 },
          { x: 9, y: 4, text: 'D', dx: 8, dy: -8 },
          { x: 1, y: 2.5, text: '3x + 5', dx: -24 },
          { x: 9, y: 2.5, text: 'x + 19', dx: 24 },
        ],
        elements: [], tolerance: 0,
      },
    },
  },

  challengeQuestions: [
    { topic: 'number', skill: 'Standard Form', question: 'Write 3,400,000 in standard form.', answer: '3.4 × 10⁶' },
    { topic: 'number', skill: 'Recurring Decimals', question: 'Convert 0.4̇5̇ (recurring) to a fraction in its simplest form.', answer: '<frac>5/11</frac>', working: 'Two repeating digits give <frac>45/99</frac>, which cancels by 9.' },
    { topic: 'algebra', skill: 'Quadratic Equations', question: 'Solve x² − 5x − 14 = 0', answer: 'x = 7 or x = −2', working: 'Factorises to (x − 7)(x + 2) = 0.' },
    { topic: 'algebra', skill: 'Simultaneous Equations', question: '3x + y = 17 and x − y = 3. Find the values of x and y.', answer: 'x = 5, y = 2', working: 'Adding the equations eliminates y: 4x = 20.' },
    { topic: 'ratio', skill: 'Growth and Decay', question: 'A car worth £18,000 depreciates by 12% each year. Work out its value after 3 years, to the nearest £100.', answer: '£12,300', working: '18 000 × 0.88³ = 12 266.50 to the nearest penny.' },
    { topic: 'ratio', skill: 'Compound Interest', question: '£2,400 is invested at 3.5% compound interest per year. Work out the value of the investment after 4 years, to the nearest penny.', answer: '£2754.06', working: '2400 × 1.035⁴ = 2400 × 1.147523.' },
    { topic: 'shape', skill: 'Sine Rule', question: 'In triangle ABC, angle A = 52°, angle B = 71°, and side a = 9 cm. Work out the length of side b, to 1 decimal place.', answer: '10.8 cm', working: 'b = 9 × sin 71° ÷ sin 52° = 10.79…' },
    { topic: 'shape', skill: 'Volume of a Sphere', question: 'Work out the volume of a sphere with radius 6 cm. Give your answer in terms of π.', answer: '288π cm³', working: '<frac>4/3</frac> × π × 6³, and 4 × 216 ÷ 3 = 288.' },
    { topic: 'probdata', skill: 'Tree Diagrams', question: 'A bag has 6 red and 4 blue counters. Two are drawn without replacement. Work out the probability that they are different colours.', answer: '<frac>8/15</frac>', working: 'Two routes: 2 × (<frac>6/10</frac> × <frac>4/9</frac>) = <frac>48/90</frac>.' },
    { topic: 'probdata', skill: 'Box Plots', question: 'A box plot has lower quartile 12, median 18, upper quartile 25. Work out the interquartile range.', answer: '13', working: '25 − 12; the median is not used.' },
  ],

  sampleStudents: [
    'Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim',
    'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson',
  ],

  // Generated (deterministic, seed 73) — see aqa-8300-1f-nov24.ts's note.
  sampleMarks: {
    'Amira Patel':     { '1a':1,'1b':1,'1c':1,'2a':1,'2b':2,'3a':1,'3b':1,'3c':2,'4a':1,'4b':1,'4c':1,'5a':1,'5b':2,'6a':1,'6b':2,'6c':3,'7':3,'8':3,'9':1,'10a':1,'10b':2,'11':3,'12a':2,'12b':1,'12c':2,'13':2,'14':4,'15a':2,'15b':2,'16':2,'17':3,'18':1,'19':2,'20a':2,'20b':1,'21':2,'22':3,'23':2,'24':3,'25':3,'26':5 },
    'Ben Okonkwo':     { '1a':0,'1b':0,'1c':0,'2a':1,'2b':1,'3a':0,'3b':1,'3c':1,'4a':1,'4b':1,'4c':1,'5a':1,'5b':1,'6a':0,'6b':1,'6c':3,'7':3,'8':2,'9':1,'10a':1,'10b':2,'11':1,'12a':1,'12b':0,'12c':1,'13':1,'14':1,'15a':1,'15b':2,'16':2,'17':3,'18':0,'19':0,'20a':0,'20b':0,'21':1,'22':0,'23':2,'24':3,'25':2,'26':4 },
    'Charlotte Evans': { '1a':1,'1b':1,'1c':1,'2a':0,'2b':1,'3a':1,'3b':0,'3c':2,'4a':1,'4b':1,'4c':1,'5a':1,'5b':1,'6a':0,'6b':2,'6c':2,'7':0,'8':2,'9':2,'10a':1,'10b':2,'11':2,'12a':2,'12b':0,'12c':1,'13':1,'14':3,'15a':2,'15b':2,'16':2,'17':3,'18':1,'19':2,'20a':0,'20b':1,'21':2,'22':2,'23':1,'24':2,'25':3,'26':3 },
    'Daniel Kim':      { '1a':1,'1b':1,'1c':0,'2a':0,'2b':1,'3a':1,'3b':0,'3c':2,'4a':0,'4b':1,'4c':1,'5a':0,'5b':1,'6a':1,'6b':1,'6c':3,'7':2,'8':1,'9':2,'10a':0,'10b':1,'11':2,'12a':2,'12b':0,'12c':0,'13':1,'14':2,'15a':0,'15b':2,'16':2,'17':0,'18':1,'19':1,'20a':1,'20b':0,'21':1,'22':2,'23':1,'24':2,'25':2,'26':3 },
    'Emily Zhang':     { '1a':1,'1b':0,'1c':1,'2a':0,'2b':1,'3a':1,'3b':1,'3c':0,'4a':0,'4b':1,'4c':1,'5a':0,'5b':2,'6a':1,'6b':2,'6c':1,'7':2,'8':2,'9':0,'10a':1,'10b':1,'11':3,'12a':1,'12b':1,'12c':0,'13':2,'14':3,'15a':1,'15b':1,'16':1,'17':3,'18':0,'19':1,'20a':1,'20b':1,'21':1,'22':2,'23':2,'24':2,'25':2,'26':4 },
    'Finn McCarthy':   { '1a':1,'1b':0,'1c':0,'2a':0,'2b':0,'3a':0,'3b':0,'3c':2,'4a':0,'4b':0,'4c':0,'5a':0,'5b':0,'6a':0,'6b':0,'6c':1,'7':1,'8':2,'9':0,'10a':0,'10b':2,'11':1,'12a':0,'12b':0,'12c':0,'13':0,'14':2,'15a':0,'15b':0,'16':1,'17':0,'18':1,'19':1,'20a':0,'20b':1,'21':1,'22':1,'23':2,'24':0,'25':0,'26':1 },
    'Grace Adeyemi':   { '1a':0,'1b':0,'1c':0,'2a':0,'2b':2,'3a':1,'3b':0,'3c':1,'4a':1,'4b':0,'4c':0,'5a':0,'5b':1,'6a':0,'6b':1,'6c':0,'7':1,'8':0,'9':0,'10a':0,'10b':0,'11':0,'12a':0,'12b':0,'12c':0,'13':0,'14':0,'15a':1,'15b':0,'16':1,'17':0,'18':1,'19':1,'20a':0,'20b':0,'21':1,'22':0,'23':0,'24':1,'25':1,'26':3 },
    'Harry Wilson':    { '1a':1,'1b':1,'1c':1,'2a':1,'2b':2,'3a':1,'3b':1,'3c':2,'4a':1,'4b':1,'4c':1,'5a':1,'5b':2,'6a':1,'6b':2,'6c':3,'7':3,'8':3,'9':2,'10a':1,'10b':2,'11':3,'12a':2,'12b':1,'12c':2,'13':2,'14':4,'15a':2,'15b':2,'16':2,'17':2,'18':1,'19':2,'20a':2,'20b':1,'21':2,'22':3,'23':2,'24':3,'25':3,'26':4 },
  },
}
