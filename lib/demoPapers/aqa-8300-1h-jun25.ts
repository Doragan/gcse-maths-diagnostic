import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1H — Higher Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-H-P1.json by
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
export const AQA_8300_1H_JUN25: PaperConfig = {
  id: 'aqa-8300-1h-jun25',
  title: 'AQA GCSE Mathematics 8300/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations',                                                                                  skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'two-value answer needs a multi-blank response' },
    { id: '2',   label: '2',     marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                                                            skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 2,  topic: 'ratio',    skill: 'Compound Units',                                                                                          skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '4',   label: '4',     marks: 2,  topic: 'probdata', skill: 'Interquartile Range',                                                                                     skillIds: ['interquartile_range'], kind: 'mastery', visual: false, desc: '' },
    { id: '5',   label: '5',     marks: 3,  topic: 'probdata', skill: 'Mean + Range',                                                                                            skillIds: ['mean', 'range'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '6a',  label: '6(a)',  marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '6b',  label: '6(b)',  marks: 2,  topic: 'number',   skill: 'Standard Form',                                                                                           skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard-form answer needs notation-equivalence checker' },
    { id: '7',   label: '7',     marks: 4,  topic: 'probdata', skill: 'Frequency Trees + Ratio',                                                                                 skillIds: ['frequency_trees', 'ratio'], kind: 'exam', visual: false, desc: 'frequency-tree multi-cell entry' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Dividing Fractions',                                                   skillIds: ['adding_and_subtracting_fractions', 'dividing_fractions'], kind: 'exam', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '9',   label: '9',     marks: 1,  topic: 'number',   skill: 'Reciprocals',                                                                                             skillIds: ['reciprocals'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
    { id: '10',  label: '10',    marks: 4,  topic: 'algebra',  skill: 'Expanding Double Brackets + Solving Quadratic Equations (Factorising) + Areas of Squares and Rectangles', skillIds: ['expanding_double_brackets', 'solving_quadratic_equations_factorising', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'static diagram supported; single positive root' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'shape',    skill: 'Translations + Vectors',                                                                                  skillIds: ['translations', 'vectors'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'shape',    skill: 'Rotations',                                                                                               skillIds: ['rotations'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines angle, direction and centre in free text' },
    { id: '12',  label: '12',    marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                                                                   skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '13',  label: '13',    marks: 2,  topic: 'number',   skill: 'Indices',                                                                                                 skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'algebra',  skill: 'Sketching Functions + Indices',                                                                           skillIds: ['sketching_functions', 'indices'], kind: 'mastery', visual: false, desc: 'multi-blank table entry' },
    { id: '14b', label: '14(b)', marks: 2,  topic: 'algebra',  skill: 'Sketching Functions',                                                                                     skillIds: ['sketching_functions'], kind: 'mastery', visual: true, desc: 'requires point-plotting and smooth-curve drawing' },
    { id: '15',  label: '15',    marks: 4,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre + Angles on lines and Circles',                                           skillIds: ['circle_theorem_angle_at_centre', 'angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '16',  label: '16',    marks: 3,  topic: 'probdata', skill: 'Venn Diagrams',                                                                                           skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'notation-to-diagram matching; needs a pairing input' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                                                           skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'tree-diagram multi-cell entry' },
    { id: '17b', label: '17(b)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams + Combined Events',                                                                         skillIds: ['tree_diagrams', 'combined_events'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '18',  label: '18',    marks: 3,  topic: 'shape',    skill: 'Exact Trigonometric Values + Expanding and Rationalising Surds',                                          skillIds: ['exact_trig_values', 'surds_expanding_and_rationalising'], kind: 'exam', visual: false, desc: 'show-that requires all three exact values to be evidenced' },
    { id: '19a', label: '19(a)', marks: 3,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                                         skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '19b', label: '19(b)', marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices',                                                                         skillIds: ['fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'number',   skill: 'Simplifying Surds',                                                                                       skillIds: ['surds_simplifying'], kind: 'mastery', visual: false, desc: 'surd answer needs symbolic-equivalence checker' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                                                   skillIds: ['graph_transformations'], kind: 'mastery', visual: true, desc: 'requires drawing a transformed curve on a grid' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                                                   skillIds: ['graph_transformations'], kind: 'mastery', visual: true, desc: 'requires drawing a transformed curve on a grid' },
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Coordinates + Ratio',                                                                                     skillIds: ['coordinates', 'ratio'], kind: 'exam', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '23a', label: '23(a)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square',                                                                                   skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square + Quadratic Functions',                                                             skillIds: ['completing_the_square', 'quadratic_functions'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '24',  label: '24',    marks: 4,  topic: 'algebra',  skill: 'Algebraic Fractions + Algebraic Proof + Difference of Two Squares',                                       skillIds: ['algebraic_fractions', 'algebraic_proof', 'difference_of_two_squares'], kind: 'exam', visual: false, desc: 'proof: the final explanation is worded, not an answer value' },
    { id: '25',  label: '25',    marks: 5,  topic: 'probdata', skill: 'Conditional Probability + Solving Quadratic Equations (Factorising) + Algebraic Fractions',               skillIds: ['conditional_probability', 'solving_quadratic_equations_factorising', 'algebraic_fractions'], kind: 'exam', visual: false, desc: 'the correct value alone scores only a special case; the algebra must be evidenced' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // THE CROSSOVER QUESTIONS ARE SHARED WITH 1F, and carry the SAME retries.
  // 3, 5, 6(a), 6(b), 7, 8, 9 and 10 here are 1F's 18, 19, 20(a), 20(b), 22,
  // 23, 24 and 26 — identical questions on both papers. Offering a student two
  // different practice questions for the same original, depending on which
  // paper they sat, is the inconsistency docs/writing-retry-questions.md warns
  // about. (coding-a-paper.md says AQA does not share across tiers; June 2025
  // shows it does, at least on paper 1.)
  //
  // 14(b) is `visual: true` and has no retry: plotting y = 3^x needs a grid
  // roughly nine rows tall and two columns wide, which at a sheet's 72mm comes
  // out as a sliver. 21(a) and 21(b) DO have grids, because f(x) can be given
  // as a polyline through lattice points on a grid that is close to square.
  retrySet: {
    '1': { skill: 'Simultaneous Equations', question: 'Solve the simultaneous equations 4x + 3y = 27 and 4x + y = 17', answer: 'x = 3, y = 5', working: 'Subtracting the equations eliminates x: 2y = 10.' },
    '2': { skill: 'Inequalities', question: '2.15 < x/6 < 2.30, where x is an integer. Work out the value of x.', answer: 'x = 13', working: 'Multiplying through by 6 gives 12.9 < x < 13.8.' },

    // Shared with 1F — see the note above.
    '3': { skill: 'Compound Units', question: 'A metal solid has volume 14 cm³. The density of the metal is 7.5 g/cm³. Work out the mass of the solid.', answer: '105 g', working: 'Mass = density × volume.' },
    '4': { skill: 'Interquartile Range', question: 'Here are 11 numbers: 4, 7, 9, 11, 15, 18, 20, 24, 27, 30, 35. Work out the interquartile range.', answer: '18', working: 'With 11 values the quartiles are the 3rd and 9th, so 27 − 9.' },
    '5': { skill: 'Mean', question: 'A table shows the mean and range of the scores of two teams. Team X: mean 48, range 12. Team Y: mean 52, range 9. Tick one box for each statement — true, may be true, or not true. (i) On average, Team Y scored higher. (ii) There are more players in Team X. (iii) Team X had a greater spread of scores.', answer: '(i) True, (ii) May be true, (iii) True', working: 'The mean compares averages and the range compares spread; neither says anything about how many players there are.' },
    '6a': { skill: 'Standard Form', question: 'Work out 0.8 ÷ 1000. Give your answer in standard form.', answer: '8 × 10⁻⁴', working: '0.8 ÷ 1000 = 0.0008' },
    '6b': { skill: 'Standard Form', question: 'Work out 50 × 60 × 10⁴. Give your answer in standard form.', answer: '3 × 10⁷', working: '50 × 60 = 3000, and 3000 × 10⁴ = 3 × 10³ × 10⁴.' },
    '7': { skill: 'Frequency Trees', question: '240 students from Year 8 and Year 9 take part in a competition. The ratio number of Year 8 students : number of Year 9 students is 1 : 3. 96 students win a medal, and 70 of the students who win a medal are in Year 9. How many Year 8 students do not win a medal?', answer: '34', working: 'Year 8 has 240 ÷ 4 = 60 students, and 96 − 70 = 26 of them win a medal.' },
    '8': { skill: 'Adding and Subtracting Fractions', question: 'Work out 3/10 + 1/4 ÷ 1/2. Give your answer as a fraction.', answer: '4/5', working: 'Divide first: 1/4 ÷ 1/2 = 1/2, then 3/10 + 5/10 = 8/10.' },
    '9': { skill: 'Reciprocals', question: 'y = 1 ÷ x. Which of these values of x gives the greatest value of y? Circle your answer: 12, 1/4, 50, −6, 30', answer: '1/4', working: 'The smallest positive x gives the largest 1 ÷ x, and a negative x makes y negative.' },
    '10': { skill: 'Solving Quadratic Equations (Factorising)', question: 'The area of a rectangle is 96 cm². Its length is (x + 8) cm and its width is (x − 2) cm. Work out the value of x.', answer: 'x = 8', working: 'Expanding gives x² + 6x − 112 = 0, which factorises to (x + 14)(x − 8) = 0; x must be positive.' },

    // The original reads both shapes off a grid. Naming the matching vertices
    // in the text carries the same work without one.
    '11a': { skill: 'Translations', question: 'Shape A has a vertex at (2, 3). Shape B is the image of shape A after a translation, and the matching vertex of shape B is at (7, 1). Write down the translation vector that maps shape A to shape B.', answer: 'The column vector 5 over −2', working: '5 to the right and 2 down.' },
    '11b': { skill: 'Rotations', question: 'Triangle A has vertices at (1, 1), (3, 1) and (1, 4). Triangle B has vertices at (−1, −1), (−3, −1) and (−1, −4). Describe fully the rotation that maps triangle A to triangle B.', answer: 'A rotation of 180° about the origin (0, 0)', working: 'Every vertex maps to the opposite side of the origin; a half turn needs no direction.' },

    '12': { skill: 'Ratio', question: 'Priya and Raj share some money in the ratio 7 : 4. Priya has £36 more than Raj. How much do they have altogether?', answer: '£132', working: 'The difference is 3 parts, so one part is £12 and there are 11 parts.' },
    '13': { skill: 'Indices', question: 'c and d are consecutive cube numbers, where c < 2.7³ < d. Work out the value of d − c.', answer: '19', working: '2.7³ = 19.68, which lies between 2³ = 8 and 3³ = 27.' },
    '14a': { skill: 'Sketching Functions', question: 'Complete the table of values for y = 3ˣ, for x = −1, 0, 1 and 2.', answer: '1/3, 1, 3, 9', working: '3⁻¹ = 1/3 and 3⁰ = 1.' },

    '15': { skill: 'Circle Theorem: Angle at Centre', question: 'A, B and C are points on a circle, and AC is a diameter. Angle BAC = 34°. Work out the size of angle BCA.', answer: '56°', working: 'The angle in a semicircle is 90°, so the angles of triangle ABC are 90°, 34° and x.' },

    // The original matches set notation to shaded Venn diagrams. Neither the
    // diagrams nor the notation survive a text sheet — the intersection and
    // union signs fall outside WinAnsi and print as gaps — so this asks for
    // the same set reasoning as a count.
    '16': { skill: 'Venn Diagrams', question: 'In a group of 60 people, 28 like tea, 35 like coffee and 12 like both. How many like neither tea nor coffee?', answer: '9', working: '28 + 35 − 12 = 51 like at least one of them.' },

    '17a': { skill: 'Tree Diagrams', question: 'The probability that it rains is 0.3. When it is not raining, the probability that a bus is on time is 0.8, and when it is raining that probability is halved. Write down the probability that the bus is on time when it is raining, and the probability that it is not on time when it is raining.', answer: '0.4 and 0.6', working: 'Half of 0.8 is 0.4, and the two must add to 1.' },
    '17b': { skill: 'Tree Diagrams', question: 'Using the probabilities above, work out the probability that it is raining and the bus is not on time.', answer: '0.18', working: '0.3 × 0.6' },
    '18': { skill: 'Exact Trigonometric Values', question: 'Show that (sin 60° × tan 45°) ÷ cos 30° can be written as an integer.', answer: '1', working: 'sin 60° and cos 30° are equal, and tan 45° = 1, so the expression is 1.' },
    '19a': { skill: 'Fractional and Negative Indices', question: 'Work out the value of (25/4) to the power −3/2', answer: '8/125', working: 'Invert for the negative power, square root for the half, then cube: (2/5)³.' },
    '19b': { skill: 'Fractional and Negative Indices', question: '1024 = 2ⁿ. Work out the value of n.', answer: 'n = 10', working: 'Doubling from 1: 2, 4, 8, … 1024 is the tenth.' },
    '20': { skill: 'Simplifying Surds', question: 'Express sqrt18 + sqrt50 + sqrt98 in the form a sqrt n, where a and n are integers.', answer: '15 sqrt2', working: 'Each term is a multiple of sqrt2: 3 + 5 + 7.' },

    // 21(a) and (b) are `visual: true` and get grids. f is given as a polyline
    // through lattice points so both transformations land on ruled lines.
    '21a': {
      skill: 'Graph Transformations',
      question: 'The graph of y = f(x) is drawn on the grid for values of x from 0 to 4. On the same grid, draw the graph of y = −f(x).',
      answer: 'A curve through (0, −2), (1, −4), (2, −2), (3, 0) and (4, 2).',
      working: 'y = −f(x) reflects the graph in the x-axis, so every y-value changes sign.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 4, step: 1, label: 'x' },
        y: { min: -4, max: 4, step: 2, label: 'y' },
        background: '<polyline points="0,2 1,4 2,2 3,0 4,-2" stroke="#333" />',
        elements: [{ x: 0, y: -2, marks: 1 }, { x: 1, y: -4, marks: 1 }, { x: 2, y: -2, marks: 1 }, { x: 3, y: 0, marks: 1 }, { x: 4, y: 2, marks: 1 }],
        tolerance: 0,
      },
    },
    '21b': {
      skill: 'Graph Transformations',
      question: 'The graph of y = f(x) is drawn on the grid for values of x from 0 to 4. On the same grid, draw the graph of y = f(x) + 2.',
      answer: 'A curve through (0, 4), (1, 6), (2, 4), (3, 2) and (4, 0).',
      working: 'Adding 2 raises the whole graph by 2, leaving the x-values alone.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 4, step: 1, label: 'x' },
        y: { min: -2, max: 6, step: 2, label: 'y' },
        background: '<polyline points="0,2 1,4 2,2 3,0 4,-2" stroke="#333" />',
        elements: [{ x: 0, y: 4, marks: 1 }, { x: 1, y: 6, marks: 1 }, { x: 2, y: 4, marks: 1 }, { x: 3, y: 2, marks: 1 }, { x: 4, y: 0, marks: 1 }],
        tolerance: 0,
      },
    },

    '22': { skill: 'Coordinates', question: 'E is the point (2, 3) and G is the point (11, 12). F lies on the straight line EG so that EF is one third of EG. Work out the coordinates of F.', answer: '(5, 6)', working: 'E to G is 9 right and 9 up, so E to F is 3 right and 3 up.' },
    '23a': { skill: 'Completing the Square', question: 'Write x² + 10x + 32 in the form (x + a)² + b, where a and b are integers.', answer: '(x + 5)² + 7', working: '(x + 5)² = x² + 10x + 25, and 32 − 25 = 7.' },
    '23b': { skill: 'Completing the Square', question: 'A curve has the equation y = (x + 4)² − 5. Write down the coordinates of the turning point of the curve.', answer: '(−4, −5)', working: 'The bracket is zero when x = −4, and that is where y is least.' },
    '24': { skill: 'Algebraic Proof', question: 'Prove that (x² − 9)/(x + 3) − (x − 3) is equal to 0 for every value of x except x = −3', answer: 'It simplifies to 0', working: 'x² − 9 is (x + 3)(x − 3), so the fraction cancels to x − 3, and (x − 3) − (x − 3) = 0.' },
    '25': { skill: 'Conditional Probability', question: 'There are n counters in a box, and 5 of them are red. Two counters are chosen at random without replacement. The probability that both counters are red is 2/9. Use an algebraic method to work out the value of n.', answer: 'n = 10', working: '5/n × 4/(n − 1) = 2/9 gives n² − n − 90 = 0, which factorises to (n − 10)(n + 9) = 0.' },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
