import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3H — Higher Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-H-P3.json by
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
 *
 * KNOWN GAPS in this paper, carried here so they survive regeneration:
 *   • item 2 is untagged by design — filed under Probability and Data, contributing 1 mark(s) with no skill evidence. Check coding_notes says why.
 */
export const AQA_8300_3H_JUN25: PaperConfig = {
  id: 'aqa-8300-3h-jun25',
  title: 'AQA GCSE Mathematics 8300/3H',
  subtitle: 'Higher Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'probdata', skill: 'Untagged',                                                                             skillIds: [], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 3,  topic: 'shape',    skill: 'Parts of a Circle',                                                                    skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'label-to-diagram matching; needs a pairing input' },
    { id: '4',   label: '4',     marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters', skillIds: ['forming_expressions_and_formulae', 'solving_linear_equations', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '5',   label: '5',     marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                           skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '6a',  label: '6(a)',  marks: 4,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'length measured off a grid, so the answer is accepted over a range' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'shape',    skill: 'Bearings',                                                                             skillIds: ['bearings'], kind: 'mastery', visual: false, desc: '' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'number',   skill: 'Simplifying Fractions + Converting Measurements',                                      skillIds: ['simplifying_fractions', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker; mixed numbers not credited' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'ratio',    skill: 'Simplifying Ratio + Converting Measurements',                                          skillIds: ['simplifying_ratio', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '7c',  label: '7(c)',  marks: 2,  topic: 'ratio',    skill: 'Ratio + Dividing Fractions',                                                           skillIds: ['ratio', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '8',   label: '8',     marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term',                                                                 skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '9',   label: '9',     marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '10',  label: '10',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                       skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'open-ended answer: any line with the same gradient; needs form-equivalence plus a not-identical check' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '12',  label: '12',    marks: 4,  topic: 'probdata', skill: 'Grouped Frequency Tables + Mean + Percentage Change',                                  skillIds: ['grouped_frequency_tables', 'mean', 'percentage_change'], kind: 'exam', visual: false, desc: '' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'probdata', skill: 'Cumulative Frequency',                                                                 skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'multi-blank table, credited as a single all-or-nothing mark' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                                 skillIds: ['cumulative_frequency'], kind: 'mastery', visual: true, desc: 'requires point-plotting and curve drawing at upper class bounds' },
    { id: '13c', label: '13(c)', marks: 2,  topic: 'probdata', skill: 'Cumulative Frequency',                                                                 skillIds: ['cumulative_frequency'], kind: 'mastery', visual: false, desc: 'read-off from the student\'s own graph; accepted over a range' },
    { id: '14a', label: '14(a)', marks: 4,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                               skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'tick credited only with three bounds and their total evidenced' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs + Compound Units',                                                    skillIds: ['kinematic_graphs', 'compound_units'], kind: 'exam', visual: true, desc: 'requires drawing and labelling both axes as well as the line' },
    { id: '15',  label: '15',    marks: 3,  topic: 'probdata', skill: 'Counting Without Listing',                                                             skillIds: ['counting_without_listing'], kind: 'mastery', visual: false, desc: '' },
    { id: '16',  label: '16',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Algebraic Proof',                                                       skillIds: ['substitution', 'algebraic_proof'], kind: 'mastery', visual: false, desc: 'explain-why answer: three cases each credited separately' },
    { id: '17',  label: '17',    marks: 2,  topic: 'shape',    skill: 'Sine Rule',                                                                            skillIds: ['sine_rule'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '18',  label: '18',    marks: 3,  topic: 'algebra',  skill: 'Nth Term of Quadratic Sequences',                                                      skillIds: ['nth_term_quadratic_sequences'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '19',  label: '19',    marks: 4,  topic: 'algebra',  skill: 'Inequalities + Plotting Straight Line Graphs',                                         skillIds: ['inequalities', 'plotting_straight_line_graphs'], kind: 'exam', visual: true, desc: 'requires drawing three boundary lines and identifying a region' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'algebra',  skill: 'Factorising Quadratics',                                                               skillIds: ['factorising_quadratics'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '20b', label: '20(b)', marks: 1,  topic: 'algebra',  skill: 'Factorising Quadratics + Factors and Multiples',                                       skillIds: ['factorising_quadratics', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'tick + worded reason drawing on the factorisation; not markable' },
    { id: '21',  label: '21',    marks: 4,  topic: 'shape',    skill: 'Volume of a Sphere + Volume of a prism',                                               skillIds: ['volume_of_a_sphere', 'volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'fraction answer from an algebraic derivation; needs equivalence checker' },
    { id: '22',  label: '22',    marks: 4,  topic: 'algebra',  skill: 'Quadratic Inequalities + Solving Quadratic Equations (Factorising)',                   skillIds: ['quadratic_inequalities', 'solving_quadratic_equations_factorising'], kind: 'exam', visual: false, desc: 'double-inequality answer needs an inequality-equivalence checker' },
    { id: '23',  label: '23',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                                  skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors + Area of a Triangle (½ab sinC)',                        skillIds: ['area_and_volume_scale_factors', 'area_of_triangle_sine'], kind: 'exam', visual: false, desc: 'range-tolerance answer; static diagram supported' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // CROSSOVER WITH 3F, carrying the SAME retries: 4, 5, 6(a), 6(b), 8, 9, 10,
  // 11(a) and 11(b) here are 3F's 16, 18, 19(a), 19(b), 20, 21, 22, 24(a) and
  // 24(b).
  //
  // 13(b), 14(b) and 19 are the visual items and have no retry — a cumulative
  // frequency curve, a speed/time graph drawn on blank axes, and a
  // three-inequality region all need a grid taller than a sheet can give at
  // 72mm wide.
  retrySet: {
    '1': { skill: 'Proportion + Converting Measurements', question: 'Convert 13.2 pounds into kilograms. Use 2.2 pounds = 1 kilogram.', answer: '6 kg', working: '13.2 ÷ 2.2' },
    '2': { skill: 'Outliers', question: 'Here are the times, in minutes, taken by six people to finish a puzzle: 4, 6, 5.5, 7, 42, 5. Write down the outlier.', answer: '42 minutes', working: 'Every other time is between 4 and 7.' },
    '3': { skill: 'Parts of a Circle', question: 'Write down the name of each of these parts of a circle.\n(i)   a straight line from the centre to the edge\n(ii)  a straight line right across the circle through the centre\n(iii) a straight line joining two points on the edge but not passing through the centre', answer: '(i) radius, (ii) diameter, (iii) chord' },

    // Shared with 3F — see the note above.
    '4': { skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters', question: 'An equilateral triangle has sides of length (3x + 4) cm, (5x − 2) cm and (2x + 7) cm. Work out the perimeter of the triangle.', answer: '39 cm', working: '3x + 4 = 5x − 2 gives x = 3, so each side is 13 cm.' },
    '5': {
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
    '6a': {
      skill: 'Proportion',
      question: 'The scale diagram shows towns A, B and C on a centimetre grid.\nScale 1 : 400 000\nWork out the actual distance from B to C.\nGive your answer in kilometres.',
      answer: '26 km (accept 25.6 km to 26.4 km)',
      working: 'B to C measures 6.5 cm. 6.5 × 400 000 = 2 600 000 cm, and 100 000 cm = 1 km, so the distance is 26 km.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.6, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polyline points="0,0 0,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,0 10,0" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="1,0 1,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,1 10,1" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="2,0 2,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,2 10,2" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="3,0 3,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,3 10,3" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="4,0 4,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,4 10,4" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="5,0 5,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,5 10,5" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="6,0 6,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,6 10,6" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="7,0 7,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,7 10,7" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="8,0 8,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,8 10,8" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="9,0 9,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,9 10,9" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="10,0 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,10 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polygon points="0,0 10,0 10,10 0,10" stroke="#333" fill="none" /><polyline points="5.83,5.83 6.17,6.17" stroke="#333" fill="none" /><polyline points="5.83,6.17 6.17,5.83" stroke="#333" fill="none" /><polyline points="9.33,2.83 9.67,3.17" stroke="#333" fill="none" /><polyline points="9.33,3.17 9.67,2.83" stroke="#333" fill="none" /><polyline points="2.83,2.83 3.17,3.17" stroke="#333" fill="none" /><polyline points="2.83,3.17 3.17,2.83" stroke="#333" fill="none" /><polyline points="11,7.8 11,9.6" stroke="#333" fill="none" /><polyline points="10.82,9.3 11,9.6" stroke="#333" fill="none" /><polyline points="11.18,9.3 11,9.6" stroke="#333" fill="none" />',
        labels: [
          { x: 6, y: 6, text: 'A', dx: -12, dy: -10 },
          { x: 9.5, y: 3, text: 'B', dx: -12, dy: -10 },
          { x: 3, y: 3, text: 'C', dx: -12, dy: -10 },
          { x: 11, y: 9.6, text: 'N', dy: -8 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '6b': {
      skill: 'Bearings',
      question: 'The scale diagram shows towns A, B and C on a centimetre grid.\nScale 1 : 400 000\nC is South West of A.\nWrite down the bearing of C from A.',
      answer: '225°',
      working: 'Clockwise from north: south is 180° and south west is another 45°.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.6, step: 1, label: '' },
        y: { min: 0, max: 10, step: 1, label: '' },
        background: '<polyline points="0,0 0,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,0 10,0" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="1,0 1,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,1 10,1" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="2,0 2,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,2 10,2" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="3,0 3,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,3 10,3" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="4,0 4,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,4 10,4" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="5,0 5,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,5 10,5" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="6,0 6,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,6 10,6" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="7,0 7,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,7 10,7" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="8,0 8,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,8 10,8" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="9,0 9,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,9 10,9" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="10,0 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polyline points="0,10 10,10" stroke="#999" stroke-width="0.03" fill="none" /><polygon points="0,0 10,0 10,10 0,10" stroke="#333" fill="none" /><polyline points="5.83,5.83 6.17,6.17" stroke="#333" fill="none" /><polyline points="5.83,6.17 6.17,5.83" stroke="#333" fill="none" /><polyline points="9.33,2.83 9.67,3.17" stroke="#333" fill="none" /><polyline points="9.33,3.17 9.67,2.83" stroke="#333" fill="none" /><polyline points="2.83,2.83 3.17,3.17" stroke="#333" fill="none" /><polyline points="2.83,3.17 3.17,2.83" stroke="#333" fill="none" /><polyline points="11,7.8 11,9.6" stroke="#333" fill="none" /><polyline points="10.82,9.3 11,9.6" stroke="#333" fill="none" /><polyline points="11.18,9.3 11,9.6" stroke="#333" fill="none" />',
        labels: [
          { x: 6, y: 6, text: 'A', dx: -12, dy: -10 },
          { x: 9.5, y: 3, text: 'B', dx: -12, dy: -10 },
          { x: 3, y: 3, text: 'C', dx: -12, dy: -10 },
          { x: 11, y: 9.6, text: 'N', dy: -8 },
        ],
        elements: [], tolerance: 0,
      },
    },

    '7a': { skill: 'Simplifying Fractions', question: 'Write 3 weeks as a fraction of 9 days. Give your answer in its simplest form.', answer: '<frac>7/3</frac>', working: '3 weeks is 21 days, and <frac>21/9</frac> cancels by 3.' },
    '7b': { skill: 'Simplifying Ratio', question: 'Write 45 centimetres : 2.25 metres as a ratio in the form 1 : n', answer: '1 : 5', working: '2.25 m is 225 cm, and 225 ÷ 45 = 5.' },
    '7c': { skill: 'Dividing Fractions', question: 'A : B = <frac>3/8</frac> : <frac>9/16</frac>. Write A as a fraction of B.', answer: '<frac>2/3</frac>', working: '<frac>3/8</frac> ÷ <frac>9/16</frac> = <frac>3/8</frac> × <frac>16/9</frac>.' },

    '8': { skill: 'Finding the nth Term', question: 'A linear sequence has 3rd term = 11 and 7th term = 27. Work out the nth term of the sequence.', answer: '4n − 1', working: '16 gained over 4 terms is 4 each time, and the 1st term is 3.' },
    '9': { skill: 'Ratio + Fractions of Amounts', question: 'Dan has £180.\nDan\'s amount is <frac>3/4</frac> of Eve\'s amount, and Finn\'s amount : Eve\'s amount = 2 : 5.\nWork out how much money Finn has.', answer: '£96', working: 'Eve has £240, and Finn has two fifths of that.' },
    '10': {
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
    '11a': { skill: 'Understanding Straight Line Graphs', question: 'Write down the equation of a straight line parallel to y − 3x = 5', answer: 'Any line of the form y = 3x + c with c not equal to 5 — for example y = 3x + 1', working: 'Parallel lines share a gradient, here 3.' },
    '11b': { skill: 'Understanding Straight Line Graphs', question: 'A straight line has gradient 4 and passes through the point (2, 5). Circle the equation of the line.\ny = 2x + 1     y = 4x     y = 4x − 3     y = 4x + 5', answer: 'y = 4x − 3', working: '4 × 2 − 3 = 5, so the point fits.' },

    '12': { skill: 'Grouped Frequency Tables + Mean + Percentage Change', question: 'The table shows the time t minutes taken to cycle to work on 60 days.\n<table>Time (t minutes) | 10 ≤ t < 20 | 20 ≤ t < 30 | 30 ≤ t < 50 | 50 ≤ t < 70\nFrequency | 18 | 24 | 12 | 6</table>\nLast year the mean time was 20 minutes.\nEstimate the percentage increase in the mean cycling time for these 60 days.', answer: '42.5%', working: 'Midpoints give a total of 1710 minutes, so the mean is 28.5, an increase of 8.5 on 20.' },
    '13a': { skill: 'Cumulative Frequency', question: 'The table shows the salaries of 80 employees.\n<table>Salary (£s) | 0 < s ≤ 10 000 | 10 000 < s ≤ 20 000 | 20 000 < s ≤ 30 000 | 30 000 < s ≤ 40 000\nFrequency | 30 | 25 | 15 | 10</table>\nComplete the cumulative frequency table.\n<table>Salary (£s) | s ≤ 10 000 | s ≤ 20 000 | s ≤ 30 000 | s ≤ 40 000\nCumulative frequency |  |  |  | </table>', answer: '30, 55, 70, 80', working: 'Each entry adds the next frequency to the one before.' },
    '13b': {
      skill: 'Cumulative Frequency',
      question: 'The cumulative frequency table shows the salaries of 80 employees.\n<table>Salary (£s) | s ≤ 10 000 | s ≤ 20 000 | s ≤ 30 000 | s ≤ 40 000\nCumulative frequency | 30 | 55 | 70 | 80</table>\nDraw a cumulative frequency diagram to represent the data.',
      answer: 'Points at (10, 30), (20, 55), (30, 70) and (40, 80), joined by a smooth curve',
      working: 'Each point goes at the TOP of its class, not the middle.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 40, step: 10, label: 'Salary (£1000s)' },
        y: { min: 0, max: 80, step: 20, label: 'Cumulative frequency' },
        background: '',
        elements: [
          { x: 10, y: 30, marks: 1 }, { x: 20, y: 55, marks: 1 },
          { x: 30, y: 70, marks: 1 }, { x: 40, y: 80, marks: 1 },
        ],
        tolerance: 0,
      },
    },
    '13c': { skill: 'Cumulative Frequency', question: 'The cumulative frequency table shows the salaries of 80 employees.\n<table>Salary (£s) | s ≤ 10 000 | s ≤ 20 000 | s ≤ 30 000 | s ≤ 40 000\nCumulative frequency | 30 | 55 | 70 | 80</table>\nEstimate the number of employees with a salary less than £25 000.', answer: 'About 63', working: 'Halfway between 55 at £20 000 and 70 at £30 000.' },
    '14a': { skill: 'Upper and Lower Bounds', question: 'For a small boat, the mass of the empty boat is 600 kg to the nearest 50 kg, the mass of the equipment is 84 kg to the nearest 2 kg, and the mass of the crew is 145 kg to the nearest kg.\nThe total mass is these three added together, and the maximum safe total is 860 kg.\nCan this boat definitely be loaded safely? Show working to support your answer.', answer: 'Yes', working: 'The largest possible total is 625 + 85 + 145.5 = 855.5 kg, which is under 860.' },
    '14b': {
      skill: 'Kinematic Graphs',
      question: 'A train travels 240 miles in 3 hours at a constant speed.\nOn the grid, draw a speed/time graph to represent this information.\nYou must draw and label both axes.',
      answer: 'Time on the horizontal axis and speed on the vertical, with a horizontal line at 80 mph from 0 to 3 hours',
      working: 'Speed = 240 ÷ 3 = 80 mph, and it does not change.',
      diagram: {
        mode: 'polyline', showAxes: false,
        x: { min: 0, max: 6, step: 1, label: '' },
        y: { min: 0, max: 6, step: 1, label: '' },
        background: '',
        elements: [],
        tolerance: 0,
      },
    },
    '15': { skill: 'Counting Without Listing', question: 'Cara and Dev each make three-digit integers from single digits, and digits may be repeated.\nCara makes even integers with a first digit greater than 6.\nDev makes odd integers with a first digit that is not zero.\nThey each make as many different integers as possible.\nHow many more integers than Cara does Dev make?', answer: '300', working: 'Cara has 3 × 10 × 5 = 150 and Dev has 9 × 10 × 5 = 450.' },
    '16': { skill: 'Substitution + Algebraic Proof', question: 'x is a positive odd number, and y = (x − 2)(x − 4)(x + 5). Without expanding the brackets, explain why there is only one value of x for which y is negative.', answer: 'Only x = 3', working: 'The third bracket is always positive, and only x = 3 makes exactly one of the first two negative; from x = 5 upwards all three are positive.' },
    '17': {
      skill: 'Sine Rule',
      question: 'The diagram shows triangle PQR.\nUse the sine rule to work out the value of x, to 1 decimal place.\nNot drawn accurately.',
      answer: '12.0 cm',
      working: '9 × sin 63° ÷ sin 42° = 11.98…',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 6.5, step: 1, label: '' },
        background: '<polygon points="1,1 8.795,1 6.344,5.811" stroke="#333" fill="none" /><path d="M 2,1 A 1,1 0 0,1 1.743,1.669" stroke="#333" fill="none" /><path d="M 8.432,1.713 A 0.8,0.8 0 0,1 7.995,1" stroke="#333" fill="none" />',
        labels: [
          { x: 1, y: 1, text: 'P', dx: -9, dy: 11 },
          { x: 8.795, y: 1, text: 'Q', dx: 9, dy: 11 },
          { x: 6.344, y: 5.811, text: 'R', dy: -8 },
          { x: 2.494, y: 1.573, text: '42°' },
          { x: 7.601, y: 1.732, text: '63°' },
          { x: 7.569, y: 3.405, text: '9 cm', dx: 18 },
          { x: 3.672, y: 3.405, text: 'x', dx: -8, dy: -6 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '18': { skill: 'Nth Term of Quadratic Sequences', question: 'Here are the first four terms of a quadratic sequence: 5, 14, 29, 50. Work out an expression for the nth term.', answer: '3n² + 2', working: 'The second difference is 6, so the sequence starts from 3n²; what is left is 2 each time.' },
    '19': {
      skill: 'Inequalities + Plotting Straight Line Graphs',
      question: 'On the grid, identify the region represented by y ≥ 1, x + y ≤ 6 and y ≤ x.\nLabel the region R.',
      answer: 'The triangle with vertices (1, 1), (5, 1) and (3, 3)',
      working: 'Draw y = 1, x + y = 6 and y = x, then take the side of each that the inequality allows.',
      diagram: {
        mode: 'polygon',
        x: { min: 0, max: 7, step: 1, label: 'x' },
        y: { min: 0, max: 7, step: 1, label: 'y' },
        background: '',
        elements: [{ x: 1, y: 1, marks: 1 }, { x: 5, y: 1, marks: 1 }, { x: 3, y: 3, marks: 1 }],
        tolerance: 0,
      },
    },
    '20a': { skill: 'Factorising Quadratics', question: 'Factorise fully 2n² + 7n + 3', answer: '(2n + 1)(n + 3)' },
    '20b': { skill: 'Factorising Quadratics', question: 'A sequence has nth term 2n² + 7n + 3.\nAre any of the terms in the sequence a prime number?\nGive a reason for your answer.', answer: 'No', working: 'It factorises to (2n + 1)(n + 3), and for every positive n both factors are greater than 1.' },
    '21': { skill: 'Volume of a Sphere + Volume of a prism', question: 'Four identical spheres just fit inside a cylinder, and each sphere has radius r.\nWhat fraction of the space inside the cylinder is NOT filled by the spheres?\nYou must show your working.\nThe volume of a sphere is <frac>4/3</frac>πr³.', answer: '<frac>1/3</frac>', working: 'The cylinder is 8r tall, so its volume is 8πr³, and the spheres take <frac>16/3</frac>πr³ — two thirds of it.' },
    '22': { skill: 'Quadratic Inequalities + Solving Quadratic Equations (Factorising)', question: 'Solve 3x² > 10 − x', answer: 'x < −2 or x > <frac>5/3</frac>', working: '3x² + x − 10 > 0 factorises to (3x − 5)(x + 2) > 0.' },
    '23': { skill: 'Quadratic Functions', question: 'The height h metres of a ball is given by h = −(t − 5)² + 25, where t is the time in seconds, for values of t from 0 to 10.\nA student draws a graph of h against t as a straight line rising from (0, 0) to (10, 25).\nMake two criticisms of the student\'s graph.', answer: 'It should be a curve rather than a straight line, and it should come back down to h = 0 at t = 10', working: 'The expression is quadratic with a maximum of 25 at t = 5.' },
    '24': {
      skill: 'Area and Volume Scale Factors + Area of a Triangle (½ab sinC)',
      question: 'Triangles ABC and DEF are similar.\nThe area of triangle ABC is 26.4 cm².\nWork out the area of triangle DEF.\nNot drawn accurately.',
      answer: '165 cm²',
      working: 'The length scale factor is 2.5, so the area scale factor is 2.5² = 6.25.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 7, step: 1, label: '' },
        background: '<polygon points="1,1 3.4,1 1.6,3" stroke="#333" fill="none" /><polygon points="5,1 11,1 6.5,6" stroke="#333" fill="none" />',
        labels: [
          { x: 1, y: 1, text: 'A', dx: -8, dy: 10 },
          { x: 3.4, y: 1, text: 'B', dx: 8, dy: 10 },
          { x: 1.6, y: 3, text: 'C', dy: -8 },
          { x: 5, y: 1, text: 'D', dx: -8, dy: 10 },
          { x: 11, y: 1, text: 'E', dx: 8, dy: 10 },
          { x: 6.5, y: 6, text: 'F', dy: -8 },
          { x: 2.2, y: 1, text: '6 cm', dy: 14 },
          { x: 8, y: 1, text: '15 cm', dy: 14 },
        ],
        elements: [], tolerance: 0,
      },
    },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
