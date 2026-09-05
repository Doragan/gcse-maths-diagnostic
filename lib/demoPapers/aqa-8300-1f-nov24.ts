import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-Calculator, Nov 2024.
 *
 * Built from the real source documents (AQA-83001F-QP-NOV24.pdf,
 * AQA-83001F-MS-NOV24.pdf), cross-checked against the skill/marks/topic
 * metadata already audited in data/exam-audit/NOV24-F-P1.json — see
 * lib/demoPapers/types.ts for why that split exists (the audit deliberately
 * carries no exam text, for copyright reasons; the wording here comes from
 * the actual paper, paraphrased the same way the reference paper is).
 *
 * `desc` is a short paraphrase of the real question, not a verbatim
 * reproduction — matches the house style set by aqa-8300-3f-nov24.ts.
 *
 * `visual: true` marks questions whose own answer is a diagram (complete a
 * frequency tree/grid, draw a shape, spot chart errors) or a function-machine
 * part whose pre-filled boxes aren't recoverable from the mark scheme alone —
 * these are excluded from `retrySet` because a fair text-only retry isn't
 * possible without inventing unverifiable diagram content. Everything else
 * gets a fresh, self-contained retry question with newly chosen numbers (never
 * the exam's own numbers).
 *
 * One correction versus the audit: q24 is tagged `dividing_fractions` there,
 * but the real question ("Work out 1⅕ − 3/10") and its mark scheme (1.2 − 0.3
 * = 0.9) are unambiguously SUBTRACTION — retagged to
 * `adding_and_subtracting_fractions` here. Worth folding back into the audit
 * JSON at some point; not done here since that file is out of scope for this
 * change.
 */
export const AQA_8300_1F_NOV24: PaperConfig = {
  id: 'aqa-8300-1f-nov24',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a', label: '1(a)', marks: 1, topic: 'number', skill: 'Indices', desc: 'Square root of 49', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '1b', label: '1(b)', marks: 1, topic: 'number', skill: 'Indices', desc: '3 cubed', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '1c', label: '1(c)', marks: 1, topic: 'number', skill: 'Indices', desc: '10,000 as a power of 10', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '2', label: '2', marks: 2, topic: 'number', skill: 'Converting Measurements + Proportion', desc: 'Ounces in 3 pounds (16 oz = 1 lb)', skillIds: ['converting_measurements', 'proportion'], kind: 'mastery', visual: false },
    { id: '3a', label: '3(a)', marks: 1, topic: 'number', skill: 'Irregular and Improper Fractions', desc: '3/2 as a mixed number', skillIds: ['irregular_and_improper_fractions'], kind: 'mastery', visual: false },
    { id: '3b', label: '3(b)', marks: 1, topic: 'number', skill: 'Adding and Subtracting Fractions', desc: '1/5 + 1/5', skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false },
    { id: '4a', label: '4(a)', marks: 2, topic: 'number', skill: 'Factors and Multiples', desc: 'All factors of 20', skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false },
    { id: '4b', label: '4(b)', marks: 1, topic: 'number', skill: 'Factors and Multiples', desc: 'Counterexample: sum of two multiples of 5 is always a multiple of 10?', skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false },
    { id: '5', label: '5', marks: 2, topic: 'number', skill: 'Fractions, Decimals and Percentages', desc: 'Order 80%, 0.7, 3/4 by size', skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false },
    { id: '6', label: '6', marks: 4, topic: 'number', skill: 'Simple Arithmetic', desc: '2 hats (£4.50 each) + 3 scarves = £28.50; cost per scarf', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '7a', label: '7(a)', marks: 4, topic: 'probdata', skill: 'Frequency Trees', desc: 'Complete the frequency tree (120 people: 80 children, 40 adults)', skillIds: ['frequency_trees'], kind: 'exam', visual: true },
    { id: '7b', label: '7(b)', marks: 2, topic: 'probdata', skill: 'Frequency Trees + Calculating Simple Probability', desc: 'Fraction of children who turned left', skillIds: ['frequency_trees', 'calculating_simple_probability'], kind: 'mastery', visual: false },
    { id: '8', label: '8', marks: 3, topic: 'probdata', skill: 'Simple Charts', desc: "Spot 3 mistakes in Ed's bar chart", skillIds: ['simple_charts'], kind: 'exam', visual: true },
    { id: '9a', label: '9(a)', marks: 4, topic: 'number', skill: 'Simple Arithmetic', desc: 'Complete a multiplication grid (odd numbers × primes)', skillIds: ['simple_arithmetic'], kind: 'exam', visual: true },
    { id: '9b', label: '9(b)', marks: 2, topic: 'probdata', skill: 'Calculating Simple Probability', desc: 'P(product from the grid is a square number)', skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false },
    { id: '10a', label: '10(a)', marks: 2, topic: 'algebra', skill: 'Simplifying Expressions', desc: 'Simplify 8m + 4 − 2m + 7', skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '10b', label: '10(b)', marks: 2, topic: 'algebra', skill: 'Simplifying Expressions', desc: 'Simplify ½c × 6d', skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '11', label: '11', marks: 4, topic: 'number', skill: 'Percentage Change + Simple Arithmetic', desc: '6 single bags at £55 each; multipack is 10% less', skillIds: ['percentage_change', 'simple_arithmetic'], kind: 'exam', visual: false },
    { id: '12', label: '12', marks: 1, topic: 'ratio', skill: 'Ratio', desc: 'Write 6:2 in the form n:1', skillIds: ['ratio'], kind: 'mastery', visual: false },
    { id: '13', label: '13', marks: 2, topic: 'number', skill: 'Simple Arithmetic', desc: 'x+y always/sometimes/never positive; x−y always/sometimes/never negative', skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '14a', label: '14(a)', marks: 1, topic: 'shape', skill: 'Congruence and Similarity', desc: 'Draw a shape congruent to triangle A', skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: true },
    { id: '14b', label: '14(b)', marks: 2, topic: 'shape', skill: 'Enlargements', desc: 'Enlarge shape B by scale factor 1/3', skillIds: ['enlargements', 'fractional_enlargements'], kind: 'mastery', visual: true },
    { id: '15', label: '15', marks: 3, topic: 'ratio', skill: 'Ratio', desc: '35 books, adults:children = 6:1 — how many more adult books', skillIds: ['ratio'], kind: 'exam', visual: false },
    { id: '16', label: '16', marks: 2, topic: 'shape', skill: 'Constructions', desc: 'Accurately draw a semicircle-and-square compound shape', skillIds: ['constructions'], kind: 'exam', visual: true },
    { id: '17', label: '17', marks: 3, topic: 'ratio', skill: 'Compound Units', desc: '4 miles in 5 minutes — average speed in mph', skillIds: ['compound_units'], kind: 'exam', visual: false },
    { id: '18', label: '18', marks: 3, topic: 'shape', skill: 'Coordinates + Straight Line Graphs', desc: 'J(0,12), K(5,10) on line JKLM with JK=KL=LM — find M', skillIds: ['coordinates', 'understanding_straight_line_graphs'], kind: 'exam', visual: false },
    { id: '19', label: '19', marks: 2, topic: 'number', skill: 'Indices', desc: '1.5 squared', skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '20a', label: '20(a)', marks: 1, topic: 'algebra', skill: 'Function Machines', desc: 'Complete a function machine so y = 4x + 5', skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '20b', label: '20(b)', marks: 1, topic: 'algebra', skill: 'Function Machines', desc: 'Complete a function machine so y = 3x − 24', skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '20c', label: '20(c)', marks: 1, topic: 'algebra', skill: 'Function Machines', desc: 'Complete a function machine so y = x', skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '21', label: '21', marks: 3, topic: 'number', skill: 'Simple Arithmetic', desc: 'Add 10 to every value in a list: True/False for mode, median, range', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '22a', label: '22(a)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Missing term: 1, 4, 16, ?, 256', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '22b', label: '22(b)', marks: 2, topic: 'algebra', skill: 'Sequences', desc: 'Fibonacci-type sequence 5, −9, … — next two terms', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '23a', label: '23(a)', marks: 1, topic: 'shape', skill: 'Properties of 3D Solids', desc: 'Faces of a hexagonal prism (from the diagram)', skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false },
    { id: '23b', label: '23(b)', marks: 2, topic: 'shape', skill: 'Areas of Compound Shapes', desc: 'Cross-section area from volume 3500 cm³, length 20 cm', skillIds: ['areas_of_compound_shapes'], kind: 'mastery', visual: false },
    { id: '24', label: '24', marks: 2, topic: 'number', skill: 'Adding and Subtracting Fractions', desc: '1⅕ − 3/10, as a fraction', skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false },
    { id: '25', label: '25', marks: 1, topic: 'shape', skill: 'Exact Trigonometric Values', desc: 'sin 90°', skillIds: ['exact_trig_values'], kind: 'mastery', visual: false },
    { id: '26', label: '26', marks: 4, topic: 'shape', skill: 'Area of a Circle', desc: 'Large circle r=12cm, radii ratio 4:1 — shaded area in terms of π', skillIds: ['area_of_a_circle'], kind: 'exam', visual: false },
    { id: '27a', label: '27(a)', marks: 2, topic: 'ratio', skill: 'Inverse Proportion', desc: '10 people take 9 hours — time for 15 people at the same rate', skillIds: ['inverse_proportion'], kind: 'mastery', visual: false },
    { id: '27b', label: '27(b)', marks: 1, topic: 'ratio', skill: 'Inverse Proportion', desc: '6 of the 15 work slower, 9 faster — greater/same/less/impossible to say', skillIds: ['inverse_proportion'], kind: 'mastery', visual: false },
  ],

  retrySet: {
    '1a': { skill: 'Indices', question: 'Work out the value of √81' },
    '1b': { skill: 'Indices', question: 'Work out the value of 4³' },
    '1c': { skill: 'Indices', question: 'Write 1000 as a power of 10' },
    '2': { skill: 'Converting Measurements', question: '1 stone = 14 pounds. Work out the number of pounds in 5 stone.' },
    '3a': { skill: 'Irregular and Improper Fractions', question: 'Write 7/3 as a mixed number' },
    '3b': { skill: 'Adding and Subtracting Fractions', question: 'Work out 1/6 + 1/6' },
    '4a': { skill: 'Factors and Multiples', question: 'Write down all the factors of 18' },
    '4b': { skill: 'Factors and Multiples', question: "Nia says, 'When two multiples of 3 are added, the answer is always a multiple of 6.' Give one example to show she is wrong." },
    '5': { skill: 'Fractions, Decimals and Percentages', question: 'Put these values in order of size, starting with the smallest: 60%, 0.55, 5/8' },
    '6': { skill: 'Simple Arithmetic', question: 'Bilal buys three pens and two rulers. The total cost is £9.60. Each pen costs £1.20. Work out the cost of each ruler.' },
    '7b': { skill: 'Frequency Trees', question: '50 students were asked if they walk or cycle to school. 30 walk; the rest cycle. Of the walkers, 18 are in Year 7. What fraction of the walkers are in Year 7?' },
    '9b': { skill: 'Calculating Simple Probability', question: 'A number is picked at random from 1 to 10. What is the probability that it is a square number? Give your answer as a fraction.' },
    '10a': { skill: 'Simplifying Expressions', question: 'Simplify fully 5x + 9 − 3x + 2' },
    '10b': { skill: 'Simplifying Expressions', question: 'Simplify fully ⅓p × 9q' },
    '11': { skill: 'Percentage Change', question: 'A multipack costs 20% less than 5 single tins. Each tin costs £3. Work out the cost of the multipack.' },
    '12': { skill: 'Ratio', question: 'Write the ratio 15 : 3 in the form n : 1' },
    '13': { skill: 'Simple Arithmetic', question: 'a and b are two different positive numbers. For each statement, say if it is always, sometimes or never true: (i) a ÷ b is a whole number  (ii) a × b is even' },
    '15': { skill: 'Ratio', question: '42 sweets are shared between Sam and Tia in the ratio 5:2. How many more sweets does Sam get than Tia?' },
    '17': { skill: 'Compound Units', question: 'A cyclist travels 6 miles in 15 minutes. Work out the average speed in miles per hour.' },
    '18': { skill: 'Coordinates', question: 'P(1,5) and Q(3,9) lie on a straight line PQRS, with PQ = QR = RS. Work out the coordinates of S.' },
    '19': { skill: 'Indices', question: 'Work out the value of 2.5²' },
    '20a': { skill: 'Function Machines', question: 'Complete a function machine with two boxes so that it turns x into 3x + 7. What are the two missing operations, in order?' },
    '20b': { skill: 'Function Machines', question: 'A function machine has one box already showing ×2. Complete the second box so the machine turns x into 2x − 11.' },
    '20c': { skill: 'Function Machines', question: 'A function machine has one box already showing ×5. Complete the second box so the machine turns x back into x, unchanged.' },
    '21': { skill: 'Simple Arithmetic', question: 'Each number in a list has 5 subtracted from it. For each statement, say True, False, or Cannot tell: the mode decreases by 5; the mean decreases by 5; the range stays the same.' },
    '22a': { skill: 'Sequences', question: 'Write the missing term in the geometric progression: 2, 6, 18, ?, 162' },
    '22b': { skill: 'Sequences', question: 'A Fibonacci-type sequence begins 3, −7, and continues by adding the previous two terms. Work out the next two terms.' },
    '23a': { skill: 'Properties of 3D Solids', question: 'A prism has an octagonal cross-section. How many faces does it have?' },
    '23b': { skill: 'Areas of Compound Shapes', question: 'A prism has volume 4200 cm³ and length 15 cm. Work out the area of the cross-section.' },
    '24': { skill: 'Adding and Subtracting Fractions', question: 'Work out 1⅓ − 2/3. Give your answer as a fraction.' },
    '25': { skill: 'Exact Trigonometric Values', question: 'Write down the value of cos 0°' },
    '26': { skill: 'Area of a Circle', question: 'A small circle sits inside a large circle. The large circle has radius 10 cm, and the radii are in the ratio 5 : 1. Work out the area between the two circles. Give your answer in terms of π.' },
    '27a': { skill: 'Inverse Proportion', question: '8 people can complete a job in 6 hours, all working at the same rate. If 12 people work on the same job, how many hours will it take?' },
    '27b': { skill: 'Inverse Proportion', question: '12 people were assumed to complete a job in 5 hours. In fact, some of the 12 work faster than assumed and some work slower. What does this mean about the time it will take, compared to 5 hours? (greater / the same / less / not possible to say)' },
  },

  challengeQuestions: [
    { topic: 'number', skill: 'Reverse Percentages', question: 'A jacket costs £68 after a 20% discount. What was the original price?', answer: '£85', working: '£68 is 80% of the original price.' },
    { topic: 'number', skill: 'Standard Form', question: 'Write 0.000521 in standard form.', answer: '5.21 × 10⁻⁴' },
    { topic: 'algebra', skill: 'Simultaneous Equations', question: '2x + 3y = 16 and 4x − 3y = 14. Find the values of x and y.', answer: 'x = 5, y = 2', working: 'Adding the equations eliminates y: 6x = 30.' },
    { topic: 'algebra', skill: 'Quadratic Factorising', question: 'Factorise x² + 2x − 15.', answer: '(x + 5)(x − 3)' },
    { topic: 'ratio', skill: 'Compound Measures', question: 'A runner covers 21 km in 1 hour 45 minutes. Work out the average speed in km/h.', answer: '12 km/h', working: '1 hour 45 minutes is 1.75 hours.' },
    { topic: 'ratio', skill: 'Direct Proportion', question: 'y is directly proportional to x. When x = 8, y = 20. Find y when x = 14.', answer: 'y = 35', working: 'y = 2.5x.' },
    { topic: 'shape', skill: 'Trigonometry', question: 'A right-angled triangle has a 9 cm side adjacent to a 40° angle. Work out the length of the hypotenuse, to 1 decimal place.', answer: '11.7 cm', working: '9 ÷ cos 40° = 11.74…' },
    { topic: 'shape', skill: 'Circle Theorems', question: 'A and B are points on a circle with centre O. Angle AOB = 84°. Work out the angle at the circumference subtended by the same arc AB.', answer: '42°', working: 'The angle at the centre is twice the angle at the circumference.' },
    { topic: 'probdata', skill: 'Probability', question: 'A bag contains 5 red, 2 blue and 3 green counters. Two counters are drawn without replacement. Work out the probability that both are green.', answer: '1/15', working: '3/10 × 2/9 = 6/90.' },
    { topic: 'probdata', skill: 'Cumulative Frequency', question: 'The interquartile range of a data set of 80 values is estimated from a cumulative frequency graph. Which two cumulative frequency values should you read across from?', answer: '20 and 60', working: 'A quarter and three quarters of 80.' },
  ],

  sampleStudents: [
    'Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim',
    'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson',
  ],

  // Generated (deterministic, seed 42) — see the note on aqa-8300-3f-nov24.ts's
  // sampleMarks for the convention; this class's relative standing matches
  // that paper's so a teacher demoing both papers sees one consistent cohort.
  sampleMarks: {
    'Amira Patel':     { '1a':1,'1b':1,'1c':1,'2':2,'3a':1,'3b':1,'4a':2,'4b':1,'5':2,'6':4,'7a':4,'7b':2,'8':3,'9a':4,'9b':2,'10a':2,'10b':2,'11':4,'12':1,'13':2,'14a':1,'14b':2,'15':3,'16':2,'17':2,'18':3,'19':2,'20a':1,'20b':1,'20c':1,'21':3,'22a':1,'22b':2,'23a':1,'23b':2,'24':2,'25':1,'26':4,'27a':2,'27b':1 },
    'Ben Okonkwo':     { '1a':0,'1b':1,'1c':0,'2':2,'3a':0,'3b':1,'4a':1,'4b':0,'5':2,'6':3,'7a':3,'7b':2,'8':3,'9a':2,'9b':2,'10a':1,'10b':2,'11':3,'12':0,'13':0,'14a':1,'14b':0,'15':2,'16':2,'17':2,'18':2,'19':1,'20a':0,'20b':1,'20c':0,'21':3,'22a':0,'22b':2,'23a':1,'23b':1,'24':1,'25':0,'26':4,'27a':1,'27b':0 },
    'Charlotte Evans': { '1a':1,'1b':0,'1c':1,'2':2,'3a':1,'3b':1,'4a':1,'4b':0,'5':2,'6':4,'7a':2,'7b':0,'8':2,'9a':3,'9b':1,'10a':0,'10b':2,'11':4,'12':1,'13':1,'14a':1,'14b':1,'15':2,'16':2,'17':2,'18':2,'19':1,'20a':1,'20b':0,'20c':0,'21':3,'22a':0,'22b':2,'23a':1,'23b':2,'24':2,'25':0,'26':2,'27a':1,'27b':1 },
    'Daniel Kim':      { '1a':1,'1b':1,'1c':0,'2':1,'3a':1,'3b':1,'4a':0,'4b':1,'5':1,'6':3,'7a':3,'7b':1,'8':3,'9a':2,'9b':2,'10a':0,'10b':1,'11':2,'12':0,'13':2,'14a':0,'14b':2,'15':2,'16':1,'17':2,'18':2,'19':2,'20a':0,'20b':0,'20c':1,'21':0,'22a':1,'22b':0,'23a':1,'23b':2,'24':0,'25':0,'26':2,'27a':1,'27b':1 },
    'Emily Zhang':     { '1a':1,'1b':1,'1c':1,'2':2,'3a':1,'3b':1,'4a':1,'4b':1,'5':1,'6':3,'7a':3,'7b':2,'8':3,'9a':3,'9b':2,'10a':2,'10b':1,'11':2,'12':1,'13':1,'14a':1,'14b':0,'15':3,'16':1,'17':2,'18':1,'19':2,'20a':1,'20b':1,'20c':1,'21':1,'22a':1,'22b':1,'23a':1,'23b':1,'24':2,'25':1,'26':1,'27a':1,'27b':0 },
    'Finn McCarthy':   { '1a':0,'1b':0,'1c':0,'2':0,'3a':0,'3b':0,'4a':1,'4b':1,'5':1,'6':0,'7a':1,'7b':2,'8':1,'9a':1,'9b':1,'10a':0,'10b':1,'11':1,'12':0,'13':2,'14a':0,'14b':0,'15':0,'16':1,'17':2,'18':0,'19':0,'20a':1,'20b':1,'20c':0,'21':0,'22a':1,'22b':1,'23a':0,'23b':0,'24':0,'25':0,'26':1,'27a':0,'27b':0 },
    'Grace Adeyemi':   { '1a':0,'1b':0,'1c':0,'2':0,'3a':0,'3b':0,'4a':1,'4b':0,'5':0,'6':1,'7a':0,'7b':1,'8':1,'9a':1,'9b':0,'10a':0,'10b':1,'11':3,'12':0,'13':0,'14a':0,'14b':0,'15':0,'16':0,'17':0,'18':1,'19':0,'20a':0,'20b':0,'20c':1,'21':2,'22a':1,'22b':1,'23a':0,'23b':0,'24':0,'25':1,'26':1,'27a':0,'27b':0 },
    'Harry Wilson':    { '1a':1,'1b':1,'1c':1,'2':2,'3a':1,'3b':1,'4a':2,'4b':0,'5':1,'6':4,'7a':4,'7b':2,'8':3,'9a':4,'9b':2,'10a':2,'10b':2,'11':4,'12':1,'13':2,'14a':1,'14b':2,'15':2,'16':2,'17':3,'18':3,'19':2,'20a':1,'20b':1,'20c':1,'21':3,'22a':1,'22b':2,'23a':1,'23b':2,'24':2,'25':1,'26':4,'27a':2,'27b':1 },
  },
}
