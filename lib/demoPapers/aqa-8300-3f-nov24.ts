import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator, Nov 2024.
 *
 * The reference example for a PaperConfig: this is the exact data the marking
 * tool used to carry as hardcoded page constants, moved here unchanged. A new
 * paper is a new file with this same shape, registered in ./index.ts.
 */
export const AQA_8300_3F_NOV24: PaperConfig = {
  id: 'aqa-8300-3f-nov24',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio & Proportion' },
    { id: 'stats', label: 'Statistics' },
  ],

  questions: [
    { id: '1a', label: '1(a)', marks: 1, topic: 'number',  skill: 'Fractions',          desc: 'Quarter of 780',             skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false },
    { id: '1b', label: '1(b)', marks: 1, topic: 'number',  skill: 'Powers & Roots',     desc: '19 squared',                 skillIds: ['indices'], kind: 'mastery', visual: false },
    { id: '2',  label: '2',    marks: 1, topic: 'algebra', skill: 'Simplifying',         desc: 'Simplify y+y+y',            skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false },
    { id: '3a', label: '3(a)', marks: 2, topic: 'ratio',   skill: 'Proportion',          desc: 'Cost of 12 apples',         skillIds: ['proportion', 'simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '3b', label: '3(b)', marks: 2, topic: 'ratio',   skill: 'Proportion',          desc: 'Cost of subset of drinks',  skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '4a', label: '4(a)', marks: 2, topic: 'number',  skill: 'Ordering Numbers',    desc: 'Order integers & decimals', skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '4b', label: '4(b)', marks: 2, topic: 'number',  skill: 'Ordering Fractions',  desc: 'Order fractions',           skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false },
    { id: '5a', label: '5(a)', marks: 1, topic: 'stats',   skill: 'Reading Charts',      desc: 'Read composite bar chart',  skillIds: ['simple_charts'], kind: 'mastery', visual: true },
    { id: '5b', label: '5(b)', marks: 1, topic: 'stats',   skill: 'Interpreting Charts', desc: 'Interpret bar chart',       skillIds: ['simple_charts'], kind: 'mastery', visual: true },
    { id: '5c', label: '5(c)', marks: 2, topic: 'stats',   skill: 'Drawing Charts',      desc: 'Complete bar chart',        skillIds: ['simple_charts'], kind: 'mastery', visual: true },
    { id: '6',  label: '6',    marks: 1, topic: 'ratio',   skill: 'Time Calculations',   desc: 'Arrival time reasoning',    skillIds: ['time_calculations'], kind: 'mastery', visual: false },
    { id: '7',  label: '7',    marks: 2, topic: 'number',  skill: 'Division in Context',  desc: 'Greatest number of items', skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false },
    { id: '8a', label: '8(a)', marks: 1, topic: 'algebra', skill: 'Function Machines',   desc: 'Forward through machine',   skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '8b', label: '8(b)', marks: 1, topic: 'algebra', skill: 'Function Machines',   desc: 'Inverse of machine',        skillIds: ['function_machines'], kind: 'mastery', visual: false },
    { id: '9',  label: '9',    marks: 3, topic: 'ratio',   skill: 'Unit Conversion',     desc: 'Total length in cm',        skillIds: ['simple_arithmetic'], kind: 'exam', visual: false },
    { id: '10a',label: '10(a)',marks: 1, topic: 'algebra', skill: 'Solving Equations',   desc: 'One-step equation',         skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false },
    { id: '10b',label: '10(b)',marks: 3, topic: 'algebra', skill: 'Solving Equations',   desc: 'Multi-step with brackets',  skillIds: ['solving_linear_equations'], kind: 'exam', visual: false },
    { id: '11a',label: '11(a)',marks: 1, topic: 'algebra', skill: 'Number Patterns',     desc: 'Complete number diagram',   skillIds: ['simple_arithmetic'], kind: 'mastery', visual: true },
    { id: '11b',label: '11(b)',marks: 2, topic: 'algebra', skill: 'Inverse Operations',  desc: 'Complete diagram inverse',  skillIds: ['function_machines'], kind: 'mastery', visual: true },
    { id: '11c',label: '11(c)',marks: 3, topic: 'algebra', skill: 'Algebraic Reasoning', desc: 'Find value using algebra',  skillIds: ['solving_linear_equations', 'forming_expressions_and_formulae'], kind: 'exam', visual: true },
    { id: '12', label: '12',   marks: 2, topic: 'stats',   skill: 'Averages',            desc: 'Find the median',           skillIds: ['median'], kind: 'mastery', visual: false },
  ],

  retrySet: {
    '1a': { skill: 'Fractions',         question: 'Work out 1/3 of 912' },
    '1b': { skill: 'Powers & Roots',    question: 'Work out the value of 23²' },
    '2':  { skill: 'Simplifying',        question: 'Simplify  p + p + p + p + p' },
    '3a': { skill: 'Proportion',         question: '5 oranges cost £1.80. Work out the cost of 15 oranges.' },
    '3b': { skill: 'Proportion',         question: 'The cost of 30 pens and 10 rulers is £16.00. Work out the cost of 3 pens and 1 ruler.' },
    '4a': { skill: 'Ordering Numbers',   question: 'Write in order, smallest first:  3,  −2,  0.5,  −1' },
    '4b': { skill: 'Ordering Fractions', question: 'Write in order, smallest first:  3/5,  1/4,  7/8,  1/2' },
    '6':  { skill: 'Time Calculations',  question: 'Amina leaves home at 8.25 am. She travels for 25 minutes. Does she arrive by 8.45 am? Explain.' },
    '7':  { skill: 'Division in Context', question: 'Priya has £25. A notebook costs £1.60. What is the greatest number she can buy?' },
    '8a': { skill: 'Function Machines',  question: 'Input → ×3 → +5 → Output. Work out the output when the input is 8.' },
    '8b': { skill: 'Function Machines',  question: 'Input → ×3 → +5 → Output. Work out the input when the output is 20.' },
    '9':  { skill: 'Unit Conversion',    question: 'A shelf holds 8 books each 25 mm thick and 2 bookends each 18 mm thick. Total length in cm?' },
    '10a':{ skill: 'Solving Equations',   question: 'Solve  c ÷ 5 = 12' },
    '10b':{ skill: 'Solving Equations',   question: 'Solve  3(4e − 2) = 42' },
    '12': { skill: 'Averages',           question: 'Find the median of: 15, 3, 9, 7, 11, 4, 7, 20, 6' },
  },

  challengeQuestions: [
    { topic: 'number',  skill: 'Reverse Percentages',   question: 'A laptop costs £612 after a 15% discount. What was the original price?' },
    { topic: 'number',  skill: 'Standard Form',          question: 'Write 0.00047 in standard form.' },
    { topic: 'number',  skill: 'Surds',                  question: 'Simplify √72 + √18. Give your answer in the form a√b.' },
    { topic: 'algebra', skill: 'Simultaneous Equations',  question: '3x + 2y = 16 and 5x − 2y = 24. Find the values of x and y.' },
    { topic: 'algebra', skill: 'Quadratic Factorising',   question: 'Factorise x² + 5x − 14.' },
    { topic: 'algebra', skill: 'Sequences (nth term)',     question: 'Find the nth term of the sequence 7, 11, 15, 19, ...' },
    { topic: 'ratio',   skill: 'Compound Measures',       question: 'A car travels 156 miles in 2 hours 24 minutes. Work out the average speed in mph.' },
    { topic: 'ratio',   skill: 'Direct Proportion',       question: 'y is directly proportional to x. When x = 5, y = 35. Find y when x = 9.' },
    { topic: 'stats',   skill: 'Probability',             question: 'A bag contains 4 red, 3 blue and 5 green counters. Two counters are drawn without replacement. Work out the probability that both are red.' },
    { topic: 'stats',   skill: 'Cumulative Frequency',    question: 'The median of a set of 60 values is estimated from a cumulative frequency graph. Which value on the vertical axis should you read across from?' },
  ],

  sampleStudents: [
    'Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim',
    'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson',
  ],

  // Realistic spread: Amira strong, Ben/Charlotte developing, Daniel/Emily
  // mixed, Finn/Grace weak, Harry very strong.
  sampleMarks: {
    'Amira Patel':     { '1a':1,'1b':1,'2':1,'3a':2,'3b':2,'4a':2,'4b':2,'5a':1,'5b':1,'5c':2,'6':1,'7':2,'8a':1,'8b':1,'9':3,'10a':1,'10b':3,'11a':1,'11b':2,'11c':3,'12':2 },
    'Ben Okonkwo':     { '1a':1,'1b':1,'2':1,'3a':2,'3b':1,'4a':2,'4b':1,'5a':1,'5b':0,'5c':1,'6':1,'7':2,'8a':1,'8b':0,'9':2,'10a':1,'10b':1,'11a':1,'11b':1,'11c':0,'12':2 },
    'Charlotte Evans': { '1a':1,'1b':1,'2':0,'3a':1,'3b':2,'4a':2,'4b':1,'5a':1,'5b':1,'5c':1,'6':1,'7':2,'8a':1,'8b':1,'9':1,'10a':1,'10b':2,'11a':0,'11b':1,'11c':1,'12':1 },
    'Daniel Kim':      { '1a':1,'1b':0,'2':1,'3a':2,'3b':0,'4a':1,'4b':0,'5a':1,'5b':1,'5c':2,'6':0,'7':1,'8a':1,'8b':1,'9':2,'10a':1,'10b':2,'11a':1,'11b':0,'11c':0,'12':2 },
    'Emily Zhang':     { '1a':1,'1b':1,'2':1,'3a':0,'3b':0,'4a':2,'4b':2,'5a':0,'5b':0,'5c':0,'6':1,'7':2,'8a':1,'8b':1,'9':3,'10a':1,'10b':3,'11a':1,'11b':2,'11c':2,'12':0 },
    'Finn McCarthy':   { '1a':0,'1b':1,'2':0,'3a':1,'3b':0,'4a':1,'4b':0,'5a':1,'5b':0,'5c':0,'6':0,'7':1,'8a':1,'8b':0,'9':1,'10a':1,'10b':0,'11a':0,'11b':0,'11c':0,'12':1 },
    'Grace Adeyemi':   { '1a':1,'1b':0,'2':1,'3a':0,'3b':0,'4a':1,'4b':1,'5a':0,'5b':1,'5c':0,'6':1,'7':0,'8a':0,'8b':0,'9':0,'10a':0,'10b':1,'11a':0,'11b':0,'11c':0,'12':1 },
    'Harry Wilson':    { '1a':1,'1b':1,'2':1,'3a':2,'3b':2,'4a':2,'4b':2,'5a':1,'5b':1,'5c':2,'6':1,'7':2,'8a':1,'8b':1,'9':3,'10a':1,'10b':3,'11a':1,'11b':2,'11c':2,'12':2 },
  },
}
