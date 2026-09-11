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
    // A negative in the data, as on the paper, and a context where one belongs.
    // A negative in the data, as on the paper, and a context where one belongs.
    '2': { skill: 'Outliers', question: 'Here are the temperatures of six freezers in a shop.\n−18 °C     −20 °C     −17.5 °C     4 °C     −19 °C     −21 °C\nWrite down the outlier.', answer: '4 °C', working: 'Every other freezer is between −21 °C and −17.5 °C.' },
    // The paper's question is a DIAGRAM to label: lettered parts of a circle
    // matched to a word bank. The retry draws its own circle with different
    // parts lettered (a diameter given, then a segment, a chord and a tangent).
    '3': {
      skill: 'Parts of a Circle',
      question: 'Here is a circle, centre O.\nMatch each letter to the correct word.\nOne has been done for you: A is a diameter.\nArc     Chord     Diameter     Radius     Sector     Segment     Tangent',
      answer: 'B is a segment, C is a chord, D is a tangent',
      working: 'A segment is the region between a chord and an arc; a chord joins two points on the circle; a tangent touches it at one point.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 9, step: 1, label: '' },
        background: '<path d="M 3.072,6.798 L 6.928,6.798 A 3,3 0 0,1 3.072,6.798 Z" stroke="#333" fill="#cccccc" /><circle cx="5" cy="4.5" r="3" stroke="#333" fill="none" /><polyline points="2.402,6 7.598,3" stroke="#333" fill="none" /><polyline points="2.402,3 6.5,1.902" stroke="#333" fill="none" /><polyline points="8,2.4 8,6.6" stroke="#333" fill="none" /><circle cx="5" cy="4.5" r="0.1" stroke="#333" fill="#333" /><polyline points="1.6,7.05 3.268,5.5" stroke="#333" fill="none" /><polyline points="8.35,7.9 5.9,7.1" stroke="#333" fill="none" /><polyline points="1.65,1.7 4.451,2.451" stroke="#333" fill="none" /><polyline points="9,6.75 8,6.1" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 4.5, text: 'O', dx: 2, dy: -11 },
          { x: 1.3, y: 7.3, text: 'A' },
          { x: 8.6, y: 8.1, text: 'B' },
          { x: 1.4, y: 1.5, text: 'C' },
          { x: 9.2, y: 6.9, text: 'D' },
        ],
        elements: [], tolerance: 0,
      },
    },

    // Shared with 3F — see the note above.
    // Shared with 3F 16 — the same retry, square and all.
    '4': {
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
    // Laid out differently from the paper: the distance asked for is a
    // DIAGONAL, measured with a ruler (3 across and 4 down, so 5 cm), and the
    // bearing is North East rather than the paper's South East.
    // Laid out differently from the paper: the distance asked for is a
    // DIAGONAL, measured with a ruler (3 across and 4 down, so 5 cm), and the
    // bearing is North East rather than the paper's South East.
    '6a': {
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
    '6b': {
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

    '7a': { skill: 'Simplifying Fractions', question: 'Write 3 weeks as a fraction of 9 days. Give your answer in its simplest form.', answer: '<frac>7/3</frac>', working: '3 weeks is 21 days, and <frac>21/9</frac> cancels by 3.' },
    '7b': { skill: 'Simplifying Ratio', question: 'Write 45 centimetres : 2.25 metres as a ratio in the form 1 : n', answer: '1 : 5', working: '2.25 m is 225 cm, and 225 ÷ 45 = 5.' },
    '7c': { skill: 'Dividing Fractions', question: 'A : B = <frac>3/8</frac> : <frac>9/16</frac>. Write A as a fraction of B.', answer: '<frac>2/3</frac>', working: '<frac>3/8</frac> ÷ <frac>9/16</frac> = <frac>3/8</frac> × <frac>16/9</frac>.' },

    '8': { skill: 'Finding the nth Term', question: 'A linear sequence has\n• 3rd term = 11\n• 7th term = 27\nWork out the nth term of the sequence.', answer: '4n − 1', working: '16 gained over 4 terms is 4 each time, and the 1st term is 3.' },
    '9': { skill: 'Ratio + Fractions of Amounts', question: 'Dan, Eve and Finn each have an amount of money.\n• Dan has £180\n• Dan\'s amount is <frac>3/4</frac> of Eve\'s amount\n• Finn\'s amount : Eve\'s amount = 2 : 5\nWork out how much money Finn has.', answer: '£96', working: 'Eve has £240, and Finn has two fifths of that.' },
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

    '12': { skill: 'Grouped Frequency Tables + Mean + Percentage Change', question: 'The table shows information about the time, t minutes, taken to cycle to work on 60 days.\n<table>Time, t (minutes) | Frequency\n10 ≤ t < 20 | 18\n20 ≤ t < 30 | 24\n30 ≤ t < 50 | 12\n50 ≤ t < 70 | 6\n | Total = 60</table>\nLast year, the mean time taken to cycle to work was 20 minutes.\nEstimate the percentage increase in the mean cycling time for these 60 days.', answer: '42.5%', working: 'Midpoints give a total of 15 × 18 + 25 × 24 + 40 × 12 + 60 × 6 = 1710 minutes, so the mean is 28.5, an increase of 8.5 on 20.' },
    // 13(a)-(c) share the frequency table, which runs DOWN the page as the
    // paper prints it.
    '13a': { skill: 'Cumulative Frequency', question: 'The table shows information about the salaries of 80 employees.\n<table>Salary, s (£) | Frequency\n0 < s ≤ 10 000 | 30\n10 000 < s ≤ 20 000 | 25\n20 000 < s ≤ 30 000 | 15\n30 000 < s ≤ 40 000 | 10</table>\nComplete the cumulative frequency table.\n<table>Salary, s (£) | Cumulative frequency\ns ≤ 10 000 | \ns ≤ 20 000 | \ns ≤ 30 000 | \ns ≤ 40 000 | </table>', answer: '30, 55, 70, 80', working: 'Each entry adds the next frequency to the one before.' },
    // A finer grid, as the paper's graph paper is: every £2000 and every 5.
    // A finer grid, as the paper's graph paper is: every £2000 and every 5.
    '13b': {
      skill: 'Cumulative Frequency',
      question: 'The table shows information about the salaries of 80 employees.\n<table>Salary, s (£) | Frequency\n0 < s ≤ 10 000 | 30\n10 000 < s ≤ 20 000 | 25\n20 000 < s ≤ 30 000 | 15\n30 000 < s ≤ 40 000 | 10</table>\nDraw a cumulative frequency diagram to represent the data.',
      answer: 'Points at (10, 30), (20, 55), (30, 70) and (40, 80), joined by a smooth curve',
      working: 'The cumulative frequencies are 30, 55, 70 and 80, each plotted at the TOP of its class, not the middle.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 40, step: 2, label: 'Salary (£1000s)' },
        y: { min: 0, max: 80, step: 5, label: 'Cumulative frequency' },
        background: '',
        elements: [
          { x: 10, y: 30, marks: 1 }, { x: 20, y: 55, marks: 1 },
          { x: 30, y: 70, marks: 1 }, { x: 40, y: 80, marks: 1 },
        ],
        tolerance: 0,
      },
    },
    '13c': { skill: 'Cumulative Frequency', question: 'The table shows information about the salaries of 80 employees.\n<table>Salary, s (£) | Frequency\n0 < s ≤ 10 000 | 30\n10 000 < s ≤ 20 000 | 25\n20 000 < s ≤ 30 000 | 15\n30 000 < s ≤ 40 000 | 10</table>\nEstimate the number of employees with a salary less than £25 000', answer: 'About 63', working: 'The cumulative frequency is 55 at £20 000 and 70 at £30 000; read the curve at £25 000.' },
    '14a': { skill: 'Upper and Lower Bounds', question: 'For a small boat,\n• the mass of the empty boat is 600 kg, to the nearest 50 kg\n• the mass of the equipment is 84 kg, to the nearest 2 kg\n• the mass of the crew is 145 kg, to the nearest kg\nThe total mass of the boat is calculated by adding these three masses.\nThe maximum mass for the boat to be loaded safely is 860 kg.\nCan this boat definitely be loaded safely?\nShow working to support your answer.', answer: 'Yes', working: 'The largest possible total is 625 + 85 + 145.5 = 855.5 kg, which is under 860.' },
    // Axes given and scaled, so the answer is a line on the grid that the
    // answer copy can draw. The 2 hours 30 minutes is the paper's own snag.
    // Axes given and scaled, so the answer is a line on the grid that the
    // answer copy can draw. The 2 hours 30 minutes is the paper's own snag.
    '14b': {
      skill: 'Kinematic Graphs',
      question: 'A train travels 225 miles in 2 hours 30 minutes at a constant speed.\nOn the grid, draw a speed/time graph to represent this information.',
      answer: 'A horizontal line at 90 mph from 0 to 2.5 hours',
      working: '2 hours 30 minutes is 2.5 hours, and 225 ÷ 2.5 = 90 mph, which does not change.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 3, step: 0.5, label: 'Time (hours)' },
        y: { min: 0, max: 100, step: 10, label: 'Speed (mph)' },
        background: '',
        elements: [{ x: 0, y: 90, marks: 1 }, { x: 2.5, y: 90, marks: 1 }],
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
    // Mixed strict and inclusive inequalities, as on the paper. The answer
    // copy shows it the way it is marked: each WHOLE line drawn (dashed for
    // <, solid for ≥), the unwanted side of each shaded, and R labelled.
    // Mixed strict and inclusive inequalities, as on the paper. The answer
    // copy shows it the way it is marked: each WHOLE line drawn (dashed for
    // <, solid for ≥), the unwanted side of each shaded, and R labelled.
    '19': {
      skill: 'Inequalities + Plotting Straight Line Graphs',
      question: 'On the grid, identify the region represented by\nx + y < 8 and y < 2x + 2 and y ≥ 2\nLabel the region R.',
      answer: 'The triangle with vertices (0, 2), (6, 2) and (2, 6): below the dashed lines x + y = 8 and y = 2x + 2, and on or above the solid line y = 2',
      working: 'Draw y = 2 as a solid line (≥ includes it) and the other two dashed (< does not); shade the side of each line that is not wanted, and label the unshaded triangle R.',
      diagram: {
        mode: 'polygon',
        x: { min: -2, max: 8, step: 1, label: 'x' },
        y: { min: -2, max: 9, step: 1, label: 'y' },
        background: '',
        solution: '<polygon points="-1,9 8,9 8,0" stroke="none" fill="#999999" fill-opacity="0.35" /><polygon points="-2,-2 3.5,9 -2,9" stroke="none" fill="#999999" fill-opacity="0.35" /><polygon points="-2,-2 8,-2 8,2 -2,2" stroke="none" fill="#999999" fill-opacity="0.35" /><polyline points="-1,9 8,0" stroke="#333" fill="none" stroke-dasharray="0.3 0.2" /><polyline points="-2,-2 3.5,9" stroke="#333" fill="none" stroke-dasharray="0.3 0.2" /><polyline points="-2,2 8,2" stroke="#333" fill="none" /><polyline points="2.35,2.85 2.35,3.85" stroke="#333" fill="none" /><path d="M 2.35,3.85 L 2.6,3.85 A 0.25,0.25 0 0,0 2.6,3.35 L 2.35,3.35" stroke="#333" fill="none" /><polyline points="2.55,3.35 2.85,2.85" stroke="#333" fill="none" />',
        elements: [{ x: 0, y: 2, marks: 1 }, { x: 6, y: 2, marks: 1 }, { x: 2, y: 6, marks: 1 }],
        tolerance: 0,
      },
    },
    '20a': { skill: 'Factorising Quadratics', question: 'Factorise fully 2n² + 7n + 3', answer: '(2n + 1)(n + 3)' },
    '20b': { skill: 'Factorising Quadratics', question: 'A sequence has nth term 2n² + 7n + 3.\nAre any of the terms in the sequence a prime number?\nGive a reason for your answer.', answer: 'No', working: 'It factorises to (2n + 1)(n + 3), and for every positive n both factors are greater than 1.' },
    // The paper draws the spheres in their cylinder, and gives the formula
    // BEFORE the question; so does the retry.
    // A different pair of solids from the paper's spheres-in-a-cylinder:
    // spheres in a CUBOID box, so the fraction keeps a π (the cylinder's
    // cancels) while the step count stays the same.
    // A different pair of solids from the paper's spheres-in-a-cylinder:
    // spheres in a CUBOID box, so the fraction keeps a π (the cylinder's
    // cancels) while the step count stays the same.
    '21': {
      skill: 'Volume of a Sphere + Volume of a prism',
      question: 'Four identical spheres just fit in a row inside a box in the shape of a cuboid.\nEach sphere has radius r.\nVolume of a sphere = <frac>4/3</frac>πr³\nWhat fraction of the space inside the box is filled by the spheres?\nGive your answer in terms of π.\nYou must show your working.',
      answer: '<frac>π/6</frac>',
      working: 'The box is 8r by 2r by 2r, so its volume is 32r³; the spheres take 4 × <frac>4/3</frac>πr³ = <frac>16/3</frac>πr³, and <frac>16/3</frac> ÷ 32 = <frac>1/6</frac>.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polyline points="1,1 9,1 9,3 1,3 1,1" stroke="#333" fill="none" /><polyline points="1,3 1.9,3.6 9.9,3.6 9,3" stroke="#333" fill="none" /><polyline points="9,1 9.9,1.6 9.9,3.6" stroke="#333" fill="none" /><polyline points="1,1 1.9,1.6 9.9,1.6" stroke="#333" fill="none" stroke-dasharray="0.2 0.15" /><polyline points="1.9,1.6 1.9,3.6" stroke="#333" fill="none" stroke-dasharray="0.2 0.15" /><circle cx="2" cy="2" r="1" stroke="#333" fill="#e5e5e5" /><circle cx="4" cy="2" r="1" stroke="#333" fill="#e5e5e5" /><circle cx="6" cy="2" r="1" stroke="#333" fill="#e5e5e5" /><circle cx="8" cy="2" r="1" stroke="#333" fill="#e5e5e5" /><path d="M 1,2 A 1,0.25 0 0,1 3,2" stroke="#333" fill="none" /><path d="M 3,2 A 1,0.25 0 0,1 1,2" stroke="#333" fill="none" stroke-dasharray="0.15 0.12" /><path d="M 3,2 A 1,0.25 0 0,1 5,2" stroke="#333" fill="none" /><path d="M 5,2 A 1,0.25 0 0,1 3,2" stroke="#333" fill="none" stroke-dasharray="0.15 0.12" /><path d="M 5,2 A 1,0.25 0 0,1 7,2" stroke="#333" fill="none" /><path d="M 7,2 A 1,0.25 0 0,1 5,2" stroke="#333" fill="none" stroke-dasharray="0.15 0.12" /><path d="M 7,2 A 1,0.25 0 0,1 9,2" stroke="#333" fill="none" /><path d="M 9,2 A 1,0.25 0 0,1 7,2" stroke="#333" fill="none" stroke-dasharray="0.15 0.12" />',
        elements: [], tolerance: 0,
      },
    },
    '22': { skill: 'Quadratic Inequalities + Solving Quadratic Equations (Factorising)', question: 'Solve 3x² > 10 − x', answer: 'x < −2 or x > <frac>5/3</frac>', working: '3x² + x − 10 > 0 factorises to (3x − 5)(x + 2) > 0.' },
    // The paper prints Sam's WRONG graph for the student to criticise, so the
    // retry draws one: it starts at 25 instead of 0, and climbs above 25.
    '23': {
      skill: 'Quadratic Functions',
      question: 'A ball is kicked from ground level.\nThe height of the ball, h metres, is given by\nh = −(t − 5)² + 25\nwhere t is the time in seconds after the ball is kicked.\nSam draws a graph of h against t for 0 ≤ t ≤ 10\nMake two criticisms of Sam\'s graph.',
      answer: 'The graph should start at h = 0 when t = 0, not at 25; and the greatest height should be 25 (at t = 5), but the graph goes higher than 25',
      working: 'At t = 0, h = −25 + 25 = 0; and (t − 5)² is never negative, so h is never more than 25.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: -1, max: 13, step: 1, label: '' },
        y: { min: -1, max: 12, step: 1, label: '' },
        background: '<polyline points="0,-0.4 0,11.6" stroke="#333" fill="none" /><polyline points="-0.18,11.3 0,11.6 0.18,11.3" stroke="#333" fill="none" /><polyline points="-0.4,0 12.4,0" stroke="#333" fill="none" /><polyline points="12.1,0.18 12.4,0 12.1,-0.18" stroke="#333" fill="none" /><polyline points="-0.15,8.333 0.15,8.333" stroke="#333" fill="none" /><polyline points="5,-0.15 5,0.15" stroke="#333" fill="none" /><polyline points="10,-0.15 10,0.15" stroke="#333" fill="none" /><polyline points="0,8.333 0.5,8.713 1,9.053 1.5,9.353 2,9.613 2.5,9.833 3,10.013 3.5,10.153 4,10.253 4.5,10.313 5,10.333 5.5,10.23 6,9.92 6.5,9.403 7,8.68 7.5,7.75 8,6.613 8.5,5.27 9,3.72 9.5,1.963 10,0" stroke="#333" fill="none" />',
        labels: [
          { x: 0, y: 11.6, text: 'h', dx: -10 },
          { x: 12.4, y: 0, text: 't', dx: 9 },
          { x: 0, y: 0, text: 'O', dx: -10, dy: 11 },
          { x: 0, y: 8.333, text: '25', dx: -15 },
          { x: 5, y: 0, text: '5', dy: 13 },
          { x: 10, y: 0, text: '10', dy: 13 },
        ],
        elements: [], tolerance: 0,
      },
    },
    // Built as the paper builds it: the area of the first triangle is given,
    // so the missing side has to come from ½ab sin C BEFORE the scale factor
    // can be found from the pair of corresponding sides.
    // Built as the paper builds it: the area of the first triangle is given,
    // so the missing side has to come from ½ab sin C BEFORE the scale factor
    // can be found from the pair of corresponding sides.
    '24': {
      skill: 'Area and Volume Scale Factors + Area of a Triangle (½ab sinC)',
      question: 'Triangles PQR and STU are similar.\nThe area of triangle PQR is 45.315 cm²\nWork out the area of triangle STU.\nNot drawn accurately.',
      answer: '16.3 cm² (16.3134…)',
      working: '½ × 8 × QR × sin 115° = 45.315, so QR = 12.5 cm. QR corresponds to TU, so the length scale factor is 7.5 ÷ 12.5 = 0.6, the area scale factor is 0.36, and 45.315 × 0.36 = 16.3134…',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 1, max: 10, step: 1, label: '' },
        background: '<polygon points="1.737,9.263 2.29,2.302 4,7" stroke="#333" fill="none" /><polygon points="8.39,8.81 8.832,3.241 10.2,7" stroke="#333" fill="none" /><path d="M 3.505,7.495 A 0.7,0.7 0 0,1 3.761,6.342" stroke="#333" fill="none" /><path d="M 9.811,7.389 A 0.55,0.55 0 0,1 10.012,6.483" stroke="#333" fill="none" />',
        labels: [
          { x: 1.737, y: 9.263, text: 'P', dx: -9, dy: -6 },
          { x: 2.29, y: 2.302, text: 'Q', dx: -9, dy: 10 },
          { x: 4, y: 7, text: 'R', dx: 10, dy: 0 },
          { x: 8.39, y: 8.81, text: 'S', dx: -9, dy: -6 },
          { x: 8.832, y: 3.241, text: 'T', dx: -9, dy: 10 },
          { x: 10.2, y: 7, text: 'U', dx: 10, dy: 0 },
          { x: 2.828, y: 6.74, text: '115°' },
          { x: 9.224, y: 6.784, text: '115°' },
          { x: 2.869, y: 8.131, text: '8 cm', dx: 16, dy: -8 },
          { x: 9.516, y: 5.121, text: '7.5 cm', dx: 24 },
        ],
        elements: [], tolerance: 0,
      },
    },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
