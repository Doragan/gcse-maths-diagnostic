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
    { skill: 'Reverse Percentages', question: 'A coat costs £68 in a sale after 20% off. Work out the price before the sale.', answer: '£85', working: '£68 is 80% of the original, so 1% is £0.85 and 100% is £85.' },
    { skill: 'Standard Form', question: 'Write 0.000521 in standard form.', answer: '5.21 × 10⁻⁴' },
    { skill: 'Lowest Common Multiple', question: 'Two lighthouses flash every 24 seconds and every 36 seconds. They flash together at 9:00 pm. At what time do they next flash together?', answer: '9:01:12 pm (72 seconds later)', working: '24 = 2³ × 3 and 36 = 2² × 3², so the LCM is 2³ × 3² = 72 seconds.' },
    { skill: 'Prime Factorisation', question: 'Write 360 as a product of its prime factors, using index form.', answer: '2³ × 3² × 5', working: '360 = 36 × 10 = (4 × 9) × (2 × 5).' },
    { skill: 'Error Intervals', question: 'A length is 4.6 m, correct to 1 decimal place. Write down the error interval for the length.', answer: '4.55 ≤ length < 4.65', working: 'Half of 0.1 either side; the upper bound is strict.' },
    { skill: 'Compound Interest', question: '£2000 is invested at 3% compound interest per year. Work out the value after 3 years, to the nearest penny.', answer: '£2185.45', working: '2000 × 1.03³ = 2000 × 1.092727.' },
  ],
  'number|H': [
    { skill: 'Recurring Decimals', question: 'Write 0.272727… as a fraction in its simplest form.', answer: '3/11', working: 'Two repeating digits, so the fraction is 27/99, which cancels by 9.' },
    { skill: 'Surds', question: 'Simplify fully √75 + √12.', answer: '7√3', working: '√75 = 5√3 and √12 = 2√3.' },
    { skill: 'Rationalising Denominators', question: 'Rationalise the denominator of 6/√3, simplifying your answer fully.', answer: '2√3', working: 'Multiply top and bottom by √3 to get 6√3/3.' },
    { skill: 'Bounds', question: 'a = 8.4 and b = 2.5, each correct to 1 decimal place. Work out the upper bound of a ÷ b, to 3 decimal places.', answer: '3.449', working: 'Largest a over smallest b: 8.45 ÷ 2.45.' },
    { skill: 'Standard Form', question: 'Work out (3 × 10⁵) × (8 × 10⁻²). Give your answer in standard form.', answer: '2.4 × 10⁴', working: '24 × 10³ is not in standard form; adjust to 2.4 × 10⁴.' },
    { skill: 'Fractional Indices', question: 'Work out the value of 16^(3/4).', answer: '8', working: 'The fourth root of 16 is 2, and 2³ = 8.' },
  ],

  // ── Algebra ───────────────────────────────────────────────────────────────
  'algebra|F': [
    { skill: 'Simultaneous Equations', question: '2x + 3y = 16 and 4x − 3y = 14. Find the values of x and y.', answer: 'x = 5, y = 2', working: 'Adding the equations eliminates y: 6x = 30.' },
    { skill: 'Factorising Quadratics', question: 'Factorise x² + 2x − 15.', answer: '(x + 5)(x − 3)', working: 'Two numbers multiplying to −15 and adding to 2.' },
    { skill: 'Expanding Double Brackets', question: 'Expand and simplify (x + 4)(x − 7).', answer: 'x² − 3x − 28' },
    { skill: 'Nth Term of a Sequence', question: 'A sequence begins 5, 9, 13, 17. Find an expression for the nth term, and use it to find the 50th term.', answer: '4n + 1, and the 50th term is 201', working: 'The common difference is 4, and 5 − 4 = 1.' },
    { skill: 'Rearranging Formulae', question: 'Make x the subject of y = 4x + 9.', answer: 'x = (y − 9)/4' },
    { skill: 'Equations with the Unknown on Both Sides', question: 'Solve 5(x − 2) = 3x + 8.', answer: 'x = 9', working: 'Expanding gives 5x − 10 = 3x + 8, so 2x = 18.' },
  ],
  'algebra|H': [
    { skill: 'The Quadratic Formula', question: 'Solve 2x² + 5x − 4 = 0. Give your solutions to 2 decimal places.', answer: 'x = 0.64 or x = −3.14', working: 'x = (−5 ± √57)/4, and √57 ≈ 7.5498.' },
    { skill: 'Completing the Square', question: 'Write x² − 6x + 11 in the form (x − a)² + b.', answer: '(x − 3)² + 2', working: '(x − 3)² = x² − 6x + 9, and 11 − 9 = 2.' },
    { skill: 'Simplifying Algebraic Fractions', question: 'Simplify fully (x² − 9)/(x² + 7x + 12).', answer: '(x − 3)/(x + 4)', working: 'Factorise both: (x − 3)(x + 3) over (x + 3)(x + 4).' },
    { skill: 'Composite Functions', question: 'f(x) = 3x − 2 and g(x) = x². Work out fg(4).', answer: '46', working: 'g first: g(4) = 16, then f(16) = 46.' },
    { skill: 'Inverse Functions', question: 'f(x) = (x + 5)/3. Find f⁻¹(x).', answer: 'f⁻¹(x) = 3x − 5', working: 'Set y = (x + 5)/3 and rearrange for x.' },
    { skill: 'Quadratic Sequences', question: 'Find the nth term of the sequence 3, 8, 15, 24, 35.', answer: 'n² + 2n', working: 'Second difference 2 gives n²; subtracting n² leaves 2, 4, 6, 8 = 2n.' },
  ],

  // ── Ratio and Proportion ──────────────────────────────────────────────────
  'ratio|F': [
    { skill: 'Compound Units', question: 'A runner covers 21 km in 1 hour 45 minutes. Work out the average speed in km/h.', answer: '12 km/h', working: '1 hour 45 minutes is 1.75 hours, and 21 ÷ 1.75 = 12.' },
    { skill: 'Direct Proportion', question: 'y is directly proportional to x. When x = 8, y = 20. Find y when x = 14.', answer: 'y = 35', working: 'y = 2.5x.' },
    { skill: 'Sharing in a Ratio', question: '£350 is shared between Ana and Bo in the ratio 4 : 3. How much more does Ana get than Bo?', answer: '£50', working: 'Seven parts of £50; Ana has one part more than Bo.' },
    { skill: 'Best Buy', question: 'A 750 g box of cereal costs £2.10. A 1.2 kg box costs £3.48. Which is better value? Show your working.', answer: 'The 750 g box', working: '0.28p per gram against 0.29p per gram.' },
    { skill: 'Inverse Proportion', question: '8 workers build a wall in 6 days. How long would 12 workers take, working at the same rate?', answer: '4 days', working: 'The job is 48 worker-days, so 48 ÷ 12 = 4.' },
    { skill: 'Combining Ratios', question: 'The ratio a : b is 2 : 5 and the ratio b : c is 3 : 4. Work out a : c in its simplest form.', answer: '3 : 10', working: 'Scale to a common b of 15: a : b : c = 6 : 15 : 20.' },
  ],
  'ratio|H': [
    { skill: 'Inverse Proportion', question: 'y is inversely proportional to the square of x. When x = 2, y = 9. Find y when x = 3.', answer: 'y = 4', working: 'y = 36/x².' },
    { skill: 'Depreciation', question: 'A car worth £18 000 depreciates by 15% each year. Work out its value after 3 years, to the nearest pound.', answer: '£11 054', working: '18 000 × 0.85³ = 18 000 × 0.614125.' },
    { skill: 'Density', question: 'A piece of copper has density 8.96 g/cm³ and volume 250 cm³. Work out its mass in kilograms.', answer: '2.24 kg', working: 'Mass = 8.96 × 250 = 2240 g.' },
    { skill: 'Ratio Problems', question: 'The ratio of red to blue counters is 3 : 5. After 12 more red counters are added, the ratio is 9 : 10. How many blue counters are there?', answer: '40', working: 'With red 3k and blue 5k, 10(3k + 12) = 9 × 5k gives k = 8.' },
    { skill: 'Compound Units', question: 'A car travels 45 km in 30 minutes. Work out its speed in metres per second.', answer: '25 m/s', working: '45 000 m in 1800 s.' },
    { skill: 'Reverse Percentages', question: 'The price of a phone increased by 8% to £486. Work out the price before the increase.', answer: '£450', working: '486 ÷ 1.08.' },
  ],

  // ── Shape and Space ───────────────────────────────────────────────────────
  'shape|F': [
    { skill: 'Pythagoras', question: 'A right-angled triangle has shorter sides of 7 cm and 9 cm. Work out the length of the hypotenuse, to 1 decimal place.', answer: '11.4 cm', working: '√(49 + 81) = √130 = 11.40…' },
    { skill: 'Area of a Circle', question: 'A circle has a radius of 6 cm. Work out its area to 1 decimal place. Use the π key on your calculator.', answer: '113.1 cm²', working: 'π × 6² = 36π = 113.09…' },
    { skill: 'Angles in Polygons', question: 'Work out the size of each interior angle of a regular decagon.', answer: '144°', working: 'Each exterior angle is 360 ÷ 10 = 36°.' },
    { skill: 'Volume of a Prism', question: 'A triangular prism has a cross-section that is a right-angled triangle with shorter sides 5 cm and 12 cm. The prism is 20 cm long. Work out its volume.', answer: '600 cm³', working: 'Cross-section area 30 cm², times the length.' },
    { skill: 'Surface Area', question: 'A cuboid measures 4 cm by 5 cm by 9 cm. Work out its total surface area.', answer: '202 cm²', working: '2 × (20 + 45 + 36).' },
    { skill: 'Compound Area', question: 'A rectangular lawn measures 12 m by 8 m. A square flower bed of side 3 m is cut out of one corner. Work out the area of the remaining lawn.', answer: '87 m²', working: '96 − 9.' },
  ],
  'shape|H': [
    { skill: 'Trigonometry', question: 'In a right-angled triangle the hypotenuse is 12 cm and one of the acute angles is 35°. Work out the length of the side opposite that angle, to 1 decimal place.', answer: '6.9 cm', working: '12 × sin 35° = 6.88…' },
    { skill: 'The Sine Rule', question: 'In triangle ABC, angle A = 40°, angle B = 65° and side a = 9 cm. Work out the length of side b, to 1 decimal place.', answer: '12.7 cm', working: 'b = 9 × sin 65° ÷ sin 40°.' },
    { skill: 'The Cosine Rule', question: 'In triangle PQR, PQ = 7 cm, QR = 9 cm and angle Q = 110°. Work out the length of PR, to 1 decimal place.', answer: '13.2 cm', working: 'PR² = 49 + 81 − 2 × 7 × 9 × cos 110° = 173.09…' },
    { skill: 'Circle Theorems', question: 'A and B are points on a circle with centre O, and angle AOB = 84°. Work out the angle subtended by the arc AB at a point on the major arc.', answer: '42°', working: 'The angle at the centre is twice the angle at the circumference.' },
    { skill: 'Similar Solids', question: 'Two similar cones have heights 4 cm and 10 cm. The smaller has a volume of 32 cm³. Work out the volume of the larger cone.', answer: '500 cm³', working: 'Length scale factor 2.5, so volume scale factor 2.5³ = 15.625.' },
    { skill: 'Area of a Triangle', question: 'A triangle has sides of 8 cm and 11 cm with an included angle of 52°. Work out its area, to 1 decimal place.', answer: '34.7 cm²', working: '½ × 8 × 11 × sin 52°.' },
  ],

  // ── Probability and Data ──────────────────────────────────────────────────
  'probdata|F': [
    { skill: 'Calculating Simple Probability', question: 'A bag holds 5 red, 3 blue and 2 green counters. One counter is taken at random. Work out the probability that it is not blue.', answer: '7/10' },
    { skill: 'Working Backwards from the Mean', question: 'The mean of five numbers is 12. Four of them are 8, 15, 9 and 14. Work out the fifth number.', answer: '14', working: 'The total must be 60, and the four given add to 46.' },
    { skill: 'Relative Frequency', question: 'A biased dice is rolled 200 times and lands on six 46 times. Estimate the probability of rolling a six. Give your answer as a decimal.', answer: '0.23' },
    { skill: 'Sets and Overlap', question: 'In a group of 40 students, 22 study French, 18 study German and 7 study both. How many study neither?', answer: '7', working: '22 + 18 − 7 = 33 study at least one.' },
    { skill: 'Expected Frequency', question: 'The probability that a spinner lands on red is 0.35. The spinner is spun 240 times. Estimate the number of times it lands on red.', answer: '84' },
    { skill: 'Working Backwards from the Mean', question: 'The mean of 8 numbers is 6.5. A ninth number is added and the mean becomes 7. Work out the ninth number.', answer: '11', working: 'The total rises from 52 to 63.' },
  ],
  'probdata|H': [
    { skill: 'Probability Without Replacement', question: 'A bag holds 5 red, 2 blue and 3 green counters. Two are taken at random without replacement. Work out the probability that both are green.', answer: '1/15', working: '3/10 × 2/9 = 6/90.' },
    { skill: 'Tree Diagrams', question: 'The probability that it rains is 0.3. If it rains, the probability a train is late is 0.4; if it does not, the probability is 0.1. Work out the probability that the train is late.', answer: '0.19', working: '0.3 × 0.4 + 0.7 × 0.1.' },
    { skill: 'Capture and Recapture', question: '45 fish are caught, marked and returned to a lake. Later 60 fish are caught and 9 of them are marked. Estimate the number of fish in the lake.', answer: '300', working: '9/60 of the lake is marked, and 45 fish were marked.' },
    { skill: 'Probability with Algebra', question: 'A bag contains n counters, 4 of which are red. One counter is taken at random and the probability that it is red is 1/6. Work out n.', answer: 'n = 24' },
    { skill: 'Sets and Overlap', question: 'In a class of 30 students, 18 play football, 14 play tennis and 5 play neither. How many play both?', answer: '7', working: '25 play at least one, and 18 + 14 = 32.' },
    { skill: 'Counting Without Listing', question: 'A password is made from 2 letters (A–Z) followed by 3 digits (0–9). Letters and digits may repeat. How many different passwords are possible?', answer: '676 000', working: '26² × 10³.' },
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
