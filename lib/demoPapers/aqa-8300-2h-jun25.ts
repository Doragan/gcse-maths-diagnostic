import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2H — Higher Tier Paper 2 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-H-P2.json by
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
 *   • item 22 is tagged `fractional_enlargements` only. The audit also
 *     listed `enlargements`, but that is the prerequisite of a fractional
 *     or negative enlargement, not a second independent skill. Changed in
 *     data/exam-audit/JUN25-H-P2.json too.
 *   • `challengeQuestions` stays empty ON PURPOSE. Challenges are pooled by
 *     topic and tier in lib/papers/challengePool.ts, and every paper draws
 *     from there; filling this in would override the pool for this paper only.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const AQA_8300_2H_JUN25: PaperConfig = {
  id: 'aqa-8300-2h-jun25',
  title: 'AQA GCSE Mathematics 8300/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Highest Common Factor',                                                                             skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Lowest Common Multiple',                                                                            skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'number',   skill: 'Prime Factor Decomposition',                                                                        skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'product-of-primes answer needs order-insensitive equivalence' },
    { id: '2',   label: '2',     marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                                skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'two blanks of different kinds (an equation and a gradient) in one part' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'probdata', skill: 'Time Series',                                                                                       skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires point-plotting and line-drawing input' },
    { id: '3b',  label: '3(b)',  marks: 3,  topic: 'probdata', skill: 'Time Series + Proportion',                                                                          skillIds: ['time_series', 'proportion'], kind: 'exam', visual: false, desc: 'answer accepted over a range because the trend estimate is open' },
    { id: '4',   label: '4',     marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages + Proportion',                                                   skillIds: ['fractions_decimals_and_percentages', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                                            skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval; needs inequality-form entry' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                                            skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that on a strict inequality; needs the bound and the total evidenced' },
    { id: '6',   label: '6',     marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                                                       skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '7',   label: '7',     marks: 3,  topic: 'probdata', skill: 'Probability Spaces',                                                                                skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: '' },
    { id: '8a',  label: '8(a)',  marks: 3,  topic: 'shape',    skill: 'Circumfrence of a Circle + Sector Calculations',                                                    skillIds: ['circumfrence_of_a_circle', 'sector_calculations'], kind: 'mastery', visual: false, desc: 'range-tolerance decimal answer; static diagram supported' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'shape',    skill: 'Sector Calculations',                                                                               skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '9',   label: '9',     marks: 1,  topic: 'number',   skill: 'Percentage Change',                                                                                 skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '10',  label: '10',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                                                                      skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '11',  label: '11',    marks: 3,  topic: 'shape',    skill: 'Angles in Polygons',                                                                                skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'probdata', skill: 'Sampling',                                                                                          skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'worded criticism of a sample; not markable' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage + Fractions Decimals and Percentages',                                           skillIds: ['reverse_percentage', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                                                                    skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'choice credited only with two comparable times shown' },
    { id: '14',  label: '14',    marks: 3,  topic: 'algebra',  skill: 'Equations and Identities',                                                                          skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'open answer: any triple satisfying the identity is valid, so exact-match fails' },
    { id: '15',  label: '15',    marks: 2,  topic: 'algebra',  skill: 'Solving Quadratic Equations (Quadratic Equation)',                                                  skillIds: ['solving_quadratic_equations_quadratic_equation'], kind: 'mastery', visual: false, desc: 'two-root answer needs a multi-blank response' },
    { id: '16',  label: '16',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                                  skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '17',  label: '17',    marks: 3,  topic: 'probdata', skill: 'Combined Events + Ratio',                                                                           skillIds: ['combined_events', 'ratio'], kind: 'exam', visual: false, desc: '' },
    { id: '18',  label: '18',    marks: 4,  topic: 'shape',    skill: 'Cosine Rule + Angles on lines and Circles',                                                         skillIds: ['cosine_rule', 'angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '19',  label: '19',    marks: 4,  topic: 'probdata', skill: 'Histograms',                                                                                        skillIds: ['histograms'], kind: 'mastery', visual: false, desc: 'static histogram supported' },
    { id: '20',  label: '20',    marks: 1,  topic: 'algebra',  skill: 'Quadratic Inequalities',                                                                            skillIds: ['quadratic_inequalities'], kind: 'mastery', visual: false, desc: 'spot-the-error free text on a number-line representation' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Equation of a Circle',                                                                              skillIds: ['equation_of_a_circle'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '21b', label: '21(b)', marks: 4,  topic: 'algebra',  skill: 'Perpendicular Gradients + Circle Theorem: Tangent and Radius + Understanding Straight Line Graphs', skillIds: ['perpendicular_gradients', 'circle_theorem_tangent', 'understanding_straight_line_graphs'], kind: 'exam', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Fractional and Negative Enlargements',                                               skillIds: ['fractional_enlargements'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines a name, a scale factor and a centre in free text' },
    { id: '23',  label: '23',    marks: 5,  topic: 'shape',    skill: 'Vector Proof + Vectors + Ratio',                                                                    skillIds: ['vector_proof', 'vectors', 'ratio'], kind: 'exam', visual: false, desc: 'banded marks depend on which intermediate vectors are shown, not on the value alone' },
    { id: '24',  label: '24',    marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers',                                                                            skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'range-tolerance percentage answer' },
    { id: '25',  label: '25',    marks: 4,  topic: 'algebra',  skill: 'Composite Functions + Inverse Functions + Algebraic Proof',                                         skillIds: ['composite_functions', 'inverse_functions', 'algebraic_proof'], kind: 'exam', visual: false, desc: 'proof: the conclusion is worded, and each stage is credited separately' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // CROSSOVER WITH 2F, carrying the SAME retries: 3(b), 4, 5(a), 5(b), 6,
  // 8(a), 8(b) and 10 here are 2F's 20(b), 21, 23(a), 23(b), 24, 25(a), 25(b)
  // and 26. 3(a) is the shared visual item and has no retry on either paper.
  retrySet: {
    '1a': {
      skill: 'Highest Common Factor',
      question: 'Work out the highest common factor (HCF) of 18 and 30',
      answer: '6',
      working: '18 = 2 × 3 × 3 and 30 = 2 × 3 × 5, so the HCF is 2 × 3 = 6.',
    },
    '1b': {
      skill: 'Lowest Common Multiple',
      question: 'Work out the lowest common multiple (LCM) of 8 and 12',
      answer: '24',
      working: 'Multiples of 8: 8, 16, 24. Multiples of 12: 12, 24. The first in both lists is 24.',
    },
    '1c': {
      skill: 'Prime Factor Decomposition',
      question: 'Write 66 as a product of its prime factors.',
      answer: '2 × 3 × 11',
      working: '66 = 2 × 33, and 33 = 3 × 11.',
    },
    '2': {
      skill: 'Understanding Straight Line Graphs',
      question: 'The diagram shows two straight lines, A and B.\nWrite down the equation of line A, and the gradient of line B.',
      answer: 'Line A is y = 4, and the gradient of line B is 2',
      working: 'B rises 6 for every 3 across.',
      diagram: {
        mode: 'points',
        x: { min: -1, max: 5, step: 1, label: 'x' },
        y: { min: -2, max: 7, step: 1, label: 'y' },
        background: '<polyline points="-1,4 5,4" stroke="#333" fill="none" /><polyline points="-0.5,-2 4,7" stroke="#333" fill="none" />',
        labels: [
          { x: 4.6, y: 4, text: 'A', dy: -8 },
          { x: 3.7, y: 6.4, text: 'B', dx: -10 },
        ],
        elements: [], tolerance: 0,
      },
    },

    // Shared with 2F — see the note above. 3(a) is the visual half of the same
    // crossover question and carries 2F 20(a)'s grid, unchanged.
    '3a': {
      skill: 'Time Series',
      question: 'The table shows the number of visitors to a café during its first 6 days.\n<table>Day | 1 | 2 | 3 | 4 | 5 | 6\nVisitors | 40 | 120 | 100 | 80 | 60 | 40</table>\nOn the grid, draw a time series graph to represent the data.',
      answer: 'Points at (1, 40), (2, 120), (3, 100), (4, 80), (5, 60) and (6, 40), joined by straight lines',
      working: 'Plot each day against its number of views, then join them in order.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 6, step: 1, label: 'Day' },
        y: { min: 0, max: 120, step: 20, label: 'Visitors' },
        background: '',
        elements: [{ x: 1, y: 40, marks: 1 }, { x: 2, y: 120, marks: 1 }, { x: 3, y: 100, marks: 1 }, { x: 4, y: 80, marks: 1 }, { x: 5, y: 60, marks: 1 }, { x: 6, y: 40, marks: 1 }], tolerance: 0,
      },
    },
    '3b': {
      skill: 'Time Series',
      question: 'The table shows the number of visitors to a café during its first 6 days.\n<table>Day | 1 | 2 | 3 | 4 | 5 | 6\nVisitors | 40 | 120 | 100 | 80 | 60 | 40</table>\nAfter day 2, the number of visitors falls steadily.\nEach visitor spends £2.50 on average.\nEstimate how much visitors will spend on day 7.',
      answer: '£50',
      working: 'The visitors fall by 20 a day, so day 7 has about 20 visitors, and 20 × £2.50 = £50.',
    },
    '4': { skill: 'Fractions Decimals and Percentages + Proportion', question: '60% of the counters in a bag are green and the rest are yellow.\n25% of the green counters are removed, and 40% of the yellow counters are removed.\nIn total, what percentage of the counters are removed from the bag?', answer: '31%', working: '0.6 × 25% = 15% and 0.4 × 40% = 16%.' },
    '5a': { skill: 'Upper and Lower Bounds', question: 'The length of a shelf is 240 cm to the nearest 20 cm. Complete the error interval for the length.', answer: '230 ≤ length < 250', working: 'Half of 20 either side; the upper bound is strict.' },
    '5b': {
      skill: 'Upper and Lower Bounds',
      question: 'A different shelf measures 3 metres to the nearest 20 cm. Show that the total length of four of these shelves must be less than 12.5 metres.',
      answer: 'One shelf is at most 3.1 m, so four are at most 4 × 3.1 = 12.4 m, which is less than 12.5 m',
      working: 'One shelf is under 3.1 m, so four are under 12.4 m.',
    },
    '6': { skill: 'Factorising', question: 'Circle the expression which is a factor of 5x + 30.\n5x     x + 35     x + 6     x + 30', answer: 'x + 6', working: '5x + 30 = 5(x + 6).' },

    '7': {
      skill: 'Probability Spaces',
      question: 'The table shows the probabilities of the five possible outcomes of an event.\n<table>Outcome | V | W | X | Y | Z\nProbability | 0.18 | 0.12 |  |  | </table>\nP(X) = P(W) + 0.18\nP(Y) = P(Z)\nWork out P(Y).',
      answer: '0.2',
      working: 'V, W and X take 0.6, leaving 0.4 to share equally between Y and Z.',
    },

    '8a': {
      skill: 'Sector Calculations',
      question: 'The diagram shows a circle, centre O.\nThe circle has a circumference of 30 cm.\nThe shaded sector has an angle of 270° at the centre.\nWork out the area of the shaded sector.\nGive your answer to 1 decimal place.',
      answer: '53.7 cm²',
      working: 'The radius is 30 ÷ 2π = 4.775 cm, so the whole circle is 71.62 cm² and three quarters of it is 53.7 cm².',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<path d="M 5,4 L 5,7 A 3,3 0 1,1 8,4 Z" fill="#dddddd" stroke="none" /><circle cx="5" cy="4" r="3" stroke="#333" fill="none" /><polyline points="5,4 8,4" stroke="#333" fill="none" /><polyline points="5,4 5,7" stroke="#333" fill="none" /><polyline points="5.55,4 5.55,4.55 5,4.55" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 4, text: 'O', dx: -9, dy: 5 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '8b': {
      skill: 'Sector Calculations',
      question: 'The diagram shows a circle, centre O.\nThe circle has a circumference of 30 cm.\nThe shaded sector has an angle of 270° at the centre.\nIn fact, the angle at the centre of the shaded sector is more than 270°.\nWhat does this mean about the area of the shaded sector?\nTick one box.\n[   ] It is less than three quarters of the circle\n[   ] It is exactly three quarters of the circle\n[   ] It is more than three quarters of the circle\n[   ] It could be any of these',
      answer: 'It is more than three quarters of the circle',
      working: 'A larger angle takes a larger share of the circle.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<path d="M 5,4 L 5,7 A 3,3 0 1,1 8,4 Z" fill="#dddddd" stroke="none" /><circle cx="5" cy="4" r="3" stroke="#333" fill="none" /><polyline points="5,4 8,4" stroke="#333" fill="none" /><polyline points="5,4 5,7" stroke="#333" fill="none" /><polyline points="5.55,4 5.55,4.55 5,4.55" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 4, text: 'O', dx: -9, dy: 5 },
        ],
        elements: [], tolerance: 0,
      },
    },

    '9': { skill: 'Percentage Change', question: 'The number of members of a club increases from 24 000 to 72 000.\nThe chair says, "Our membership has increased by 300%, because 72 000 is 24 000 times 3."\nAre they correct?\nGive a reason for your answer.', answer: 'No — it is a 200% increase', working: 'The increase is 48 000 on 24 000, and tripling is an increase of 200%, not 300%.' },

    '10': {
      skill: 'Trigonometry (missing sides)',
      question: 'Use trigonometry to work out the value of x, to 1 decimal place. You must show your working.\nNot drawn accurately.',
      answer: '9.2 cm',
      working: '15 × sin 38° = 9.23…',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,1 9,1 9,7" stroke="#333" fill="none" /><polyline points="8.3,1 8.3,1.7 9,1.7" stroke="#333" fill="none" /><path d="M 3,1 A 2,2 0 0,1 2.6,2.2" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 4, text: '15 cm', dx: -12, dy: -4 },
          { x: 9, y: 4, text: 'x', dx: 11 },
          { x: 1, y: 1, text: '38°', dx: 34, dy: -6 },
        ],
        elements: [], tolerance: 0,
      },
    },

    '11': {
      skill: 'Angles in Polygons',
      question: 'A straight line is drawn across a regular decagon.\nWork out the size of angle x.\nNot drawn accurately.',
      answer: '72°',
      working: 'Each interior angle of a regular decagon is 180 − 360 ÷ 10 = 144°.\nThe line joins opposite vertices, so the shape above it is a hexagon, whose angles add to 720°.\nFour of them are 144°, leaving 720 − 576 = 144° shared equally between the two ends of the line.\nSo x = 72°.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polygon points="10.28,6.391 8.645,8.641 6,9.5 3.355,8.641 1.72,6.391 1.72,3.609 3.355,1.359 6,0.5 8.645,1.359 10.28,3.609" stroke="#333" fill="none" /><polyline points="1.72,3.609 10.28,6.391" stroke="#333" fill="none" /><path d="M 2.671,3.918 A 1,1 0 0,1 1.72,4.609" stroke="#333" fill="none" />',
        labels: [
          { x: 2.602, y: 4.823, text: 'x' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '12a': { skill: 'Sampling', question: 'Priya wants to know whether students at her school think the library opening hours are long enough.\nShe asks 12 students who are in the library at lunchtime.\nGive one reason why her results may not represent the whole school.', answer: 'The students she asked already use the library, so they are not typical of the whole school', working: 'A sample drawn from one group is biased towards that group, and 12 is a very small sample.' },
    '12b': {
      skill: 'Reverse Percentage',
      question: 'In a survey, people answered Yes, No or Not Sure.\n55% answered Yes.\n30% answered No.\nThe rest answered Not Sure.\n132 people answered Yes.\nHow many people answered Not Sure?',
      answer: '36',
      working: '55% is 132, so 1% is 2.4 and the total is 240; Not Sure is 15%.',
    },
    '13': { skill: 'Compound Units', question: 'Ella and Finn each drive 180 miles from P to Q.\nElla drives the whole way at an average speed of 60 mph.\nFinn drives 100 miles at an average speed of 50 mph and then the rest of the way at an average speed of 40 mph.\nWho takes less time, Ella or Finn?\nShow working to support your answer.', answer: 'Ella', working: 'Ella takes 3 hours; Finn takes 2 hours then 2 more, so 4 hours.' },
    '14': {
      skill: 'Equations and Identities',
      question: 'a(7x + 3) ≡ 28x + 2b + c\nwhere a, b and c are positive integers.\nWork out one possible set of values for a, b and c.',
      answer: 'a = 4, b = 5, c = 2',
      working: '7a = 28 gives a = 4, so 2b + c = 12; any positive pair works.',
    },
    '15': { skill: 'Solving Quadratic Equations (Quadratic Equation)', question: 'Solve 2x² + 7x − 5 = 0. Give your solutions as decimals to 2 decimal places.', answer: 'x = 0.61 and x = −4.11', working: 'x = (−7 ± √89) ÷ 4, and √89 = 9.434.' },
    '16': { skill: 'Growth and Decay', question: 'The value of a machine decreases by 15% per year.\nWork out the number of full years until the machine loses more than half its value.\nYou must show your working.', answer: '5 years', working: '0.85⁴ = 0.522, which is still above half, and 0.85⁵ = 0.444.' },
    '17': {
      skill: 'Combined Events + Ratio',
      question: 'When a biased spinner is spun, P(red) : P(blue) = 3 : 1.\nIn a game the spinner is spun four times.\nThe first way to win is to spin four reds.\nThe second way is to spin red, blue, red, blue.\nHow many times more likely is a player to win the first way than the second way?',
      answer: '9 times',
      working: 'P(red) = <frac>3/4</frac> and P(blue) = <frac>1/4</frac>.\nFour reds: <frac>3/4</frac> × <frac>3/4</frac> × <frac>3/4</frac> × <frac>3/4</frac> = <frac>81/256</frac>.\nRed, blue, red, blue: <frac>3/4</frac> × <frac>1/4</frac> × <frac>3/4</frac> × <frac>1/4</frac> = <frac>9/256</frac>.\nSo the first way is 81 ÷ 9 = 9 times more likely than the second.',
    },
    '18': {
      skill: 'Cosine Rule + Angles on lines and Circles',
      question: 'The diagram shows triangle ABC.\nDBC is a straight line.\nWork out the length of AC, to 1 decimal place.\nNot drawn accurately.',
      answer: '15.2 cm',
      working: 'Angles on a straight line add to 180°, so angle ABC = 180 − 75 = 105°.\nAC² = 8² + 11² − 2 × 8 × 11 × cos 105° = 230.55…\nAC = √230.55… = 15.18…, so AC = 15.2 cm.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 7.5, step: 1, label: '' },
        background: '<polygon points="1.551,6.409 3,1 10.7,1" stroke="#333" fill="none" /><polyline points="0.5,1 3,1" stroke="#333" fill="none" /><path d="M 2.793,1.773 A 0.8,0.8 0 0,1 2.2,1" stroke="#333" fill="none" />',
        labels: [
          { x: 1.551, y: 6.409, text: 'A', dx: -9, dy: -3 },
          { x: 3, y: 1, text: 'B', dy: 13 },
          { x: 10.7, y: 1, text: 'C', dx: 9, dy: 11 },
          { x: 0.5, y: 1, text: 'D', dx: -8, dy: 11 },
          { x: 2.276, y: 3.704, text: '8 cm', dx: 20 },
          { x: 6.85, y: 1, text: '11 cm', dy: 14 },
          { x: 1.929, y: 1.822, text: '75°' },
        ],
        elements: [], tolerance: 0,
      },
    },
    // The paper's histogram is drawn, and the fee boundary falls INSIDE a bar
    // (65 in the 60–80 bar), so part of one bar has to be split off. The retry
    // draws its own histogram, with 60 falling inside the 50–70 bar.
    '19': {
      skill: 'Histograms',
      question: 'The histogram represents the ages of the 400 members of a swimming club.\nThe first bar represents the members aged at least 16 and under 20\nEach member pays an annual fee based on their age.\n<table>Age | Under 60 | 60 or over\nAnnual fee | £240 | £150</table>\nUse the histogram to estimate the total annual fees paid by these members.',
      answer: '£90 150',
      working: 'The frequencies are 30, 130, 140, 70 and 30. Half of the 50–70 bar is under 60, so 335 members pay £240 and 65 pay £150: 80 400 + 9 750.',
      diagram: {
        mode: 'polygon',
        x: { min: 0, max: 90, step: 10, label: 'Age (years)' },
        y: { min: 0, max: 14, step: 1, label: 'Frequency density' },
        // Bars filled, then edged segment by segment: the axes are scaled 10 : 1,
        // so one stroke-width would print the tops ten times the sides.
        background: '<polygon points="16,0 20,0 20,7.5 16,7.5" stroke="none" fill="#cccccc" /><polygon points="20,0 30,0 30,13 20,13" stroke="none" fill="#cccccc" /><polygon points="30,0 50,0 50,7 30,7" stroke="none" fill="#cccccc" /><polygon points="50,0 70,0 70,3.5 50,3.5" stroke="none" fill="#cccccc" /><polygon points="70,0 90,0 90,1.5 70,1.5" stroke="none" fill="#cccccc" /><polyline points="16,7.5 20,7.5" stroke="#333" stroke-width="0.0714" /><polyline points="20,13 30,13" stroke="#333" stroke-width="0.0714" /><polyline points="30,7 50,7" stroke="#333" stroke-width="0.0714" /><polyline points="50,3.5 70,3.5" stroke="#333" stroke-width="0.0714" /><polyline points="70,1.5 90,1.5" stroke="#333" stroke-width="0.0714" /><polyline points="16,0 16,7.5" stroke="#333" stroke-width="0.7143" /><polyline points="20,0 20,13" stroke="#333" stroke-width="0.7143" /><polyline points="30,0 30,13" stroke="#333" stroke-width="0.7143" /><polyline points="50,0 50,7" stroke="#333" stroke-width="0.7143" /><polyline points="70,0 70,3.5" stroke="#333" stroke-width="0.7143" /><polyline points="90,0 90,1.5" stroke="#333" stroke-width="0.7143" />',
        elements: [], tolerance: 0,
      },
    },
    '20': { skill: 'Quadratic Inequalities', question: 'Ben solves the inequality x² < 25 and writes his answer as x < 5. Give one reason why Ben\'s answer is wrong.', answer: 'It leaves out the lower limit — the solution is −5 < x < 5', working: 'His answer wrongly includes values such as x = −7, whose square is 49.' },
    '21a': { skill: 'Equation of a Circle', question: 'A circle has its centre at the origin and passes through the point P(3, −4).\nWrite down the equation of the circle.', answer: 'x² + y² = 25', working: 'The radius squared is 3² + (−4)².' },
    '21b': { skill: 'Perpendicular Gradients', question: 'A circle has its centre at the origin and passes through the point P(3, −4).\nWork out the equation of the tangent to the circle at P. Give your answer in the form y = mx + c.', answer: 'y = 0.75x − 6.25', working: 'The radius OP has gradient −<frac>4/3</frac>, so the tangent has gradient <frac>3/4</frac> and passes through (3, −4).' },
    // A NEGATIVE and FRACTIONAL scale factor together, as on the paper: B is
    // half the size of A, on the far side of the centre and upside down.
    '22': {
      skill: 'Fractional and Negative Enlargements',
      question: 'Shape A and shape B are shown on the grid.\nDescribe fully the single transformation that maps shape A to shape B.',
      answer: 'An enlargement, scale factor −<frac>1/2</frac>, centre (6, 4)',
      working: 'Lines through corresponding corners — (2, 8) to (8, 2) and (2, 2) to (8, 5) — cross at (6, 4). B is half the size of A and on the opposite side of that point, so the scale factor is negative.',
      diagram: {
        mode: 'polygon',
        x: { min: 0, max: 10, step: 1, label: 'x' },
        y: { min: 0, max: 10, step: 1, label: 'y' },
        background: '<polygon points="2,2 2,8 6,2" stroke="#333" fill="none" /><polygon points="8,5 8,2 6,5" stroke="#333" fill="none" />',
        labels: [
          { x: 3.2, y: 4, text: 'A' },
          { x: 7.4, y: 4, text: 'B' },
        ],
        elements: [], tolerance: 0,
      },
    },
    // Built as the paper builds it: three sides given as vectors, the
    // diagonals crossing at P in a known ratio one way and an unknown one the
    // other. The arrows on the sides show each vector's direction.
    '23': {
      skill: 'Vector Proof + Vectors + Ratio',
      question: 'ABCD is a quadrilateral.\nAC and BD intersect at P.\nvector AB = 8b − 5a\nvector BC = 9a\nvector DC = 9b\nBP : PD = 2 : 1\nAP : PC = 1 : k\nWork out the value of k.\nYou must show your working.\nNot drawn accurately.',
      answer: 'k = 3',
      working: 'AC = AB + BC = 4a + 8b, and BD = BC + CD = 9a − 9b. AP = AB + <frac>2/3</frac>BD = −5a + 8b + 6a − 6b = a + 2b, which is <frac>1/4</frac> of AC, so AP : PC = 1 : 3.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="2.5,1 9.25,1.85 7.9,6.8 1.15,2.75" stroke="#333" fill="none" /><polyline points="2.5,1 7.9,6.8" stroke="#333" fill="none" /><polyline points="9.25,1.85 1.15,2.75" stroke="#333" fill="none" /><polyline points="5.704,1.585 6.024,1.444 5.749,1.228" stroke="#333" fill="none" /><polyline points="8.441,4.133 8.536,4.47 8.788,4.228" stroke="#333" fill="none" /><polyline points="4.304,4.852 4.654,4.852 4.489,4.543" stroke="#333" fill="none" />',
        labels: [
          { x: 2.5, y: 1, text: 'A', dx: -8, dy: 11 },
          { x: 9.25, y: 1.85, text: 'B', dx: 10 },
          { x: 7.9, y: 6.8, text: 'C', dy: -9 },
          { x: 1.15, y: 2.75, text: 'D', dx: -10 },
          { x: 3.85, y: 2.45, text: 'P', dx: 4, dy: -12 },
          { x: 5.875, y: 1.425, text: '8b − 5a', dy: 15 },
          { x: 8.575, y: 4.325, text: '9a', dx: 14 },
          { x: 4.525, y: 4.775, text: '9b', dx: -8, dy: -12 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '24': { skill: 'Proportion with Powers', question: 'A study suggests a student\'s exam mark m is directly proportional to the square root of their total revision time t.\nA student triples their total revision time.\nWork out the percentage increase in their exam mark, to 1 decimal place.', answer: '73.2%', working: 'The mark is multiplied by √3 = 1.732.' },
    '25': { skill: 'Composite Functions + Inverse Functions + Algebraic Proof', question: 'f(x) = 2x + 5 and g(x) = <frac>x − 5/2</frac>. Prove that fg(x) + gf(x) is always equal to 2x.', answer: 'Both compositions simplify to x, so the sum is 2x', working: 'f and g are inverses of each other, so each composition returns x.' },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
