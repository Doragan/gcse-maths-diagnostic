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
    '1': {
      skill: 'Simultaneous Equations',
      question: 'Solve the simultaneous equations\n4x + 3y = 27\n4x + y = 17',
      answer: 'x = 3, y = 5',
      working: 'Subtracting the equations eliminates x: 2y = 10.',
    },
    '2': { skill: 'Inequalities', question: '2.15 < <frac>x/6</frac> < 2.30, where x is an integer. Work out the value of x.', answer: 'x = 13', working: 'Multiplying through by 6 gives 12.9 < x < 13.8.' },

    // Shared with 1F — see the note above.
    '3': {
      skill: 'Compound Units',
      question: 'A metal solid has a volume of 14 cm³.\nThe density of the metal is 7.5 g/cm³.\nWork out the mass of the solid.',
      answer: '105 g',
      working: 'Mass = density × volume.',
    },
    '4': { skill: 'Interquartile Range', question: 'Here are 11 numbers: 4, 7, 9, 11, 15, 18, 20, 24, 27, 30, 35. Work out the interquartile range.', answer: '18', working: 'With 11 values the quartiles are the 3rd and 9th, so 27 − 9.' },
    '5': {
      skill: 'Mean + Range',
      question: 'The table shows the mean and range of the scores of two teams.\n<table> | Mean | Range\nTeam X | 48 | 12\nTeam Y | 52 | 9</table>\nFor each statement, state whether it is true, may be true, or not true.\n(i)   On average, Team Y scored higher\n(ii)  There are more players in Team X\n(iii) Team X had a greater spread of scores',
      answer: '(i) True, (ii) May be true, (iii) True',
      working: 'The mean compares averages and the range compares spread; neither says anything about how many players there are.',
    },
    '6a': { skill: 'Standard Form', question: 'Work out 0.8 ÷ 1000. Give your answer in standard form.', answer: '8 × 10⁻⁴', working: '0.8 ÷ 1000 = 0.0008' },
    '6b': { skill: 'Standard Form', question: 'Work out 50 × 60 × 10⁴. Give your answer in standard form.', answer: '3 × 10⁷', working: '50 × 60 = 3000, and 3000 × 10⁴ = 3 × 10³ × 10⁴.' },
    '7': {
      // Same question as 1F 22 on the crossover, so the same tree.
      skill: 'Frequency Trees + Ratio',
      question: '240 students from Year 8 and Year 9 take part in a competition.\nThe ratio number of Year 8 students : number of Year 9 students is 1 : 3\n96 students win a medal, and 70 of the students who win a medal are in Year 9.\nComplete the frequency tree, and write down how many Year 8 students do not win a medal.',
      answer: '34',
      working: 'Year 8 has 240 ÷ 4 = 60 students, and 96 − 70 = 26 of them win a medal.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 9, step: 1, label: '' },
        y: { min: 0, max: 8, step: 1, label: '' },
        background: '<polyline points="1,4 3.9,6.5" stroke="#333" fill="none" /><polyline points="1,4 3.9,1.5" stroke="#333" fill="none" /><polyline points="4.9,6.5 7.5,7.5" stroke="#333" fill="none" /><polyline points="4.9,6.5 7.5,5.5" stroke="#333" fill="none" /><polyline points="4.9,1.5 7.5,2.5" stroke="#333" fill="none" /><polyline points="4.9,1.5 7.5,0.5" stroke="#333" fill="none" /><polyline points="0.05,3.7 0.95,3.7 0.95,4.3 0.05,4.3 0.05,3.7" stroke="#333" fill="none" /><polyline points="3.95,6.2 4.85,6.2 4.85,6.8 3.95,6.8 3.95,6.2" stroke="#333" fill="none" /><polyline points="3.95,1.2 4.85,1.2 4.85,1.8 3.95,1.8 3.95,1.2" stroke="#333" fill="none" /><polyline points="7.6,7.2 8.5,7.2 8.5,7.8 7.6,7.8 7.6,7.2" stroke="#333" fill="none" /><polyline points="7.6,5.2 8.5,5.2 8.5,5.8 7.6,5.8 7.6,5.2" stroke="#333" fill="none" /><polyline points="7.6,2.2 8.5,2.2 8.5,2.8 7.6,2.8 7.6,2.2" stroke="#333" fill="none" /><polyline points="7.6,0.2 8.5,0.2 8.5,0.8 7.6,0.8 7.6,0.2" stroke="#333" fill="none" />',
        labels: [
          { x: 0.5, y: 4, text: '240' },
          { x: 2.45, y: 6, text: 'Year 8' },
          { x: 2.45, y: 2, text: 'Year 9' },
          { x: 6.1, y: 7.45, text: 'medal' },
          { x: 6.1, y: 5.35, text: 'no medal' },
          { x: 6.1, y: 2.45, text: 'medal' },
          { x: 6.1, y: 0.35, text: 'no medal' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '8': { skill: 'Adding and Subtracting Fractions + Dividing Fractions', question: 'Work out <frac>3/10</frac> + <frac>1/4</frac> ÷ <frac>1/2</frac>. Give your answer as a fraction.', answer: '<frac>4/5</frac>', working: 'Divide first: <frac>1/4</frac> ÷ <frac>1/2</frac> = <frac>1/2</frac>, then <frac>3/10</frac> + <frac>5/10</frac> = <frac>8/10</frac>.' },
    '9': { skill: 'Reciprocals', question: 'y = 1 ÷ x. Which of these values of x gives the greatest value of y? Circle your answer.\n12     <frac>1/4</frac>     50     −6     30', answer: '<frac>1/4</frac>', working: 'The smallest positive x gives the largest 1 ÷ x, and a negative x makes y negative.' },
    '10': {
      skill: 'Expanding Double Brackets + Solving Quadratic Equations (Factorising) + Areas of Squares and Rectangles',
      question: 'The diagram shows a rectangle with an area of 96 cm².\nWork out the value of x.\nNot drawn accurately.',
      answer: 'x = 8',
      working: 'Expanding gives x² + 6x − 112 = 0, which factorises to (x + 14)(x − 8) = 0; x must be positive.',
      diagram: {
        mode: 'polygon', showAxes: false, showGrid: false,
        x: { min: 0, max: 13, step: 1, label: '' },
        y: { min: 0, max: 6, step: 1, label: '' },
        background: '<polygon points="2,1 10,1 10,5 2,5" stroke="#333" fill="none" />',
        labels: [
          { x: 6, y: 1, text: '(x + 8) cm', dy: 14 },
          { x: 10, y: 3, text: '(x − 2) cm', dx: 38 },
        ],
        elements: [], tolerance: 0,
      },
    },

    // The original reads both shapes off a grid. Naming the matching vertices
    // in the text carries the same work without one.
    '11a': {
      skill: 'Translations',
      question: 'Shape B is the image of shape A after a translation.\nWrite down the translation vector that maps shape A to shape B.',
      answer: 'The column vector 5 over −2',
      working: 'A moves 5 to the right and 2 down.',
      diagram: {
        mode: 'polygon',
        x: { min: 0, max: 10, step: 1, label: 'x' },
        y: { min: 0, max: 6, step: 1, label: 'y' },
        background: '<polygon points="2,3 4,3 2,5" stroke="#333" fill="none" /><polygon points="7,1 9,1 7,3" stroke="#333" fill="none" />',
        labels: [
          { x: 2.6, y: 3.5, text: 'A' },
          { x: 7.6, y: 1.5, text: 'B' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '11b': {
      skill: 'Rotations',
      question: 'Triangle B is the image of triangle A after a rotation.\nDescribe fully the rotation that maps triangle A to triangle B.',
      answer: 'A rotation of 180° about the origin (0, 0)',
      working: 'Every vertex maps to the opposite side of the origin; a half turn needs no direction.',
      diagram: {
        mode: 'polygon',
        x: { min: -5, max: 5, step: 1, label: 'x' },
        y: { min: -5, max: 5, step: 1, label: 'y' },
        background: '<polygon points="1,1 3,1 1,4" stroke="#333" fill="none" /><polygon points="-1,-1 -3,-1 -1,-4" stroke="#333" fill="none" />',
        labels: [
          { x: 1.6, y: 1.6, text: 'A' },
          { x: -1.6, y: -1.6, text: 'B' },
        ],
        elements: [], tolerance: 0,
      },
    },

    '12': { skill: 'Ratio', question: 'Priya and Raj share some money in the ratio 7 : 4. Priya has £36 more than Raj. How much do they have altogether?', answer: '£132', working: 'The difference is 3 parts, so one part is £12 and there are 11 parts.' },
    '13': { skill: 'Indices', question: 'c and d are consecutive cube numbers, where c < 2.7³ < d. Work out the value of d − c.', answer: '19', working: '2.7³ = 19.68, which lies between 2³ = 8 and 3³ = 27.' },
    '14a': {
      skill: 'Sketching Functions',
      question: 'The table shows values of x for the graph of y = 3ˣ.\n<table>x | −1 | 0 | 1 | 2\ny |  |  |  | </table>\nComplete the table of values.',
      answer: '<frac>1/3</frac>, 1, 3, 9',
      working: '3⁻¹ = <frac>1/3</frac> and 3⁰ = 1.',
    },

    // 14(b) is `visual: true`. I claimed this grid was "two columns by nine
    // rows at any width" — it is nine rows only because I fixed the y step at
    // 1 for no reason. At a step of 3 it is three by three.
    //
    // Only (1, 3) and (2, 9) land on a ruled line, and that is CORRECT here: a
    // curve is plotted through points wherever they fall, and demanding
    // lattice values would have meant a different function.
    '14b': {
      skill: 'Sketching Functions',
      question: 'The table shows values of x for the graph of y = 3ˣ.\n<table>x | −1 | 0 | 1 | 2\ny |  |  |  | </table>\nDraw the graph of y = 3ˣ for values of x from −1 to 2.',
      answer: 'A smooth curve through (−1, <frac>1/3</frac>), (0, 1), (1, 3) and (2, 9)',
      working: 'The curve rises slowly at first and then steeply; it never touches the x-axis.',
      diagram: {
        mode: 'polyline',
        x: { min: -1, max: 2, step: 1, label: 'x' },
        y: { min: 0, max: 9, step: 1, label: 'y' },
        background: '',
        elements: [{ x: -1, y: 0.3333333333333333, marks: 1 }, { x: 0, y: 1, marks: 1 }, { x: 1, y: 3, marks: 1 }, { x: 2, y: 9, marks: 1 }], tolerance: 0,
      },
    },

    '15': { skill: 'Circle Theorem: Angle at Centre + Angles on lines and Circles', question: 'A, B and C are points on a circle, and AC is a diameter. Angle BAC = 34°. Work out the size of angle BCA.', answer: '56°', working: 'The angle in a semicircle is 90°, so the angles of triangle ABC are 90°, 34° and x.' },

    // The original matches set notation to shaded Venn diagrams. Neither the
    // diagrams nor the notation survive a text sheet — the intersection and
    // union signs fall outside WinAnsi and print as gaps — so this asks for
    // the same set reasoning as a count.
    '16': { skill: 'Venn Diagrams', question: 'In a group of 60 people, 28 like tea, 35 like coffee and 12 like both. How many like neither tea nor coffee?', answer: '9', working: '28 + 35 − 12 = 51 like at least one of them.' },

    '17a': {
      skill: 'Tree Diagrams',
      question: 'The tree diagram shows the probability of rain and of a bus being on time.\nWhen it is raining, the probability that the bus is on time is half the probability when it is not raining.\nComplete the two missing probabilities on the tree diagram.',
      answer: '0.4 and 0.6',
      working: 'Half of 0.8 is 0.4, and the two on a pair of branches add to 1.',
      diagram: {
        mode: 'points', showAxes: false, showGrid: false,
        x: { min: 0, max: 10, step: 1, label: '' },
        y: { min: 0, max: 9, step: 1, label: '' },
        background: '<polyline points="1,4.3 3.4,6.7" stroke="#333" fill="none" /><polyline points="1,4.3 3.4,1.9" stroke="#333" fill="none" /><polyline points="4.8,6.7 7.2,7.8" stroke="#333" fill="none" /><polyline points="4.8,6.7 7.2,5.5" stroke="#333" fill="none" /><polyline points="4.8,1.9 7.2,3" stroke="#333" fill="none" /><polyline points="4.8,1.9 7.2,0.8" stroke="#333" fill="none" /><polyline points="5.55,7.6 6.45,7.6 6.45,8.2 5.55,8.2 5.55,7.6" stroke="#333" fill="none" /><polyline points="5.3,5.05 6.2,5.05 6.2,5.65 5.3,5.65 5.3,5.05" stroke="#333" fill="none" />',
        labels: [
          { x: 2.2, y: 6.05, text: '0.3' },
          { x: 2.2, y: 2.55, text: '0.7' },
          { x: 6, y: 2.9, text: '0.8' },
          { x: 6, y: 0.65, text: '0.2' },
          { x: 4.1, y: 6.7, text: 'Rain' },
          { x: 4.1, y: 1.9, text: 'No rain' },
          { x: 7.9, y: 7.8, text: 'On time' },
          { x: 8.1, y: 5.5, text: 'Not on time' },
          { x: 7.9, y: 3, text: 'On time' },
          { x: 8.1, y: 0.8, text: 'Not on time' },
        ],
        elements: [], tolerance: 0,
      },
    },
    '17b': { skill: 'Tree Diagrams', question: 'The probability that it rains is 0.3, and when it is raining the probability that a bus is not on time is 0.6. Work out the probability that it is raining and the bus is not on time.', answer: '0.18', working: '0.3 × 0.6' },
    '18': {
      skill: 'Exact Trigonometric Values + Expanding and Rationalising Surds',
      question: 'Show that (sin 60° × tan 45°) ÷ cos 30° can be written as an integer.',
      answer: 'sin 60° = √3 ÷ 2 and cos 30° = √3 ÷ 2, so they cancel; tan 45° = 1, leaving 1 × 1 = 1',
      working: 'sin 60° and cos 30° are equal, and tan 45° = 1, so the expression is 1.',
    },
    '19a': { skill: 'Fractional and Negative Indices', question: 'Work out the value of <frac>25/4</frac> to the power −<frac>3/2</frac>', answer: '<frac>8/125</frac>', working: 'Invert for the negative power, square root for the half, then cube: (<frac>2/5</frac>)³.' },
    '19b': { skill: 'Fractional and Negative Indices', question: '1024 = 2ⁿ. Work out the value of n.', answer: 'n = 10', working: 'Doubling from 1: 2, 4, 8, … 1024 is the tenth.' },
    '20': { skill: 'Simplifying Surds', question: 'Express √18 + √50 + √98 in the form a√n, where a and n are integers.', answer: '15√2', working: 'Each term is a multiple of √2: 3 + 5 + 7.' },

    // 21(a) and (b) are `visual: true` and get grids. f is given as a polyline
    // through lattice points so both transformations land on ruled lines.
    '21a': {
      skill: 'Graph Transformations',
      question: 'The graph of y = f(x) is drawn on the grid for values of x from 0 to 4.\nOn the same grid, draw the graph of y = −f(x).',
      answer: 'A curve through (0, −2), (1, −4), (2, −2), (3, 0) and (4, 2).',
      working: 'y = −f(x) reflects the graph in the x-axis, so every y-value changes sign.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 4, step: 1, label: 'x' },
        // One axis for BOTH parts: y = -f(x) reaches -4 and y = f(x) + 2 reaches 6,
        // so a range covering both lets (a) and (b) share one printed grid — which
        // is how the paper sets them, and what sameGrid() needs to draw it once.
        y: { min: -4, max: 6, step: 2, label: 'y' },
        background: '<polyline points="0,2 1,4 2,2 3,0 4,-2" stroke="#333" />',
        elements: [{ x: 0, y: -2, marks: 1 }, { x: 1, y: -4, marks: 1 }, { x: 2, y: -2, marks: 1 }, { x: 3, y: 0, marks: 1 }, { x: 4, y: 2, marks: 1 }],
        tolerance: 0,
      },
    },
    '21b': {
      skill: 'Graph Transformations',
      question: 'The graph of y = f(x) is drawn on the grid for values of x from 0 to 4.\nOn the same grid, draw the graph of y = f(x) + 2.',
      answer: 'A curve through (0, 4), (1, 6), (2, 4), (3, 2) and (4, 0).',
      working: 'Adding 2 raises the whole graph by 2, leaving the x-values alone.',
      diagram: {
        mode: 'polyline',
        x: { min: 0, max: 4, step: 1, label: 'x' },
        y: { min: -4, max: 6, step: 2, label: 'y' },
        background: '<polyline points="0,2 1,4 2,2 3,0 4,-2" stroke="#333" />',
        elements: [{ x: 0, y: 4, marks: 1 }, { x: 1, y: 6, marks: 1 }, { x: 2, y: 4, marks: 1 }, { x: 3, y: 2, marks: 1 }, { x: 4, y: 0, marks: 1 }],
        tolerance: 0,
      },
    },

    '22': { skill: 'Coordinates + Ratio', question: 'E is the point (2, 3) and G is the point (11, 12). F lies on the straight line EG so that EF is one third of EG. Work out the coordinates of F.', answer: '(5, 6)', working: 'E to G is 9 right and 9 up, so E to F is 3 right and 3 up.' },
    '23a': { skill: 'Completing the Square', question: 'Write x² + 10x + 32 in the form (x + a)² + b, where a and b are integers.', answer: '(x + 5)² + 7', working: '(x + 5)² = x² + 10x + 25, and 32 − 25 = 7.' },
    '23b': { skill: 'Completing the Square', question: 'A curve has the equation y = (x + 4)² − 5. Write down the coordinates of the turning point of the curve.', answer: '(−4, −5)', working: 'The bracket is zero when x = −4, and that is where y is least.' },
    '24': { skill: 'Algebraic Fractions + Algebraic Proof + Difference of Two Squares', question: 'Prove that <frac>x² − 9/x + 3</frac> − (x − 3) is equal to 0 for every value of x except x = −3', answer: 'It simplifies to 0', working: 'x² − 9 is (x + 3)(x − 3), so the fraction cancels to x − 3, and (x − 3) − (x − 3) = 0.' },
    '25': { skill: 'Conditional Probability + Solving Quadratic Equations (Factorising) + Algebraic Fractions', question: 'There are n counters in a box, and 5 of them are red. Two counters are chosen at random without replacement. The probability that both counters are red is <frac>2/9</frac>. Use an algebraic method to work out the value of n.', answer: 'n = 10', working: '<frac>5/n</frac> × <frac>4/n − 1</frac> = <frac>2/9</frac> gives n² − n − 90 = 0, which factorises to (n − 10)(n + 9) = 0.' },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
