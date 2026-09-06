import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/JUN25-F-P3.json by
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
export const AQA_8300_3F_JUN25: PaperConfig = {
  id: 'aqa-8300-3f-jun25',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                            skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'requires drawing the next pattern on a grid' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                                            skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'static pattern diagram supported' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                                          skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                                   skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'requires structured listing with set-equality marking' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability + Systematic Listing',                                  skillIds: ['calculating_simple_probability', 'systematic_listing'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '4c',  label: '4(c)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                                    skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'operation entered into a machine box; needs operation-equivalence check' },
    { id: '5a',  label: '5(a)',  marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'multi-blank table; each cell must be in the column\'s form' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                                   skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'static grid diagram supported' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Converting Measurements',                                                              skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'genuine unit-select per row' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                                                    skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show-that requires the intermediate product to be evidenced' },
    { id: '7b',  label: '7(b)',  marks: 3,  topic: 'number',   skill: 'Percentage Change + Simple Arithmetic',                                                skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'choice credited only with comparable totals shown' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Solving Linear Equations',                                         skillIds: ['simple_arithmetic', 'solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 3,  topic: 'number',   skill: 'Indices',                                                                              skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'two answers in one part; needs a two-blank response' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'number',   skill: 'Indices + Decimals',                                                                   skillIds: ['indices', 'decimals'], kind: 'mastery', visual: false, desc: 'tick credited only with comparable values or a worded reason' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'probdata', skill: 'Mode + Simple Arithmetic',                                                             skillIds: ['mode', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'units are part of the answer and the coin set must be evidenced' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'probdata', skill: 'Median',                                                                               skillIds: ['median'], kind: 'mastery', visual: false, desc: '' },
    { id: '11',  label: '11',    marks: 3,  topic: 'number',   skill: 'Percentage Change + Simple Arithmetic',                                                skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '12',  label: '12',    marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                                                       skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; two distinct faults must be named' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Areas of Squares and Rectangles + Areas of Triangles + Ratio',                         skillIds: ['areas_of_squares_and_rectangles', 'areas_of_triangles', 'ratio'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence check; static grid diagram supported' },
    { id: '14a', label: '14(a)', marks: 2,  topic: 'probdata', skill: 'Probability Spaces',                                                                   skillIds: ['probability_spaces'], kind: 'mastery', visual: false, desc: 'two-cell table entry' },
    { id: '14b', label: '14(b)', marks: 3,  topic: 'probdata', skill: 'Expected Outcomes + Probability Spaces',                                               skillIds: ['expected_outcomes', 'probability_spaces'], kind: 'exam', visual: false, desc: '' },
    { id: '15',  label: '15',    marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                                            skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '16',  label: '16',    marks: 4,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Solving Linear Equations + Lengths and Perimeters', skillIds: ['forming_expressions_and_formulae', 'solving_linear_equations', 'lengths_and_perimeters'], kind: 'exam', visual: false, desc: 'static diagram supported' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'recurring decimal or equivalent fraction accepted' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'probdata', skill: 'Relative Frequency',                                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'tick + worded reason; justify not markable' },
    { id: '18',  label: '18',    marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                                                           skillIds: ['pie_charts'], kind: 'mastery', visual: false, desc: 'static pie chart supported' },
    { id: '19a', label: '19(a)', marks: 4,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',                                                 skillIds: ['proportion', 'converting_measurements'], kind: 'exam', visual: false, desc: 'length measured off a grid, so the answer is accepted over a range' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'shape',    skill: 'Bearings',                                                                             skillIds: ['bearings'], kind: 'mastery', visual: false, desc: '' },
    { id: '20',  label: '20',    marks: 3,  topic: 'algebra',  skill: 'Finding the nth Term',                                                                 skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '21',  label: '21',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                                         skillIds: ['ratio', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '22',  label: '22',    marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                                       skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '23',  label: '23',    marks: 4,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                                                                 skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'show-that over two Pythagoras steps; intermediate working must be evidenced' },
    { id: '24a', label: '24(a)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'open-ended answer: any line with the same gradient; needs form-equivalence plus a not-identical check' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                                   skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'genuine circle-one-answer' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // 1(a) is the only `visual: true` item and has no retry: drawing the next
  // pattern needs the first three printed beside it, which is a picture, not a
  // grid to draw on.
  retrySet: {
    // 1(a) is `visual: true`, and it is the labels layer that makes it
    // possible: a "draw the next pattern" question is meaningless unless the
    // first three are shown AND named, and naming them is what a background
    // fragment could not do.
    //
    // Pattern n is a bottom row of n squares under a top row of n + 1, giving
    // 2n + 1 squares — the same rule 1(b) counts, so the two parts describe
    // one sequence.
    '1a': {
      skill: 'Sequences',
      question: 'Here are the first three patterns in a sequence.\nDraw Pattern 4 on the grid.',
      answer: 'A bottom row of 4 squares under a top row of 5 squares — 9 squares in total',
      working: 'Each pattern adds one square to each row.',
      diagram: {
        mode: 'cells', showAxes: false,
        x: { min: 0, max: 12, step: 1, label: '' },
        y: { min: 0, max: 3, step: 1, label: '' },
        background:
          '<rect x="0" y="1" width="1" height="1" stroke="#333" /><rect x="0" y="2" width="1" height="1" stroke="#333" /><rect x="1" y="2" width="1" height="1" stroke="#333" />' +
          '<rect x="3" y="1" width="2" height="1" stroke="#333" /><rect x="3" y="2" width="3" height="1" stroke="#333" /><rect x="4" y="1" width="1" height="1" stroke="#333" /><rect x="4" y="2" width="1" height="1" stroke="#333" /><rect x="5" y="2" width="1" height="1" stroke="#333" />' +
          '<rect x="7" y="1" width="3" height="1" stroke="#333" /><rect x="7" y="2" width="4" height="1" stroke="#333" /><rect x="8" y="1" width="1" height="1" stroke="#333" /><rect x="9" y="1" width="1" height="1" stroke="#333" /><rect x="8" y="2" width="1" height="1" stroke="#333" /><rect x="9" y="2" width="1" height="1" stroke="#333" /><rect x="10" y="2" width="1" height="1" stroke="#333" />',
        labels: [
          { x: 1, y: 1, text: 'Pattern 1', dy: 13 },
          { x: 4.5, y: 1, text: 'Pattern 2', dy: 13 },
          { x: 9, y: 1, text: 'Pattern 3', dy: 13 },
        ],
        elements: [], tolerance: 0,
      },
    },
    '1b': { skill: 'Sequences', question: 'In a sequence of patterns, Pattern 1 has 3 squares, Pattern 2 has 5 squares and Pattern 3 has 7 squares. How many squares would Pattern 6 have?', answer: '13', working: 'Each pattern adds 2, so the nth pattern has 2n + 1.' },
    '2a': { skill: 'Coordinates', question: 'The line AB is drawn on a grid. A is at the point (1, 2), and B is 6 to the right of A and 4 above it. Write down the coordinates of B.', answer: '(7, 6)' },
    '2b': { skill: 'Coordinates', question: 'A is at the point (1, 2) and B is at the point (7, 6). Write down the coordinates of the midpoint of the line AB.', answer: '(4, 4)', working: 'Halfway in each direction.' },
    '3a': { skill: 'Systematic Listing', question: 'Kai makes a drink using one type of milk and one flavour. The milk is dairy (D) or oat (O). The flavour is vanilla (V), chocolate (C) or strawberry (S). List all 6 possible drinks. One has been done for you: DV.', answer: 'DV, DC, DS, OV, OC, OS', working: 'Take each milk in turn with every flavour.' },
    '3b': { skill: 'Calculating Simple Probability', question: 'Kai makes a drink using one type of milk and one flavour. The milk is dairy or oat, and the flavour is vanilla, chocolate or strawberry. What fraction of the 6 possible drinks use chocolate?', answer: '1/3', working: '2 out of 6.' },
    '4a': { skill: 'Function Machines', question: 'A number machine multiplies the input by 3 and then subtracts 5. Work out the output when the input is 4', answer: '7' },
    '4b': { skill: 'Function Machines', question: 'A number machine multiplies the input by 3 and then subtracts 5. Work out the input when the output is 19', answer: '8', working: 'Work backwards: 19 + 5 = 24, then ÷ 3.' },
    '4c': { skill: 'Function Machines', question: 'A number machine has two steps and turns an input of x into 4x + 9. The first step is × 4. Write down the second step.', answer: '+ 9' },
    '5a': { skill: 'Fractions Decimals and Percentages', question: 'Complete the table of equivalent fractions, decimals and percentages.\n(i)   1/4 = ?   = ?%\n(ii)  ?   = 0.2 = ?%\n(iii) 3/5 = ?   = ?%', answer: '(i) 0.25 and 25%, (ii) 1/5 and 20%, (iii) 0.6 and 60%' },
    '5b': { skill: 'Fractions Decimals and Percentages', question: 'A grid is made of 20 equal squares and 7 of them are shaded. What percentage of the grid is shaded?', answer: '35%', working: '7/20 = 35/100.' },
    '6': { skill: 'Converting Measurements', question: 'Which metric unit would be most suitable for each measurement? Choose millimetres, metres or kilometres for each.\n(i)   the thickness of a coin\n(ii)  the width of a classroom\n(iii) the distance between two cities', answer: '(i) millimetres, (ii) metres, (iii) kilometres' },
    '7a': { skill: 'Simple Arithmetic', question: 'Plan A costs £420 for the phone plus £13 per month for 24 months. Show that the total cost of Plan A for 24 months is £732', answer: '£420 + £312 = £732', working: '13 × 24 = 312.' },
    '7b': { skill: 'Percentage Change', question: 'Plan A costs £732 in total for 24 months.\nPlan B has a free phone plus £38 per month for 24 months, and during a sale the total cost of Plan B is reduced by 15%.\nWhich plan is cheaper for 24 months during the sale? Show working to support your answer.\n[   ] Plan A\n[   ] Plan B', answer: 'Plan A', working: 'Plan B is £912 before the sale and £775.20 after it.' },
    '8': { skill: 'Solving Linear Equations', question: 'One coffee costs £2.40. Three coffees and four teas cost £14.00 altogether. Work out the cost of one tea.', answer: '£1.70', working: 'The coffees cost £7.20, leaving £6.80 for four teas.' },
    '9a': { skill: 'Indices', question: 'The cube of a whole number is a three-digit number. Work out the smallest number that could have been cubed, and the largest number that could have been cubed.', answer: 'Smallest 5, largest 9', working: '4³ = 64 is too small and 10³ = 1000 is too big.' },
    '9b': { skill: 'Indices', question: 'Which has the larger value, 0.6² or 0.6³? Give a reason for your answer.', answer: '0.6²', working: '0.36 against 0.216 — multiplying by a number below 1 makes it smaller each time.' },
    '10a': { skill: 'Mode', question: '£5.53 is paid using the smallest possible number of coins. What is the modal value of the coins used? You must show your working.', answer: '£2', working: 'Two £2, one £1, one 50p, one 2p and one 1p — six coins, and only £2 is used twice.' },
    '10b': { skill: 'Median', question: 'Here is a list of five numbers: 3, 11, 6, 14, 9. An extra number is put into the list, and the median of the six numbers is now 8. Work out the extra number.', answer: '7', working: 'In order the six must have 3rd and 4th values adding to 16, which 7 and 9 do.' },
    '11': { skill: 'Percentage Change', question: 'A café has 15 tables. The owner buys 8 glasses for each table, plus an extra 60% for spares. Work out how many glasses the owner buys in total.', answer: '192', working: '15 × 8 = 120, and 120 × 1.6.' },
    '12': { skill: 'Scatter Graphs', question: 'A student draws a scatter diagram and then draws their line of best fit so that it joins the first and the last point exactly. Write down two things that are wrong with drawing a line of best fit this way.', answer: 'It ignores all the other points, and it follows two particular readings rather than the overall trend', working: 'A line of best fit should pass close to as many points as possible, with roughly as many above as below.' },
    '13': { skill: 'Areas of Squares and Rectangles', question: 'A rectangle measures 5 cm by 6 cm. A triangle has a base of 10 cm and a height of 4 cm. Work out the ratio area of rectangle : area of triangle. Give your answer in its simplest form.', answer: '3 : 2', working: 'Areas of 30 and 20, both divided by 10.' },
    '14a': { skill: 'Probability Spaces', question: 'A box contains cards that are red, blue, green or yellow. P(red) = 0.15 and P(blue) = 0.29, and P(green) = P(yellow). Work out P(green) and P(yellow).', answer: '0.28 each', working: 'Red and blue take 0.44, leaving 0.56 to share equally.' },
    '14b': { skill: 'Expected Outcomes', question: 'A box contains cards that are red, blue, green or yellow, with P(red) = 0.15 and P(blue) = 0.29. There are 400 cards in the box. How many of the cards are not blue?', answer: '284', working: '1 − 0.29 = 0.71, and 400 × 0.71.' },
    '15': { skill: 'Congruence and Similarity', question: 'A and B are triangles. For each statement, tick one box — always congruent, sometimes congruent, or never congruent.\n(i)   A\'s sides are the same lengths as B\'s sides\n(ii)  A\'s angles are the same as B\'s angles\n(iii) A is an enlargement of B with scale factor 3', answer: '(i) Always, (ii) Sometimes, (iii) Never', working: 'Equal angles fix the shape but not the size; an enlargement by 3 always changes the size.' },
    '16': { skill: 'Forming Expressions and Formulae', question: 'An equilateral triangle has sides of length (3x + 4) cm, (5x − 2) cm and (2x + 7) cm. Work out the perimeter of the triangle.', answer: '39 cm', working: '3x + 4 = 5x − 2 gives x = 3, so each side is 13 cm.' },
    '17a': { skill: 'Relative Frequency', question: 'Ana throws a biased coin 50 times and the relative frequency of heads is 0.6. Ben throws the same coin 150 times and gets 78 heads. Work out the relative frequency of heads for all 200 throws.', answer: '0.54', working: 'Ana got 30 heads, so 108 out of 200.' },
    '17b': { skill: 'Relative Frequency', question: 'Which results would give the best estimate of the probability of heads?\nTick one box.\n[   ] Ana\'s 50 throws\n[   ] Ben\'s 150 throws\n[   ] all 200 throws. Give a reason for your answer', answer: 'All 200 throws', working: 'The more trials there are, the more reliable the estimate.' },
    '18': { skill: 'Pie Charts', question: 'A pie chart represents the results of matches played by a team. The sector for matches won has an angle of 144°, and the sector for matches lost has an angle of 96°. 36 matches were won. How many matches were lost?', answer: '24', working: '144° is 36 matches, so each match is 4°.' },
    '19a': { skill: 'Proportion', question: 'A scale diagram uses a scale of 1 : 250 000. On the diagram, the distance from B to C is 6 cm. Work out the actual distance from B to C, in kilometres.', answer: '15 km', working: '6 × 250 000 = 1 500 000 cm, and there are 100 000 cm in a kilometre.' },
    '19b': { skill: 'Bearings', question: 'C is South West of A. Write down the bearing of C from A.', answer: '225°', working: 'Clockwise from north: south is 180° and south west is another 45°.' },
    '20': { skill: 'Finding the nth Term', question: 'A linear sequence has 3rd term = 11 and 7th term = 27. Work out the nth term of the sequence.', answer: '4n − 1', working: '16 gained over 4 terms is 4 each time, and the 1st term is 3.' },
    '21': { skill: 'Ratio', question: 'Dan has £180. Dan\'s amount is 3/4 of Eve\'s amount, and Finn\'s amount : Eve\'s amount = 2 : 5. Work out how much money Finn has.', answer: '£96', working: 'Eve has £240, and Finn has two fifths of that.' },
    '22': { skill: 'Venn Diagrams', question: 'A Venn diagram shows two sets A and B. The region for A only contains 7 items, the overlap contains x items, the region for B only contains 11 items, and 4 items are outside both sets. There are 30 items altogether and P(A) = 1/2. Work out the value of x.', answer: 'x = 8', working: 'P(A) = 1/2 means A holds 15 items, and 15 − 7 = 8.' },
    '23': { skill: 'Pythagoras\' Theorem', question: 'A right-angled triangle has shorter sides of 6 cm and 7 cm. A second right-angled triangle has the hypotenuse of the first as one of its shorter sides, and its other shorter side is 5 cm. Use Pythagoras\' theorem to show that the hypotenuse x of the second triangle is between 10 and 11.', answer: 'x² = 110, and 10² = 100 while 11² = 121', working: 'The first hypotenuse squared is 36 + 49 = 85, then 85 + 25 = 110.' },
    '24a': { skill: 'Understanding Straight Line Graphs', question: 'Write down the equation of a straight line parallel to y − 3x = 5', answer: 'Any line of the form y = 3x + c with c not equal to 5 — for example y = 3x + 1', working: 'Parallel lines share a gradient, here 3.' },
    '24b': { skill: 'Understanding Straight Line Graphs', question: 'A straight line has gradient 4 and passes through the point (2, 5). Circle the equation of the line.\ny = 2x + 1     y = 4x     y = 4x − 3     y = 4x + 5', answer: 'y = 4x − 3', working: '4 × 2 − 3 = 5, so the point fits.' },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
