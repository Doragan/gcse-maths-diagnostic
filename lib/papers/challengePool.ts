import type { PaperChallengeQuestion, PaperConfig } from '../demoPapers/types'
import { stableHash } from './stableHash'

// ─────────────────────────────────────────────────────────────────────────────
// Challenge questions — "Push yourself", offered where a topic is already
// strong.
//
// WHY THESE ARE POOLED AND RETRIES ARE NOT. A retry is a rewritten version of
// the question a student actually dropped, so it is bound to that question and
// cannot be shared between papers. A challenge is not: it attaches to a TOPIC
// the student is strong in, and "a hard ratio question for a Foundation
// student" is the same thing whichever paper prompted it. So there are sixty
// of these, not one per paper, and every paper draws from them.
//
// NO DIAGRAMS, ANYWHERE IN THIS FILE. A challenge is printed as one line of
// text on a feedback sheet, so anything needing a picture is out. That is a
// free choice here — unlike a retry, nothing forces a particular question — but
// it is not a NEUTRAL one, and the bias is worth naming:
//
//   • Fine, because the configuration can be described: circle theorems with
//     named points, right-angled triangles with labelled sides, solids given by
//     their dimensions, angle facts about regular polygons.
//   • Excluded, because the diagram carries the data: reading off charts and
//     graphs, grids, transformations, loci, constructions, scale drawings,
//     plans and elevations, cumulative frequency, box plots.
//
// So the shape and probability pools lean toward trigonometry, mensuration and
// calculation, and away from the visual end of those topics. A student strong
// in shape because they are good at transformations will be pushed on
// trigonometry instead. That is a real limitation of a text-only sheet, not an
// oversight, and the fix is a drawing surface rather than more questions here.
//
// EVERY QUESTION CARRIES ITS ANSWER, for the teacher and as the only available
// check on correctness — see PaperChallengeQuestion['answer']. Answers were
// each worked independently rather than asserted; `working` is one line of
// method, not a full solution.
//
// TIER is the paper's, not the student's. A Foundation pool stretches toward
// the top of Foundation; a Higher pool sits at the top end of Higher.
//
// HOW THESE ARE PITCHED, since "a hard question" is easy to get wrong here.
// The first version of this pool was one substitution into a named method —
// "angle A = 40°, angle B = 65°, a = 9 cm, work out b" — with the skill
// printed beside it, so even the choice of method was made for the student.
// A student offered a challenge is one who is ALREADY strong in that topic;
// those questions were routine for them. Two framings fix it without needing
// a diagram:
//
//   • REVERSE the question. Give the output and ask for an input: the area
//     and two sides, find the included angle; the value after three years,
//     find the rate.
//   • Make the answer need TWO independent steps, neither of them stated —
//     the sine rule to find a side and then the area of a triangle; a surface
//     area scale factor to a length one and then to a volume.
//
// What does NOT work is hiding data or padding with arithmetic. If telling
// the student the intermediate value leaves a complete single-skill question,
// nothing has been added. See docs/writing-retry-questions.md, which argues
// the same case for retries.
// ─────────────────────────────────────────────────────────────────────────────

export type Tier = 'F' | 'H'

/** A pool entry — a challenge before it is attached to a paper's topic. */
type PoolEntry = Omit<PaperChallengeQuestion, 'topic'>

/**
 * The paper's tier, read from its own subtitle.
 *
 * Every one of the 42 papers says "Foundation Tier" or "Higher Tier" there, so
 * this needs no new field on PaperConfig and no per-board id parsing (OCR
 * encodes tier in the paper NUMBER, not a letter, so an id regex would need a
 * board special case). Defaults to Foundation, which is the safer miss: a
 * Foundation challenge set in front of a Higher student is merely easy, while
 * the reverse is discouraging.
 */
export function tierOf(paper: PaperConfig): Tier {
  return /higher/i.test(paper.subtitle) ? 'H' : 'F'
}

