import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1F — Foundation Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-F-P1.json by
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
export const EDEXCEL_1MA1_1F_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-1f-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                          skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'collect repeated like terms' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                 skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'write a simple fraction as a decimal' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                          skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'metric length conversion' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                            skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'give a multiple within a range' },
    { id: '5',   label: '5',     marks: 1,  topic: 'shape',    skill: 'Angles on lines and Circles',                                      skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'name the type of a given angle' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'read two values from a table and add' },
    { id: '6b',  label: '6(b)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                skillIds: ['simple_arithmetic'], kind: 'exam', visual: false, desc: 'compare two totals against a multiplicative claim, with working' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                                    skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'complete a bar chart from given figures' },
    { id: '7b',  label: '7(b)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Simple Charts',                                skillIds: ['simple_arithmetic', 'simple_charts'], kind: 'exam', visual: false, desc: 'total mixed-denomination money read from a chart, compared with a bound' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'shape',    skill: 'Properties of 2D Shapes',                                          skillIds: ['properties_of_2d_shapes'], kind: 'mastery', visual: true, desc: 'complete a kite on a grid from two given sides' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                                          skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'name a solid from its picture' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                                 skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'write an expression for an age, given a difference' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                                 skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'write an expression for an age, given a multiple' },
    { id: '9c',  label: '9(c)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                         skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a one-step equation' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'number',   skill: 'Rounding',                                                         skillIds: ['rounding'], kind: 'mastery', visual: false, desc: 'round to the nearest thousand' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'number',   skill: 'Estimating',                                                       skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'estimate a product by rounding both factors' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                                 skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract fractions with different denominators' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'number',   skill: 'Fractions of Amounts',                                             skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'find a fraction of a quantity' },
    { id: '12a', label: '12(a)', marks: 3,  topic: 'number',   skill: 'Time Calculations',                                                skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'compare journey durations from a timetable, with working' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'number',   skill: 'Time Calculations',                                                skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'waiting time from a timetable with a stated delay' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'forward through a two-step machine' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'inverse through a two-step machine, negative output' },
    { id: '14',  label: '14',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Converting Measurements',                                  skillIds: ['ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'map scale applied to a real length, answer in a different unit' },
    { id: '15',  label: '15',    marks: 3,  topic: 'number',   skill: 'Decimals',                                                         skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'written multiplication of a decimal by a two-digit integer' },
    { id: '16',  label: '16',    marks: 4,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Angles on lines and Circles', skillIds: ['alternate_and_corresponding_angles', 'angles_on_lines_and_circles'], kind: 'exam', visual: false, desc: 'prove two lines parallel, giving an angle reason at each stage' },
    { id: '17',  label: '17',    marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                       skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'scale a recipe and check four quantities against what is available' },
    { id: '18',  label: '18',    marks: 3,  topic: 'probdata', skill: 'Gathering and Organising Data',                                    skillIds: ['gathering_and_organising_data'], kind: 'mastery', visual: true, desc: 'construct a stem and leaf diagram, including a key' },
    { id: '19',  label: '19',    marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                            skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two numbers' },
    { id: '20a', label: '20(a)', marks: 3,  topic: 'probdata', skill: 'Mutually Exclusive Events + Calculating Simple Probability',       skillIds: ['mutually_exclusive_events', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'missing probability from a table, given a ratio between two outcomes' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'probdata', skill: 'Expected Outcomes',                                                skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: 'total population from a known probability and its frequency' },
    { id: '21a', label: '21(a)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                     skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '21b', label: '21(b)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                              skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve over a given domain' },
    { id: '21c', label: '21(c)', marks: 1,  topic: 'algebra',  skill: 'Quadratic Functions',                                              skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read the turning point off a drawn curve' },
    { id: '22a', label: '22(a)', marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                     skillIds: ['ratio', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'chain two ratios through a fractional part of a total' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'state whether a change to one quantity affects a ratio, with a reason' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Standard Form',                                                    skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'add two numbers in standard form, answer in standard form' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Exterior Angles',                             skillIds: ['angles_in_polygons', 'exterior_angles'], kind: 'exam', visual: false, desc: 'number of sides of a regular polygon from an interior angle built up from a triangle and a square' },
    { id: '25',  label: '25',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                               skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a drawn line in y = mx + c form' },
    { id: '26',  label: '26',    marks: 2,  topic: 'shape',    skill: 'Vectors',                                                          skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'linear combination of two column vectors' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // FIRST NON-AQA RETRY SET. The procedure in docs/writing-retry-questions.md
  // transferred unchanged; what differs is Edexcel's house style, and the
  // rewrites follow it — "Write down…" for recall, "You must show how you get
  // your answer" where the working carries the marks, and multi-part questions
  // sharing one setup.
  //
  // 18 is the only visual item without a retry: a stem and leaf diagram is
  // structured text rather than a grid, and there is no generator for one.
  // 7(a), 8(a) and 21(b) all get grids.
  retrySet: {
    '1': { skill: 'Simplifying Expressions', question: 'Simplify g + g + g + g', answer: '4g' },
    '2': { skill: 'Converting Fractions to Decimals', question: 'Write <frac>2/5</frac> as a decimal.', answer: '0.4' },
    '3': { skill: 'Converting Measurements', question: 'Change 85 millimetres into centimetres.', answer: '8.5 centimetres', working: 'There are 10 mm in 1 cm.' },
    '4': { skill: 'Factors and Multiples', question: 'Write down a multiple of 7 that is between 30 and 40', answer: '35' },
    '5': { skill: 'Angles on lines and Circles', question: 'Angle B is 127°. What type of angle is angle B?', answer: 'Obtuse', working: 'It is between 90° and 180°.' },

    // 6(a) and (b) share one table, as on the paper.
    '6a': { skill: 'Simple Arithmetic', question: 'Kim works at a cinema.\nThe table shows the number of adult tickets and the number of child tickets Kim sold in each of three months.\n<table>Month | Adult tickets | Child tickets\nApril | 41 | 18\nMay | 36 | 22\nJune | 29 | 17</table>\nWork out the total number of adult tickets and child tickets Kim sold in June.', answer: '46', working: '29 + 17' },
    '6b': { skill: 'Simple Arithmetic', question: 'Kim works at a cinema.\nThe table shows the number of adult tickets and the number of child tickets Kim sold in each of three months.\n<table>Month | Adult tickets | Child tickets\nApril | 41 | 18\nMay | 36 | 22\nJune | 29 | 17</table>\nKim says, "In these three months, in total, I sold more than twice as many adult tickets as child tickets."\nIs Kim correct?\nYou must show how you get your answer.', answer: 'No', working: '41 + 36 + 29 = 106 adult tickets and 18 + 22 + 17 = 57 child tickets; twice 57 is 114, which is more than 106.' },

    // 7(a) is `visual: true` and gets the bar chart. The two given bars are in
    // the background; the two to draw are the answer.
    '7a': {
      skill: 'Simple Charts',
      question: 'There are only 5p, 10p, 20p and 50p coins in a bag.\nThe bar chart shows the number of 5p coins and the number of 10p coins in the bag.\nThere are six 20p coins and four 50p coins in the bag.\nUse this information to complete the bar chart.',
      answer: 'A bar of 6 for 20p and a bar of 4 for 50p',
      diagram: {
        mode: 'bars', barWidth: 0.62,
        x: { min: 0, max: 4, step: 1, label: 'Coin', categories: ['5p', '10p', '20p', '50p'] },
        y: { min: 0, max: 14, step: 2, label: 'Number of coins' },
        background: '<rect x="0.19" y="0" width="0.62" height="12" stroke="#333" fill="none" /><rect x="1.19" y="0" width="0.62" height="8" stroke="#333" fill="none" />',
        elements: [{ x: 2, y: 6, marks: 1 }, { x: 3, y: 4, marks: 1 }],
        tolerance: 0,
      },
    },
    // 7(b) reads the same chart as 7(a), as on the paper: the 5p and 10p
    // counts come off the bars, the 20p and 50p counts from the text.
    '7b': {
      skill: 'Simple Arithmetic',
      question: 'There are only 5p, 10p, 20p and 50p coins in a bag.\nThe bar chart shows the number of 5p coins and the number of 10p coins in the bag.\nThere are six 20p coins and four 50p coins in the bag.\nShow that the total amount of money in the bag is less than £5',
      answer: '12 × 5p = 60p, 8 × 10p = 80p, 6 × 20p = £1.20, 4 × 50p = £2.00, so the total is £4.60, which is less than £5',
      working: 'Read 12 five-pence coins and 8 ten-pence coins off the chart; 60p + 80p + £1.20 + £2.00 = £4.60.',
      diagram: {
        mode: 'bars', barWidth: 0.62,
        x: { min: 0, max: 4, step: 1, label: 'Coin', categories: ['5p', '10p', '20p', '50p'] },
        y: { min: 0, max: 14, step: 2, label: 'Number of coins' },
        background: '<rect x="0.19" y="0" width="0.62" height="12" stroke="#333" fill="none" /><rect x="1.19" y="0" width="0.62" height="8" stroke="#333" fill="none" />',
        elements: [],
        tolerance: 0,
      },
    },

    // 8(a) is `visual: true`. Two sides of the kite are given and the student
    // completes it; the grid is plain squares, as the paper prints it.
    '8a': {
      skill: 'Properties of 2D Shapes',
      question: 'The diagram shows two sides of a kite.\nOn the grid, complete the kite.',
      answer: 'The fourth vertex is at (6, 4)',
      working: 'A kite has two pairs of equal adjacent sides, so the shape is a mirror image in the line through (4, 1) and (4, 8).',
      diagram: {
        mode: 'polygon', showAxes: false,
        x: { min: 0, max: 8, step: 1, label: '' },
        y: { min: 0, max: 9, step: 1, label: '' },
        background: '<polyline points="4,1 2,4 4,8" stroke="#333" />',
        elements: [{ x: 6, y: 4, marks: 1 }],
        tolerance: 0,
      },
    },
    // The paper shows a PICTURE of a solid and asks for its name, so the retry
    // draws one too (a cone; the paper's is a cylinder) rather than listing
    // its faces, which would test a different thing.
    '8b': {
      skill: 'Properties of 3D Solids',
      question: 'Here is a solid shape.\nWhat is the mathematical name of this solid shape?',
      answer: 'A cone',
      working: 'One flat circular face, and a curved surface that comes to a point.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="2.4,1.8 5,7 7.6,1.8" stroke="#333" fill="none" /><path d="M 2.4,1.8 A 2.6,0.6 0 0,1 7.6,1.8" stroke="#333" fill="none" /><path d="M 7.6,1.8 A 2.6,0.6 0 0,1 2.4,1.8" stroke="#333" fill="none" stroke-dasharray="0.3 0.25" />',
        elements: [], tolerance: 0,
      },
    },

    // 9(a)-(c) share one setup, as on the paper.
    '9a': { skill: 'Forming Expressions and Formulae', question: 'Maya is x years old.\nMaya is 7 years older than Sam.\nWrite down an expression, in terms of x, for Sam\'s age.', answer: 'x − 7' },
    '9b': { skill: 'Forming Expressions and Formulae', question: 'Maya is x years old.\nMaya is 7 years older than Sam.\nLeo is three times as old as Maya.\nWrite down an expression, in terms of x, for Leo\'s age.', answer: '3x' },
    '9c': { skill: 'Solving Linear Equations', question: 'Solve 6w = 42', answer: 'w = 7' },

    '10a': { skill: 'Rounding', question: 'Write 47 382 to the nearest 1000', answer: '47 000' },
    '10b': { skill: 'Estimating', question: 'Work out an estimate for the value of 4.2 × 51.7', answer: '200', working: '4 × 50, rounding each number to 1 significant figure.' },
    '11a': { skill: 'Adding and Subtracting Fractions', question: 'Work out <frac>7/10</frac> − <frac>1/5</frac>', answer: '<frac>1/2</frac>', working: '<frac>7/10</frac> − <frac>2/10</frac> = <frac>5/10</frac>.' },
    '11b': { skill: 'Fractions of Amounts', question: 'Work out <frac>3/8</frac> of 56', answer: '21', working: '56 ÷ 8 = 7, then × 3.' },

    // 12(a) and (b) share one timetable.
    // 12(a) and (b) share one timetable, and — as on the paper — one bus does
    // not stop everywhere. (b) turns on noticing the dash.
    '12a': { skill: 'Time Calculations', question: 'Here is part of a bus timetable from Park Road to Hospital.\n<table>Park Road | 07 10 | 07 45 | 08 05\nHigh Street | 07 26 | 07 58 | 08 22\nStation | 07 52 | 08 19 | 08 48\nMarket | 08 07 | – | 09 04\nHospital | 08 25 | 08 50 | 09 21</table>\nWhich bus should take the least time to go from Park Road to Station?\nYou must show how you get your answer.', answer: 'The 07 45 bus', working: 'Park Road to Station takes 42 minutes, 34 minutes and 43 minutes.' },
    '12b': { skill: 'Time Calculations', question: 'Here is part of a bus timetable from Park Road to Hospital.\n<table>Park Road | 07 10 | 07 45 | 08 05\nHigh Street | 07 26 | 07 58 | 08 22\nStation | 07 52 | 08 19 | 08 48\nMarket | 08 07 | – | 09 04\nHospital | 08 25 | 08 50 | 09 21</table>\nAnn gets to the Market stop at 08 15\nShe wants to catch the next bus to Hospital.\nThis bus is delayed by 25 minutes.\nHow many minutes does Ann have to wait for the bus?', answer: '74 minutes', working: 'The 07 45 bus does not stop at Market, so the next bus is the 09 04, which becomes 09 29; 08 15 to 09 29 is 74 minutes.' },

    '13a': {
      skill: 'Function Machines',
      question: 'The diagram shows a number machine.\nFind the output when the input is 3',
      answer: '−8',
      working: '(3 − 5) × 4',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.8, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<polyline points="2.2,1 4.4,1 4.4,2 2.2,2 2.2,1" stroke="#333" fill="none" /><polyline points="5.9,1 8.1,1 8.1,2 5.9,2 5.9,1" stroke="#333" fill="none" /><polyline points="0.9,1.5 2.14,1.5" stroke="#333" fill="none" /><polyline points="1.92,1.68 2.17,1.5 1.92,1.32" stroke="#333" fill="none" /><polyline points="4.4,1.5 5.84,1.5" stroke="#333" fill="none" /><polyline points="5.62,1.68 5.87,1.5 5.62,1.32" stroke="#333" fill="none" /><polyline points="8.100000000000001,1.5 9.54,1.5" stroke="#333" fill="none" /><polyline points="9.32,1.68 9.57,1.5 9.32,1.32" stroke="#333" fill="none" />',
        labels: [
          { x: 0.5, y: 1.5, text: 'Input' },
          { x: 3.3, y: 1.5, text: '− 5' },
          { x: 7, y: 1.5, text: '× 4' },
          { x: 10, y: 1.5, text: 'Output' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '13b': {
      skill: 'Function Machines',
      question: 'The diagram shows a number machine.\nFind the input when the output is −24',
      answer: '−1',
      working: 'Work backwards: −24 ÷ 4 = −6, then −6 + 5.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 11.8, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background: '<polyline points="2.2,1 4.4,1 4.4,2 2.2,2 2.2,1" stroke="#333" fill="none" /><polyline points="5.9,1 8.1,1 8.1,2 5.9,2 5.9,1" stroke="#333" fill="none" /><polyline points="0.9,1.5 2.14,1.5" stroke="#333" fill="none" /><polyline points="1.92,1.68 2.17,1.5 1.92,1.32" stroke="#333" fill="none" /><polyline points="4.4,1.5 5.84,1.5" stroke="#333" fill="none" /><polyline points="5.62,1.68 5.87,1.5 5.62,1.32" stroke="#333" fill="none" /><polyline points="8.100000000000001,1.5 9.54,1.5" stroke="#333" fill="none" /><polyline points="9.32,1.68 9.57,1.5 9.32,1.32" stroke="#333" fill="none" />',
        labels: [
          { x: 0.5, y: 1.5, text: 'Input' },
          { x: 3.3, y: 1.5, text: '− 5' },
          { x: 7, y: 1.5, text: '× 4' },
          { x: 10, y: 1.5, text: 'Output' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '14': { skill: 'Ratio + Converting Measurements', question: 'A path has a length of 2.4 kilometres.\nThe path is shown on a map with a scale of 1 : 40 000\nWork out the length, in centimetres, of this path on the map.', answer: '6 centimetres', working: '2.4 km is 240 000 cm, and 240 000 ÷ 40 000 = 6.' },
    '15': { skill: 'Decimals', question: 'Work out 2.45 × 36', answer: '88.2', working: '245 × 36 = 8820, then place the decimal point.' },
    // Laid out as the paper lays it out: a small isosceles triangle inside a
    // larger one, sharing the line XYZ, so the parallel lines follow from
    // CORRESPONDING angles.
    '16': {
      skill: 'Alternate and Corresponding Angles + Angles on lines and Circles',
      question: 'VWX and XYZ are straight lines.\nWX = WY\nShow that WY is parallel to VZ.\nGive a reason for each stage of your working.',
      answer: 'Angle WYX = (180 − 50) ÷ 2 = 65°, because base angles of an isosceles triangle are equal. So angle WYX = angle VZX = 65°, and equal corresponding angles mean WY is parallel to VZ',
      working: 'Triangle WXY is isosceles because WX = WY; angles in a triangle add up to 180°; corresponding angles are equal, so the lines are parallel.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 11, step: 1, label: '' },
        background: '<polygon points="5,9.578 1,1 9,1" stroke="#333" fill="none" /><polyline points="3.5,6.361 6,1" stroke="#333" fill="none" /><path d="M 3.162,5.636 A 0.8,0.8 0 0,1 3.838,5.636" stroke="#333" fill="none" /><path d="M 8.62,1.816 A 0.9,0.9 0 0,1 8.1,1" stroke="#333" fill="none" />',
        labels: [
          { x: 5, y: 9.578, text: 'V', dy: -8 },
          { x: 3.5, y: 6.361, text: 'W', dx: -11 },
          { x: 1, y: 1, text: 'X', dx: -9, dy: 10 },
          { x: 6, y: 1, text: 'Y', dy: 13 },
          { x: 9, y: 1, text: 'Z', dx: 9, dy: 10 },
          { x: 3.5, y: 5.011, text: '50°' },
          { x: 7.735, y: 1.806, text: '65°' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '17': { skill: 'Proportion', question: 'Nia wants to use this recipe to make 12 muffins.\n<table>Ingredients for 8 muffins | Nia has\n160 g flour | 260 g flour\n140 ml milk | 200 ml milk\n60 g sugar | 90 g sugar\n2 eggs | 4 eggs</table>\nDoes Nia have enough flour, enough milk, enough sugar and enough eggs to make 12 muffins?\nYou must show all your working.', answer: 'No — she has enough flour, sugar and eggs, but not enough milk', working: '12 muffins is 1.5 times the recipe: 240 g flour, 210 ml milk, 90 g sugar and 3 eggs; she has only 200 ml of milk.' },
    '19': { skill: 'Highest Common Factor', question: 'Find the highest common factor (HCF) of 84 and 126', answer: '42', working: '84 = 2² × 3 × 7 and 126 = 2 × 3² × 7, so the HCF is 2 × 3 × 7.' },

    // 20(a) and (b) share one bag of counters.
    // 20(a) and (b) share one bag and one table, as on the paper.
    '20a': { skill: 'Mutually Exclusive Events + Calculating Simple Probability', question: 'There are only red counters, white counters, blue counters and green counters in a bag.\nAmir is going to take at random a counter from the bag.\nThe table shows the probability that he will take a red counter and the probability that he will take a white counter.\n<table>Colour | red | white | blue | green\nProbability | 0.25 | 0.15 |  | </table>\nThere are three times as many blue counters as green counters in the bag.\nWork out the probability that Amir will take a blue counter.', answer: '0.45', working: 'Blue and green together are 1 − 0.25 − 0.15 = 0.6, shared 3 : 1.' },
    '20b': { skill: 'Expected Outcomes', question: 'There are only red counters, white counters, blue counters and green counters in a bag.\nAmir is going to take at random a counter from the bag.\nThe table shows the probability that he will take a red counter and the probability that he will take a white counter.\n<table>Colour | red | white | blue | green\nProbability | 0.25 | 0.15 |  | </table>\nThere are 32 red counters in the bag.\nWork out the total number of counters in the bag.', answer: '128', working: '32 ÷ 0.25' },

    // 21(a)-(c) share one quadratic. It is chosen to have a WHOLE-NUMBER
    // turning point, so (c) can be read off the grid rather than estimated.
    // 21(a)-(c) share one quadratic and one table, with two values filled in
    // as the paper does. The turning point is a WHOLE-NUMBER point, so (c) can
    // be read off the grid rather than estimated.
    '21a': {
      skill: 'Substitution',
      question: 'Here is a table of values for y = x² − 2x − 3\n<table>x | −2 | −1 | 0 | 1 | 2 | 3 | 4\ny | 5 |  | −3 |  |  |  | </table>\nComplete the table of values.',
      answer: '0, −4, −3, 0 and 5 (for x = −1, 1, 2, 3 and 4)',
      working: 'For example x = −1: 1 + 2 − 3 = 0.',
    },
    '21b': {
      skill: 'Quadratic Functions',
      question: 'Here is a table of values for y = x² − 2x − 3\n<table>x | −2 | −1 | 0 | 1 | 2 | 3 | 4\ny | 5 |  | −3 |  |  |  | </table>\nOn the grid, draw the graph of y = x² − 2x − 3 for values of x from −2 to 4',
      answer: 'A smooth curve through (−2, 5), (−1, 0), (0, −3), (1, −4), (2, −3), (3, 0) and (4, 5)',
      working: 'Plot the seven points and join them with a smooth curve, not straight lines.',
      diagram: {
        mode: 'polyline',
        x: { min: -2, max: 4, step: 1, label: 'x' },
        y: { min: -4, max: 5, step: 1, label: 'y' },
        background: '',
        elements: [{ x: -2, y: 5, marks: 1 }, { x: -1, y: 0, marks: 1 }, { x: 0, y: -3, marks: 1 }, { x: 1, y: -4, marks: 1 }, { x: 2, y: -3, marks: 1 }, { x: 3, y: 0, marks: 1 }, { x: 4, y: 5, marks: 1 }], tolerance: 0,
      },
    },
    '21c': {
      skill: 'Quadratic Functions',
      question: 'Here is a table of values for y = x² − 2x − 3\n<table>x | −2 | −1 | 0 | 1 | 2 | 3 | 4\ny | 5 |  | −3 |  |  |  | </table>\nWrite down the coordinates of the turning point of the graph of y = x² − 2x − 3',
      answer: '(1, −4)',
      working: 'The lowest point of the curve, halfway between the two places it crosses the x-axis.',
      diagram: {
        mode: 'polyline',
        x: { min: -2, max: 4, step: 1, label: 'x' },
        y: { min: -4, max: 5, step: 1, label: 'y' },
        background: '',
        elements: [{ x: -2, y: 5, marks: 1 }, { x: -1, y: 0, marks: 1 }, { x: 0, y: -3, marks: 1 }, { x: 1, y: -4, marks: 1 }, { x: 2, y: -3, marks: 1 }, { x: 3, y: 0, marks: 1 }, { x: 4, y: 5, marks: 1 }], tolerance: 0,
      },
    },

    // 22(a) and (b) share one box, and (b) asks about n WITHOUT stating it, so
    // it cannot hand over the answer to (a).
    '22a': { skill: 'Ratio', question: 'There are 350 sweets in a box.\nThere are only toffees, mints and fudges.\n<frac>1/7</frac> of the 350 sweets are fudges.\nThe number of toffees : the number of mints = 1 : 2\nThe number of mints : the number of fudges = n : 1\nWork out the value of n.\nYou must show all your working.', answer: 'n = 4', working: '50 fudges, leaving 300 shared 1 : 2 as 100 toffees and 200 mints; 200 : 50 is 4 : 1.' },
    '22b': { skill: 'Ratio', question: 'There are 350 sweets in a box.\nThere are only toffees, mints and fudges.\n<frac>1/7</frac> of the 350 sweets are fudges.\nThe number of toffees : the number of mints = 1 : 2\nThe number of mints : the number of fudges = n : 1\n10 toffees from the box are eaten.\nDoes this affect the value of n?\nGive a reason for your answer.', answer: 'No', working: 'n compares only the mints with the fudges, and neither number changes.' },

    '23': { skill: 'Standard Form', question: 'Work out 6.4 × 10² + 8.5 × 10³\nGive your answer in standard form.', answer: '9.14 × 10³', working: '640 + 8500 = 9140.' },
    // Drawn as the paper draws it. The retry swaps the paper's square for a
    // regular pentagon, so the angle at C is 60° + 108° rather than 60° + 90°.
    '24': {
      skill: 'Angles in Polygons + Exterior Angles',
      question: 'AB, BC, CD and DE are four sides of a regular polygon with n sides.\nBCX is an equilateral triangle.\nCDYZX is a regular pentagon.\nWork out the value of n.\nYou must show all your working.',
      answer: 'n = 30',
      working: 'The interior angle at C is 60° + 108° = 168°, so each exterior angle is 180° − 168° = 12°, and n = 360 ÷ 12.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 2, max: 10, step: 1, label: '' },
        y: { min: -1, max: 12, step: 1, label: '' },
        background: '<polyline points="5.844,11.675 4.624,8.934 4,6 4,3 4.624,0.066" stroke="#333" fill="none" /><polyline points="4.624,8.934 6.853,6.927 4,6" stroke="#333" fill="none" /><polyline points="4,3 6.853,2.073 8.617,4.5 6.853,6.927" stroke="#333" fill="none" />',
        labels: [
          { x: 5.844, y: 11.675, text: 'A', dx: 9, dy: -4 },
          { x: 4.624, y: 8.934, text: 'B', dx: -11 },
          { x: 4, y: 6, text: 'C', dx: -11 },
          { x: 4, y: 3, text: 'D', dx: -11 },
          { x: 4.624, y: 0.066, text: 'E', dx: -11, dy: 4 },
          { x: 6.853, y: 6.927, text: 'X', dx: 9, dy: -6 },
          { x: 6.853, y: 2.073, text: 'Y', dx: 8, dy: 10 },
          { x: 8.617, y: 4.5, text: 'Z', dx: 10 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '25': {
      skill: 'Understanding Straight Line Graphs',
      question: 'The straight line L is shown on the grid.\nFind an equation for L. Give your answer in the form y = mx + c',
      answer: 'y = 2x − 1',
      working: 'The line crosses the y-axis at −1 and rises 2 for every 1 across.',
      diagram: {
        mode: 'line',
        x: { min: -1, max: 4, step: 1, label: 'x' },
        y: { min: -2, max: 4, step: 1, label: 'y' },
        background: '<polyline points="0,-1 2.5,4" stroke="#333" />',
        elements: [{ x: 0, y: -1, marks: 1 }, { x: 2, y: 3, marks: 1 }],
        tolerance: 0,
      },
    },
    '26': {
      skill: 'Vectors',
      question: 'c = <vec>5, 3</vec> and d = <vec>1, −2</vec>\nWork out 3c + 2d\nGive your answer as a column vector.',
      answer: '<vec>17, 5</vec>',
      working: '3c = <vec>15, 9</vec> and 2d = <vec>2, −4</vec>.',
    },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
