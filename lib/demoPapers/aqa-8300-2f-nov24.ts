import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator, Nov 2024.
 *
 * Built the same way as aqa-8300-1f-nov24.ts — see that file's header for the
 * general approach (real QP/MS as source, audit JSON for marks/skill/topic,
 * `desc` a paraphrase not a transcription).
 *
 * Several questions here reference a diagram (angles on a line, a pie chart, a
 * right-angled triangle, a rectangle labelled with algebra) whose specific
 * given numbers the audit doesn't carry. Where the mark scheme's OWN worked
 * examples pin those numbers down exactly (eg Q6(c)'s "47 + 86 = 133" appears
 * in the MS's additional guidance; Q14's pie chart angles are forced by
 * "360 − 90 − 78 − 48"; Q19's triangle sides by "1.7² − 1.5² = 0.64"), the
 * real values are used and the question is retryable. Where they are not
 * recoverable at all (Q4's grid coordinates, depending on an unlabelled point
 * B the mark scheme never needs), the question is marked `visual: true` rather
 * than guessed.
 *
 * Two corrections versus the audit's skill tagging, both confirmed against the
 * real QP wording:
 *  - Q9 ("list all 3-topping combinations from H/S/O/M") has NO diagram at
 *    all — audit's `answer_form: table_complete` describes the answer BOXES,
 *    not a picture. Fully retryable as text.
 *  - Q12(b) is "Rearrange y = w − 1 to make w the subject" — genuinely
 *    `rearranging_formulae`, not `simplifying_expressions` as tagged.
 * Neither correction is folded back into the audit JSON here; out of scope.
 */
export const AQA_8300_2F_NOV24: PaperConfig = {
  id: 'aqa-8300-2f-nov24',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a', label: '1(a)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Next term: 4, 7, 10, 13, …', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '1b', label: '1(b)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Next term: 19, 14, 9, 4, …', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '1c', label: '1(c)', marks: 1, topic: 'algebra', skill: 'Sequences', desc: 'Term-to-term rule: 3, 6, 12, 24, …', skillIds: ['sequences'], kind: 'mastery', visual: false },
    { id: '2a', label: '2(a)', marks: 1, topic: 'number', skill: 'Simple Arithmetic', desc: 'Cost of three candles at £4.55 each', skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '2b', label: '2(b)', marks: 2, topic: 'number', skill: 'Simple Arithmetic', desc: '£7.50 — enough for soap (£2.00) + body cream (£3.80) + lip scrub (£1.75)?', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '3a', label: '3(a)', marks: 1, topic: 'algebra', skill: 'Solving Linear Equations', desc: 'Solve 5x = 30', skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false },
    { id: '3b', label: '3(b)', marks: 1, topic: 'algebra', skill: 'Solving Linear Equations', desc: 'Solve −2 + y = 10', skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false },
    { id: '3c', label: '3(c)', marks: 2, topic: 'number', skill: 'Simplifying Indices', desc: 'Simplify fully 20w ÷ 4w', skillIds: ['simplifying_indices'], kind: 'mastery', visual: false },
    { id: '4a', label: '4(a)', marks: 1, topic: 'shape', skill: 'Coordinates', desc: 'Coordinates of point C (from the grid)', skillIds: ['coordinates'], kind: 'mastery', visual: false },
    { id: '4b', label: '4(b)', marks: 1, topic: 'shape', skill: 'Coordinates', desc: 'Midpoint of A and C (from the grid)', skillIds: ['coordinates'], kind: 'mastery', visual: false },
    { id: '4c', label: '4(c)', marks: 1, topic: 'shape', skill: 'Coordinates', desc: 'Plot D on the grid so ABCD is a rhombus', skillIds: ['coordinates'], kind: 'mastery', visual: true },
    { id: '5a', label: '5(a)', marks: 1, topic: 'probdata', skill: 'Range', desc: 'Range of 14.2, 15.1, 16.5, 16.7, 18.0', skillIds: ['range'], kind: 'mastery', visual: false },
    { id: '5b', label: '5(b)', marks: 2, topic: 'probdata', skill: 'Mean', desc: 'Mean of 14.2, 15.1, 16.5, 16.7, 18.0', skillIds: ['mean'], kind: 'mastery', visual: false },
    { id: '6a', label: '6(a)', marks: 1, topic: 'shape', skill: 'Angles on Lines and Circles', desc: 'Angle x on a straight line (diagram)', skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false },
    { id: '6b', label: '6(b)', marks: 2, topic: 'shape', skill: 'Angles on Lines and Circles', desc: 'Angle y at an intersection (diagram)', skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false },
    { id: '6c', label: '6(c)', marks: 3, topic: 'shape', skill: 'Angles on Lines and Circles', desc: 'Three lines intersect, angles 47° and 86° marked — classify the triangle formed', skillIds: ['angles_on_lines_and_circles'], kind: 'exam', visual: false },
    { id: '7', label: '7', marks: 3, topic: 'ratio', skill: 'Proportion + Simple Arithmetic', desc: '5 packs of 8 cartons + 16 packs of 3 cartons; 4 cartons/day — how many days', skillIds: ['proportion', 'simple_arithmetic'], kind: 'exam', visual: false },
    { id: '8', label: '8', marks: 3, topic: 'probdata', skill: 'Simple Charts', desc: 'Complete a pictogram (100 voters, Jo/Kim/Liam)', skillIds: ['simple_charts'], kind: 'exam', visual: true },
    { id: '9', label: '9', marks: 2, topic: 'probdata', skill: 'Systematic Listing', desc: 'List all 3-topping pizza combinations from 4 choices', skillIds: ['systematic_listing'], kind: 'mastery', visual: false },
    { id: '10a', label: '10(a)', marks: 1, topic: 'number', skill: 'Fractions, Decimals and Percentages', desc: '3/8 as a percentage', skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false },
    { id: '10b', label: '10(b)', marks: 2, topic: 'number', skill: 'Converting Fractions to Decimals + Rounding', desc: '15/32 as a decimal, to 2dp', skillIds: ['converting_fractions_to_decimals', 'rounding'], kind: 'mastery', visual: false },
    { id: '11', label: '11', marks: 3, topic: 'number', skill: 'Simple Arithmetic', desc: 'True/May be true/Not true: three statements about number inequalities', skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '12a', label: '12(a)', marks: 2, topic: 'algebra', skill: 'Substitution', desc: 'Work out x² + 7x when x = −4', skillIds: ['substitution'], kind: 'mastery', visual: false },
    { id: '12b', label: '12(b)', marks: 1, topic: 'algebra', skill: 'Rearranging Formulae', desc: 'Rearrange y = w − 1 to make w the subject', skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false },
    { id: '12c', label: '12(c)', marks: 2, topic: 'algebra', skill: 'Simplifying Expressions', desc: 'Simplify fully 4(a + 2) + a', skillIds: ['expanding_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '13', label: '13', marks: 2, topic: 'number', skill: 'Time Calculations', desc: '1 minute 28 seconds less than 2 hours, in h/m/s', skillIds: ['time_calculations'], kind: 'exam', visual: false },
    { id: '14', label: '14', marks: 4, topic: 'probdata', skill: 'Pie Charts', desc: 'Pie chart: Banana = 90°, two others 78° and 48°; 120 chose Banana — how many chose Apple?', skillIds: ['pie_charts'], kind: 'exam', visual: false },
    { id: '15a', label: '15(a)', marks: 2, topic: 'ratio', skill: 'Compound Units', desc: 'Bath graph: fills to 240 (litres) in 10 minutes — find the fill rate', skillIds: ['compound_units'], kind: 'mastery', visual: false },
    { id: '15b', label: '15(b)', marks: 2, topic: 'algebra', skill: 'Kinematic Graphs', desc: 'Draw the constant-then-emptying phase on the bath graph', skillIds: ['kinematic_graphs'], kind: 'mastery', visual: true },
    { id: '16', label: '16', marks: 2, topic: 'shape', skill: 'Symmetry', desc: 'Shade one quarter of a grid so it has exactly two lines of symmetry', skillIds: ['symmetry'], kind: 'exam', visual: true },
    { id: '17', label: '17', marks: 3, topic: 'ratio', skill: 'Proportion', desc: 'Map scale 1:4000, 7cm on the map — is the real distance more than 300m?', skillIds: ['proportion'], kind: 'exam', visual: false },
    { id: '18', label: '18', marks: 1, topic: 'ratio', skill: 'Inverse Proportion', desc: 'X inversely proportional to Y — circle the correct statement', skillIds: ['inverse_proportion'], kind: 'mastery', visual: false },
    { id: '19', label: '19', marks: 2, topic: 'shape', skill: "Pythagoras' Theorem", desc: 'Right-angled triangle: hypotenuse 1.7, one leg 1.5 — show the other leg is 0.8', skillIds: ['pythagoras_theorem'], kind: 'exam', visual: false },
    { id: '20a', label: '20(a)', marks: 2, topic: 'probdata', skill: 'Simple Charts', desc: 'Beth: 125 spins, 0.32 rel. freq.; Lynn: 80 spins, 0.35 — how many more heads did Beth spin', skillIds: ['simple_charts'], kind: 'mastery', visual: false },
    { id: '20b', label: '20(b)', marks: 1, topic: 'probdata', skill: 'Calculating Simple Probability + Relative Frequency', desc: "Lynn says her estimate (0.35) must be best since it's bigger than Beth's (0.32) — is she correct?", skillIds: ['calculating_simple_probability', 'relative_frequency'], kind: 'mastery', visual: false },
    { id: '21', label: '21', marks: 2, topic: 'number', skill: 'Decimals', desc: 'Oil: mass 537g, density 895,000 g/m³, 1m³=1000 litres — find the volume in litres', skillIds: ['decimals'], kind: 'exam', visual: false },
    { id: '22', label: '22', marks: 3, topic: 'shape', skill: 'Trigonometry (missing sides)', desc: 'Right-angled triangle: hypotenuse 21, angle 40° — find x (opposite side)', skillIds: ['trigonometry_missing_sides'], kind: 'exam', visual: false },
    { id: '23', label: '23', marks: 2, topic: 'number', skill: 'Upper and Lower Bounds', desc: 'Wall length 9m to the nearest metre — error interval', skillIds: ['upper_and_lower_bounds'], kind: 'exam', visual: false },
    { id: '24', label: '24', marks: 3, topic: 'ratio', skill: 'Reverse Percentage', desc: '384,000 cars sold this year is 20% more than last year — how many last year', skillIds: ['reverse_percentage'], kind: 'exam', visual: false },
    { id: '25', label: '25', marks: 3, topic: 'number', skill: 'Simplifying Indices', desc: 'Multiply pairs from xy, x², 5y² — three fully simplified products', skillIds: ['simplifying_indices'], kind: 'exam', visual: false },
    { id: '26', label: '26', marks: 5, topic: 'shape', skill: 'Solving Linear Equations + Areas of Squares and Rectangles', desc: 'Rectangle side labelled 4x+1 and 2x+17 (equal); AB:BC = 1:3 — find the area', skillIds: ['solving_linear_equations', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false },
  ],

  retrySet: {
    '1a': { skill: 'Sequences', question: 'A linear sequence starts 6, 11, 16, 21. Write down the next number in this sequence.' },
    '1b': { skill: 'Sequences', question: 'A linear sequence starts 25, 19, 13, 7. Write down the next number in this sequence.' },
    '1c': { skill: 'Sequences', question: 'Here is a sequence: 2, 8, 32, 128. Write down the term-to-term rule.' },
    '2a': { skill: 'Simple Arithmetic', question: 'Notebooks cost £3.20 each. Work out the cost of four notebooks.' },
    '2b': { skill: 'Simple Arithmetic', question: 'Priya has £10. She wants to buy a book (£4.20) and a pen (£1.90). Does she have enough money to also buy a ruler (£2.50)? Show working to support your answer.' },
    '3a': { skill: 'Solving Linear Equations', question: 'Solve 7x = 56' },
    '3b': { skill: 'Solving Linear Equations', question: 'Solve −5 + y = 12' },
    '3c': { skill: 'Simplifying Indices', question: 'Simplify fully 18p ÷ 3p' },
    '4a': { skill: 'Coordinates', question: 'A point P is plotted 3 units right and 2 units up from the origin. Write down the coordinates of P.' },
    '4b': { skill: 'Coordinates', question: 'M(2, 4) and N(8, 10) are two points. Work out the coordinates of the midpoint of MN.' },
    '5a': { skill: 'Range', question: 'Find the range of: 12.5, 13.1, 15.8, 16.0, 19.2' },
    '5b': { skill: 'Mean', question: 'Find the mean of: 12.5, 13.1, 15.8, 16.0, 19.2' },
    '6a': { skill: 'Angles on Lines and Circles', question: 'Angle p and an angle of 128° lie on a straight line together. Work out the size of angle p.' },
    '6b': { skill: 'Angles on Lines and Circles', question: 'Angle q, a 47° angle and a 75° angle lie on a straight line together. Work out the size of angle q.' },
    '6c': { skill: 'Angles on Lines and Circles', question: 'Three straight lines intersect. Two of the angles formed are marked 50° and 80°. Work out the type of triangle formed at the intersection, showing your working.' },
    '7': { skill: 'Proportion', question: 'A family has 4 packs of 6 eggs and 10 packs of 2 eggs. They use 3 eggs each day. In total, how many days will their eggs last?' },
    '9': { skill: 'Systematic Listing', question: 'Amir is choosing two toppings from four: pepperoni (P), mushroom (M), pepper (E), olive (L). List all the possible options for the two toppings.' },
    '10a': { skill: 'Fractions, Decimals and Percentages', question: 'Write 5/8 as a percentage.' },
    '10b': { skill: 'Converting Fractions to Decimals', question: 'Work out 9/16 as a decimal. Give your answer to 2 decimal places.' },
    '11': { skill: 'Simple Arithmetic', question: 'Tick True, May be true, or Not true for each: (i) if a number is < 0 the number is negative  (ii) if a number is ≥ 4 the number is 4' },
    '12a': { skill: 'Substitution', question: 'Work out the value of x² + 5x when x = −3' },
    '12b': { skill: 'Rearranging Formulae', question: 'Rearrange p = q + 3 to make q the subject.' },
    '12c': { skill: 'Simplifying Expressions', question: 'Simplify fully 3(b + 5) + b' },
    '13': { skill: 'Time Calculations', question: 'The time Priya takes to cycle to school is 2 minutes 45 seconds less than 1 hour. Work out her time in hours, minutes and seconds.' },
    '14': { skill: 'Pie Charts', question: 'A pie chart shows favourite pets: Dogs = 100°, Cats = 60°, Fish = 50°, and Rabbits get the rest. 90 people chose Dogs. How many chose Rabbits?' },
    '15a': { skill: 'Compound Units', question: 'A tank fills to 180 litres in 15 minutes at a constant rate. Work out the rate at which it fills, stating your units.' },
    '17': { skill: 'Proportion', question: 'A map has a scale of 1 : 5000. On the map, the distance between two towns is 6 cm. Is the actual distance more than 250 m? Show working to support your answer.' },
    '18': { skill: 'Inverse Proportion', question: 'P is inversely proportional to Q. Which is correct: P is directly proportional to Q; P is directly proportional to 3Q; P is directly proportional to 1/Q; or P is directly proportional to Q²?' },
    '19': { skill: "Pythagoras' Theorem", question: 'A right-angled triangle has hypotenuse 2.5 and one leg 2.4. Show that the other leg is 0.7.' },
    '20a': { skill: 'Simple Charts', question: 'Ali spins a coin 150 times with a relative frequency of Heads of 0.4. Jade spins it 90 times with a relative frequency of 0.5. How many more Heads did Jade spin than Ali?' },
    '20b': { skill: 'Relative Frequency', question: "Ali says his estimate of the probability of Heads must be the best, because he did more spins than Jade. Is he correct? Give a reason for your answer." },
    '21': { skill: 'Decimals', question: 'Some metal has a mass of 624 g and a density of 780,000 g/m³. Given 1 m³ = 1000 litres, work out the volume of the metal in litres.' },
    '22': { skill: 'Trigonometry (missing sides)', question: 'A right-angled triangle has a hypotenuse of 16 cm and one angle of 35°. Use trigonometry to work out the length of the side opposite that angle, to 1 decimal place.' },
    '23': { skill: 'Upper and Lower Bounds', question: 'The length of a field is 40 metres to the nearest metre. Complete the error interval for the length of the field.' },
    '24': { skill: 'Reverse Percentage', question: '276,000 tickets were sold this year. This is 15% more than last year. How many were sold last year?' },
    '25': { skill: 'Simplifying Indices', question: 'Here are three terms: ab, a², 3b². Work out the three possible fully simplified products of two of these terms.' },
    '26': { skill: 'Solving Linear Equations', question: 'A rectangle has one side labelled 3x + 2 and another expression for the same side, 5x − 6. AB : BC = 1 : 4. Work out the area of the rectangle.' },
  },

  challengeQuestions: [
    { topic: 'number', skill: 'Standard Form', question: 'Write 3,400,000 in standard form.', answer: '3.4 × 10⁶' },
    { topic: 'number', skill: 'Recurring Decimals', question: 'Convert 0.4̇5̇ (recurring) to a fraction in its simplest form.', answer: '5/11', working: 'Two repeating digits give 45/99, which cancels by 9.' },
    { topic: 'algebra', skill: 'Quadratic Equations', question: 'Solve x² − 5x − 14 = 0', answer: 'x = 7 or x = −2', working: 'Factorises to (x − 7)(x + 2) = 0.' },
    { topic: 'algebra', skill: 'Simultaneous Equations', question: '3x + y = 17 and x − y = 3. Find the values of x and y.', answer: 'x = 5, y = 2', working: 'Adding the equations eliminates y: 4x = 20.' },
    { topic: 'ratio', skill: 'Growth and Decay', question: 'A car worth £18,000 depreciates by 12% each year. Work out its value after 3 years, to the nearest £100.', answer: '£12,300', working: '18 000 × 0.88³ = 12 266.50 to the nearest penny.' },
    { topic: 'ratio', skill: 'Compound Interest', question: '£2,400 is invested at 3.5% compound interest per year. Work out the value of the investment after 4 years, to the nearest penny.', answer: '£2754.06', working: '2400 × 1.035⁴ = 2400 × 1.147523.' },
    { topic: 'shape', skill: 'Sine Rule', question: 'In triangle ABC, angle A = 52°, angle B = 71°, and side a = 9 cm. Work out the length of side b, to 1 decimal place.', answer: '10.8 cm', working: 'b = 9 × sin 71° ÷ sin 52° = 10.79…' },
    { topic: 'shape', skill: 'Volume of a Sphere', question: 'Work out the volume of a sphere with radius 6 cm. Give your answer in terms of π.', answer: '288π cm³', working: '(4/3) × π × 6³, and 4 × 216 ÷ 3 = 288.' },
    { topic: 'probdata', skill: 'Tree Diagrams', question: 'A bag has 6 red and 4 blue counters. Two are drawn without replacement. Work out the probability that they are different colours.', answer: '8/15', working: 'Two routes: 2 × (6/10 × 4/9) = 48/90.' },
    { topic: 'probdata', skill: 'Box Plots', question: 'A box plot has lower quartile 12, median 18, upper quartile 25. Work out the interquartile range.', answer: '13', working: '25 − 12; the median is not used.' },
  ],

  sampleStudents: [
    'Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim',
    'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson',
  ],

  // Generated (deterministic, seed 73) — see aqa-8300-1f-nov24.ts's note.
  sampleMarks: {
    'Amira Patel':     { '1a':1,'1b':1,'1c':1,'2a':1,'2b':2,'3a':1,'3b':1,'3c':2,'4a':1,'4b':1,'4c':1,'5a':1,'5b':2,'6a':1,'6b':2,'6c':3,'7':3,'8':3,'9':1,'10a':1,'10b':2,'11':3,'12a':2,'12b':1,'12c':2,'13':2,'14':4,'15a':2,'15b':2,'16':2,'17':3,'18':1,'19':2,'20a':2,'20b':1,'21':2,'22':3,'23':2,'24':3,'25':3,'26':5 },
    'Ben Okonkwo':     { '1a':0,'1b':0,'1c':0,'2a':1,'2b':1,'3a':0,'3b':1,'3c':1,'4a':1,'4b':1,'4c':1,'5a':1,'5b':1,'6a':0,'6b':1,'6c':3,'7':3,'8':2,'9':1,'10a':1,'10b':2,'11':1,'12a':1,'12b':0,'12c':1,'13':1,'14':1,'15a':1,'15b':2,'16':2,'17':3,'18':0,'19':0,'20a':0,'20b':0,'21':1,'22':0,'23':2,'24':3,'25':2,'26':4 },
    'Charlotte Evans': { '1a':1,'1b':1,'1c':1,'2a':0,'2b':1,'3a':1,'3b':0,'3c':2,'4a':1,'4b':1,'4c':1,'5a':1,'5b':1,'6a':0,'6b':2,'6c':2,'7':0,'8':2,'9':2,'10a':1,'10b':2,'11':2,'12a':2,'12b':0,'12c':1,'13':1,'14':3,'15a':2,'15b':2,'16':2,'17':3,'18':1,'19':2,'20a':0,'20b':1,'21':2,'22':2,'23':1,'24':2,'25':3,'26':3 },
    'Daniel Kim':      { '1a':1,'1b':1,'1c':0,'2a':0,'2b':1,'3a':1,'3b':0,'3c':2,'4a':0,'4b':1,'4c':1,'5a':0,'5b':1,'6a':1,'6b':1,'6c':3,'7':2,'8':1,'9':2,'10a':0,'10b':1,'11':2,'12a':2,'12b':0,'12c':0,'13':1,'14':2,'15a':0,'15b':2,'16':2,'17':0,'18':1,'19':1,'20a':1,'20b':0,'21':1,'22':2,'23':1,'24':2,'25':2,'26':3 },
    'Emily Zhang':     { '1a':1,'1b':0,'1c':1,'2a':0,'2b':1,'3a':1,'3b':1,'3c':0,'4a':0,'4b':1,'4c':1,'5a':0,'5b':2,'6a':1,'6b':2,'6c':1,'7':2,'8':2,'9':0,'10a':1,'10b':1,'11':3,'12a':1,'12b':1,'12c':0,'13':2,'14':3,'15a':1,'15b':1,'16':1,'17':3,'18':0,'19':1,'20a':1,'20b':1,'21':1,'22':2,'23':2,'24':2,'25':2,'26':4 },
    'Finn McCarthy':   { '1a':1,'1b':0,'1c':0,'2a':0,'2b':0,'3a':0,'3b':0,'3c':2,'4a':0,'4b':0,'4c':0,'5a':0,'5b':0,'6a':0,'6b':0,'6c':1,'7':1,'8':2,'9':0,'10a':0,'10b':2,'11':1,'12a':0,'12b':0,'12c':0,'13':0,'14':2,'15a':0,'15b':0,'16':1,'17':0,'18':1,'19':1,'20a':0,'20b':1,'21':1,'22':1,'23':2,'24':0,'25':0,'26':1 },
    'Grace Adeyemi':   { '1a':0,'1b':0,'1c':0,'2a':0,'2b':2,'3a':1,'3b':0,'3c':1,'4a':1,'4b':0,'4c':0,'5a':0,'5b':1,'6a':0,'6b':1,'6c':0,'7':1,'8':0,'9':0,'10a':0,'10b':0,'11':0,'12a':0,'12b':0,'12c':0,'13':0,'14':0,'15a':1,'15b':0,'16':1,'17':0,'18':1,'19':1,'20a':0,'20b':0,'21':1,'22':0,'23':0,'24':1,'25':1,'26':3 },
    'Harry Wilson':    { '1a':1,'1b':1,'1c':1,'2a':1,'2b':2,'3a':1,'3b':1,'3c':2,'4a':1,'4b':1,'4c':1,'5a':1,'5b':2,'6a':1,'6b':2,'6c':3,'7':3,'8':3,'9':2,'10a':1,'10b':2,'11':3,'12a':2,'12b':1,'12c':2,'13':2,'14':4,'15a':2,'15b':2,'16':2,'17':2,'18':1,'19':2,'20a':2,'20b':1,'21':2,'22':3,'23':2,'24':3,'25':3,'26':4 },
  },
}