const POOL: Record<string, PoolEntry[]> = {
  // ── Number ────────────────────────────────────────────────────────────────
  'number|F': [
    { skill: 'Reverse Percentages', question: 'A coat costs £68 in a sale after 20% off. A second sale then takes 15% off the sale price. Work out the total percentage reduction from the original price.', answer: '32%', working: 'The original price is £68 ÷ 0.8 = £85, and the second sale leaves £57.80.' },
    { skill: 'Standard Form', question: 'Write these four numbers in order, smallest first: 3.1 × 10⁻³, 0.0029, 2.9 × 10⁻², 0.00031.', answer: '0.00031, 0.0029, 3.1 × 10⁻³, 2.9 × 10⁻²', working: 'As ordinary numbers: 0.0031, 0.0029, 0.029, 0.00031.' },
    { skill: 'Lowest Common Multiple', question: 'Two lighthouses flash every 24 seconds and every 36 seconds. They flash together at 9:00 pm. At what time do they next flash together?', answer: '9:01:12 pm (72 seconds later)', working: '24 = 2³ × 3 and 36 = 2² × 3², so the LCM is 2³ × 3² = 72 seconds.' },
    { skill: 'Prime Factorisation', question: 'A number has prime factorisation 2² × 3ⁿ × 5, and it is a multiple of 45. Work out the smallest possible value of n, and the number itself.', answer: 'n = 2, and the number is 180', working: '45 = 3² × 5, so the number needs 3² in it.' },
    { skill: 'Error Intervals', question: 'A rectangle measures 8 cm by 5 cm, each correct to the nearest centimetre. Work out the largest possible perimeter.', answer: '28 cm', working: 'Upper bounds of 8.5 cm and 5.5 cm.' },
    { skill: 'Compound Interest', question: '£2000 is invested at compound interest. After 3 years it is worth £2185.45. Work out the annual rate of interest.', answer: '3%', working: '2185.45 ÷ 2000 = 1.092727, whose cube root is 1.03.' },
  ],
  'number|H': [
    { skill: 'Recurring Decimals', question: 'x = 0.272727… Work out the reciprocal of x as a fraction in its simplest form.', answer: '11/3', working: 'x = 27/99 = 3/11.' },
    { skill: 'Surds', question: 'A square has an area of 48 cm². Work out its perimeter, giving your answer as a simplified surd.', answer: '16√3 cm', working: 'The side is √48 = 4√3.' },
    { skill: 'Rationalising Denominators', question: 'A rectangle has an area of 12 cm² and a width of √6 cm. Work out its length, rationalising the denominator.', answer: '2√6 cm', working: '12/√6 = 12√6/6.' },
    { skill: 'Bounds', question: 'A car travels 148 m, to the nearest metre, in 7.3 seconds, to the nearest 0.1 second. Work out the upper bound for its average speed, to 3 significant figures.', answer: '20.5 m/s', working: 'Greatest distance over least time: 148.5 ÷ 7.25 = 20.4827…' },
    { skill: 'Standard Form', question: '(4 × 10⁵) × (n × 10⁻³) = 1.2 × 10⁴. Work out n, giving your answer in standard form.', answer: '3 × 10¹', working: '1.2 × 10⁴ ÷ (4 × 10²) = 30.' },
    { skill: 'Fractional Indices', question: '16ˣ = 8. Work out the value of x.', answer: 'x = 3/4', working: 'Both sides as powers of 2: 2⁴ˣ = 2³.' },
  ],

  // ── Algebra ───────────────────────────────────────────────────────────────
  'algebra|F': [
    { skill: 'Simultaneous Equations', question: 'Three coffees and two teas cost £9.60. Two coffees and two teas cost £7.40. Work out the cost of one coffee and the cost of one tea.', answer: 'A coffee is £2.20 and a tea is £1.50', working: 'Subtracting the second from the first leaves one coffee.' },
    { skill: 'Factorising Quadratics', question: 'A rectangle has an area of x² + 2x − 15 and a width of x − 3. Work out an expression for its perimeter, simplified as far as possible.', answer: '4x + 4', working: 'The length is x + 5, so the perimeter is 2(x + 5 + x − 3).' },
    { skill: 'Expanding Double Brackets', question: 'Expand and simplify (x + 4)(x − 7) − (x − 2)².', answer: 'x − 32', working: 'x² − 3x − 28 minus x² − 4x + 4.' },
    { skill: 'Nth Term of a Sequence', question: 'The 5th term of an arithmetic sequence is 21 and the 9th term is 37. Find an expression for the nth term.', answer: '4n + 1', working: 'Four common differences make 16, so d = 4 and the first term is 5.' },
    { skill: 'Rearranging Formulae', question: 'Make r the subject of A = πr².', answer: 'r = √(A/π)', working: 'Divide by π, then take the positive square root.' },
    { skill: 'Equations with the Unknown on Both Sides', question: 'A rectangle has a length of (3x − 4) cm and a width of x cm. Its perimeter is 32 cm. Work out the area of the rectangle.', answer: '55 cm²', working: '8x − 8 = 32 gives x = 5, so the sides are 11 cm and 5 cm.' },
  ],
  'algebra|H': [
    { skill: 'The Quadratic Formula', question: 'A rectangle has a length of (x + 3) cm and a width of x cm, and an area of 20 cm². Work out the value of x, to 2 decimal places.', answer: 'x = 3.22', working: 'x² + 3x − 20 = 0, so x = (−3 + √89)/2; the negative root is rejected.' },
    { skill: 'Completing the Square', question: 'The curve y = x² − 6x + 11 has a minimum point. Write down its coordinates.', answer: '(3, 2)', working: 'x² − 6x + 11 = (x − 3)² + 2.' },
    { skill: 'Simplifying Algebraic Fractions', question: 'Solve (x² − 9)/(x² + 7x + 12) = 1/2.', answer: 'x = 10', working: 'The fraction simplifies to (x − 3)/(x + 4), so 2x − 6 = x + 4.' },
    { skill: 'Composite Functions', question: 'f(x) = 3x − 2 and g(x) = x². Work out the value of x for which fg(x) = gf(x).', answer: 'x = 1', working: '3x² − 2 = 9x² − 12x + 4 reduces to (x − 1)² = 0.' },
    { skill: 'Inverse Functions', question: 'f(x) = (x + 5)/3. Work out the value of x for which f(x) = f⁻¹(x).', answer: 'x = 2.5', working: 'f⁻¹(x) = 3x − 5, so x + 5 = 9x − 15.' },
    { skill: 'Quadratic Sequences', question: 'Find the nth term of the sequence 3, 8, 15, 24, 35.', answer: 'n² + 2n', working: 'Second difference 2 gives n²; subtracting n² leaves 2, 4, 6, 8 = 2n.' },
  ],

  // ── Ratio and Proportion ──────────────────────────────────────────────────
  'ratio|F': [
    { skill: 'Compound Units', question: 'A runner covers 21 km in 1 hour 45 minutes. Work out the average speed in metres per second, to 1 decimal place.', answer: '3.3 m/s', working: '21 000 m in 6300 s.' },
    { skill: 'Direct Proportion', question: 'y is directly proportional to x. When x = 8, y = 20. Work out x when y = 45.', answer: 'x = 18', working: 'y = 2.5x.' },
    { skill: 'Sharing in a Ratio', question: 'Money is shared between Ana and Bo in the ratio 4 : 3. Ana gets £50 more than Bo. Work out how much was shared.', answer: '£350', working: 'The difference is one part, so a part is £50 and there are seven of them.' },
    { skill: 'Best Buy', question: 'A 750 g box of cereal costs £2.10 and a 1.2 kg box costs £3.48. Work out how much is saved by buying 6 kg of cereal in the better-value boxes.', answer: '60p', working: 'The 750 g box is better value, and eight of them cost £16.80 against £17.40.' },
    { skill: 'Inverse Proportion', question: '8 workers build a wall in 6 days. How many workers would be needed to build it in 4 days, working at the same rate?', answer: '12 workers', working: 'The job is 48 worker-days.' },
    { skill: 'Combining Ratios', question: 'The ratio a : b is 2 : 5 and the ratio b : c is 3 : 4. Work out a : c in its simplest form.', answer: '3 : 10', working: 'Scale to a common b of 15: a : b : c = 6 : 15 : 20.' },
  ],
  'ratio|H': [
    { skill: 'Inverse Proportion', question: 'y is inversely proportional to the square of x. When x = 2, y = 9. Work out the positive value of x when y = 4.', answer: 'x = 3', working: 'y = 36/x².' },
    { skill: 'Depreciation', question: 'A car was worth £18 000 when new and £11 054 three years later, having depreciated by the same percentage each year. Work out the annual rate of depreciation.', answer: '15%', working: 'The cube root of 11 054 ÷ 18 000 is 0.85.' },
    { skill: 'Density', question: 'A solid copper cube has sides of 5 cm. Copper has a density of 8.96 g/cm³. Work out the mass of the cube in kilograms.', answer: '1.12 kg', working: 'Volume 125 cm³, so 1120 g.' },
    { skill: 'Ratio Problems', question: 'The ratio of red to blue counters is 3 : 5. After 12 more red counters are added, the ratio is 9 : 10. How many blue counters are there?', answer: '40', working: 'With red 3k and blue 5k, 10(3k + 12) = 9 × 5k gives k = 8.' },
    { skill: 'Compound Units', question: 'A car travels at a steady 25 m/s. Work out how long it takes to cover 45 km, in minutes.', answer: '30 minutes', working: '45 000 ÷ 25 = 1800 seconds.' },
    { skill: 'Reverse Percentages', question: 'The price of a phone rose by 8% to £486, and later fell by 8% in a sale. Work out the sale price, and how much lower it is than the price before the rise.', answer: '£447.12, which is £2.88 lower', working: 'The price before the rise was 486 ÷ 1.08 = £450.' },
  ],

  // ── Shape and Space ───────────────────────────────────────────────────────
  'shape|F': [
    { skill: 'Pythagoras', question: 'The diagonal of a rectangle is 13 cm and its width is 5 cm. Work out the area of the rectangle.', answer: '60 cm²', working: 'The other side is √(169 − 25) = 12 cm.' },
    { skill: 'Area of a Circle', question: 'A circle has an area of 113.1 cm². Work out its circumference, to 1 decimal place. Use the π key on your calculator.', answer: '37.7 cm', working: 'r = √(113.1 ÷ π) = 6.00 cm, and the circumference is 2πr.' },
    { skill: 'Angles in Polygons', question: 'Each interior angle of a regular polygon is 144°. Work out how many sides it has.', answer: '10 sides', working: 'Each exterior angle is 36°, and 360 ÷ 36 = 10.' },
    { skill: 'Volume of a Prism', question: 'A triangular prism has a volume of 600 cm³. Its cross-section is a right-angled triangle with shorter sides of 5 cm and 12 cm. Work out the length of the prism.', answer: '20 cm', working: 'The cross-section has area 30 cm².' },
    { skill: 'Surface Area', question: 'A cube has a total surface area of 150 cm². Work out its volume.', answer: '125 cm³', working: 'Each face is 25 cm², so the side is 5 cm.' },
    { skill: 'Compound Area', question: 'A rectangular lawn measures 12 m by 8 m. A path 1 m wide runs all the way round inside its edge. Work out the area of lawn left inside the path.', answer: '60 m²', working: 'The inner rectangle is 10 m by 6 m.' },
  ],
  'shape|H': [
    { skill: 'Trigonometry', question: 'A ladder 4.5 m long leans against a vertical wall and reaches 3.8 m up it. Work out the angle the ladder makes with the ground, to 1 decimal place.', answer: '57.6°', working: 'sin⁻¹(3.8 ÷ 4.5) = 57.62…' },
    { skill: 'The Sine Rule', question: 'In triangle ABC, angle A = 40°, angle B = 65° and side a = 9 cm. Work out the area of the triangle, to 1 decimal place.', answer: '55.2 cm²', working: 'b = 9 sin 65° ÷ sin 40° = 12.69 cm, and angle C = 75°.' },
    { skill: 'The Cosine Rule', question: 'In triangle PQR, PQ = 7 cm, QR = 9 cm and PR = 13 cm. Work out angle Q, to the nearest degree.', answer: '108°', working: 'cos Q = (49 + 81 − 169) ÷ 126 = −0.3095.' },
    { skill: 'Circle Theorems', question: 'A, B and C are points on a circle with centre O and radius 5 cm, where C lies on the major arc. Angle ACB = 42°. Work out the area of the minor sector AOB, to 1 decimal place. Use the π key on your calculator.', answer: '18.3 cm²', working: 'Angle AOB = 84°, and 84/360 of π × 5².' },
    { skill: 'Similar Solids', question: 'Two similar cones have surface areas of 48 cm² and 300 cm². The smaller cone has a volume of 32 cm³. Work out the volume of the larger cone.', answer: '500 cm³', working: 'Area scale factor 6.25, so length 2.5 and volume 15.625.' },
    { skill: 'Area of a Triangle', question: 'A triangle has sides of 8 cm and 11 cm, and an area of 34.7 cm². Work out the size of the acute included angle, to the nearest degree.', answer: '52°', working: 'sin C = 69.4 ÷ 88 = 0.7886.' },
  ],

  // ── Probability and Data ──────────────────────────────────────────────────
  'probdata|F': [
    { skill: 'Calculating Simple Probability', question: 'A bag holds red, blue and green counters only. The probability of taking a blue counter is 0.3, and of taking a green counter is 0.2. There are 15 red counters. Work out how many counters are in the bag.', answer: '30', working: 'P(red) = 0.5, and 15 is half the bag.' },
    { skill: 'Working Backwards from the Mean', question: 'The mean of five numbers is 12. Four of them are 8, 15, 9 and 14. Work out the fifth number.', answer: '14', working: 'The total must be 60, and the four given add to 46.' },
    { skill: 'Relative Frequency', question: 'A biased dice is rolled 200 times and lands on six 46 times. The dice is then rolled 500 times. Estimate the number of sixes.', answer: '115', working: 'The relative frequency is 0.23.' },
    { skill: 'Sets and Overlap', question: 'In a group of 40 students, 22 study French, 18 study German and 7 study both. How many study neither?', answer: '7', working: '22 + 18 − 7 = 33 study at least one.' },
    { skill: 'Expected Frequency', question: 'A spinner is spun 240 times and lands on red 84 times. Estimate the number of times it would land on red in 400 spins.', answer: '140', working: 'P(red) is about 0.35.' },
    { skill: 'Working Backwards from the Mean', question: 'The mean of 8 numbers is 6.5. Two more numbers are added and the mean becomes 7. Work out the mean of the two new numbers.', answer: '9', working: 'The total rises from 52 to 70.' },
  ],
  'probdata|H': [
    { skill: 'Probability Without Replacement', question: 'A bag holds 10 counters, of which n are green. Two are taken at random without replacement. The probability that both are green is 1/15. Work out n.', answer: 'n = 3', working: 'n(n − 1)/90 = 1/15, so n(n − 1) = 6.' },
    { skill: 'Tree Diagrams', question: 'The probability that it rains is 0.3. If it rains, the probability a train is late is 0.4. The probability that the train is late is 0.19. Work out the probability that the train is late when it does not rain.', answer: '0.1', working: '0.19 − 0.12 = 0.07, over a probability of 0.7.' },
    { skill: 'Capture and Recapture', question: '45 fish are caught, marked and returned to a lake. Later 60 fish are caught and 9 of them are marked. Estimate the number of fish in the lake.', answer: '300', working: '9/60 of the lake is marked, and 45 fish were marked.' },
    { skill: 'Probability with Algebra', question: 'A bag contains n counters, 4 of which are red. One more red counter is added, and the probability of taking a red counter at random becomes 1/4. Work out n.', answer: 'n = 19', working: '5/(n + 1) = 1/4.' },
    { skill: 'Sets and Overlap', question: 'In a class of 30 students, 18 play football and 14 play tennis, and every student plays at least one of them. One student is chosen at random. Work out the probability that they play both.', answer: '1/15', working: '18 + 14 − 30 = 2 play both.' },
    { skill: 'Counting Without Listing', question: 'A password is made from 2 different letters (A–Z) followed by 3 different digits (0–9). Work out how many different passwords are possible.', answer: '468 000', working: '26 × 25 × 10 × 9 × 8.' },
  ],
}

