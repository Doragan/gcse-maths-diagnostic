import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P1.json by
 * scripts/generate-paper-from-audit.ts. Regenerating overwrites this file, so
 * a hand correction should be noted here — the script refuses to overwrite
 * without --force precisely so corrections are not lost silently.
 *
 * HAND-AUTHORED SINCE GENERATION — do not regenerate without --force, and
 * re-apply this if you do:
 *
 *   • `retrySet` is complete: a rewritten practice question, with its answer,
 *     for all 38 non-visual items. Written from the question paper as
 *     PARALLELS — same context, framing and step count, different numbers and
 *     settings — never as transcriptions. The procedure and the boundary are
 *     in docs/writing-retry-questions.md.
 *   • 4(a) and 4(b) carry a `diagram`, because they are read off a conversion
 *     graph and are not answerable without one. 11 and 21 are the two visual
 *     items and have no retry; see the note above `retrySet`.
 *   • `challengeQuestions` stays empty ON PURPOSE. Challenges are pooled by
 *     topic and tier in lib/papers/challengePool.ts, and every paper draws
 *     from there; filling this in would override the pool for this paper only.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const AQA_8300_1F_JUN25: PaperConfig = {
  id: 'aqa-8300-1f-jun25',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '1c',  label: '1(c)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                                               skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '1d',  label: '1(d)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'select from a displayed set of numbers; static diagram supported' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: '' },
    { id: '2c',  label: '2(c)',  marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                                                   skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: '' },
    { id: '2d',  label: '2(d)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 3,  topic: 'probdata', skill: 'Simple Charts + Proportion',                                                                              skillIds: ['simple_charts', 'proportion'], kind: 'exam', visual: false, desc: 'pictogram rendered as static diagram' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Proportion',                                                         skillIds: ['understanding_straight_line_graphs', 'proportion'], kind: 'mastery', visual: false, desc: 'range-tolerance read-off; exact-match insufficient' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Proportion',                                                         skillIds: ['understanding_straight_line_graphs', 'proportion'], kind: 'mastery', visual: false, desc: 'range-tolerance read-off feeding a total' },
    { id: '5',   label: '5',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '7a',  label: '7(a)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Fractions of Amounts',                                                                skillIds: ['simple_arithmetic', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                                                       skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '8',   label: '8',     marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                                                              skillIds: ['proportion'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'ratio',    skill: 'Ratio + Simplifying Ratio',                                                                               skillIds: ['ratio', 'simplifying_ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs simplest-form equivalence check' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                                          skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '10',  label: '10',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Indices',                                                                                  skillIds: ['substitution', 'indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 1,  topic: 'shape',    skill: 'Constructions',                                                                                           skillIds: ['constructions'], kind: 'mastery', visual: true, desc: 'requires compass construction on a diagram' },
    { id: '12a', label: '12(a)', marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Simple Arithmetic',                                                                skillIds: ['fractions_of_amounts', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                                                   skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Angles on lines and Circles + Solving Linear Equations',                                                  skillIds: ['angles_on_lines_and_circles', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '14a', label: '14(a)', marks: 3,  topic: 'number',   skill: 'Estimating + Significant Figures',                                                                        skillIds: ['estimating', 'significant_figures'], kind: 'mastery', visual: false, desc: '' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'number',   skill: 'Estimating',                                                                                              skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                                                       skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'show-that reasoning not markable' },
    { id: '15b', label: '15(b)', marks: 2,  topic: 'shape',    skill: 'Volume of a Sphere',                                                                                      skillIds: ['volume_of_a_sphere'], kind: 'mastery', visual: false, desc: 'answer in terms of pi; needs symbolic-equivalence checker' },
    { id: '16a', label: '16(a)', marks: 3,  topic: 'algebra',  skill: 'Substitution + Rearranging Formulae (Changing the Subject)',                                              skillIds: ['substitution', 'rearranging_formulae'], kind: 'mastery', visual: false, desc: '' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion',                                                                                      skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '17',  label: '17',    marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                                                                                       skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '18',  label: '18',    marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '19',  label: '19',    marks: 3,  topic: 'probdata', skill: 'Mean + Range',                                                                                            skillIds: ['mean', 'range'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '21',  label: '21',    marks: 2,  topic: 'shape',    skill: 'Properties of 3D Solids',                                                                                 skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: true, desc: 'requires net drawing on a grid' },
    { id: '22',  label: '22',    marks: 4,  topic: 'probdata', skill: 'Frequency Trees + Ratio',                                                                                 skillIds: ['frequency_trees', 'ratio'], kind: 'exam', visual: false, desc: 'frequency-tree multi-cell entry' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Dividing Fractions',                                                   skillIds: ['adding_and_subtracting_fractions', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '24',  label: '24',    marks: 1,  topic: 'number',   skill: 'Reciprocals',                                                                                             skillIds: ['reciprocals'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '25',  label: '25',    marks: 1,  topic: 'shape',    skill: 'Exact Trigonometric Values',                                                                              skillIds: ['exact_trig_values'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '26',  label: '26',    marks: 4,  topic: 'algebra',  skill: 'Expanding Double Brackets + Solving Quadratic Equations (Factorising) + Areas of Squares and Rectangles', skillIds: ['expanding_double_brackets', 'solving_quadratic_equations_factorising', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'static diagram supported; single positive root' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // Written from the question paper as PARALLELS, never transcriptions: same
  // context, framing and step count, different numbers and settings. See
  // docs/writing-retry-questions.md.
  //
  // 11 and 21 are the two `visual: true` items and have no entry. 11 needs a
  // pair of compasses, and 21 needs a centimetre grid wide enough to draw a
  // cuboid net on — at the 72mm a sheet gives a diagram, fourteen columns come
  // out ~5mm each, too small to draw in. Both are better absent than answered
  // with something unusable.
  retrySet: {
    '1a': { skill: 'Sequences', question: 'Write down the next number in the sequence 5, 9, 13, 17', answer: '21', working: 'The sequence goes up by 4 each time.' },
    '1b': { skill: 'Sequences', question: 'Write down the next number in the sequence 3, 6, 12, 24', answer: '48', working: 'Each term is double the one before.' },
    '1c': { skill: 'Sequences', question: 'Write down the next number in the sequence 31, 26, 21, 16', answer: '11', working: 'The sequence goes down by 5 each time.' },
    '1d': { skill: 'Simple Arithmetic', question: 'Work out 4 × (−7)', answer: '−28', working: 'A positive times a negative is negative.' },

    // 2(a)–(d) all read from ONE card, as on the paper. The six numbers are
    // chosen so each of the four answers is unique — 35 is the only multiple
    // of 5, 8 the only factor of 40, 23 the only prime, 49 the only square.
    '2a': { skill: 'Factors and Multiples', question: 'Here is a card from a game.\n18    35    23    49    8    12\nWrite down the number from the card that is a multiple of 5', answer: '35' },
    '2b': { skill: 'Factors and Multiples', question: 'Here is a card from a game.\n18    35    23    49    8    12\nWrite down the number from the card that is a factor of 40', answer: '8' },
    '2c': { skill: 'Factors and Multiples', question: 'Here is a card from a game.\n18    35    23    49    8    12\nWrite down the number from the card that is a prime number.', answer: '23', working: '49 is 7 × 7 and 35 is 5 × 7, so neither is prime.' },
    '2d': { skill: 'Indices', question: 'Here is a card from a game.\n18    35    23    49    8    12\nWrite down the number from the card that is a square number.', answer: '49', working: '49 = 7².' },

    // The original reads a pictogram with a missing key. The symbol counts are
    // stated here instead, which keeps the reasoning — scale up from a known
    // row — without needing the picture.
    '3': {
      skill: 'Simple Charts',
      question: 'The pictogram shows how many books two classes read.\nThe key is missing.\nClass A read 48 books.\nHow many books did Class B read?',
      answer: '36 books',
      working: 'Six symbols stand for 48 books, so one symbol is 8 books, and Class B has four and a half.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 9, step: 1, label: '' },
        y: { min: 0, max: 4, step: 1, label: '' },
        background:
          '<circle cx="3" cy="3" r="0.32" stroke="#333" /><circle cx="4" cy="3" r="0.32" stroke="#333" /><circle cx="5" cy="3" r="0.32" stroke="#333" /><circle cx="6" cy="3" r="0.32" stroke="#333" /><circle cx="7" cy="3" r="0.32" stroke="#333" /><circle cx="8" cy="3" r="0.32" stroke="#333" />' +
          '<circle cx="3" cy="1" r="0.32" stroke="#333" /><circle cx="4" cy="1" r="0.32" stroke="#333" /><circle cx="5" cy="1" r="0.32" stroke="#333" /><circle cx="6" cy="1" r="0.32" stroke="#333" />' +
          '<path d="M 7 0.68 A 0.32 0.32 0 0 1 7 1.32 Z" stroke="#333" />',
        labels: [
          { x: 1.2, y: 3, text: 'Class A' },
          { x: 1.2, y: 1, text: 'Class B' },
        ],
        elements: [], tolerance: 0,
      },
    },

    // 4(a) and (b) are read off a conversion graph, so the retry supplies one.
    // The grid steps are chosen so both answers land on a gridline: red 4 and
    // yellow 6 are both ruled, as are red 8 and yellow 12.
    '4a': {
      skill: 'Understanding Straight Line Graphs',
      question: 'The graph shows how much red and yellow paint to mix to make orange paint. Ola uses 6 litres of yellow paint. Write down how much red paint Ola uses.',
      answer: '4 litres',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 12, step: 2, label: 'Red paint (litres)' },
        y: { min: 0, max: 12, step: 2, label: 'Yellow paint (litres)' },
        background: '<polyline points="0,0 8,12" stroke="#333" />',
        elements: [{ x: 4, y: 6, marks: 1 }],
        tolerance: 0,
      },
    },
    '4b': {
      skill: 'Understanding Straight Line Graphs',
      question: 'The graph shows how much red and yellow paint to mix to make orange paint. Pip uses 12 litres of yellow paint. How much orange paint does Pip make?',
      answer: '20 litres',
      working: 'The graph gives 8 litres of red, and the orange is the two mixed: 8 + 12.',
      diagram: {
        mode: 'points',
        x: { min: 0, max: 12, step: 2, label: 'Red paint (litres)' },
        y: { min: 0, max: 12, step: 2, label: 'Yellow paint (litres)' },
        background: '<polyline points="0,0 8,12" stroke="#333" />',
        elements: [{ x: 8, y: 12, marks: 1 }],
        tolerance: 0,
      },
    },

    '5': { skill: 'Simple Arithmetic', question: 'A number is divided by 7. The answer is 36 remainder 4. Work out the number.', answer: '256', working: '7 × 36 = 252, then add the remainder.' },
    '6': { skill: 'Simple Arithmetic', question: 'Rosa buys 150 mugs for £6 each. She sells the mugs for £8 each. What is the least number of mugs she must sell to make a profit?', answer: '113', working: 'The mugs cost £900, and 112 sold gives only £896.' },
    '7a': { skill: 'Simple Arithmetic', question: 'Trainers cost £40 a pair. There is an offer: buy one pair and get a second pair for half price. Bea wants two pairs and saves £14 every week. Assume the offer is permanent. How many weeks does Bea need to save for? You must show your working.', answer: '5 weeks', working: 'Two pairs cost £40 + £20 = £60, and 4 weeks gives only £56.' },
    '7b': { skill: 'Simple Arithmetic', question: 'Trainers cost £40 a pair and Bea saves £14 a week. With an offer of a second pair at half price, two pairs cost £60 and Bea needs 5 weeks to save up. In fact the offer ends, so she must pay full price for both pairs. What does this mean about the number of weeks she needs to save for?\nTick one box.\n[   ] fewer than 5 weeks\n[   ] exactly 5 weeks\n[   ] more than 5 weeks\n[   ] it is not possible to tell', answer: 'More than 5 weeks', working: 'Two pairs at full price is £80, which takes longer to save.' },
    '8': { skill: 'Proportion', question: 'Here is a list of ingredients for pancakes for 6 people.\nFlour   240 g\nMilk    450 ml\nEggs    2\nHow many grams of flour are needed to make pancakes for 15 people?', answer: '600 g', working: '240 ÷ 6 = 40 g each, then × 15.' },

    // 9(a) and (b) share one pair of boxes, as on the paper.
    '9a': { skill: 'Ratio', question: 'Box A holds discs numbered 3, 5, 5 and 7.\nBox B holds discs numbered 2, 4, 6, 8 and 10.\nWork out the ratio total value of the numbers in Box A : total value of the numbers in Box B.\nGive your answer in its simplest form.', answer: '2 : 3', working: 'Box A totals 20 and Box B totals 30, and 20 : 30 divides by 10.' },
    '9b': { skill: 'Calculating Simple Probability', question: 'Box A holds discs numbered 3, 5, 5 and 7.\nOne disc is picked at random from Box A.\nWrite down the probability that the number on the disc is greater than 6', answer: '1/4', working: 'Only the 7 is greater than 6, out of four discs.' },

    '10': { skill: 'Substitution', question: 'Work out the value of 3(b² − 2b) when b = 5', answer: '45', working: '25 − 10 = 15, then × 3.' },
    // 11 is `visual: true`. Its figure is just a line segment with the
    // centre marked — plain paper, no ruling, which is what showGrid:false
    // is for. The student still needs a pair of compasses.
    '11': {
      skill: 'Constructions',
      question: 'In this question use a pair of compasses.\nThe line shown is the diameter of a circle, centre X.\nDraw the circle.',
      answer: 'A circle passing through both ends of the line, centred on X',
      working: 'Open the compasses to the distance from X to one end, then draw all the way round.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polyline points="2,2.5 8,2.5" stroke="#333" /><circle cx="5" cy="2.5" r="0.1" fill="#333" />',
        labels: [{ x: 5, y: 2.5, text: 'X', dy: -8 }],
        elements: [], tolerance: 0,
      },
    },
    '12a': { skill: 'Fractions of Amounts', question: 'One day, a bus company runs 180 buses and one sixth of these buses are late. The company is fined £240 for each late bus. How much is the company fined that day?', answer: '£7200', working: '180 ÷ 6 = 30 late buses, then × £240.' },
    '12b': { skill: 'Ratio', question: 'Sandwiches are sold at a station in the ratio cheese : ham : tuna = 4 : 3 : 5. 1800 sandwiches are sold. How many ham sandwiches are sold?', answer: '450', working: '12 parts altogether, so one part is 150.' },
    '13': {
      skill: 'Angles on lines and Circles',
      question: 'PQ is a straight line, and three angles meet at a point on it.\nWork out the value of x.\nNot drawn accurately.',
      answer: 'x = 26',
      working: 'Angles on a straight line add to 180°, so 5x + 50 = 180.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 6, step: 1, label: '' },
        background: '<polyline points="1,2 9,2" stroke="#333" /><polyline points="5,2 3,5" stroke="#333" /><polyline points="5,2 7,5" stroke="#333" />',
        labels: [
          { x: 1, y: 2, text: 'P', dx: -10 },
          { x: 9, y: 2, text: 'Q', dx: 10 },
          { x: 4, y: 2.4, text: '3x' },
          { x: 5, y: 3.6, text: '2x + 10' },
          { x: 6.3, y: 2.4, text: '40°' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '14a': { skill: 'Estimating', question: 'By rounding each number to 1 significant figure, estimate the value of 3.4 × 5.2 + 2.3². You must show your working.', answer: '19', working: '3 × 5 = 15 and 2² = 4.' },
    '14b': { skill: 'Estimating', question: 'An estimate of 3.4 × 5.2 + 2.3² is made by rounding each number to 1 significant figure, giving 19. Is 19 an overestimate or an underestimate of the true value? Give a reason for your answer.\n[   ] Overestimate\n[   ] Underestimate', answer: 'Underestimate', working: 'Every number was rounded down, so the estimate must be below the true value.' },
    '15a': { skill: 'Parts of a Circle', question: 'A sphere has diameter 12 cm. Show that the radius of the sphere is 6 cm', answer: 'The radius is half the diameter, and 12 ÷ 2 = 6' },
    '15b': { skill: 'Volume of a Sphere', question: 'The volume of a sphere is (4/3) × pi × r³, where r is the radius. Work out the volume of a sphere with diameter 12 cm. Give your answer in terms of pi.', answer: '288 pi cm³', working: 'r = 6, so r³ = 216, and 4 ÷ 3 × 216 = 288.' },
    '16a': { skill: 'Rearranging Formulae (Changing the Subject)', question: 'The number of days d to complete a job and the number of workers w are related by d = 600 ÷ w. Assume the job needs completing in 25 days. How many workers are needed?', answer: '24 workers', working: '25 = 600 ÷ w, so w = 600 ÷ 25.' },
    '16b': { skill: 'Inverse Proportion', question: 'The number of days d to complete a job and the number of workers w are related by d = 600 ÷ w, and completing the job in 25 days needs 24 workers. In fact, the job needs completing in fewer than 25 days. What does this mean about the number of workers needed?\nTick one box.\n[   ] fewer than 24\n[   ] exactly 24\n[   ] more than 24', answer: 'More than 24 workers', working: 'Days × workers is fixed, so fewer days needs more workers.' },
    '17': { skill: 'Parts of a Circle', question: 'A chord is drawn on a circle. Which statement is correct?\nTick one box.\n[   ] The chord must be shorter than the diameter\n[   ] The chord must be equal in length to the diameter\n[   ] The chord must be longer than the diameter\n[   ] The chord is never longer than the diameter', answer: 'The chord is never longer than the diameter', working: 'The longest chord a circle has is a diameter, so equal is possible but longer is not.' },
    '18': { skill: 'Compound Units', question: 'A metal solid has volume 14 cm³. The density of the metal is 7.5 g/cm³. Work out the mass of the solid.', answer: '105 g', working: 'Mass = density × volume.' },
    '19': { skill: 'Mean', question: 'The mean and range of the scores of two teams are:\nTeam X: mean 48, range 12\nTeam Y: mean 52, range 9\nFor each statement, state whether it is true, may be true, or not true.\n(i)   On average, Team Y scored higher\n(ii)  There are more players in Team X\n(iii) Team X had a greater spread of scores', answer: '(i) True, (ii) May be true, (iii) True', working: 'The mean compares averages and the range compares spread; neither says anything about how many players there are.' },
    '20a': { skill: 'Standard Form', question: 'Work out 0.8 ÷ 1000. Give your answer in standard form.', answer: '8 × 10⁻⁴', working: '0.8 ÷ 1000 = 0.0008' },
    '20b': { skill: 'Standard Form', question: 'Work out 50 × 60 × 10⁴. Give your answer in standard form.', answer: '3 × 10⁷', working: '50 × 60 = 3000, and 3000 × 10⁴ = 3 × 10³ × 10⁴.' },

    // 21 is `visual: true`. It was written off as impossible on the strength
    // of a hard-coded 72mm diagram width, which made a twelve-column grid come
    // out at 5mm a square; diagrams are sized from the SQUARE now, so this is
    // about 110mm across and perfectly drawable.
    //
    // Part of the net is given, as on the paper — "complete the drawing" is a
    // different question from "draw a net", and the given face fixes where the
    // rest goes.
    '21': {
      skill: 'Properties of 3D Solids',
      question: 'The diagram shows part of the net of a cuboid measuring 4 cm by 3 cm by 2 cm.\nComplete the drawing of the net on the centimetre grid.',
      answer: 'The four faces still to draw are 4 × 3, 4 × 2, 4 × 2 and 3 × 2 (two of each size in total), arranged so every edge meets a matching edge',
      working: 'A cuboid has three pairs of identical faces: two 4 × 3, two 4 × 2 and two 3 × 2.',
      diagram: {
        mode: 'cells', showAxes: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 7, step: 1, label: '' },
        // The 4 × 3 face, given.
        background: '<rect x="2" y="2" width="4" height="3" stroke="#333" />',
        elements: [], tolerance: 0,
      },
    },

    // The original asks for a completed frequency tree. The reasoning is the
    // same here, with one value asked for instead of five boxes — which is how
    // the same idea is often asked when there is no tree printed.
    '22': {
      skill: 'Frequency Trees',
      question: '240 students from Year 8 and Year 9 take part in a competition.\nThe ratio number of Year 8 students : number of Year 9 students is 1 : 3\n96 students win a medal, and 70 of the students who win a medal are in Year 9.\nComplete the frequency tree, and write down how many Year 8 students do not win a medal.',
      answer: '34 Year 8 students do not win a medal',
      working: 'Year 8 has 240 ÷ 4 = 60 students; 96 − 70 = 26 of them win a medal, so 60 − 26 = 34 do not.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 9, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="1,4 4,6.5" stroke="#333" /><polyline points="1,4 4,1.5" stroke="#333" />' +
          '<polyline points="4.7,6.5 7.5,7.5" stroke="#333" /><polyline points="4.7,6.5 7.5,5.5" stroke="#333" />' +
          '<polyline points="4.7,1.5 7.5,2.5" stroke="#333" /><polyline points="4.7,1.5 7.5,0.5" stroke="#333" />',
        labels: [
          { x: 0.6, y: 4, text: '240' },
          { x: 4.3, y: 6.5, text: 'Year 8' },
          { x: 4.3, y: 1.5, text: 'Year 9' },
          { x: 8.2, y: 7.5, text: 'medal' },
          { x: 8.2, y: 5.5, text: 'no medal' },
          { x: 8.2, y: 2.5, text: 'medal' },
          { x: 8.2, y: 0.5, text: 'no medal' },
        ],
        elements: [], tolerance: 0,
      },
    },

    '23': { skill: 'Adding and Subtracting Fractions + Dividing Fractions', question: 'Work out 3/10 + 1/4 ÷ 1/2. Give your answer as a fraction.', answer: '4/5', working: 'Divide first: 1/4 ÷ 1/2 = 1/2, then 3/10 + 5/10 = 8/10.' },
    '24': { skill: 'Reciprocals', question: 'y = 1 ÷ x. Which of these values of x gives the greatest value of y? Circle your answer.\n12     1/4     50     −6     30', answer: '1/4', working: 'The smallest positive x gives the largest 1 ÷ x, and a negative x makes y negative.' },
    '25': { skill: 'Exact Trigonometric Values', question: 'Circle the value of cos 90 degrees.\n0     1/2     1/sqrt2     sqrt3/2     1', answer: '0', working: 'cos 0° is 1 and cos 90° is 0 — at Foundation the exact values asked for are the ones at 0° and 90°.' },
    '26': {
      skill: 'Solving Quadratic Equations (Factorising)',
      question: 'The area of the rectangle is 96 cm².\nWork out the value of x.\nNot drawn accurately.',
      answer: 'x = 8',
      working: 'Expanding gives x² + 6x − 112 = 0, which factorises to (x + 14)(x − 8) = 0; x must be positive.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 5, step: 1, label: '' },
        background: '<polygon points="2,1 8,1 8,4 2,4" stroke="#333" />',
        labels: [
          { x: 5, y: 1, text: '(x + 8) cm', dy: 14 },
          { x: 2, y: 2.5, text: '(x − 2) cm', dx: -30 },
        ],
        elements: [], tolerance: 0,
      },
    },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
