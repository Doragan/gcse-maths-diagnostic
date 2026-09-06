import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P2.json by
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
export const AQA_8300_2F_JUN25: PaperConfig = {
  id: 'aqa-8300-2f-jun25',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                   skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                      skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'ratio',    skill: 'Ratio + Simple Arithmetic',                                  skillIds: ['ratio', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'shape',    skill: 'Bearings',                                                   skillIds: ['bearings'], kind: 'mastery', visual: false, desc: 'compass-word or bearing answer; needs synonym/format equivalence' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Lengths and Perimeters',                        skillIds: ['proportion', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'scale drawing on a grid; static diagram supported' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                    skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                    skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '4c',  label: '4(c)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                        skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'index-notation answer needs equivalence checker' },
    { id: '4d',  label: '4(d)',  marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                                        skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'index-notation answer needs equivalence checker' },
    { id: '5',   label: '5',     marks: 2,  topic: 'number',   skill: 'Converting Measurements + Simple Arithmetic',                skillIds: ['converting_measurements', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show-that requires both the total and the comparison to be evidenced' },
    { id: '6',   label: '6',     marks: 4,  topic: 'probdata', skill: 'Simple Charts',                                              skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing a bar to scale with width/gap conventions marked' },
    { id: '7',   label: '7',     marks: 2,  topic: 'number',   skill: 'Simplifying Fractions + Converting Measurements',            skillIds: ['simplifying_fractions', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; decimal/percent not credited' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'number',   skill: 'Time Calculations',                                          skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: '' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                    skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '8c',  label: '8(c)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                       skillIds: ['proportion', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'number',   skill: 'Time Calculations',                                          skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'clock-time answer; needs time-format equivalence (2:30pm / 14:30)' },
    { id: '9b',  label: '9(b)',  marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Converting Measurements',             skillIds: ['fractions_of_amounts', 'converting_measurements'], kind: 'exam', visual: false, desc: 'tick + supporting calculation; the choice alone earns nothing' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '11',  label: '11',    marks: 3,  topic: 'algebra',  skill: 'Expanding Brackets + Simplifying Expressions',               skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'show-equivalence requires both expressions simplified and shown' },
    { id: '12',  label: '12',    marks: 2,  topic: 'ratio',    skill: 'Proportion',                                                 skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'probdata', skill: 'Range',                                                      skillIds: ['range'], kind: 'mastery', visual: false, desc: '' },
    { id: '13b', label: '13(b)', marks: 3,  topic: 'probdata', skill: 'Mean',                                                       skillIds: ['mean'], kind: 'mastery', visual: false, desc: '' },
    { id: '14',  label: '14',    marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Simplifying Expressions', skillIds: ['forming_expressions_and_formulae', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'description-to-expression matching; needs a pairing input' },
    { id: '15',  label: '15',    marks: 1,  topic: 'shape',    skill: 'Lengths and Perimeters + Areas of Squares and Rectangles',   skillIds: ['lengths_and_perimeters', 'areas_of_squares_and_rectangles'], kind: 'mastery', visual: false, desc: 'tick credited only with supporting working' },
    { id: '16',  label: '16',    marks: 1,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '17',  label: '17',    marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                 skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'best-buy choice credited only with two comparable values shown' },
    { id: '18a', label: '18(a)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                      skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '18b', label: '18(b)', marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio',                                          skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '18c', label: '18(c)', marks: 1,  topic: 'ratio',    skill: 'Ratio + Proportion',                                         skillIds: ['ratio', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                              skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-diagram multi-cell entry' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                            skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'probdata', skill: 'Time Series',                                                skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires point-plotting and line-drawing input' },
    { id: '20b', label: '20(b)', marks: 3,  topic: 'probdata', skill: 'Time Series + Proportion',                                   skillIds: ['time_series', 'proportion'], kind: 'exam', visual: false, desc: 'answer accepted over a range because the trend estimate is open' },
    { id: '21',  label: '21',    marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages + Proportion',            skillIds: ['fractions_decimals_and_percentages', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Proportion',                             skillIds: ['simple_arithmetic', 'proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                     skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval; needs inequality-form entry' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                     skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that on a strict inequality; needs the bound and the total evidenced' },
    { id: '24',  label: '24',    marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '25a', label: '25(a)', marks: 3,  topic: 'shape',    skill: 'Circumfrence of a Circle + Sector Calculations',             skillIds: ['circumfrence_of_a_circle', 'sector_calculations'], kind: 'mastery', visual: false, desc: 'range-tolerance decimal answer; static diagram supported' },
    { id: '25b', label: '25(b)', marks: 1,  topic: 'shape',    skill: 'Sector Calculations',                                        skillIds: ['sector_calculations'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '26',  label: '26',    marks: 3,  topic: 'shape',    skill: 'Trigonometry (missing sides)',                               skillIds: ['trigonometry_missing_sides'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // 6 is `visual: true` and gets a bar chart to complete — two bars given in
  // the background, the rest for the student. 20(a) is the other visual item
  // and has none: a time-series grid needs six columns and enough rows to
  // place the readings, which at a sheet's 72mm leaves rows too shallow to
  // plot into.
  retrySet: {
    '1a': { skill: 'Solving Linear Equations', question: 'Solve k + 7 = 23', answer: 'k = 16' },
    '1b': { skill: 'Solving Linear Equations', question: 'Solve 5m = 45', answer: 'm = 9' },
    '1c': { skill: 'Solving Linear Equations', question: 'Solve 30 − t = 12', answer: 't = 18' },

    // 2(a) and (b) share one setup, as on the paper. The ratio is chosen so
    // that doubling it would break the "fewer than 100" condition, which is
    // what makes a single answer possible at all.
    '2a': { skill: 'Ratio', question: 'The only animals in a field are goats and hens. The ratio goats : hens = 29 : 43. There are fewer than 100 animals in the field. Write down the number of hens in the field.', answer: '43', working: 'One lot of the ratio is 72 animals; two lots would be 144, which is too many.' },
    '2b': { skill: 'Ratio', question: 'The only animals in a field are goats and hens. The ratio goats : hens = 29 : 43. There are fewer than 100 animals in the field. In total, how many animals are there in the field?', answer: '72', working: '29 + 43' },

    // 3(a) and (b) read off a scale drawing, so the retry supplies one. The
    // path is the whole diagram — there is nothing for the student to draw —
    // so `elements` is empty and everything lives in `background`. The points
    // are named in the TEXT because a background cannot carry labels.
    '3a': {
      skill: 'Bearings',
      question: 'A path joins A(1, 1), B(5, 1) and C(5, 4) on a centimetre grid, with north pointing up the page. Write down the direction of B from A.',
      answer: 'East',
      working: 'B is directly to the right of A on the drawing.',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 7, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polyline points="1,1 5,1 5,4" stroke="#333" /><circle cx="1" cy="1" r="0.15" fill="#333" /><circle cx="5" cy="1" r="0.15" fill="#333" /><circle cx="5" cy="4" r="0.15" fill="#333" />',
        labels: [{ x: 1, y: 1, text: 'A', dx: -9, dy: 4 }, { x: 5, y: 1, text: 'B', dx: 9, dy: 4 }, { x: 5, y: 4, text: 'C', dx: 9, dy: 4 }],
        elements: [],
        tolerance: 0,
      },
    },
    '3b': {
      skill: 'Proportion',
      question: 'A path joins A(1, 1), B(5, 1) and C(5, 4) on a centimetre grid.\nScale: 1 centimetre represents 10 metres.\nWork out the actual distance along the path from A to C.',
      answer: '70 metres',
      working: 'AB is 4 cm and BC is 3 cm, so the path is 7 cm on the drawing.',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 7, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polyline points="1,1 5,1 5,4" stroke="#333" /><circle cx="1" cy="1" r="0.15" fill="#333" /><circle cx="5" cy="1" r="0.15" fill="#333" /><circle cx="5" cy="4" r="0.15" fill="#333" />',
        labels: [{ x: 1, y: 1, text: 'A', dx: -9, dy: 4 }, { x: 5, y: 1, text: 'B', dx: 9, dy: 4 }, { x: 5, y: 4, text: 'C', dx: 9, dy: 4 }],
        elements: [],
        tolerance: 0,
      },
    },

    '4a': { skill: 'Simplifying Expressions', question: 'Simplify m × n', answer: 'mn' },
    '4b': { skill: 'Simplifying Expressions', question: 'Simplify fully t + t + t + t', answer: '4t' },
    '4c': { skill: 'Simplifying Indices', question: 'Simplify fully k × k × k × k', answer: 'k⁴' },
    '4d': { skill: 'Simplifying Indices', question: 'Simplify fully h ÷ h', answer: '1' },

    '5': { skill: 'Converting Measurements', question: 'Sam cycles 600 metres to the shop, then 450 metres to the library, then 520 metres home. Show that Sam cycles more than 1.5 kilometres.', answer: '1570 metres, which is 1.57 km', working: '600 + 450 + 520 = 1570 m, and 1.5 km is 1500 m.' },

    '6': {
      skill: 'Simple Charts',
      // Mimics the original directly: the chart is short by ONE bar and the
      // total fixes it. An earlier version left two bars unknown and gave a
      // relationship between them, which is a harder question than the one on
      // the paper — the demand should match, not exceed.
      question: '60 people each choose one of apple, berry, cherry or damson.\nThe bar chart shows the numbers who chose apple, berry and cherry.\nComplete the bar chart.',
      answer: 'Damson 6',
      working: '60 − 18 − 24 − 12 = 6.',
      diagram: {
        mode: 'bars',
        x: { min: 0, max: 4, step: 1, label: 'Flavour', categories: ['Apple', 'Berry', 'Cherry', 'Damson'] },
        y: { min: 0, max: 30, step: 6, label: 'People' },
        background: '<rect x="0" y="0" width="1" height="18" stroke="#333" /><rect x="1" y="0" width="1" height="24" stroke="#333" /><rect x="2" y="0" width="1" height="12" stroke="#333" />',
        elements: [{ x: 3, y: 6, marks: 1 }],
        tolerance: 0,
      },
    },

    '7': { skill: 'Simplifying Fractions', question: 'Work out 45p as a fraction of £1.50. Give your answer in its simplest form.', answer: '3/10', working: '45/150, cancelling by 15.' },
    '8a': { skill: 'Time Calculations', question: 'Convert 2 and three quarter hours to minutes.', answer: '165 minutes', working: '2 × 60 + 45' },
    '8b': { skill: 'Converting Measurements', question: 'Convert 2600 grams to kilograms.', answer: '2.6 kilograms' },
    '8c': { skill: 'Proportion', question: 'Convert 56 kilometres to miles. Use 8 kilometres = 5 miles.', answer: '35 miles', working: '56 ÷ 8 = 7, then × 5.' },
    '9a': { skill: 'Time Calculations', question: 'Nadia started work at 09:45 and worked for 5 hours 30 minutes. What time did she finish?', answer: '15:15 (3:15 pm)' },
    '9b': { skill: 'Fractions of Amounts', question: 'Ravi worked for a total of 6 hours one day, and spent 100 minutes of that time online. Ravi says he spent more than one quarter of his total working time online. Is he correct? Show working to support your answer.', answer: 'Yes', working: 'A quarter of 6 hours is 90 minutes, and 100 is more than 90.' },
    // 10(a) and (b) show the two similar shapes, with their measurements on
    // the figure rather than only in the sentence — which is what `labels`
    // exists for, and what the exam does.
    '10a': {
      skill: 'Congruence and Similarity',
      question: 'The two shapes shown are similar. Write down the size of angle y in the larger shape.\nNot drawn accurately.',
      answer: '68°',
      working: 'Similar shapes have equal matching angles; only the lengths change.',
      // The drawn shapes MUST share the labelled ratio, or the figure argues
      // against its own question — an earlier version drew 4 × 3 beside 6 × 6
      // and called them similar. 2 : 3 here, matching 4 : 6 and 10 : 15, with
      // the exam's own "not drawn accurately" covering the rest.
      diagram: {
        mode: 'polygon', showAxes: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,1 3,1 3,4 1,4" stroke="#333" /><polygon points="5,1 9,1 9,7 5,7" stroke="#333" />',
        labels: [
          { x: 1, y: 1, text: '68°', dx: 16, dy: -8 },
          { x: 5, y: 1, text: 'y', dx: 14, dy: -8 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '10b': {
      skill: 'Congruence and Similarity',
      question: 'The two rectangles shown are similar. Work out the length x.\nNot drawn accurately.',
      answer: '15 cm',
      working: 'The scale factor is 10 ÷ 4 = 2.5, and 6 × 2.5 = 15.',
      diagram: {
        mode: 'polygon', showAxes: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,1 3,1 3,4 1,4" stroke="#333" /><polygon points="5,1 9,1 9,7 5,7" stroke="#333" />',
        labels: [
          { x: 2, y: 1, text: '4 cm', dy: 12 },
          { x: 1, y: 2.5, text: '6 cm', dx: -15 },
          { x: 7, y: 1, text: '10 cm', dy: 12 },
          { x: 9, y: 4, text: 'x', dx: 11 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '11': { skill: 'Expanding Brackets', question: 'A is 4(x + 5) + 3x − 8\nB is 9(x − 1) − 2x + 21\nShow that A and B are equivalent.', answer: 'Both simplify to 7x + 12', working: 'A: 4x + 20 + 3x − 8. B: 9x − 9 − 2x + 21.' },
    '12': { skill: 'Proportion', question: '5 oranges cost £1.80. Work out the cost of 8 of these oranges.', answer: '£2.88', working: 'One orange is 36p.' },
    '13a': { skill: 'Range', question: 'Here are four numbers: 125, 154, 189, 172. Work out the range.', answer: '64', working: '189 − 125' },
    '13b': { skill: 'Mean', question: 'A fifth number is added to 125, 154, 189 and 172. The mean of all five numbers is 158. Work out the fifth number.', answer: '150', working: 'The five must total 790, and the first four total 640.' },
    '14': { skill: 'Forming Expressions and Formulae', question: 'A number is n. Write an expression for each of these.\n(i)   5 more than the number\n(ii)  the number multiplied by 4\n(iii) 3 less than double the number\n(iv)  the number divided by 2', answer: '(i) n + 5, (ii) 4n, (iii) 2n − 3, (iv) n/2' },
    '15': { skill: 'Lengths and Perimeters', question: 'A rectangle has an area of 84 cm² and a side length of 12 cm. Dara says, "The perimeter of the rectangle is 40 cm because 84 ÷ 12 = 7." Is Dara correct? Show working to support your answer.', answer: 'No — the perimeter is 38 cm', working: 'The other side is 7 cm, so the perimeter is 2 × (12 + 7) = 38.' },
    '16': { skill: 'Rearranging Formulae (Changing the Subject)', question: 'Rearrange c − 5 = d to make c the subject.', answer: 'c = d + 5' },
    '17': { skill: 'Proportion', question: 'Packet A holds 500 g of rice and costs £1.20.\nPacket B holds 800 g and costs £2.00.\nWhich packet is better value for money? You must show your working.\n[   ] Packet A\n[   ] Packet B', answer: 'Packet A', working: 'A is 0.24p per gram and B is 0.25p per gram.' },
    '18a': { skill: 'Ratio', question: 'Sam uses either a bike or a bus to get to work. The number of days using a bike divided by the number of days using a bus is 2/7. Write down the ratio number of days using a bike : number of days using a bus.', answer: '2 : 7' },
    '18b': { skill: 'Simplifying Ratio', question: 'Write the ratio 9b : 4b in the form n : 1, where n is a decimal.', answer: '2.25 : 1', working: 'The b cancels, and 9 ÷ 4 = 2.25.' },
    '18c': { skill: 'Ratio', question: '1 : x = x : 9. Work out the value of x.', answer: 'x = 3', working: 'Cross-multiplying gives x² = 9.' },
    '19a': { skill: 'Tree Diagrams', question: 'Two spinners each have only red and green sections. For spinner 1, P(red) = 2/5. For spinner 2, P(red) = 3/7. Write down the probability that spinner 1 lands on green, and the probability that spinner 2 lands on green.', answer: '3/5 and 4/7', working: 'Each pair of probabilities must add to 1.' },
    '19b': { skill: 'Tree Diagrams', question: 'Two spinners each have only red and green sections. For spinner 1, P(red) = 2/5, and for spinner 2, P(red) = 3/7. Both spinners are spun. Work out the probability that both spinners land on red.', answer: '6/35', working: '2/5 × 3/7' },
    // 20(a) is `visual: true` and now has a grid to plot on. Every reading is
    // a multiple of 20 000 so it lands on a ruled line, and six days against
    // six rows keeps the grid square enough to print at 72mm.
    //
    // 20(b) shares 20(a)'s figures. They are separate items and each still
    // stands alone, but two versions of one advert's viewing figures on one
    // sheet would read as a mistake.
    '20a': {
      skill: 'Time Series',
      question: 'The table shows the number of views of an advert during its first 6 days.\nDay:    1     2     3     4     5     6\nViews:  40    120   100   80    60    40   (thousands)\nOn the grid, draw a time series graph to represent the data.',
      answer: 'Points at (1, 40), (2, 120), (3, 100), (4, 80), (5, 60) and (6, 40), joined by straight lines',
      working: 'Plot each day against its number of views, then join them in order.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 6, step: 1, label: 'Day' },
        y: { min: 0, max: 120, step: 20, label: 'Views (thousands)' },
        background: '',
        elements: [
          { x: 1, y: 40, marks: 1 }, { x: 2, y: 120, marks: 1 }, { x: 3, y: 100, marks: 1 },
          { x: 4, y: 80, marks: 1 }, { x: 5, y: 60, marks: 1 }, { x: 6, y: 40, marks: 1 },
        ],
        tolerance: 0,
      },
    },
    '20b': { skill: 'Time Series', question: 'The number of views of an advert falls steadily after day 2: day 4 had 80 000 views, day 5 had 60 000 and day 6 had 40 000. The owner receives 0.02p for each view. Estimate how much is received from views on day 7.', answer: '£4.00', working: 'The views fall by about 20 000 a day, so day 7 is about 20 000, and 20 000 × 0.02p = 400p.' },
    '21': { skill: 'Fractions Decimals and Percentages', question: '60% of the counters in a bag are green and the rest are yellow. 25% of the green counters are removed, and 40% of the yellow counters are removed. In total, what percentage of the counters are removed from the bag?', answer: '31%', working: '0.6 × 25% = 15% and 0.4 × 40% = 16%.' },
    '22': { skill: 'Simple Arithmetic', question: 'A group of adults and children go to a theme park. An adult ticket is £18.00 and a child ticket is £11.50, and one adult goes free with every 4 children. In the group there are 32 children, and the total price for the group is £494. How many adults are in the group?', answer: '15 adults', working: 'The children cost £368, leaving £126, which is 7 paying adults; 32 children also bring 8 free adults.' },
    '23a': { skill: 'Upper and Lower Bounds', question: 'The length of a shelf is 240 cm to the nearest 20 cm. Complete the error interval for the length.', answer: '230 ≤ length < 250', working: 'Half of 20 either side; the upper bound is strict.' },
    '23b': { skill: 'Upper and Lower Bounds', question: 'A different shelf measures 3 metres to the nearest 20 cm. Show that the total length of four of these shelves must be less than 12.5 metres.', answer: 'The largest possible total is 12.4 m', working: 'One shelf is under 3.1 m, so four are under 12.4 m.' },
    '24': { skill: 'Factorising', question: 'Circle the expression which is a factor of 5x + 30.\n5x     x + 35     x + 6     x + 30', answer: 'x + 6', working: '5x + 30 = 5(x + 6).' },
    '25a': { skill: 'Sector Calculations', question: 'A circle has a circumference of 30 cm. A sector of the circle has an angle of 90° at the centre. Work out the area of the sector. Give your answer as a decimal to 1 decimal place.', answer: '17.9 cm²', working: 'The radius is 30 ÷ (2 pi) = 4.775 cm, so the whole circle is 71.62 cm² and a quarter of it is 17.9 cm².' },
    '25b': { skill: 'Sector Calculations', question: 'A circle has a circumference of 30 cm, and a sector with an angle of 90° at the centre has an area of 17.9 cm². In fact, the angle at the centre is smaller than 90°. What does this mean about the area of the sector?\nTick one box.\n[   ] smaller than 17.9 cm²\n[   ] the same as 17.9 cm²\n[   ] larger than 17.9 cm²\n[   ] it could be any of these', answer: 'Smaller than 17.9 cm²', working: 'A smaller angle takes a smaller share of the circle.' },
    '26': {
      skill: 'Trigonometry (missing sides)',
      question: 'Use trigonometry to work out the value of x, to 1 decimal place. You must show your working.\nNot drawn accurately.',
      answer: '9.2 cm',
      working: '15 × sin 38° = 9.23…',
      // Legs of 8 and 6 put the marked angle at 36.9°, near enough to 38° that
      // the picture does not fight the label. Exact would need a non-lattice
      // vertex, which is what "not drawn accurately" exists for on the paper.
      diagram: {
        mode: 'polygon', showAxes: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polygon points="1,1 9,1 9,7" stroke="#333" /><polyline points="8,1 8,2 9,2" stroke="#333" />',
        labels: [
          { x: 5, y: 4, text: '15 cm', dx: -12, dy: -4 },
          { x: 9, y: 4, text: 'x', dx: 11 },
          { x: 1, y: 1, text: '38°', dx: 20, dy: -7 },
        ],
        elements: [], tolerance: 0,
      },
    },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