/** How many challenges each topic contributes, matching the hand-authored papers. */
export const CHALLENGES_PER_TOPIC = 2

/**
 * The challenges a paper offers.
 *
 * A paper's own `challengeQuestions` WINS when it has any — the three
 * hand-authored papers keep the questions written for them, and any paper can
 * overrule the pool the same way. Everything else draws from the pool, which is
 * why the 39 generated papers need no edits to turn "Push yourself" on.
 *
 * The draw is deterministic, hashed on the paper id and topic, for the same
 * reason the feedback wording is: regenerating a sheet after fixing one mark
 * must not silently change what every student is offered. Different papers get
 * different pairs, and the same paper always gets its own.
 */
export function challengesFor(paper: PaperConfig): PaperChallengeQuestion[] {
  if (paper.challengeQuestions.length) return paper.challengeQuestions

  const tier = tierOf(paper)
  const out: PaperChallengeQuestion[] = []
  for (const topic of paper.topics) {
    const bank = POOL[`${topic.id}|${tier}`]
    if (!bank?.length) continue
    const start = stableHash(`${paper.id}|${topic.id}`) % bank.length
    for (let i = 0; i < Math.min(CHALLENGES_PER_TOPIC, bank.length); i++) {
      out.push({ topic: topic.id, ...bank[(start + i) % bank.length] })
    }
  }
  return out
}

/** Every pool entry, for tests and for a future teacher answer key. */
export function allPooledChallenges(): { key: string; entry: PoolEntry }[] {
  return Object.entries(POOL).flatMap(([key, entries]) => entries.map(entry => ({ key, entry })))
}
