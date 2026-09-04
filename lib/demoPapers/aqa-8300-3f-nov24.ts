import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — November 2024.
 *
 * ⚠ HYBRID FILE. DO NOT REGENERATE — you would delete 30 hand-authored retry
 * questions, 10 challenge questions and the sample class. The script refuses to
 * overwrite without --force; do not reach for --force here.
 *
 *   • The `questions` list came from data/exam-audit/NOV24-F-P3.json via
 *     scripts/generate-paper-from-audit.ts.
 *   • Everything from `retrySet` down is hand-authored and cannot be derived,
 *     because the audit transcribes no exam text.
 *
 * WHY IT WAS REBUILT (2026-09-04). This file previously held only 21 of the
 * paper's 41 items and 35 of its 80 marks — it stopped after question 12,
 * because it began life as hardcoded constants in the demo marking page rather
 * than as a coding of the whole paper. Since it is DEFAULT_PAPER_ID, a teacher
 * marking the real 3F would have seen half its questions and scored their class
 * out of 35. The audit's coding supplied the missing 20 items; the retry
 * questions for them were written to match.
 *
 * TWO THINGS TO KNOW BEFORE EDITING:
 *
 *   • `visual` on items 5(a), 5(b), 11(a), 11(b) and 11(c) is HAND-SET and
 *     deliberately disagrees with what the generator would produce. It derives
 *     `visual` from an answer_form of "draw…", which catches only DRAWING a
 *     diagram; PaperQuestion.visual means the wider "depends on a diagram in
 *     the original paper — a chart to read, a number pattern to complete".
 *     Reading a composite bar chart is visual and the heuristic misses it.
 *
 *   • retrySet must stay ALL-OR-NOTHING — every non-visual item or none, which
 *     papers.test.ts enforces. Adding an item means adding its retry question.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const AQA_8300_3F_NOV24: PaperConfig = {
  id: 'aqa-8300-3f-nov24',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                                        skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Indices',                                                     skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                     skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Simple Arithmetic',                              skillIds: ['proportion', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '4a',  label: '4(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'ordering; exact sequence checkable' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                          skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'ordering; exact sequence checkable' },
    { id: '5a',  label: '5(a)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'static composite bar chart supported' },
    { id: '5b',  label: '5(b)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'identify category from chart' },
    { id: '5c',  label: '5(c)',  marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                               skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing/shading a composite bar' },
    { id: '6',   label: '6',     marks: 1,  topic: 'number',   skill: 'Time Calculations',                                           skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'tick + worded reason not markable' },
    { id: '7',   label: '7',     marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                           skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                           skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '9',   label: '9',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                    skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '10b', label: '10(b)', marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations',                                    skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: '' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                           skillIds: ['simple_arithmetic'], kind: 'mastery', visual: true, desc: 'number-diagram cell entry' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                           skillIds: ['function_machines'], kind: 'mastery', visual: true, desc: 'number-diagram cell entry' },
    { id: '11c', label: '11(c)', marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations + Forming Expressions and Formulae', skillIds: ['solving_linear_equations', 'forming_expressions_and_formulae'], kind: 'exam', visual: true, desc: '' },
    { id: '12',  label: '12',    marks: 2,  topic: 'probdata', skill: 'Median',                                                      skillIds: ['median'], kind: 'mastery', visual: false, desc: '' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                              skillIds: ['symmetry'], kind: 'mastery', visual: true, desc: 'requires drawing lines of symmetry' },
    { id: '13b', label: '13(b)', marks: 1,  topic: 'shape',    skill: 'Symmetry (Line and Rotational)',                              skillIds: ['symmetry'], kind: 'mastery', visual: true, desc: 'requires shading/completing a symmetric pattern' },
    { id: '14a', label: '14(a)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                               skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'static Venn diagram supported' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams',                                               skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: '' },
    { id: '14c', label: '14(c)', marks: 2,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',              skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '15',  label: '15',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts + Ratio',                                skillIds: ['fractions_of_amounts', 'ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '16',  label: '16',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                            skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '17',  label: '17',    marks: 3,  topic: 'algebra',  skill: 'Forming Expressions and Formulae + Simplifying Expressions',  skillIds: ['forming_expressions_and_formulae', 'simplifying_expressions'], kind: 'exam', visual: false, desc: 'line-matching input not supported' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                          skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'probdata', skill: 'Time Series',                                                 skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires plotting line graph' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'probdata', skill: 'Time Series',                                                 skillIds: ['time_series'], kind: 'mastery', visual: false, desc: 'range-tolerance answer; exact-match insufficient' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                        skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'requires drawing plan view on a grid' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                        skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'requires drawing front elevation on a grid' },
    { id: '21',  label: '21',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Areas of Squares and Rectangles',                     skillIds: ['ratio', 'areas_of_squares_and_rectangles'], kind: 'exam', visual: false, desc: 'ratio answer needs equivalence checker' },
    { id: '22',  label: '22',    marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                      skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'show-that justification with bounds not markable' },
    { id: '23',  label: '23',    marks: 2,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                            skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'formula expression needs equivalence checker' },
    { id: '24a', label: '24(a)', marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                       skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence checker' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                       skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'explain-the-error worded answer not markable' },
    { id: '25',  label: '25',    marks: 4,  topic: 'shape',    skill: 'Coordinates + Understanding Straight Line Graphs',            skillIds: ['coordinates', 'understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'multiple coordinate answers need pair-equivalence checker' },
    { id: '26',  label: '26',    marks: 2,  topic: 'shape',    skill: 'Volume of a Sphere',                                          skillIds: ['volume_of_a_sphere'], kind: 'mastery', visual: false, desc: 'identify-mistakes worded answers not markable' },
  ],

  // ── Hand-authored below this line ─────────────────────────────────────────
  // The questions above come from the audit; everything below does not, and a
  // regeneration would wipe it. See the file header.
  retrySet: {
    '1a':  { skill: 'Fractions',           question: 'Work out 1/3 of 912' },
    '1b':  { skill: 'Powers & Roots',      question: 'Work out the value of 23²' },
    '2':   { skill: 'Simplifying',         question: 'Simplify  p + p + p + p + p' },
    '3a':  { skill: 'Proportion',          question: '5 oranges cost £1.80. Work out the cost of 15 oranges.' },
    '3b':  { skill: 'Proportion',          question: 'The cost of 30 pens and 10 rulers is £16.00. Work out the cost of 3 pens and 1 ruler.' },
    '4a':  { skill: 'Ordering Numbers',    question: 'Write in order, smallest first:  3,  −2,  0.5,  −1' },
    '4b':  { skill: 'Ordering Fractions',  question: 'Write in order, smallest first:  3/5,  1/4,  7/8,  1/2' },
    '6':   { skill: 'Time Calculations',   question: 'Amina leaves home at 8.25 am. She travels for 25 minutes. Does she arrive by 8.45 am? Explain.' },
    '7':   { skill: 'Division in Context', question: 'Priya has £25. A notebook costs £1.60. What is the greatest number she can buy?' },
    '8a':  { skill: 'Function Machines',   question: 'Input → ×3 → +5 → Output. Work out the output when the input is 8.' },
    '8b':  { skill: 'Function Machines',   question: 'Input → ×3 → +5 → Output. Work out the input when the output is 20.' },
    '9':   { skill: 'Unit Conversion',     question: 'A shelf holds 8 books each 25 mm thick and 2 bookends each 18 mm thick. Total length in cm?' },
    '10a': { skill: 'Solving Equations',   question: 'Solve  c ÷ 5 = 12' },
    '10b': { skill: 'Solving Equations',   question: 'Solve  3(4e − 2) = 42' },
    '12':  { skill: 'Averages',            question: 'Find the median of: 15, 3, 9, 7, 11, 4, 7, 20, 6' },
    '14a': { skill: 'Venn Diagrams',       question: 'In a survey of 30 people, 18 like tea, 14 like coffee and 5 like neither. How many like both?' },
    '14b': { skill: 'Venn Diagrams',       question: 'In a group of 25 people, 16 own a bike, 11 own a scooter and 6 own both. How many own a scooter but not a bike?' },
    '14c': { skill: 'Venn Diagrams',       question: 'A club has 40 members. 24 of them play tennis. What fraction of all the members play tennis?' },
    '15':  { skill: 'Fractions & Ratio',   question: '180 people travel to work by bus, train or bike. 2/9 go by bus. The rest split train : bike = 2 : 3. How many go by bike?' },
    '16':  { skill: 'Percentage Decrease', question: 'A laptop is worth £750. Its value falls by 20% in the first year, then by 5% in the second year. Work out its value after two years.' },
    '17':  { skill: 'Forming Expressions', question: 'Write an expression for: three times a number n, then subtract 4' },
    '18':  { skill: 'Percentages',         question: 'Maya has £40. She buys 6 notebooks costing £2.50 each. What percentage of her £40 does she spend?' },
    '19b': { skill: 'Trends',              question: 'A town had 210 electric cars in 2020, 275 in 2021 and 350 in 2022. Estimate the number in 2023.' },
    '21':  { skill: 'Ratio & Area',        question: 'Rectangle A is 12 cm by 3 cm. Rectangle B has the same area and is 6 cm wide. Work out the ratio perimeter A : perimeter B.' },
    '22':  { skill: 'Bounds',              question: 'To the nearest pound, Tom has £20. He wants to buy 7 tickets costing £2.75 each. Show that Tom definitely has enough money.' },
    '23':  { skill: 'Forming Formulae',    question: 'A plumber charges a call-out fee of £35 plus £28 for each hour worked. Write a formula for the total cost, £T, of a job lasting h hours.' },
    '24a': { skill: 'Ratio',               question: 'A school has 720 students and the ratio of students to teachers is 20 : 1. The number of students stays the same and the number of teachers increases by 4. Work out the new ratio of students to teachers, in the form n : 1' },
    '24b': { skill: 'Ratio Reasoning',     question: 'One coach is needed for every 50 passengers or fewer. 340 passengers are travelling. Jo works out 340 ÷ 50 = 6.8 and says 6 coaches are needed. What is wrong with her answer?' },
    '25':  { skill: 'Coordinates & Lines', question: 'A triangle is formed by the lines y = x, x = 3 and y = −1. Work out the coordinates of its three vertices.' },
    '26':  { skill: 'Volume of a Sphere',  question: 'Volume of a sphere = 4/3 πr³. A hemisphere has radius 6 cm. Kai writes: Volume = 4/3 × π × 6 × 3 × 2. Write down two mistakes Kai has made.' },
  },

  challengeQuestions: [
    { topic: 'number', skill: 'Reverse Percentages', question: 'A laptop costs £612 after a 15% discount. What was the original price?' },
    { topic: 'number', skill: 'Standard Form', question: 'Write 0.00047 in standard form.' },
    { topic: 'number', skill: 'Surds', question: 'Simplify √72 + √18. Give your answer in the form a√b.' },
    { topic: 'algebra', skill: 'Simultaneous Equations', question: '3x + 2y = 16 and 5x − 2y = 24. Find the values of x and y.' },
    { topic: 'algebra', skill: 'Quadratic Factorising', question: 'Factorise x² + 5x − 14.' },
    { topic: 'algebra', skill: 'Sequences (nth term)', question: 'Find the nth term of the sequence 7, 11, 15, 19, ...' },
    { topic: 'ratio', skill: 'Compound Measures', question: 'A car travels 156 miles in 2 hours 24 minutes. Work out the average speed in mph.' },
    { topic: 'ratio', skill: 'Direct Proportion', question: 'y is directly proportional to x. When x = 5, y = 35. Find y when x = 9.' },
    { topic: 'probdata', skill: 'Probability', question: 'A bag contains 4 red, 3 blue and 5 green counters. Two counters are drawn without replacement. Work out the probability that both are red.' },
    { topic: 'probdata', skill: 'Cumulative Frequency', question: 'The median of a set of 60 values is estimated from a cumulative frequency graph. Which value on the vertical axis should you read across from?' },
  ],

  sampleStudents: ['Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim', 'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson'],

  // Marks for the original 21 items are the originals; the rest are generated
  // (deterministic, seed 42) around each student's demonstrated ability so the
  // sample class keeps its characters.
  sampleMarks: {
    'Amira Patel': { '1a': 1, '1b': 1, '2': 1, '3a': 2, '3b': 2, '4a': 2, '4b': 2, '5a': 1, '5b': 1, '5c': 2, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 3, '10a': 1, '10b': 3, '11a': 1, '11b': 2, '11c': 3, '12': 2, '13a': 2, '13b': 1, '14a': 1, '14b': 1, '14c': 2, '15': 3, '16': 3, '17': 3, '18': 3, '19a': 2, '19b': 1, '20a': 2, '20b': 2, '21': 4, '22': 3, '23': 2, '24a': 3, '24b': 1, '25': 3, '26': 2 },
    'Ben Okonkwo': { '1a': 1, '1b': 1, '2': 1, '3a': 2, '3b': 1, '4a': 2, '4b': 1, '5a': 1, '5b': 0, '5c': 1, '6': 1, '7': 2, '8a': 1, '8b': 0, '9': 2, '10a': 1, '10b': 1, '11a': 1, '11b': 1, '11c': 0, '12': 2, '13a': 2, '13b': 1, '14a': 1, '14b': 0, '14c': 1, '15': 2, '16': 2, '17': 2, '18': 2, '19a': 1, '19b': 1, '20a': 2, '20b': 1, '21': 3, '22': 2, '23': 1, '24a': 1, '24b': 1, '25': 3, '26': 1 },
    'Charlotte Evans': { '1a': 1, '1b': 1, '2': 0, '3a': 1, '3b': 2, '4a': 2, '4b': 1, '5a': 1, '5b': 1, '5c': 1, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 1, '10a': 1, '10b': 2, '11a': 0, '11b': 1, '11c': 1, '12': 1, '13a': 1, '13b': 1, '14a': 1, '14b': 1, '14c': 1, '15': 2, '16': 2, '17': 2, '18': 2, '19a': 1, '19b': 1, '20a': 1, '20b': 1, '21': 3, '22': 2, '23': 1, '24a': 2, '24b': 1, '25': 3, '26': 1 },
    'Daniel Kim': { '1a': 1, '1b': 0, '2': 1, '3a': 2, '3b': 0, '4a': 1, '4b': 0, '5a': 1, '5b': 1, '5c': 2, '6': 0, '7': 1, '8a': 1, '8b': 1, '9': 2, '10a': 1, '10b': 2, '11a': 1, '11b': 0, '11c': 0, '12': 2, '13a': 1, '13b': 0, '14a': 1, '14b': 1, '14c': 1, '15': 2, '16': 1, '17': 2, '18': 2, '19a': 1, '19b': 1, '20a': 1, '20b': 1, '21': 3, '22': 1, '23': 1, '24a': 2, '24b': 1, '25': 2, '26': 1 },
    'Emily Zhang': { '1a': 1, '1b': 1, '2': 1, '3a': 0, '3b': 0, '4a': 2, '4b': 2, '5a': 0, '5b': 0, '5c': 0, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 3, '10a': 1, '10b': 3, '11a': 1, '11b': 2, '11c': 2, '12': 0, '13a': 1, '13b': 1, '14a': 1, '14b': 1, '14c': 1, '15': 2, '16': 2, '17': 2, '18': 3, '19a': 2, '19b': 1, '20a': 1, '20b': 1, '21': 2, '22': 2, '23': 1, '24a': 2, '24b': 1, '25': 2, '26': 1 },
    'Finn McCarthy': { '1a': 0, '1b': 1, '2': 0, '3a': 1, '3b': 0, '4a': 1, '4b': 0, '5a': 1, '5b': 0, '5c': 0, '6': 0, '7': 1, '8a': 1, '8b': 0, '9': 1, '10a': 1, '10b': 0, '11a': 0, '11b': 0, '11c': 0, '12': 1, '13a': 1, '13b': 0, '14a': 0, '14b': 0, '14c': 1, '15': 1, '16': 0, '17': 1, '18': 0, '19a': 1, '19b': 0, '20a': 0, '20b': 1, '21': 2, '22': 1, '23': 1, '24a': 1, '24b': 0, '25': 2, '26': 0 },
    'Grace Adeyemi': { '1a': 1, '1b': 0, '2': 1, '3a': 0, '3b': 0, '4a': 1, '4b': 1, '5a': 0, '5b': 1, '5c': 0, '6': 1, '7': 0, '8a': 0, '8b': 0, '9': 0, '10a': 0, '10b': 1, '11a': 0, '11b': 0, '11c': 0, '12': 1, '13a': 0, '13b': 0, '14a': 0, '14b': 0, '14c': 1, '15': 0, '16': 1, '17': 1, '18': 0, '19a': 0, '19b': 0, '20a': 1, '20b': 0, '21': 1, '22': 1, '23': 0, '24a': 0, '24b': 0, '25': 1, '26': 1 },
    'Harry Wilson': { '1a': 1, '1b': 1, '2': 1, '3a': 2, '3b': 2, '4a': 2, '4b': 2, '5a': 1, '5b': 1, '5c': 2, '6': 1, '7': 2, '8a': 1, '8b': 1, '9': 3, '10a': 1, '10b': 3, '11a': 1, '11b': 2, '11c': 2, '12': 2, '13a': 2, '13b': 1, '14a': 1, '14b': 1, '14c': 2, '15': 3, '16': 3, '17': 3, '18': 3, '19a': 2, '19b': 1, '20a': 2, '20b': 2, '21': 4, '22': 3, '23': 2, '24a': 3, '24b': 1, '25': 4, '26': 2 },
  },
}
