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
    { id: '22',  label: '22',    marks: 3,  topic: 'shape',    skill: 'Fractional and Negative Enlargements + Enlargements',                                               skillIds: ['fractional_enlargements', 'enlargements'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines a name, a scale factor and a centre in free text' },
    { id: '23',  label: '23',    marks: 5,  topic: 'shape',    skill: 'Vector Proof + Vectors + Ratio',                                                                    skillIds: ['vector_proof', 'vectors', 'ratio'], kind: 'exam', visual: false, desc: 'banded marks depend on which intermediate vectors are shown, not on the value alone' },
    { id: '24',  label: '24',    marks: 3,  topic: 'ratio',    skill: 'Proportion with Powers',                                                                            skillIds: ['proportion_with_powers'], kind: 'mastery', visual: false, desc: 'range-tolerance percentage answer' },
    { id: '25',  label: '25',    marks: 4,  topic: 'algebra',  skill: 'Composite Functions + Inverse Functions + Algebraic Proof',                                         skillIds: ['composite_functions', 'inverse_functions', 'algebraic_proof'], kind: 'exam', visual: false, desc: 'proof: the conclusion is worded, and each stage is credited separately' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  // CROSSOVER WITH 2F, carrying the SAME retries: 3(b), 4, 5(a), 5(b), 6,
  // 8(a), 8(b) and 10 here are 2F's 20(b), 21, 23(a), 23(b), 24, 25(a), 25(b)
  // and 26. 3(a) is the shared visual item and has no retry on either paper.
  retrySet: {
    '1a': { skill: 'Highest Common Factor', question: 'Work out the highest common factor (HCF) of 18 and 30', answer: '6' },
    '1b': { skill: 'Lowest Common Multiple', question: 'Work out the lowest common multiple (LCM) of 8 and 12', answer: '24' },
    '1c': { skill: 'Prime Factor Decomposition', question: 'Write 66 as a product of its prime factors.', answer: '2 × 3 × 11' },
    '2': { skill: 'Understanding Straight Line Graphs', question: 'Line A is horizontal and passes through (0, 4). Line B passes through (0, −1) and (3, 5). Write down the equation of line A, and the gradient of line B.', answer: 'Line A is y = 4, and the gradient of line B is 2', working: 'B rises 6 for every 3 across.' },

    // Shared with 2F — see the note above.
    '3b': { skill: 'Time Series', question: 'The number of views of an advert falls steadily: day 4 had 72 000 views, day 5 had 60 000 and day 6 had 48 000. The owner receives 0.02p for each view. Estimate how much is received from views on day 7.', answer: '£7.20', working: 'The views fall by about 12 000 a day, so day 7 is about 36 000, and 36 000 × 0.02p = 720p.' },
    '4': { skill: 'Fractions Decimals and Percentages', question: '60% of the counters in a bag are green and the rest are yellow. 25% of the green counters are removed, and 40% of the yellow counters are removed. In total, what percentage of the counters are removed from the bag?', answer: '31%', working: '0.6 × 25% = 15% and 0.4 × 40% = 16%.' },
    '5a': { skill: 'Upper and Lower Bounds', question: 'The length of a shelf is 240 cm to the nearest 20 cm. Complete the error interval for the length.', answer: '230 ≤ length < 250', working: 'Half of 20 either side; the upper bound is strict.' },
    '5b': { skill: 'Upper and Lower Bounds', question: 'A different shelf measures 3 metres to the nearest 20 cm. Show that the total length of four of these shelves must be less than 12.5 metres.', answer: 'The largest possible total is 12.4 m', working: 'One shelf is under 3.1 m, so four are under 12.4 m.' },
    '6': { skill: 'Factorising', question: 'Circle the expression which is a factor of 5x + 30: 5x, x + 35, x + 6, x + 30', answer: 'x + 6', working: '5x + 30 = 5(x + 6).' },

    '7': { skill: 'Probability Spaces', question: 'The five possible outcomes of an event are V, W, X, Y and Z. P(V) = 0.18, P(W) = 0.12, P(X) = P(W) + 0.18, and P(Y) = P(Z). Work out P(Y).', answer: '0.2', working: 'V, W and X take 0.6, leaving 0.4 to share equally between Y and Z.' },

    '8a': { skill: 'Sector Calculations', question: 'A circle has a circumference of 30 cm. A sector of the circle has an angle of 90° at the centre. Work out the area of the sector. Give your answer as a decimal to 1 decimal place.', answer: '17.9 cm²', working: 'The radius is 30 ÷ (2 pi) = 4.775 cm, so the whole circle is 71.62 cm² and a quarter of it is 17.9 cm².' },
    '8b': { skill: 'Sector Calculations', question: 'A circle has a circumference of 30 cm, and a sector with an angle of 90° at the centre has an area of 17.9 cm². In fact, the angle at the centre is smaller than 90°. What does this mean about the area of the sector? Tick one box: smaller than 17.9 cm² / the same as 17.9 cm² / larger than 17.9 cm² / it could be any of these.', answer: 'Smaller than 17.9 cm²', working: 'A smaller angle takes a smaller share of the circle.' },

    '9': { skill: 'Percentage Change', question: 'The number of members of a club increases from 24 000 to 72 000. The chair says, "Our membership has increased by 300%, because 72 000 is 24 000 times 3." Are they correct? Tick a box, and give a reason for your answer.', answer: 'No — it is a 200% increase', working: 'The increase is 48 000 on 24 000, and tripling is an increase of 200%, not 300%.' },

    '10': { skill: 'Trigonometry (missing sides)', question: 'A right-angled triangle has a hypotenuse of 15 cm and one acute angle of 38°. Use trigonometry to work out the length of the side opposite the 38° angle, to 1 decimal place. You must show your working.', answer: '9.2 cm', working: '15 × sin 38° = 9.23…' },

    '11': { skill: 'Angles in Polygons', question: 'A regular polygon has an interior angle of 156°. Work out the number of sides.', answer: '15 sides', working: 'The exterior angle is 180 − 156 = 24°, and 360 ÷ 24 = 15.' },
    '12a': { skill: 'Sampling', question: 'Priya wants to know whether students at her school think the library opening hours are long enough. She asks 12 students who are in the library at lunchtime. Give one reason why her results may not represent the whole school.', answer: 'The students she asked already use the library, so they are not typical of the whole school', working: 'A sample drawn from one group is biased towards that group, and 12 is a very small sample.' },
    '12b': { skill: 'Reverse Percentage', question: 'In a survey, 55% answered Yes, 30% answered No, and the rest answered Not Sure. 132 people answered Yes. How many people answered Not Sure?', answer: '36', working: '55% is 132, so 1% is 2.4 and the total is 240; Not Sure is 15%.' },
    '13': { skill: 'Compound Units', question: 'Ella and Finn each drive 180 miles from P to Q. Ella drives the whole way at an average speed of 60 mph. Finn drives 100 miles at an average speed of 50 mph and then the rest of the way at an average speed of 40 mph. Who takes less time, Ella or Finn? Show working to support your answer.', answer: 'Ella', working: 'Ella takes 3 hours; Finn takes 2 hours then 2 more, so 4 hours.' },
    '14': { skill: 'Equations and Identities', question: 'a, b and c are positive integers, and a(7x + 3) is identical to 28x + 2b + c. Work out one possible set of values for a, b and c.', answer: 'a = 4, b = 5, c = 2', working: '7a = 28 gives a = 4, so 2b + c = 12; any positive pair works.' },
    '15': { skill: 'Solving Quadratic Equations (Quadratic Equation)', question: 'Solve 2x² + 7x − 5 = 0. Give your solutions as decimals to 2 decimal places.', answer: 'x = 0.61 and x = −4.11', working: 'x = (−7 ± sqrt89) ÷ 4, and sqrt89 = 9.434.' },
    '16': { skill: 'Growth and Decay', question: 'The value of a machine decreases by 15% per year. Work out the number of full years until the machine loses more than half its value. You must show your working.', answer: '5 years', working: '0.85⁴ = 0.522, which is still above half, and 0.85⁵ = 0.444.' },
    '17': { skill: 'Combined Events', question: 'When a biased spinner is spun, P(red) : P(blue) = 3 : 1. In a game the spinner is spun four times. The first way to win is to spin four reds. The second way is to spin red, blue, red, blue. How many times more likely is a player to win the first way than the second way?', answer: '9 times', working: 'The first way trades two blues for two reds, so the ratio is (3 ÷ 1)² = 9.' },
    '18': { skill: 'Cosine Rule', question: 'In triangle ABC, AB = 8 cm, BC = 11 cm and angle ABC = 105°. Work out the length of AC, to 1 decimal place.', answer: '15.2 cm', working: 'AC² = 64 + 121 − 2 × 8 × 11 × cos 105° = 230.55' },
    '19': { skill: 'Histograms', question: 'A histogram represents the ages of the members of a gym. The bar for ages 20 to 30 has a frequency density of 8 members per year, and the bar for ages 30 to 50 has a frequency density of 4.5 members per year. Members under 40 pay £250 a year and members aged 40 or over pay £150. Estimate the total annual fees paid by the members aged 20 to 50.', answer: '£38 000', working: '80 members aged 20–30 and 45 in each of 30–40 and 40–50, so 125 pay £250 and 45 pay £150.' },
    '20': { skill: 'Quadratic Inequalities', question: 'Ben solves the inequality x² < 25 and writes his answer as x < 5. Give one reason why Ben\'s answer is wrong.', answer: 'It leaves out the lower limit — the solution is −5 < x < 5', working: 'His answer wrongly includes values such as x = −7, whose square is 49.' },
    '21a': { skill: 'Equation of a Circle', question: 'A circle has its centre at the origin and passes through the point P(3, −4). Write down the equation of the circle.', answer: 'x² + y² = 25', working: 'The radius squared is 3² + (−4)².' },
    '21b': { skill: 'Perpendicular Gradients', question: 'A circle has its centre at the origin and passes through P(3, −4). Work out the equation of the tangent to the circle at P. Give your answer in the form y = mx + c.', answer: 'y = 0.75x − 6.25', working: 'The radius OP has gradient −4/3, so the tangent has gradient 3/4 and passes through (3, −4).' },
    '22': { skill: 'Enlargements', question: 'Triangle A has vertices at (2, 2), (6, 2) and (2, 4). Triangle B has vertices at (1, 1), (3, 1) and (1, 2). Describe fully the single transformation that maps triangle A to triangle B.', answer: 'An enlargement with scale factor 1/2, centre the origin (0, 0)', working: 'Every coordinate is halved, which places the centre at the origin.' },
    '23': { skill: 'Vectors', question: 'OABC is a parallelogram, with the vector OA = a and the vector OC = c. M is the point on AB such that AM : MB = 1 : 3. Write down, in terms of a and c, the vector OM. You must show your working.', answer: 'OM = a + (1/4)c', working: 'AB is equal to OC, so AM is one quarter of c.' },
    '24': { skill: 'Proportion with Powers', question: 'A study suggests a student\'s exam mark m is directly proportional to the square root of their total revision time t. A student triples their total revision time. Work out the percentage increase in their exam mark, to 1 decimal place.', answer: '73.2%', working: 'The mark is multiplied by sqrt3 = 1.732.' },
    '25': { skill: 'Composite Functions', question: 'f(x) = 2x + 5 and g(x) = (x − 5)/2. Prove that fg(x) + gf(x) is always equal to 2x.', answer: 'Both compositions simplify to x, so the sum is 2x', working: 'f and g are inverses of each other, so each composition returns x.' },
  },
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
