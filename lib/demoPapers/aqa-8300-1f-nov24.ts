import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-Calculator, Nov 2024.
 *
 * Built from the real source documents (AQA-83001F-QP-NOV24.pdf,
 * AQA-83001F-MS-NOV24.pdf), cross-checked against the skill/marks/topic
 * metadata already audited in data/exam-audit/NOV24-F-P1.json — see
 * lib/demoPapers/types.ts for why that split exists (the audit deliberately
 * carries no exam text, for copyright reasons; the wording here comes from
 * the actual paper, paraphrased the same way the reference paper is).
 *
 * `desc` is a short paraphrase of the real question, not a verbatim
 * reproduction — matches the house style set by aqa-8300-3f-nov24.ts.
 *
 * `visual: true` marks questions whose own answer is a diagram (complete a
 * frequency tree/grid, draw a shape, spot chart errors) or a function-machine
 * part whose pre-filled boxes aren't recoverable from the mark scheme alone —
 * these are excluded from `retrySet` because a fair text-only retry isn't
 * possible without inventing unverifiable diagram content. Everything else
 * gets a fresh, self-contained retry question with newly chosen numbers (never
 * the exam's own numbers).
 *
 * REBUILT 2026-09-11 against the question paper. Every retry now carries
 * its answer and working, a multi-part question shares its setup across
 * its parts, and a figure is drawn wherever the paper draws one — which is
 * also why 7(a), 14(a) and 14(b) have retries after all: a retry can bring
 * its own grid, so "a fair text-only retry isn't possible" no longer rules
 * a visual item out.
 *
 * One correction versus the audit: q24 is tagged `dividing_fractions` there,
 * but the real question ("Work out 1⅕ − 3/10") and its mark scheme (1.2 − 0.3
 * = 0.9) are unambiguously SUBTRACTION — retagged to
 * `adding_and_subtracting_fractions` here. Worth folding back into the audit
 * JSON at some point; not done here since that file is out of scope for this
 * change.
 */
export const AQA_8300_1F_NOV24: PaperConfig = {
  id: 'aqa-8300-1f-nov24',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a', label: '1(a)', marks: 1, topic: 'number', skill: 'Indices', desc: 'Square root of 49', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '1b', label: '1(b)', marks: 1, topic: 'number', skill: 'Indices', desc: '3 cubed', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '1c', label: '1(c)', marks: 1, topic: 'number', skill: 'Indices', desc: '10,000 as a power of 10', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '2', label: '2', marks: 2, topic: 'number', skill: 'Converting Measurements + Proportion', desc: 'Ounces in 3 pounds (16 oz = 1 lb)', skillIds: ['converting_measurements', 'proportion'], kind: 'mastery', visual: false },
    { id: '3a', label: '3(a)', marks: 1, topic: 'number', skill: 'Irregular and Improper Fractions', desc: '3/2 as a mixed number', skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false },
    { id: '3b', label: '3(b)', marks: 1, topic: 'number', skill: 'Adding and Subtracting Fractions', desc: '1/5 + 1/5', skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false },
    { id: '4a', label: '4(a)', marks: 2, topic: 'number', skill: 'Factors and Multiples', desc: 'All factors of 20', skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false },
    { id: '4b', label: '4(b)', marks: 1, topic: 'number', skill: 'Factors and Multiples', desc: 'Counterexample: sum of two multiples of 5 is always a multiple of 10?', skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false },
    { id: '5', label: '5', marks: 2, topic: 'number', skill: 'Fractions, Decimals and Percentages', desc: 'Order 80%, 0.7, 3/4 by size', skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false },
    { id: '6', label: '6', marks: 4, topic: 'number', skill: 'Simple Arithmetic', desc: '2 hats (£4.50 each) + 3 scarves = £28.50; cost per scarf', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '7a', label: '7(a)', marks: 4, topic: 'probdata', skill: 'Frequency Trees', desc: 'Complete the frequency tree (120 people: 80 children, 40 adults)', skillIds: ['frequency_trees'], kind: 'exam', visual: true },
    { id: '7b', label: '7(b)', marks: 2, topic: 'probdata', skill: 'Frequency Trees + Calculating Simple Probability', desc: 'Fraction of children who turned left', skillIds: ['frequency_trees', 'calculating_simple_probability'], kind: 'mastery', visual: false },
    { id: '8', label: '8', marks: 3, topic: 'probdata', skill: 'Simple Charts', desc: "Spot 3 mistakes in Ed's bar chart", skillIds: ['simple_charts'], kind: 'exam', visual: true },
    { id: '9a', label: '9(a)', marks: 4, topic: 'number', skill: 'Simple Arithmetic', desc: 'Complete a multiplication grid (odd numbers × primes)', skillIds: ['simple_arithmetic'], kind: 'exam', visual: true },
    { id: '9b', label: '9(b)', marks: 2, topic: 'probdata', skill: 'Calculating Simple Probability', desc: 'P(product from the grid is a square number)', skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false },
    { id: '10a', label: '10(a)', marks: 2, topic: 'algebra', skill: 'Simplifying Expressions', desc: 'Simplify 8m + 4 − 2m + 7', skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '10b', label: '10(b)', marks: 2, topic: 'algebra', skill: 'Simplifying Expressions', desc: 'Simplify ½c × 6d', skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '11', label: '11', marks: 4, topic: 'number', skill: 'Percentage Change + Simple Arithmetic', desc: '6 single bags at £55 each; multipack is 10% less', skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'exam', visual: false },
    { id: '12', label: '12', marks: 1, topic: 'ratio', skill: 'Ratio', desc: 'Write 6:2 in the form n:1', skillIds: ['ratio'], kind: 'mastery', visual: false },
    { id: '13', label: '13', marks: 2, topic: 'number', skill: 'Simple Arithmetic', desc: 'x+y always/sometimes/never positive; x−y always/sometimes/never negative', skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '14a', label: '14(a)', marks: 1, topic: 'shape', skill: 'Congruence and Similarity', desc: 'Draw a shape congruent to triangle A', skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: true },
    { id: '14b', label: '14(b)', marks: 2, topic: 'shape', skill: 'Enlargements', desc: 'Enlarge shape B by scale factor 1/3', skillIds: ['enlargements', 'fractional_enlargements'], kind: 'mastery', visual: true },
    { id: '15', label: '15', marks: 3, topic: 'ratio', skill: 'Ratio', desc: '35 books, adults:children = 6:1 — how many more adult books', skillIds: ['ratio'], kind: 'exam', visual: false },
    { id: '16', label: '16', marks: 2, topic: 'shape', skill: 'Constructions', desc: 'Accurately draw a semicircle-and-square compound shape', skillIds: ['constructions'], kind: 'exam', visual: true },
    { id: '17', label: '17', marks: 3, topic: 'ratio', skill: 'Compound Units', desc: '4 miles in 5 minutes — average speed in mph', skillIds: ['compound_units'], kind: 'exam', visual: false },
    { id: '18', label: '18', marks: 3, topic: 'shape', skill: 'Coordinates + Straight Line Graphs', desc: 'J(0,12), K(5,10) on line JKLM with JK=KL=LM — find M', skillIds: ['coordinates', 'understanding_straight_line_graphs'], kind: 'exam', visual: false },
    { id: '19', label: '19', marks: 2, topic: 'number', skill: 'Indices', desc: '1.5 squared', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '20a', label: '20(a)', marks: 1, topic: 'algebra', skill: 'Function Machines', desc: 'Complete a function machine so y = 4x + 5', skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '20b', label: '20(b)', marks: 1, topic: 'algebra', skill: 'Function Machines', desc: 'Complete a function machine so y = 3x − 24', skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '20c', label: '20(c)', marks: 1, topic: 'algebra', skill: 'Function Machines', desc: 'Complete a function machine so y = x', skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '21', label: '21', marks: 3, topic: 'number', skill: 'Simple Arithmetic', desc: 'Add 10 to every value in a list: True/False for mode, median, range', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '22a', label: '22(a)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Missing term: 1, 4, 16, ?, 256', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '22b', label: '22(b)', marks: 2, topic: 'algebra', skill: 'Sequences', desc: 'Fibonacci-type sequence 5, −9, … — next two terms', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '23a', label: '23(a)', marks: 1, topic: 'shape', skill: 'Properties of 3D Solids', desc: 'Faces of a hexagonal prism (from the diagram)', skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false },
    { id: '23b', label: '23(b)', marks: 2, topic: 'shape', skill: 'Areas of Compound Shapes', desc: 'Cross-section area from volume 3500 cm³, length 20 cm', skillIds: ['areas_of_compound_shapes'], kind: 'mastery', visual: false },
    { id: '24', label: '24', marks: 2, topic: 'number', skill: 'Adding and Subtracting Fractions', desc: '1⅕ − 3/10, as a fraction', skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false },
    { id: '25', label: '25', marks: 1, topic: 'shape', skill: 'Exact Trigonometric Values', desc: 'sin 90°', skillIds: ['exact_trig_values'], kind: 'mastery', visual: false },
    { id: '26', label: '26', marks: 4, topic: 'shape', skill: 'Area of a Circle', desc: 'Large circle r=12cm, radii ratio 4:1 — shaded area in terms of π', skillIds: ['area_of_a_circle'], kind: 'exam', visual: false },
    { id: '27a', label: '27(a)', marks: 2, topic: 'ratio', skill: 'Inverse Proportion', desc: '10 people take 9 hours — time for 15 people at the same rate', skillIds: ['inverse_proportion'], kind: 'mastery', visual: false },
    { id: '27b', label: '27(b)', marks: 1, topic: 'ratio', skill: 'Inverse Proportion', desc: '6 of the 15 work slower, 9 faster — greater/same/less/impossible to say', skillIds: ['inverse_proportion'], kind: 'mastery', visual: false },
  ],

  // Rebuilt 2026-09-11 against the question paper: every retry carries its
  // answer and working, a multi-part question shares its setup (and figure)
  // across its parts, and a figure is drawn wherever the paper draws one.
  retrySet: {
    '1a': { skill: 'Indices', question: 'Write down the value of √81', answer: '9' },
    '1b': { skill: 'Indices', question: 'Work out the value of 4³', answer: '64', working: '4 × 4 × 4' },
    '1c': { skill: 'Indices', question: 'Write 100 000 as a power of 10', answer: '10⁵', working: 'Five zeros, so five tens multiplied together.' },
    '2': { skill: 'Converting Measurements + Proportion', question: '1 stone = 14 pounds\nWork out the number of pounds in 5 stone.', answer: '70 pounds', working: '5 × 14' },
    '3a': { skill: 'Irregular and Improper Fractions', question: 'Write <frac>7/3</frac> as a mixed number.', answer: '2<frac>1/3</frac>', working: '7 ÷ 3 = 2 remainder 1.' },
    '3b': { skill: 'Adding and Subtracting Fractions', question: 'Work out <frac>1/7</frac> + <frac>3/7</frac>', answer: '<frac>4/7</frac>', working: 'Same denominator, so add the numerators.' },
    '4a': { skill: 'Factors and Multiples', question: 'Write down all the factors of 18', answer: '1, 2, 3, 6, 9 and 18', working: 'In pairs: 1 × 18, 2 × 9 and 3 × 6.' },
    '4b': { skill: 'Factors and Multiples', question: 'Nia says,\n"When two multiples of 3 are added, the answer is always a multiple of 6"\nGive one example to show that she is wrong.', answer: 'For example 3 + 6 = 9, which is not a multiple of 6', working: 'Any odd multiple of 3 added to an even one gives an odd total, which cannot be a multiple of 6.' },
    '5': { skill: 'Fractions, Decimals and Percentages', question: 'Put these values in order of size, starting with the smallest.\n60%     0.55     <frac>5/8</frac>', answer: '0.55, 60%, <frac>5/8</frac>', working: 'As decimals they are 0.6, 0.55 and 0.625.' },
    '6': { skill: 'Simple Arithmetic', question: 'Bilal buys three pens and four rulers.\nThe total cost is £11.10\nEach pen costs £1.30\nWork out the cost of each ruler.', answer: '£1.80', working: 'The pens cost 3 × £1.30 = £3.90, leaving £7.20 for four rulers.' },

    // 7(a) is `visual: true` and gets the frequency tree, drawn as the paper
    // draws it: the category names on the BRANCHES, the numbers in the nodes,
    // every node but the first left empty. 7(b) reads the same tree.
    '7a': {
      skill: 'Frequency Trees',
      question: '150 people visit a zoo.\n90 are children, the rest are adults.\nAt the entrance you can turn left or right.\n54 children turn left.\n80 people in total turn left.\nComplete the frequency tree.',
      answer: 'Children 90 and adults 60; children: left 54, right 36; adults: left 26, right 34',
      working: '150 − 90 = 60 adults; 90 − 54 = 36 children turn right; 80 − 54 = 26 adults turn left, so 60 − 26 = 34 turn right.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 9, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polyline points="1.05,4 3.95,6.5" stroke="#333" /><polyline points="1.05,4 3.95,1.5" stroke="#333" /><polyline points="4.95,6.5 7.7,7.5" stroke="#333" /><polyline points="4.95,6.5 7.7,5.5" stroke="#333" /><polyline points="4.95,1.5 7.7,2.5" stroke="#333" /><polyline points="4.95,1.5 7.7,0.5" stroke="#333" /><ellipse cx="0.55" cy="4" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="4.45" cy="6.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="4.45" cy="1.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="7.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="5.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="2.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="0.5" rx="0.5" ry="0.38" stroke="#333" fill="none" />',
        labels: [
          { x: 0.55, y: 4, text: '150' },
          { x: 0.55, y: 9.2, text: 'People' },
          { x: 4.45, y: 9.4, text: 'Children' },
          { x: 4.45, y: 8.8, text: 'or adults' },
          { x: 8.2, y: 9.4, text: 'Turn left' },
          { x: 8.2, y: 8.8, text: 'or right' },
          { x: 2.2, y: 5.75, text: 'Children' },
          { x: 2.2, y: 2.25, text: 'Adults' },
          { x: 6.2, y: 7.45, text: 'Left' },
          { x: 6.2, y: 5.55, text: 'Right' },
          { x: 6.2, y: 2.45, text: 'Left' },
          { x: 6.2, y: 0.55, text: 'Right' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '7b': {
      skill: 'Frequency Trees + Calculating Simple Probability',
      question: '150 people visit a zoo.\n90 are children, the rest are adults.\nAt the entrance you can turn left or right.\n54 children turn left.\n80 people in total turn left.\nWhat fraction of the children turn left?\nGive your answer in its simplest form.',
      answer: '<frac>3/5</frac>',
      working: '<frac>54/90</frac>, which cancels by 18.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 9, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polyline points="1.05,4 3.95,6.5" stroke="#333" /><polyline points="1.05,4 3.95,1.5" stroke="#333" /><polyline points="4.95,6.5 7.7,7.5" stroke="#333" /><polyline points="4.95,6.5 7.7,5.5" stroke="#333" /><polyline points="4.95,1.5 7.7,2.5" stroke="#333" /><polyline points="4.95,1.5 7.7,0.5" stroke="#333" /><ellipse cx="0.55" cy="4" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="4.45" cy="6.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="4.45" cy="1.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="7.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="5.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="2.5" rx="0.5" ry="0.38" stroke="#333" fill="none" /><ellipse cx="8.2" cy="0.5" rx="0.5" ry="0.38" stroke="#333" fill="none" />',
        labels: [
          { x: 0.55, y: 4, text: '150' },
          { x: 0.55, y: 9.2, text: 'People' },
          { x: 4.45, y: 9.4, text: 'Children' },
          { x: 4.45, y: 8.8, text: 'or adults' },
          { x: 8.2, y: 9.4, text: 'Turn left' },
          { x: 8.2, y: 8.8, text: 'or right' },
          { x: 2.2, y: 5.75, text: 'Children' },
          { x: 2.2, y: 2.25, text: 'Adults' },
          { x: 6.2, y: 7.45, text: 'Left' },
          { x: 6.2, y: 5.55, text: 'Right' },
          { x: 6.2, y: 2.45, text: 'Left' },
          { x: 6.2, y: 0.55, text: 'Right' },
        ],
        elements: [], tolerance: 0,
      },
    },

    // 9(a) (the grid of scores) is visual and has no retry, so 9(b) sets up
    // its own two picks rather than pointing at a grid the student lacks.
    '9b': { skill: 'Calculating Simple Probability', question: 'A number is picked at random from the first three positive even numbers.\nA number is picked at random from the first four prime numbers.\nThe two numbers are multiplied to get a score.\nWhat is the probability that the score is a square number?\nGive your answer as a fraction.', answer: '<frac>1/12</frac>', working: '2, 4 or 6 times 2, 3, 5 or 7 gives 12 equally likely scores, and only 2 × 2 = 4 is a square number.' },
    '10a': { skill: 'Simplifying Expressions', question: 'Simplify fully 7k + 3 − 4k + 8', answer: '3k + 11' },
    '10b': { skill: 'Simplifying Expressions', question: 'Simplify fully ⅓p × 9q', answer: '3pq', working: '⅓ × 9 = 3, and p × q = pq.' },

    // The paper gives the single price and the pack size in a PICTURE of the
    // two packs, and only the percentage in words. So does the retry.
    '11': {
      skill: 'Percentage Change + Simple Arithmetic',
      question: 'Here are a single carton of juice and a multipack.\nThe multipack costs 15% less than 8 single cartons.\nWork out the cost of the multipack.',
      answer: '£4.42',
      working: '8 × 65p = £5.20, and 15% of £5.20 is 78p, so £5.20 − 78p.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 7, step: 1, label: '' },
        background: '<polyline points="1,1 3.2,1 3.2,4.6 1,4.6 1,1" stroke="#333" fill="none" /><polyline points="5,1 9,1 9,6.2 5,6.2 5,1" stroke="#333" fill="none" />',
        labels: [
          { x: 2.1, y: 3.3, text: 'Juice' },
          { x: 2.1, y: 2.5, text: '65p' },
          { x: 7, y: 4.3, text: 'Multipack –' },
          { x: 7, y: 3.5, text: '8 cartons' },
          { x: 7, y: 2.7, text: 'of juice' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '12': { skill: 'Ratio', question: 'Write the ratio 18 : 3 in the form n : 1', answer: '6 : 1', working: 'Divide both sides by 3.' },
    '13': { skill: 'Simple Arithmetic', question: 'a and b are two different positive numbers.\nFor each statement, tick the correct box.\n<table>Statement | Always true | Sometimes true | Never true\na × b is positive |  |  | \na ÷ b is greater than 1 |  |  | </table>', answer: 'a × b is positive: always true; a ÷ b is greater than 1: sometimes true', working: 'Two positive numbers always multiply to a positive; a ÷ b is more than 1 only when a is the bigger number.' },

    // ── The two diagram-bearing retries ───────────────────────────────────
    // 14(a) and 14(b) are `visual: true` items, which normally get no retry at
    // all — a question depending on a diagram cannot be reissued as text. They
    // can have one here because the retry brings its own grid.
    //
    // `background` is the GIVEN shape and `elements` is the ANSWER. Only the
    // background is printed (feedbackPdf renders with showCanonical: false), so
    // the student gets the shape to work from and not the shape to find.
    // Coordinates are in axis units; the wrapper supplies stroke-width.
    '14a': {
      skill: 'Congruence and Similarity',
      question: 'Triangle A is drawn on the grid. On the same grid, draw a triangle that is congruent to triangle A, in a different position.',
      answer: 'Any triangle with sides of 3, 4 and 5 units — for example vertices at (6,1), (9,1) and (6,5).',
      working: 'Congruent means identical in size and shape, so only the position may change.',
      diagram: {
        mode: 'polygon',
        x: { min: 0, max: 10, step: 1, label: 'x' },
        y: { min: 0, max: 6, step: 1, label: 'y' },
        background: '<polygon points="1,1 4,1 1,5" stroke="#333" />',
        elements: [{ x: 6, y: 1, marks: 1 }, { x: 9, y: 1, marks: 1 }, { x: 6, y: 5, marks: 1 }],
        tolerance: 0,
      },
    },
    '14b': {
      skill: 'Enlargements',
      question: 'Shape B is drawn on the grid. Enlarge shape B by scale factor <frac>1/3</frac>, using (0,0) as the centre of enlargement.',
      answer: 'A triangle with vertices at (1,1), (3,1) and (1,3).',
      working: 'The centre is the origin, so divide each coordinate by 3.',
      diagram: {
        mode: 'polygon',
        x: { min: 0, max: 10, step: 1, label: 'x' },
        y: { min: 0, max: 10, step: 1, label: 'y' },
        background: '<polygon points="3,3 9,3 3,9" stroke="#333" />',
        elements: [{ x: 1, y: 1, marks: 1 }, { x: 3, y: 1, marks: 1 }, { x: 1, y: 3, marks: 1 }],
        tolerance: 0,
      },
    },
    '15': { skill: 'Ratio', question: '56 films are either comedies or dramas.\nnumber of comedies : number of dramas = 5 : 3\nHow many more films are comedies than dramas?', answer: '14', working: '56 ÷ 8 = 7, so 35 comedies and 21 dramas.' },
    '17': { skill: 'Compound Units', question: 'A cyclist travels 3 miles in 12 minutes.\nWork out the average speed in miles per hour.', answer: '15 mph', working: '12 minutes is <frac>1/5</frac> of an hour, so 3 × 5.' },

    // Drawn as the paper draws it: the line on bare axes, the two given
    // points lettered with their coordinates and the other two lettered only.
    // No tick marks, so nothing can be read off.
    '18': {
      skill: 'Coordinates + Straight Line Graphs',
      question: 'P (0, 11) and Q (4, 8) are points on the straight line PQRS.\nPQ = QR = RS\nWork out the coordinates of S.\nNot drawn accurately',
      answer: '(12, 2)',
      working: 'From P to Q is 4 across and 3 down, so S is three of those steps from P.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: -1, max: 15, step: 1, label: '' },
        y: { min: -1, max: 13, step: 1, label: '' },
        background: '<polyline points="0,-0.6 0,12.6" stroke="#333" fill="none" /><polyline points="-0.2,12.25 0,12.6 0.2,12.25" stroke="#333" fill="none" /><polyline points="-0.6,0 14.2,0" stroke="#333" fill="none" /><polyline points="13.85,0.2 14.2,0 13.85,-0.2" stroke="#333" fill="none" /><polyline points="0,11 12,2" stroke="#333" fill="none" /><circle cx="0" cy="11" r="0.16" stroke="#333" fill="#333" /><circle cx="4" cy="8" r="0.16" stroke="#333" fill="#333" /><circle cx="8" cy="5" r="0.16" stroke="#333" fill="#333" /><circle cx="12" cy="2" r="0.16" stroke="#333" fill="#333" />',
        labels: [
          { x: 0, y: 11, text: 'P (0, 11)', dx: 34, dy: -8 },
          { x: 4, y: 8, text: 'Q (4, 8)', dx: 30, dy: -8 },
          { x: 8, y: 5, text: 'R', dx: 7, dy: -11 },
          { x: 12, y: 2, text: 'S', dx: 7, dy: -11 },
          { x: 0, y: 0, text: 'O', dx: -10, dy: 11 },
          { x: 14.2, y: 0, text: 'x', dy: 13 },
          { x: 0, y: 12.6, text: 'y', dx: -10 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '19': { skill: 'Indices', question: 'Work out the value of 3.5²', answer: '12.25', working: '35 × 35 = 1225, and two decimal places.' },

    // 20(a)-(c) are drawn as the paper draws them, x in and y out. (a) has
    // both boxes empty; (b) gives the SECOND box and asks for the first; (c)
    // gives the first — the mark scheme shows which box each part leaves out.
    '20a': {
      skill: 'Function Machines',
      question: 'Here is a number machine.\nComplete this number machine so that y = 3x + 7',
      answer: '× 3, then + 7',
      working: 'Multiply first, then add. (+ <frac>7/3</frac> then × 3 also works.)',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<ellipse cx="1.2" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" /><polyline points="2.2,1.5 3.2,1.5" stroke="#333" fill="none" /><polyline points="2.95,1.68 3.18,1.5 2.95,1.32" stroke="#333" fill="none" /><polyline points="3.2,1 5.2,1 5.2,2 3.2,2 3.2,1" stroke="#333" fill="none" /><polyline points="5.2,1.5 6.8,1.5" stroke="#333" fill="none" /><polyline points="6.55,1.68 6.78,1.5 6.55,1.32" stroke="#333" fill="none" /><polyline points="6.8,1 8.8,1 8.8,2 6.8,2 6.8,1" stroke="#333" fill="none" /><polyline points="8.8,1.5 9.8,1.5" stroke="#333" fill="none" /><polyline points="9.55,1.68 9.78,1.5 9.55,1.32" stroke="#333" fill="none" /><ellipse cx="10.8" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" />',
        // Empty text for an empty box, so the three machines share anchors —
        // they are different machines in one drawing, not one figure split up.
        labels: [
          { x: 1.2, y: 2.55, text: 'Input' },
          { x: 10.8, y: 2.55, text: 'Output' },
          { x: 1.2, y: 1.5, text: 'x' },
          { x: 10.8, y: 1.5, text: 'y' },
          { x: 4.2, y: 1.5, text: '' },
          { x: 7.8, y: 1.5, text: '' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '20b': {
      skill: 'Function Machines',
      question: 'Here is a number machine.\nComplete this number machine so that y = 5x − 15',
      answer: '− 3',
      working: '(x − 3) × 5 = 5x − 15',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<ellipse cx="1.2" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" /><polyline points="2.2,1.5 3.2,1.5" stroke="#333" fill="none" /><polyline points="2.95,1.68 3.18,1.5 2.95,1.32" stroke="#333" fill="none" /><polyline points="3.2,1 5.2,1 5.2,2 3.2,2 3.2,1" stroke="#333" fill="none" /><polyline points="5.2,1.5 6.8,1.5" stroke="#333" fill="none" /><polyline points="6.55,1.68 6.78,1.5 6.55,1.32" stroke="#333" fill="none" /><polyline points="6.8,1 8.8,1 8.8,2 6.8,2 6.8,1" stroke="#333" fill="none" /><polyline points="8.8,1.5 9.8,1.5" stroke="#333" fill="none" /><polyline points="9.55,1.68 9.78,1.5 9.55,1.32" stroke="#333" fill="none" /><ellipse cx="10.8" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" />',
        labels: [
          { x: 1.2, y: 2.55, text: 'Input' },
          { x: 10.8, y: 2.55, text: 'Output' },
          { x: 1.2, y: 1.5, text: 'x' },
          { x: 10.8, y: 1.5, text: 'y' },
          { x: 4.2, y: 1.5, text: '' },
          { x: 7.8, y: 1.5, text: '× 5' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '20c': {
      skill: 'Function Machines',
      question: 'Here is a number machine.\nComplete this number machine so that y = x',
      answer: '÷ 4',
      working: 'Dividing by 4 undoes multiplying by 4.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<ellipse cx="1.2" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" /><polyline points="2.2,1.5 3.2,1.5" stroke="#333" fill="none" /><polyline points="2.95,1.68 3.18,1.5 2.95,1.32" stroke="#333" fill="none" /><polyline points="3.2,1 5.2,1 5.2,2 3.2,2 3.2,1" stroke="#333" fill="none" /><polyline points="5.2,1.5 6.8,1.5" stroke="#333" fill="none" /><polyline points="6.55,1.68 6.78,1.5 6.55,1.32" stroke="#333" fill="none" /><polyline points="6.8,1 8.8,1 8.8,2 6.8,2 6.8,1" stroke="#333" fill="none" /><polyline points="8.8,1.5 9.8,1.5" stroke="#333" fill="none" /><polyline points="9.55,1.68 9.78,1.5 9.55,1.32" stroke="#333" fill="none" /><ellipse cx="10.8" cy="1.5" rx="1" ry="0.55" stroke="#333" fill="none" />',
        labels: [
          { x: 1.2, y: 2.55, text: 'Input' },
          { x: 10.8, y: 2.55, text: 'Output' },
          { x: 1.2, y: 1.5, text: 'x' },
          { x: 10.8, y: 1.5, text: 'y' },
          { x: 4.2, y: 1.5, text: '× 4' },
          { x: 7.8, y: 1.5, text: '' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '21': { skill: 'Simple Arithmetic', question: 'Each number in a list is decreased by 4\nFor each statement, tick the correct box.\n<table>Statement | True | False | Cannot tell\nThe mean is decreased by 4 |  |  | \nThe median is decreased by 4 |  |  | \nThe range is decreased by 4 |  |  | </table>', answer: 'True, True, False', working: 'Every value moves down by 4, so the mean and median move with them, but the gap between the largest and smallest value does not change.' },
    '22a': { skill: 'Sequences', question: 'Write the missing term in this geometric progression.\n2     6     18     ____     162', answer: '54', working: 'Each term is 3 times the one before.' },
    '22b': { skill: 'Sequences', question: 'A Fibonacci-type sequence begins\n3     −7\nThe sequence is continued by adding the previous two terms.\nWork out the next two terms.', answer: '−4 and −11', working: '3 + (−7) = −4, then −7 + (−4) = −11.' },

    // 23(a) and (b) share the solid, drawn as the paper draws its prism: a
    // pentagonal one here (the paper's is hexagonal), hidden edges dashed.
    '23a': {
      skill: 'Properties of 3D Solids',
      question: 'Here is a solid prism.\nHow many faces does the prism have?',
      answer: '7',
      working: 'Five rectangles round the sides, plus the two pentagonal ends.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 7, step: 1, label: '' },
        background: '<polygon points="2.5,4.6 0.978,3.494 1.56,1.706 3.44,1.706 4.022,3.494" stroke="#333" fill="none" /><polyline points="2.5,4.6 8,6.4 9.522,5.294 8.94,3.506 3.44,1.706" stroke="#333" fill="none" /><polyline points="4.022,3.494 9.522,5.294" stroke="#333" fill="none" /><polyline points="8,6.4 6.478,5.294 7.06,3.506 8.94,3.506" stroke="#333" fill="none" stroke-dasharray="0.25 0.18" /><polyline points="0.978,3.494 6.478,5.294" stroke="#333" fill="none" stroke-dasharray="0.25 0.18" /><polyline points="1.56,1.706 7.06,3.506" stroke="#333" fill="none" stroke-dasharray="0.25 0.18" />',
        elements: [], tolerance: 0,
      },
    },
    '23b': {
      skill: 'Areas of Compound Shapes',
      question: 'Here is a solid prism.\nThe prism has volume = 4200 cm³ and length = 15 cm\nWork out the area of the cross-section of the prism.',
      answer: '280 cm²',
      working: 'Volume of a prism = area of cross-section × length, so 4200 ÷ 15.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 7, step: 1, label: '' },
        background: '<polygon points="2.5,4.6 0.978,3.494 1.56,1.706 3.44,1.706 4.022,3.494" stroke="#333" fill="none" /><polyline points="2.5,4.6 8,6.4 9.522,5.294 8.94,3.506 3.44,1.706" stroke="#333" fill="none" /><polyline points="4.022,3.494 9.522,5.294" stroke="#333" fill="none" /><polyline points="8,6.4 6.478,5.294 7.06,3.506 8.94,3.506" stroke="#333" fill="none" stroke-dasharray="0.25 0.18" /><polyline points="0.978,3.494 6.478,5.294" stroke="#333" fill="none" stroke-dasharray="0.25 0.18" /><polyline points="1.56,1.706 7.06,3.506" stroke="#333" fill="none" stroke-dasharray="0.25 0.18" />',
        elements: [], tolerance: 0,
      },
    },
    '24': { skill: 'Adding and Subtracting Fractions', question: 'Work out 1<frac>1/4</frac> − <frac>3/8</frac>\nGive your answer as a fraction.', answer: '<frac>7/8</frac>', working: '1<frac>1/4</frac> = <frac>10/8</frac>, and <frac>10/8</frac> − <frac>3/8</frac>.' },
    '25': { skill: 'Exact Trigonometric Values', question: 'Write down the value of cos 0°', answer: '1' },

    // The paper shades the region between the circles; so does the retry.
    '26': {
      skill: 'Area of a Circle',
      question: 'A large circle and a small circle are shown.\nThe radius of the large circle is 10 cm\nradius of large circle : radius of small circle = 5 : 1\nWork out the shaded area.\nGive your answer in terms of π\nNot drawn accurately',
      answer: '96π cm²',
      working: 'The small circle has radius 2 cm, so the shaded area is π × 10² − π × 2² = 100π − 4π.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<circle cx="5" cy="5" r="4" stroke="#333" fill="#dddddd" /><circle cx="3.232" cy="6.768" r="1.5" stroke="#333" fill="#ffffff" />',
        elements: [], tolerance: 0,
      },
    },
    '27a': { skill: 'Inverse Proportion', question: '8 people can complete a job in 15 hours.\nIn this part, assume that each person works at the same rate.\nIf 12 people work on the same job, how many hours will it take to complete the job?', answer: '10 hours', working: '8 × 15 = 120 hours of work, shared between 12 people.' },
    '27b': { skill: 'Inverse Proportion', question: '8 people can complete a job in 15 hours.\n12 people work on the same job.\nIn fact, of the 12 people\n• 5 work at a slower rate\n• 7 work at a faster rate.\nWhat does this mean about the number of hours it will take, compared with 12 people all working at the same rate?\nTick one box.\n[   ] It is greater\n[   ] It is the same\n[   ] It is less\n[   ] It is not possible to say', answer: 'It is not possible to say', working: 'Without knowing how much slower and how much faster they work, the two effects could balance out either way.' },
  },

  challengeQuestions: [
    { topic: 'number', skill: 'Reverse Percentages', question: 'A jacket costs £68 after a 20% discount. What was the original price?', answer: '£85', working: '£68 is 80% of the original price.' },
    { topic: 'number', skill: 'Standard Form', question: 'Write 0.000521 in standard form.', answer: '5.21 × 10⁻⁴' },
    { topic: 'algebra', skill: 'Simultaneous Equations', question: '2x + 3y = 16 and 4x − 3y = 14. Find the values of x and y.', answer: 'x = 5, y = 2', working: 'Adding the equations eliminates y: 6x = 30.' },
    { topic: 'algebra', skill: 'Quadratic Factorising', question: 'Factorise x² + 2x − 15.', answer: '(x + 5)(x − 3)' },
    { topic: 'ratio', skill: 'Compound Measures', question: 'A runner covers 21 km in 1 hour 45 minutes. Work out the average speed in km/h.', answer: '12 km/h', working: '1 hour 45 minutes is 1.75 hours.' },
    { topic: 'ratio', skill: 'Direct Proportion', question: 'y is directly proportional to x. When x = 8, y = 20. Find y when x = 14.', answer: 'y = 35', working: 'y = 2.5x.' },
    { topic: 'shape', skill: 'Trigonometry', question: 'A right-angled triangle has a 9 cm side adjacent to a 40° angle. Work out the length of the hypotenuse, to 1 decimal place.', answer: '11.7 cm', working: '9 ÷ cos 40° = 11.74…' },
    { topic: 'shape', skill: 'Circle Theorems', question: 'A and B are points on a circle with centre O. Angle AOB = 84°. Work out the angle at the circumference subtended by the same arc AB.', answer: '42°', working: 'The angle at the centre is twice the angle at the circumference.' },
    { topic: 'probdata', skill: 'Probability', question: 'A bag contains 5 red, 2 blue and 3 green counters. Two counters are drawn without replacement. Work out the probability that both are green.', answer: '<frac>1/15</frac>', working: '<frac>3/10</frac> × <frac>2/9</frac> = <frac>6/90</frac>.' },
    { topic: 'probdata', skill: 'Cumulative Frequency', question: 'The interquartile range of a data set of 80 values is estimated from a cumulative frequency graph. Which two cumulative frequency values should you read across from?', answer: '20 and 60', working: 'A quarter and three quarters of 80.' },
  ],

  sampleStudents: [
    'Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim',
    'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson',
  ],

  // Generated (deterministic, seed 42) — see the note on aqa-8300-3f-nov24.ts's
  // sampleMarks for the convention; this class's relative standing matches
  // that paper's so a teacher demoing both papers sees one consistent cohort.
  sampleMarks: {
    'Amira Patel':     { '1a':1,'1b':1,'1c':1,'2':2,'3a':1,'3b':1,'4a':2,'4b':1,'5':2,'6':4,'7a':4,'7b':2,'8':3,'9a':4,'9b':2,'10a':2,'10b':2,'11':4,'12':1,'13':2,'14a':1,'14b':2,'15':3,'16':2,'17':2,'18':3,'19':2,'20a':1,'20b':1,'20c':1,'21':3,'22a':1,'22b':2,'23a':1,'23b':2,'24':2,'25':1,'26':4,'27a':2,'27b':1 },
    'Ben Okonkwo':     { '1a':0,'1b':1,'1c':0,'2':2,'3a':0,'3b':1,'4a':1,'4b':0,'5':2,'6':3,'7a':3,'7b':2,'8':3,'9a':2,'9b':2,'10a':1,'10b':2,'11':3,'12':0,'13':0,'14a':1,'14b':0,'15':2,'16':2,'17':2,'18':2,'19':1,'20a':0,'20b':1,'20c':0,'21':3,'22a':0,'22b':2,'23a':1,'23b':1,'24':1,'25':0,'26':4,'27a':1,'27b':0 },
    'Charlotte Evans': { '1a':1,'1b':0,'1c':1,'2':2,'3a':1,'3b':1,'4a':1,'4b':0,'5':2,'6':4,'7a':2,'7b':0,'8':2,'9a':3,'9b':1,'10a':0,'10b':2,'11':4,'12':1,'13':1,'14a':1,'14b':1,'15':2,'16':2,'17':2,'18':2,'19':1,'20a':1,'20b':0,'20c':0,'21':3,'22a':0,'22b':2,'23a':1,'23b':2,'24':2,'25':0,'26':2,'27a':1,'27b':1 },
    'Daniel Kim':      { '1a':1,'1b':1,'1c':0,'2':1,'3a':1,'3b':1,'4a':0,'4b':1,'5':1,'6':3,'7a':3,'7b':1,'8':3,'9a':2,'9b':2,'10a':0,'10b':1,'11':2,'12':0,'13':2,'14a':0,'14b':2,'15':2,'16':1,'17':2,'18':2,'19':2,'20a':0,'20b':0,'20c':1,'21':0,'22a':1,'22b':0,'23a':1,'23b':2,'24':0,'25':0,'26':2,'27a':1,'27b':1 },
    'Emily Zhang':     { '1a':1,'1b':1,'1c':1,'2':2,'3a':1,'3b':1,'4a':1,'4b':1,'5':1,'6':3,'7a':3,'7b':2,'8':3,'9a':3,'9b':2,'10a':2,'10b':1,'11':2,'12':1,'13':1,'14a':1,'14b':0,'15':3,'16':1,'17':2,'18':1,'19':2,'20a':1,'20b':1,'20c':1,'21':1,'22a':1,'22b':1,'23a':1,'23b':1,'24':2,'25':1,'26':1,'27a':1,'27b':0 },
    'Finn McCarthy':   { '1a':0,'1b':0,'1c':0,'2':0,'3a':0,'3b':0,'4a':1,'4b':1,'5':1,'6':0,'7a':1,'7b':2,'8':1,'9a':1,'9b':1,'10a':0,'10b':1,'11':1,'12':0,'13':2,'14a':0,'14b':0,'15':0,'16':1,'17':2,'18':0,'19':0,'20a':1,'20b':1,'20c':0,'21':0,'22a':1,'22b':1,'23a':0,'23b':0,'24':0,'25':0,'26':1,'27a':0,'27b':0 },
    'Grace Adeyemi':   { '1a':0,'1b':0,'1c':0,'2':0,'3a':0,'3b':0,'4a':1,'4b':0,'5':0,'6':1,'7a':0,'7b':1,'8':1,'9a':1,'9b':0,'10a':0,'10b':1,'11':3,'12':0,'13':0,'14a':0,'14b':0,'15':0,'16':0,'17':0,'18':1,'19':0,'20a':0,'20b':0,'20c':1,'21':2,'22a':1,'22b':1,'23a':0,'23b':0,'24':0,'25':1,'26':1,'27a':0,'27b':0 },
    'Harry Wilson':    { '1a':1,'1b':1,'1c':1,'2':2,'3a':1,'3b':1,'4a':2,'4b':0,'5':1,'6':4,'7a':4,'7b':2,'8':3,'9a':4,'9b':2,'10a':2,'10b':2,'11':4,'12':1,'13':2,'14a':1,'14b':2,'15':2,'16':2,'17':3,'18':3,'19':2,'20a':1,'20b':1,'20c':1,'21':3,'22a':1,'22b':2,'23a':1,'23b':2,'24':2,'25':1,'26':4,'27a':2,'27b':1 },
  },
}
